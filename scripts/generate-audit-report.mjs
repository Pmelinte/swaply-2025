#!/usr/bin/env node
/**
 * Reads audit-results/full-audit/results.json (produced by tests/audit/full-audit.spec.ts)
 * and writes audit-report.md sorted by severity, with Cloudinary URLs (when available)
 * inlined for screenshots.
 *
 * Optional: cloudinary-urls.json (mapping of basename → secure_url) — produced by the
 * upload step in .github/workflows/full-audit.yml.
 */

import fs from "node:fs/promises";
import path from "node:path";

const RESULTS_PATH = process.env.AUDIT_RESULTS_JSON
  || path.join(process.cwd(), "audit-results", "full-audit", "results.json");
const CLOUDINARY_PATH = process.env.AUDIT_CLOUDINARY_JSON
  || path.join(process.cwd(), "cloudinary-urls.json");
const OUT_PATH = process.env.AUDIT_REPORT_MD
  || path.join(process.cwd(), "audit-report.md");

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, ok: 4 };
const SEVERITY_LABEL = {
  critical: "🔴 critical",
  high: "🟠 high",
  medium: "🟡 medium",
  low: "🔵 low",
  ok: "🟢 ok",
};

async function readJson(p, fallback) {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();
}

function truncate(value, max) {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function compareResults(a, b) {
  const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  if (sev !== 0) return sev;
  if (a.path !== b.path) return a.path.localeCompare(b.path);
  return a.viewport.localeCompare(b.viewport);
}

async function main() {
  const report = await readJson(RESULTS_PATH, null);
  if (!report) {
    console.error(`Could not read ${RESULTS_PATH}`);
    process.exit(1);
  }
  const cloudinaryUrls = await readJson(CLOUDINARY_PATH, {});

  const results = [...(report.results || [])].sort(compareResults);

  const counts = results.reduce((acc, r) => {
    acc[r.severity] = (acc[r.severity] || 0) + 1;
    return acc;
  }, {});

  const lines = [];
  lines.push(`# Swaply full audit`);
  lines.push("");
  lines.push(`- **Base URL:** \`${report.baseUrl}\``);
  lines.push(`- **Generated:** ${report.generatedAt}`);
  lines.push(`- **Authenticated:** ${report.authenticated ? "yes" : "no"}`);
  lines.push(`- **Routes audited:** ${results.length}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Severity | Count |");
  lines.push("| --- | ---: |");
  for (const sev of ["critical", "high", "medium", "low", "ok"]) {
    lines.push(`| ${SEVERITY_LABEL[sev]} | ${counts[sev] || 0} |`);
  }
  lines.push("");

  lines.push("## Results (sorted by severity)");
  lines.push("");
  lines.push("| Severity | Route | Viewport | Status | Title | H1 | Notes |");
  lines.push("| --- | --- | --- | ---: | --- | --- | --- |");

  for (const r of results) {
    const notes = r.severityReasons?.length ? r.severityReasons.join("; ") : "—";
    lines.push(
      "| " +
        [
          SEVERITY_LABEL[r.severity] || r.severity,
          `\`${r.path}\``,
          r.viewport,
          r.status ?? "—",
          escapeCell(truncate(r.title, 60)) || "—",
          escapeCell(truncate(r.h1, 60)) || "—",
          escapeCell(truncate(notes, 160)),
        ]
          .map(escapeCell)
          .join(" | ") +
        " |"
    );
  }
  lines.push("");

  lines.push("## Screenshots");
  lines.push("");

  for (const r of results) {
    const fileName = path.basename(r.screenshot);
    const cloudUrl = cloudinaryUrls[fileName];
    const heading = `### ${SEVERITY_LABEL[r.severity]} — \`${r.path}\` (${r.viewport})`;
    lines.push(heading);
    if (r.severityReasons?.length) {
      lines.push("");
      lines.push(`> ${r.severityReasons.join(" · ")}`);
    }
    lines.push("");
    if (cloudUrl) {
      lines.push(`![${fileName}](${cloudUrl})`);
    } else {
      lines.push(`_Screenshot:_ \`${r.screenshot}\``);
    }
    lines.push("");

    if (r.cardClicks?.length) {
      lines.push("**Card click checks:**");
      lines.push("");
      lines.push("| # | Navigated | Console errors after | Page errors after | Notes |");
      lines.push("| ---: | --- | ---: | ---: | --- |");
      for (const click of r.cardClicks) {
        lines.push(
          `| ${click.index + 1} | ${click.navigated ? "yes" : "no"} | ${click.consoleErrorsAfter} | ${click.pageErrorsAfter} | ${escapeCell(truncate(click.notes || "ok", 120))} |`
        );
      }
      lines.push("");
    }

    if (r.consoleErrors?.length) {
      const matching = r.consoleErrors.filter((e) =>
        /error|MISSING|crash/i.test(e.text)
      );
      if (matching.length) {
        lines.push("**Console (error|MISSING|crash):**");
        lines.push("");
        lines.push("```");
        for (const entry of matching.slice(0, 12)) {
          lines.push(`[${entry.type}] ${entry.text}`);
        }
        lines.push("```");
        lines.push("");
      }
    }

    if (r.pageErrors?.length) {
      lines.push("**Uncaught page errors:**");
      lines.push("");
      lines.push("```");
      for (const entry of r.pageErrors.slice(0, 8)) {
        lines.push(entry);
      }
      lines.push("```");
      lines.push("");
    }
  }

  await fs.writeFile(OUT_PATH, lines.join("\n"), "utf8");
  console.log(`Wrote ${OUT_PATH} (${results.length} rows)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
