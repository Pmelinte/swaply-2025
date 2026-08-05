#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const ROOT = process.cwd();
const MESSAGE_DIR = join(ROOT, "src/messages");
const BLOG_DIR = join(ROOT, "src/content/blog");
const PUBLIC_SURFACES = [
  join(ROOT, "src/app/[locale]/blog/page.tsx"),
  join(ROOT, "src/app/[locale]/stories/page.tsx"),
];

const ALLOWED_RAW_LABELS = new Set(["RSS"]);

function listFiles(dir, predicate = () => true) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...listFiles(full, predicate));
    } else if (predicate(full)) {
      files.push(full);
    }
  }
  return files;
}

function flattenKeys(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return nested && typeof nested === "object" && !Array.isArray(nested)
      ? flattenKeys(nested, path)
      : [path];
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function catalogueEvidence() {
  const catalogues = listFiles(MESSAGE_DIR, (file) => extname(file) === ".json");
  const englishPath = join(MESSAGE_DIR, "en.json");
  const englishKeys = new Set(flattenKeys(readJson(englishPath)));
  const missingByLocale = {};
  const extraByLocale = {};

  for (const file of catalogues) {
    const locale = basename(file, ".json");
    const keys = new Set(flattenKeys(readJson(file)));
    const missing = [...englishKeys].filter((key) => !keys.has(key));
    const extra = [...keys].filter((key) => !englishKeys.has(key));
    if (missing.length > 0) missingByLocale[locale] = missing;
    if (extra.length > 0) extraByLocale[locale] = extra;
  }

  return {
    catalogueCount: catalogues.length,
    englishKeyCount: englishKeys.size,
    missingByLocale,
    extraByLocale,
  };
}

function blogEvidence() {
  const englishFiles = readdirSync(BLOG_DIR)
    .filter((entry) => entry.endsWith(".mdx"))
    .sort();
  const englishSlugs = new Set(englishFiles.map((file) => basename(file, ".mdx")));
  const localeDirectories = readdirSync(BLOG_DIR)
    .filter((entry) => statSync(join(BLOG_DIR, entry)).isDirectory())
    .sort();

  const localized = {};
  const orphanTranslations = {};

  for (const locale of localeDirectories) {
    const files = readdirSync(join(BLOG_DIR, locale))
      .filter((entry) => entry.endsWith(".mdx"))
      .sort();
    const slugs = files.map((file) => basename(file, ".mdx"));
    localized[locale] = {
      translatedCount: slugs.length,
      missingCount: englishSlugs.size - slugs.filter((slug) => englishSlugs.has(slug)).length,
    };
    const orphans = slugs.filter((slug) => !englishSlugs.has(slug));
    if (orphans.length > 0) orphanTranslations[locale] = orphans;
  }

  return {
    sourceArticleCount: englishSlugs.size,
    localeDirectories,
    localized,
    orphanTranslations,
  };
}

function hardcodedEvidence() {
  const findings = [];
  const jsxTextPattern = />\s*([A-Za-z][A-Za-z0-9 ,.!?&'’\-]{1,80})\s*</g;
  const literalAttributePattern = /(?:aria-label|title|placeholder)=["']([A-Za-z][^"']{1,80})["']/g;

  for (const file of PUBLIC_SURFACES) {
    if (!existsSync(file)) continue;
    const content = readFileSync(file, "utf8");
    for (const pattern of [jsxTextPattern, literalAttributePattern]) {
      for (const match of content.matchAll(pattern)) {
        const value = match[1].trim();
        if (!value || ALLOWED_RAW_LABELS.has(value)) continue;
        findings.push({
          file: relative(ROOT, file),
          value,
          line: content.slice(0, match.index).split("\n").length,
        });
      }
    }
  }

  return findings;
}

function layoutEvidence() {
  const storiesPath = join(ROOT, "src/app/[locale]/stories/page.tsx");
  const source = readFileSync(storiesPath, "utf8");
  return {
    userContentDirectionAuto: source.includes('dir="auto"'),
    longTextWrap: source.includes("[overflow-wrap:anywhere]"),
    minWidthContainment: source.includes("min-w-0"),
    overflowContainment: source.includes("overflow-hidden"),
  };
}

const evidence = {
  generatedAt: new Date().toISOString(),
  catalogues: catalogueEvidence(),
  blog: blogEvidence(),
  hardcodedPublicStrings: hardcodedEvidence(),
  layout: layoutEvidence(),
};

const failures = [];
if (evidence.catalogues.catalogueCount !== 43) {
  failures.push(`expected 43 message catalogues, found ${evidence.catalogues.catalogueCount}`);
}
if (Object.keys(evidence.catalogues.missingByLocale).length > 0) {
  failures.push("one or more locale catalogues miss English contract keys");
}
if (Object.keys(evidence.catalogues.extraByLocale).length > 0) {
  failures.push("one or more locale catalogues contain keys outside the English contract");
}
if (Object.keys(evidence.blog.orphanTranslations).length > 0) {
  failures.push("localized Blog content contains orphan slugs");
}
if (evidence.hardcodedPublicStrings.length > 0) {
  failures.push("public Blog/Stories surfaces contain unclassified hardcoded UI strings");
}
if (!Object.values(evidence.layout).every(Boolean)) {
  failures.push("Stories lacks one or more RTL/long-text containment safeguards");
}

console.log(JSON.stringify({ ...evidence, pass: failures.length === 0, failures }, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
