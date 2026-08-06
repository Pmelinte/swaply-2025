import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "audit-results", "v1-09");
const JSON_PATH = path.join(OUTPUT_DIR, "quality-inventory.json");
const MD_PATH = path.join(OUTPUT_DIR, "quality-inventory.md");

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".css",
  ".json",
  ".yml",
  ".yaml",
]);

const SKIP_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "playwright-report",
  "test-results",
  "audit-results",
  "coverage",
  "docs",
]);

const EXCLUDED_FILES = new Set([
  "scripts/audit-v1-09-quality.mjs",
  ".github/workflows/v1-09-quality-inventory.yml",
]);

const checks = [
  {
    id: "A11Y-AUTOMATION",
    area: "accessibility",
    description: "Executable accessibility tooling or assertions",
    includePrefixes: ["e2e/", "tests/", "src/__tests__/", "package.json", ".github/workflows/"],
    patterns: [/@axe-core\/playwright/i, /axe-core/i, /toHaveAccessibleName/i, /toHaveAccessibleDescription/i],
  },
  {
    id: "A11Y-KEYBOARD-FOCUS",
    area: "accessibility",
    description: "Executable keyboard traversal and focus-management coverage",
    includePrefixes: ["e2e/", "tests/", "src/__tests__/"],
    patterns: [
      /press\(["']Tab["']\)/i,
      /keyboard\.press\(["']Tab["']\)/i,
      /toBeFocused\(/i,
      /document\.activeElement/i,
      /focusTrap/i,
    ],
  },
  {
    id: "A11Y-MOTION",
    area: "accessibility",
    description: "Reduced-motion implementation or executable coverage",
    includePrefixes: ["src/", "e2e/", "tests/", "src/__tests__/"],
    patterns: [/prefers-reduced-motion/i, /reducedMotion/i],
  },
  {
    id: "PERF-WEB-VITALS",
    area: "performance",
    description: "Executable Core Web Vitals measurement or explicit budgets",
    includePrefixes: ["src/", "e2e/", "tests/", "scripts/", ".github/workflows/", "package.json"],
    patterns: [
      /web-vitals/i,
      /largest-contentful-paint/i,
      /cumulative-layout-shift/i,
      /interaction-to-next-paint/i,
      /performance\.getEntriesByType/i,
      /lcpThreshold/i,
      /clsThreshold/i,
      /inpThreshold/i,
    ],
  },
  {
    id: "PERF-LIGHTHOUSE",
    area: "performance",
    description: "Executable Lighthouse or equivalent performance audit",
    includePrefixes: [".github/workflows/", "scripts/", "package.json", "lighthouserc"],
    patterns: [/\blighthouse\b/i, /\blhci\b/i, /@lhci\/cli/i],
  },
  {
    id: "PERF-BUNDLE",
    area: "performance",
    description: "Bundle analysis support",
    includePrefixes: ["next.config", "package.json", ".github/workflows/", "scripts/"],
    patterns: [/@next\/bundle-analyzer/i, /ANALYZE\s*===?\s*["']true["']/i, /ANALYZE=true/i],
  },
  {
    id: "PRIVACY-DATA-EXPORT",
    area: "privacy",
    description: "Concrete user-data export endpoint or direct executable coverage",
    includePrefixes: [
      "src/app/api/gdpr/export/",
      "src/app/api/privacy/export/",
      "src/__tests__/",
      "e2e/",
      "tests/",
    ],
    patterns: [
      /\/api\/gdpr\/export/i,
      /gdpr\/export/i,
      /exportUserData/i,
      /content-disposition[^\n]*attachment/i,
    ],
  },
  {
    id: "PRIVACY-ACCOUNT-DELETION",
    area: "privacy",
    description: "Server-side account-deletion authority or direct executable coverage",
    includePrefixes: [
      "src/app/api/",
      "src/app/actions/",
      "src/lib/",
      "src/__tests__/",
      "e2e/",
      "tests/",
    ],
    patterns: [
      /auth\.admin\.deleteUser/i,
      /admin\.deleteUser/i,
      /\/api\/(?:gdpr\/)?(?:account\/)?delete/i,
      /delete-account/i,
      /deleteAccountServer/i,
    ],
  },
  {
    id: "PRIVACY-AI-DISCLOSURE",
    area: "privacy",
    description: "Public runtime disclosure of AI provider or third-party processing",
    includePrefixes: ["src/app/[locale]/privacy/", "src/app/[locale]/terms/", "src/messages/", "messages/"],
    patterns: [/AI provider/i, /third-party AI/i, /artificial intelligence provider/i, /furnizor.*inteligență artificială/i],
  },
  {
    id: "LEGAL-POLICY-ROUTES",
    area: "legal",
    description: "Public Terms, Privacy and Cookies route implementations",
    requiredPaths: [
      "src/app/[locale]/terms/page.tsx",
      "src/app/[locale]/privacy/page.tsx",
      "src/app/[locale]/cookies/page.tsx",
    ],
  },
  {
    id: "LEGAL-PROHIBITED-RULES",
    area: "legal",
    description: "Public or enforceable prohibited-goods rules",
    includePrefixes: ["src/", "e2e/", "tests/", "src/__tests__/"],
    patterns: [/prohibited goods/i, /prohibited items/i, /obiecte interzise/i, /illegal goods/i],
  },
];

function normalizePath(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function isIncluded(relativePath, prefixes = []) {
  return prefixes.length === 0 || prefixes.some((prefix) => relativePath.startsWith(prefix));
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute));
      continue;
    }

    const relativePath = normalizePath(absolute);
    if (EXCLUDED_FILES.has(relativePath)) continue;

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name)) || entry.name === "package.json") {
      files.push(absolute);
    }
  }
  return files;
}

const files = walk(ROOT);

function evaluatePatternCheck(check) {
  const matches = [];
  for (const file of files) {
    const relativePath = normalizePath(file);
    if (!isIncluded(relativePath, check.includePrefixes)) continue;

    const text = fs.readFileSync(file, "utf8");
    const matchedPatterns = check.patterns
      .filter((pattern) => pattern.test(text))
      .map((pattern) => pattern.source);

    if (matchedPatterns.length > 0) {
      matches.push({ file: relativePath, patterns: matchedPatterns });
    }
  }
  return matches;
}

function evaluateRequiredPaths(check) {
  return check.requiredPaths
    .filter((requiredPath) => fs.existsSync(path.join(ROOT, requiredPath)))
    .map((requiredPath) => ({ file: requiredPath, patterns: ["required-path-exists"] }));
}

const findings = checks.map((check) => {
  const matches = check.requiredPaths
    ? evaluateRequiredPaths(check)
    : evaluatePatternCheck(check);

  const requiredCount = check.requiredPaths?.length ?? 1;
  const proven = check.requiredPaths
    ? matches.length === requiredCount
    : matches.length > 0;

  return {
    id: check.id,
    area: check.area,
    description: check.description,
    status: proven ? "EVIDENCE_FOUND" : "GAP_OR_NOT_PROVEN",
    matches,
    requiredCount,
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  repository: "Pmelinte/swaply-2025",
  baseline: process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA || "local-or-unknown",
  scope: "V1-09 predictive static inventory only",
  methodology: "Executable source, tests, workflows and concrete route paths only; docs, generic MIME strings, UI-only deletion controls and the scanner itself are excluded as proof.",
  disclaimer: "Evidence found means a relevant implementation or executable check exists. It does not constitute accessibility, performance, privacy or legal sign-off.",
  totals: {
    checks: findings.length,
    evidenceFound: findings.filter((item) => item.status === "EVIDENCE_FOUND").length,
    gapsOrNotProven: findings.filter((item) => item.status === "GAP_OR_NOT_PROVEN").length,
  },
  findings,
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(JSON_PATH, `${JSON.stringify(summary, null, 2)}\n`);

const markdown = [
  "# V1-09 — Transversal quality inventory",
  "",
  `- Generated: \`${summary.generatedAt}\``,
  `- Baseline: \`${summary.baseline}\``,
  `- Evidence found: **${summary.totals.evidenceFound}/${summary.totals.checks}**`,
  `- Gaps or not proven: **${summary.totals.gapsOrNotProven}/${summary.totals.checks}**`,
  "",
  `> Methodology: ${summary.methodology}`,
  "",
  `> ${summary.disclaimer}`,
  "",
  "| ID | Area | Status | Matching files |",
  "|---|---|---|---:|",
  ...findings.map((item) => `| ${item.id} | ${item.area} | ${item.status} | ${item.matches.length} |`),
  "",
  "## Detailed evidence",
  "",
  ...findings.flatMap((item) => [
    `### ${item.id} — ${item.description}`,
    "",
    `Status: **${item.status}**`,
    "",
    ...(item.matches.length > 0
      ? item.matches.map((match) => `- \`${match.file}\``)
      : ["- No qualifying executable repository evidence found by this inventory."]),
    "",
  ]),
].join("\n");

fs.writeFileSync(MD_PATH, `${markdown}\n`);
console.log(markdown);
