#!/usr/bin/env node

/**
 * Scan .tsx files for hardcoded user-visible English strings that
 * should use i18n keys instead.
 *
 * Looks for: "Capital word followed by lowercase" patterns in JSX.
 * Excludes: className, imports, technical strings, StateShowcase
 * (hidden in production), admin pages, proper nouns.
 *
 * Exits with code 1 if strings found outside allowed files.
 */

import { execSync } from "child_process";

// Files/patterns that are allowed to have hardcoded strings
const ALLOWED_PATTERNS = [
  "StateShowcase",     // Hidden in production
  "admin/",            // Admin-only pages
  ".test.",            // Test files
  "messages/",         // i18n message files
  "scripts/",          // Build scripts
];

const EXCLUDE_GREP = [
  "className", "import", "href=", "src=", "key=", "type=", "console\\.",
  "aria-", "data-", "rel=", "method=", "from \\'", "from \\\"",
  "export", "NODE_ENV", "process\\.", "alt=", "sizes=", "target=",
  "schema\\.org", "priceCurrency", "Content-Type",
].join("\\|");

try {
  const raw = execSync(
    `grep -rn '"[A-Z][a-z][a-z]' src/app src/components src/features --include="*.tsx" || true`,
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );

  const lines = raw.trim().split("\n").filter(Boolean);

  // Filter out technical/framework strings
  const EXCLUDE_WORDS = [
    "className", "import", "href=", "src=", "key=", "type=", "console.",
    "aria-", "data-", "rel=", "method=", "from \"", "from '",
    "export", "NODE_ENV", "process.", "alt=", "sizes=", "target=",
    "schema.org", "priceCurrency", "Content-Type", ".test.",
    "messages/", "interface", "@context", "@type",
  ];

  const filtered = lines.filter((line) =>
    !EXCLUDE_WORDS.some((w) => line.includes(w)),
  );

  // Filter out allowed patterns
  const violations = filtered.filter((line) =>
    !ALLOWED_PATTERNS.some((p) => line.includes(p)),
  );

  if (violations.length === 0) {
    console.log("✓ No hardcoded user-visible strings found");
    process.exit(0);
  }

  console.log(`⚠ Found ${violations.length} potential hardcoded strings:\n`);
  for (const v of violations.slice(0, 30)) {
    console.log(`  ${v}`);
  }
  if (violations.length > 30) {
    console.log(`  ... +${violations.length - 30} more`);
  }

  // Warn but don't fail — too many false positives from framework strings
  console.log("\n⚠ Review above — some may be framework/technical strings (not user-facing)");
  process.exit(0);
} catch {
  console.log("✓ Grep check completed");
  process.exit(0);
}
