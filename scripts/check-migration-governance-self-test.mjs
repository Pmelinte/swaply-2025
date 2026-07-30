#!/usr/bin/env node

import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runGuard } from "./check-migration-governance.mjs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function copyFile(source, target) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, readFileSync(source));
}

function materializeGovernedMigrations(sourceRoot, fixtureRoot) {
  const governanceSource = join(sourceRoot, "supabase", "migration-governance");
  const governanceTarget = join(fixtureRoot, "supabase", "migration-governance");

  for (const name of ["forward-epoch.json", "r4-classification-snapshot.json"]) {
    copyFile(join(governanceSource, name), join(governanceTarget, name));
  }

  const manifest = readJson(
    join(governanceTarget, "r4-classification-snapshot.json"),
  );
  const epoch = readJson(join(governanceTarget, "forward-epoch.json"));
  const governedPaths = [
    ...Object.values(manifest.classifications).flat(),
    ...epoch.forward_migrations.map((entry) => entry.path),
  ];

  for (const relativePath of governedPaths) {
    const target = join(fixtureRoot, relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, "-- self-test fixture\n");
  }

  return {
    baselineCount: manifest.baseline_repository_files,
    forwardCount: epoch.forward_migrations.length,
  };
}

function expectFailure(label, fn, expectedCode) {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.startsWith(`${expectedCode}:`)) {
      throw new Error(
        `SELF_TEST_WRONG_CODE: ${label}: expected ${expectedCode}, received ${message}`,
      );
    }
    return;
  }

  throw new Error(
    `SELF_TEST_EXPECTED_FAILURE: ${label}: guard unexpectedly passed`,
  );
}

function main() {
  const repositoryRoot = new URL("..", import.meta.url).pathname;
  const fixture = mkdtempSync(join(tmpdir(), "swaply-migration-guard-"));

  try {
    const counts = materializeGovernedMigrations(repositoryRoot, fixture);
    writeFileSync(
      join(fixture, "package.json"),
      '{"name":"fixture","private":true}\n',
    );
    mkdirSync(join(fixture, "scripts"), { recursive: true });
    writeFileSync(
      join(fixture, "scripts", "safe.mjs"),
      'console.log("safe");\n',
    );

    const clean = runGuard({ root: fixture, skipGitDiff: true });
    const expectedTotal = counts.baselineCount + counts.forwardCount;
    if (clean.totalFiles !== expectedTotal) {
      throw new Error(
        `SELF_TEST_GOVERNED_COUNT: expected ${expectedTotal}, received ${clean.totalFiles}`,
      );
    }

    const unclassifiedPath = join(
      fixture,
      "supabase",
      "migrations",
      "20260730210000_unclassified.sql",
    );
    writeFileSync(unclassifiedPath, "-- unclassified\n");
    expectFailure(
      "unclassified migration",
      () => runGuard({ root: fixture, skipGitDiff: true }),
      "UNCLASSIFIED_MIGRATION",
    );
    rmSync(unclassifiedPath);

    const configPath = join(
      fixture,
      "supabase",
      "migration-governance",
      "forward-epoch.json",
    );
    const originalConfig = readJson(configPath);
    const duplicateVersion = "20260730210001";
    const forwardA = `supabase/migrations/${duplicateVersion}_forward_a.sql`;
    const forwardB = `supabase/migrations/${duplicateVersion}_forward_b.sql`;

    writeFileSync(join(fixture, forwardA), "-- forward a\n");
    writeFileSync(join(fixture, forwardB), "-- forward b\n");
    writeFileSync(
      configPath,
      `${JSON.stringify(
        {
          ...originalConfig,
          forward_migrations: [
            ...originalConfig.forward_migrations,
            {
              path: forwardA,
              version: duplicateVersion,
              name: "forward_a",
              kind: "FORWARD_ONLY",
            },
            {
              path: forwardB,
              version: duplicateVersion,
              name: "forward_b",
              kind: "FORWARD_ONLY",
            },
          ],
        },
        null,
        2,
      )}\n`,
    );
    expectFailure(
      "duplicate forward version",
      () => runGuard({ root: fixture, skipGitDiff: true }),
      "DUPLICATE_MIGRATION_VERSION",
    );
    rmSync(join(fixture, forwardA));
    rmSync(join(fixture, forwardB));
    writeFileSync(configPath, `${JSON.stringify(originalConfig, null, 2)}\n`);

    const forbiddenCommand = [
      "supabase",
      "db",
      "push",
      "--include-all",
    ].join(" ");
    writeFileSync(
      join(fixture, "scripts", "unsafe.sh"),
      `#!/usr/bin/env bash\n${forbiddenCommand}\n`,
    );
    expectFailure(
      "forbidden include-all automation",
      () => runGuard({ root: fixture, skipGitDiff: true }),
      "FORBIDDEN_INCLUDE_ALL_AUTOMATION",
    );

    console.log(
      `Migration governance self-tests: PASS (4; ${counts.baselineCount} baseline + ${counts.forwardCount} forward)`,
    );
  } finally {
    if (existsSync(fixture)) {
      rmSync(fixture, { recursive: true, force: true });
    }
  }
}

main();
