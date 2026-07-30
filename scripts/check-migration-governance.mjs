#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MIGRATION_PATTERN = /^(\d{14})_([a-z0-9][a-z0-9_]*)\.sql$/;
const FORBIDDEN_AUTOMATION_PATTERN = /\bsupabase\s+db\s+push\b[^\r\n]{0,240}--include-all\b/i;
const AUTOMATION_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".sh", ".yml", ".yaml"]);

class GovernanceError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = "GovernanceError";
    this.code = code;
  }
}

function invariant(condition, code, message) {
  if (!condition) throw new GovernanceError(code, message);
}

function normalizePath(path) {
  return path.split(sep).join("/");
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new GovernanceError("INVALID_JSON", `${normalizePath(path)}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function listFilesRecursive(root) {
  if (!existsSync(root)) return [];
  const output = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) output.push(...listFilesRecursive(path));
    else if (entry.isFile()) output.push(path);
  }
  return output;
}

function listMigrationFiles(root) {
  const migrationDir = join(root, "supabase", "migrations");
  invariant(existsSync(migrationDir), "MIGRATION_DIR_MISSING", "supabase/migrations does not exist");
  return readdirSync(migrationDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => {
      const match = MIGRATION_PATTERN.exec(entry.name);
      invariant(match, "INVALID_MIGRATION_FILENAME", `Expected 14-digit version and snake_case name: ${entry.name}`);
      return {
        path: `supabase/migrations/${entry.name}`,
        version: match[1],
        name: match[2]
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function collectVersionMap(entries) {
  const map = new Map();
  for (const entry of entries) {
    const paths = map.get(entry.version) ?? [];
    paths.push(entry.path);
    map.set(entry.version, paths.sort());
  }
  return map;
}

function validateConfigAndManifest(root) {
  const configPath = join(root, "supabase", "migration-governance", "forward-epoch.json");
  invariant(existsSync(configPath), "EPOCH_CONFIG_MISSING", "supabase/migration-governance/forward-epoch.json is missing");
  const config = readJson(configPath);
  invariant(config.schema_version === "1.0", "EPOCH_SCHEMA_UNSUPPORTED", `Expected schema_version 1.0, received ${String(config.schema_version)}`);
  invariant(config.epoch_id === "V1-02-R5", "EPOCH_ID_INVALID", `Expected V1-02-R5, received ${String(config.epoch_id)}`);
  invariant(/^\d{14}$/.test(config.forward_only_after_version), "EPOCH_VERSION_INVALID", "forward_only_after_version must contain 14 digits");

  const manifestPath = resolve(root, config.baseline_manifest_path);
  invariant(existsSync(manifestPath), "BASELINE_MANIFEST_MISSING", config.baseline_manifest_path);
  invariant(sha256(manifestPath) === config.baseline_manifest_sha256, "BASELINE_MANIFEST_HASH_MISMATCH", "The immutable R4 manifest hash changed");

  const manifest = readJson(manifestPath);
  invariant(manifest.schema_version === "1.0", "MANIFEST_SCHEMA_UNSUPPORTED", `Expected schema_version 1.0, received ${String(manifest.schema_version)}`);
  invariant(manifest.baseline_application_sha === config.baseline_application_sha, "BASELINE_SHA_MISMATCH", "R4 snapshot SHA and forward epoch SHA differ");
  invariant(manifest.production_project === config.production_project, "PRODUCTION_PROJECT_MISMATCH", "R4 snapshot project and forward epoch project differ");
  invariant(manifest.classifications && typeof manifest.classifications === "object", "MANIFEST_CLASSIFICATIONS_INVALID", "classifications must be an object");
  invariant(Array.isArray(config.forward_migrations), "FORWARD_REGISTRY_INVALID", "forward_migrations must be an array");

  return { config, manifest };
}

function validateInventory(root, config, manifest) {
  const actual = listMigrationFiles(root);
  const actualByPath = new Map(actual.map((entry) => [entry.path, entry]));
  const baselineEntries = Object.entries(manifest.classifications).flatMap(([classification, paths]) => {
    invariant(Array.isArray(paths), "MANIFEST_CLASS_INVALID", `${classification} must be an array`);
    return paths.map((path) => {
      const fileName = path.split("/").at(-1) ?? "";
      const match = MIGRATION_PATTERN.exec(fileName);
      invariant(match, "MANIFEST_PATH_INVALID", path);
      return { path, version: match[1], name: match[2], classification };
    });
  });
  const baselineByPath = new Map(baselineEntries.map((entry) => [entry.path, entry]));
  invariant(baselineByPath.size === baselineEntries.length, "BASELINE_DUPLICATE_PATH", "R4 manifest contains duplicate repository paths");
  invariant(manifest.baseline_repository_files === baselineEntries.length, "BASELINE_COUNT_MISMATCH", "R4 snapshot baseline_repository_files does not match classifications");

  const forwardEntries = config.forward_migrations.map((entry, index) => {
    invariant(entry && typeof entry === "object", "FORWARD_ENTRY_INVALID", `forward_migrations[${index}] must be an object`);
    invariant(typeof entry.path === "string", "FORWARD_PATH_INVALID", `forward_migrations[${index}].path is required`);
    const fileName = entry.path.split("/").at(-1) ?? "";
    const match = MIGRATION_PATTERN.exec(fileName);
    invariant(match, "FORWARD_FILENAME_INVALID", entry.path);
    invariant(entry.path === `supabase/migrations/${fileName}`, "FORWARD_PATH_INVALID", `Forward migration must be directly under supabase/migrations: ${entry.path}`);
    invariant(entry.version === match[1], "FORWARD_VERSION_MISMATCH", entry.path);
    invariant(entry.name === match[2], "FORWARD_NAME_MISMATCH", entry.path);
    invariant(entry.kind === "FORWARD_ONLY", "FORWARD_KIND_INVALID", `${entry.path} must use kind FORWARD_ONLY`);
    invariant(entry.version > config.forward_only_after_version, "FORWARD_BEFORE_EPOCH", `${entry.path} must be newer than ${config.forward_only_after_version}`);
    return { path: entry.path, version: entry.version, name: entry.name, kind: entry.kind };
  });
  const forwardByPath = new Map(forwardEntries.map((entry) => [entry.path, entry]));
  invariant(forwardByPath.size === forwardEntries.length, "FORWARD_DUPLICATE_PATH", "forward_migrations contains duplicate paths");

  for (const path of baselineByPath.keys()) {
    invariant(actualByPath.has(path), "BASELINE_FILE_MISSING", path);
  }
  for (const path of forwardByPath.keys()) {
    invariant(actualByPath.has(path), "FORWARD_FILE_MISSING", path);
    invariant(!baselineByPath.has(path), "FORWARD_RECLASSIFIES_BASELINE", path);
  }
  for (const entry of actual) {
    invariant(baselineByPath.has(entry.path) || forwardByPath.has(entry.path), "UNCLASSIFIED_MIGRATION", entry.path);
  }

  const actualVersions = collectVersionMap(actual);
  const allowedLegacyDuplicates = new Map(
    Object.entries(manifest.legacy_duplicate_versions ?? {}).map(([version, paths]) => [
      version,
      [...paths].sort()
    ])
  );
  for (const [version, paths] of actualVersions.entries()) {
    if (paths.length === 1) continue;
    const allowed = allowedLegacyDuplicates.get(version);
    invariant(allowed && JSON.stringify(allowed) === JSON.stringify(paths), "DUPLICATE_MIGRATION_VERSION", `${version}: ${paths.join(", ")}`);
  }
  for (const [version, allowedPaths] of allowedLegacyDuplicates.entries()) {
    const actualPaths = actualVersions.get(version) ?? [];
    invariant(JSON.stringify(actualPaths) === JSON.stringify(allowedPaths), "LEGACY_DUPLICATE_DRIFT", `${version}: expected ${allowedPaths.join(", ")}; found ${actualPaths.join(", ")}`);
  }

  const unsafeBaselinePaths = new Set(
    baselineEntries.filter((entry) => entry.classification === "UNSAFE_OPERATIONAL_ONE_SHOT").map((entry) => entry.path)
  );
  for (const entry of forwardEntries) {
    invariant(!unsafeBaselinePaths.has(entry.path), "UNSAFE_FILE_IN_FORWARD_EPOCH", entry.path);
  }

  return {
    actual,
    baselineEntries,
    forwardEntries,
    allowedLegacyDuplicates
  };
}

function automationCandidates(root) {
  const candidates = [];
  const packageJson = join(root, "package.json");
  if (existsSync(packageJson)) candidates.push(packageJson);

  for (const folder of [join(root, ".github", "workflows"), join(root, ".github", "actions"), join(root, "scripts")]) {
    for (const path of listFilesRecursive(folder)) {
      if (AUTOMATION_EXTENSIONS.has(extname(path))) candidates.push(path);
    }
  }
  for (const name of ["Makefile", "Dockerfile"] ) {
    const path = join(root, name);
    if (existsSync(path)) candidates.push(path);
  }
  return [...new Set(candidates)];
}

function validateAutomation(root) {
  const violations = [];
  for (const path of automationCandidates(root)) {
    const content = readFileSync(path, "utf8").replace(/\\\r?\n/g, " ");
    if (FORBIDDEN_AUTOMATION_PATTERN.test(content)) {
      violations.push(normalizePath(relative(root, path)));
    }
  }
  invariant(violations.length === 0, "FORBIDDEN_INCLUDE_ALL_AUTOMATION", violations.join(", "));
}

function parseNameStatusZ(buffer) {
  if (!buffer) return [];
  const tokens = buffer.split("\0").filter(Boolean);
  const changes = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const status = tokens[index];
    if (status.startsWith("R") || status.startsWith("C")) {
      changes.push({ status, oldPath: tokens[index + 1], path: tokens[index + 2] });
      index += 2;
    } else {
      changes.push({ status, path: tokens[index + 1] });
      index += 1;
    }
  }
  return changes;
}

function validateGitDiff(root, inventory, env = process.env) {
  const base = env.BASE_SHA;
  const head = env.HEAD_SHA;
  if (!base || !head || /^0+$/.test(base)) return { checked: false, changes: [] };

  const result = spawnSync("git", ["diff", "--name-status", "-z", "--find-renames", base, head, "--", "supabase/migrations"], {
    cwd: root,
    encoding: "utf8"
  });
  invariant(result.status === 0, "GIT_DIFF_FAILED", result.stderr?.trim() || "git diff returned a non-zero status");

  const forwardPaths = new Set(inventory.forwardEntries.map((entry) => entry.path));
  const changes = parseNameStatusZ(result.stdout);
  for (const change of changes) {
    const code = change.status[0];
    if (code === "A") {
      invariant(forwardPaths.has(change.path), "UNREGISTERED_FORWARD_MIGRATION", change.path);
      continue;
    }
    throw new GovernanceError(
      "RETROACTIVE_MIGRATION_CHANGE",
      change.oldPath ? `${change.status}: ${change.oldPath} -> ${change.path}` : `${change.status}: ${change.path}`
    );
  }
  return { checked: true, changes };
}

export function runGuard({ root = process.cwd(), env = process.env, skipGitDiff = false } = {}) {
  const absoluteRoot = resolve(root);
  const { config, manifest } = validateConfigAndManifest(absoluteRoot);
  const inventory = validateInventory(absoluteRoot, config, manifest);
  validateAutomation(absoluteRoot);
  const diff = skipGitDiff ? { checked: false, changes: [] } : validateGitDiff(absoluteRoot, inventory, env);
  return {
    baselineFiles: inventory.baselineEntries.length,
    forwardFiles: inventory.forwardEntries.length,
    totalFiles: inventory.actual.length,
    allowedLegacyDuplicateVersions: inventory.allowedLegacyDuplicates.size,
    gitDiffChecked: diff.checked,
    migrationChanges: diff.changes.length
  };
}

function copyGovernanceFiles(sourceRoot, targetRoot) {
  const sourceFolder = join(sourceRoot, "supabase", "migration-governance");
  const targetFolder = join(targetRoot, "supabase", "migration-governance");
  mkdirSync(targetFolder, { recursive: true });
  for (const name of ["forward-epoch.json", "r4-classification-snapshot.json"]) {
    writeFileSync(join(targetFolder, name), readFileSync(join(sourceFolder, name)));
  }
}

function materializeBaselineMigrations(root) {
  const manifest = readJson(join(root, "supabase", "migration-governance", "r4-classification-snapshot.json"));
  const paths = Object.values(manifest.classifications).flat();
  for (const relativePath of paths) {
    const path = join(root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "-- self-test fixture\n");
  }
}

function expectFailure(label, fn, expectedCode) {
  try {
    fn();
  } catch (error) {
    invariant(error instanceof GovernanceError, "SELF_TEST_WRONG_ERROR", `${label}: ${error instanceof Error ? error.message : String(error)}`);
    invariant(error.code === expectedCode, "SELF_TEST_WRONG_CODE", `${label}: expected ${expectedCode}, received ${error.code}`);
    return;
  }
  throw new GovernanceError("SELF_TEST_EXPECTED_FAILURE", `${label}: guard unexpectedly passed`);
}

function runSelfTests(root) {
  const fixture = mkdtempSync(join(tmpdir(), "swaply-migration-guard-"));
  try {
    copyGovernanceFiles(root, fixture);
    materializeBaselineMigrations(fixture);
    writeFileSync(join(fixture, "package.json"), '{"name":"fixture","private":true}\n');
    mkdirSync(join(fixture, "scripts"), { recursive: true });
    writeFileSync(join(fixture, "scripts", "safe.mjs"), 'console.log("safe");\n');

    const clean = runGuard({ root: fixture, skipGitDiff: true });
    invariant(clean.totalFiles === 140, "SELF_TEST_BASELINE_COUNT", `Expected 140, received ${clean.totalFiles}`);

    const unclassifiedPath = join(fixture, "supabase", "migrations", "20260730130000_unclassified.sql");
    writeFileSync(unclassifiedPath, "-- unclassified\n");
    expectFailure("unclassified migration", () => runGuard({ root: fixture, skipGitDiff: true }), "UNCLASSIFIED_MIGRATION");
    rmSync(unclassifiedPath);

    const configPath = join(fixture, "supabase", "migration-governance", "forward-epoch.json");
    const originalConfig = readJson(configPath);
    const duplicateVersion = "20260730130001";
    const forwardA = `supabase/migrations/${duplicateVersion}_forward_a.sql`;
    const forwardB = `supabase/migrations/${duplicateVersion}_forward_b.sql`;
    writeFileSync(join(fixture, forwardA), "-- forward a\n");
    writeFileSync(join(fixture, forwardB), "-- forward b\n");
    writeFileSync(
      configPath,
      `${JSON.stringify({
        ...originalConfig,
        forward_migrations: [
          { path: forwardA, version: duplicateVersion, name: "forward_a", kind: "FORWARD_ONLY" },
          { path: forwardB, version: duplicateVersion, name: "forward_b", kind: "FORWARD_ONLY" }
        ]
      }, null, 2)}\n`
    );
    expectFailure("duplicate forward version", () => runGuard({ root: fixture, skipGitDiff: true }), "DUPLICATE_MIGRATION_VERSION");
    rmSync(join(fixture, forwardA));
    rmSync(join(fixture, forwardB));
    writeFileSync(configPath, `${JSON.stringify(originalConfig, null, 2)}\n`);

    const forbiddenCommand = ["supabase", "db", "push", "--include-all"].join(" ");
    writeFileSync(join(fixture, "scripts", "unsafe.sh"), `#!/usr/bin/env bash\n${forbiddenCommand}\n`);
    expectFailure("forbidden include-all automation", () => runGuard({ root: fixture, skipGitDiff: true }), "FORBIDDEN_INCLUDE_ALL_AUTOMATION");

    return { passed: 4 };
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function printGuardResult(result) {
  console.log("Migration governance guard: PASS");
  console.log(`Baseline classified files: ${result.baselineFiles}`);
  console.log(`Forward-epoch files: ${result.forwardFiles}`);
  console.log(`Total SQL migration files: ${result.totalFiles}`);
  console.log(`Allowed legacy duplicate versions: ${result.allowedLegacyDuplicateVersions}`);
  console.log(`Git diff checked: ${result.gitDiffChecked ? "yes" : "no"}`);
  if (result.gitDiffChecked) console.log(`Migration changes in diff: ${result.migrationChanges}`);
}

function main() {
  const selfTest = process.argv.includes("--self-test");
  const scriptPath = fileURLToPath(import.meta.url);
  const repositoryRoot = resolve(dirname(scriptPath), "..");
  try {
    if (selfTest) {
      const result = runSelfTests(repositoryRoot);
      console.log(`Migration governance self-tests: PASS (${result.passed})`);
    } else {
      printGuardResult(runGuard({ root: repositoryRoot }));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
