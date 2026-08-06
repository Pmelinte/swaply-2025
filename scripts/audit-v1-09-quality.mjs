import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "audit-results", "v1-09");
const JSON_PATH = path.join(OUTPUT_DIR, "quality-inventory.json");
const MD_PATH = path.join(OUTPUT_DIR, "quality-inventory.md");

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css", ".md"]);
const SKIP_DIRS = new Set([".git", ".next", "node_modules", "playwright-report", "test-results", "audit-results", "coverage"]);

const checks = [
  {
    id: "A11Y-AUTOMATION",
    area: "accessibility",
    description: "Automated accessibility tooling or assertions",
    patterns: [/axe-core/i, /@axe-core\/playwright/i, /toHaveAccessibleName/i, /keyboard-only/i],
  },
  {
    id: "A11Y-FOCUS",
    area: "accessibility",
    description: "Focus management and keyboard interaction coverage",
    patterns: [/focus management/i, /focusTrap/i, /press\(["']Tab["']\)/i, /press\(["']Escape["']\)/i],
  },
  {
    id: "A11Y-MOTION",
    area: "accessibility",
    description: "Reduced-motion handling",
    patterns: [/prefers-reduced-motion/i, /reducedMotion/i],
  },
  {
    id: "PERF-WEB-VITALS",
    area: "performance",
    description: "Core Web Vitals measurement or budgets",
    patterns: [/web-vitals/i, /largest-contentful-paint/i, /cumulative-layout-shift/i, /interaction-to-next-paint/i, /\bLCP\b/, /\bCLS\b/, /\bINP\b/],
  },
  {
    id: "PERF-LIGHTHOUSE",
    area: "performance",
    description: "Lighthouse or equivalent performance audit",
    patterns: [/lighthouse/i, /lhci/i],
  },
  {
    id: "PERF-BUNDLE",
    area: "performance",
    description: "Bundle analysis support",
    patterns: [/bundle-analyzer/i, /ANALYZE=true/i],
  },
  {
    id: "PRIVACY-DATA-RIGHTS",
    area: "privacy",
    description: "Export and deletion user-data flows",
    patterns: [/export.*data/i, /delete.*account/i, /right to erasure/i, /data retention/i],
  },
  {
    id: "PRIVACY-AI-DISCLOSURE",
    area: "privacy",
    description: "AI provider disclosure or data-sharing documentation",
    patterns: [/AI provider/i, /third-party AI/i, /data.*provider/i, /provider disclosure/i],
  },
  {
    id: "LEGAL-POLICIES",
    area: "legal",
    description: "Terms, privacy and cookie policy surfaces",
    patterns: [/privacy policy/i, /terms of service/i, /cookie policy/i, /politica de confidențialitate/i],
  },
  {
    id: "LEGAL-PROHIBITED",
    area: "legal",
    description: "Prohibited goods or transaction rules",
    patterns: [/prohibited goods/i, /prohibited items/i, /obiecte interzise/i, /illegal goods/i],
  },
];

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(absolute);
  }
  return files;
}

const files = walk(ROOT);
const findings = checks.map((check) => {
  const matches = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const matchedPatterns = check.patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
    if (matchedPatterns.length > 0) {
      matches.push({
        file: path.relative(ROOT, file).replaceAll(path.sep, "/"),
        patterns: matchedPatterns,
      });
    }
  }
  return {
    ...check,
    status: matches.length > 0 ? "EVIDENCE_FOUND" : "GAP_OR_NOT_PROVEN",
    matches,
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  repository: "Pmelinte/swaply-2025",
  baseline: process.env.GITHUB_SHA || "local-or-unknown",
  scope: "V1-09 predictive static inventory only",
  disclaimer: "Pattern matches are inventory evidence, not accessibility, performance, privacy or legal sign-off.",
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
  "> This is a read-only static inventory. It does not constitute accessibility, performance, privacy or legal sign-off.",
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
      : ["- No matching repository evidence found by this inventory."]),
    "",
  ]),
].join("\n");

fs.writeFileSync(MD_PATH, `${markdown}\n`);
console.log(markdown);
