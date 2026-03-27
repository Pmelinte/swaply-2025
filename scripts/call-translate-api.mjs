/**
 * Calls the admin translate-ui endpoint repeatedly for each locale,
 * applies returned translations to local JSON files, and git commits.
 *
 * Usage: node scripts/call-translate-api.mjs [baseUrl] [secret]
 */
import fs from "fs";
import { execSync } from "child_process";

const BASE_URL = process.argv[2] || "https://swaply-2025-git-claude-fix-issue-z2ymi-petrus-projects-d4a0946c.vercel.app";
const SECRET = process.argv[3] || "swaply-translate-2026";

const LOCALES = [
  "it", "de", "fr", "es", "pt", "nl", "pl", "id", "vi", "th",
  "ar", "ja", "ko", "zh", "tr", "ru", "uk", "cs", "sk", "hu",
  "bg", "hr", "sr", "sl", "et", "lv", "lt", "fi", "sv", "da",
  "no", "el", "bn", "hi", "ms", "fil", "mn", "ga", "mt", "yi",
  "fa", "ro",
];

function setNested(obj, keyPath, value) {
  const parts = keyPath.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

async function callEndpoint(locale) {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/translate-ui`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: SECRET, locale }),
      });
      if (!res.ok) {
        if (attempt < MAX_RETRIES) {
          const delay = (attempt + 1) * 10;
          console.log(`    HTTP ${res.status}, retry in ${delay}s...`);
          await new Promise((r) => setTimeout(r, delay * 1000));
          continue;
        }
        return null;
      }
      return await res.json();
    } catch (e) {
      if (attempt < MAX_RETRIES) {
        const delay = (attempt + 1) * 10;
        console.log(`    ${e.message}, retry in ${delay}s...`);
        await new Promise((r) => setTimeout(r, delay * 1000));
        continue;
      }
      return null;
    }
  }
  return null;
}

function gitCommitAndPush(locale, count) {
  const locFile = `src/messages/${locale}.json`;
  try {
    execSync(`git add ${locFile}`, { stdio: "pipe" });
    execSync(
      `git commit -m "feat: translate ${locale} — ${count} strings via Claude Haiku"`,
      { stdio: "pipe" },
    );
    execSync("git push", { stdio: "pipe" });
    console.log(`  [git] committed and pushed ${locale}`);
  } catch (e) {
    console.log(`  [git] no changes to commit for ${locale}`);
  }
}

async function translateLocale(locale) {
  const locFile = `src/messages/${locale}.json`;
  let locData = JSON.parse(fs.readFileSync(locFile, "utf8"));
  let totalTranslated = 0;
  let remaining = 1;
  let round = 0;

  while (remaining > 0) {
    round++;
    const data = await callEndpoint(locale);

    if (!data) {
      console.log(`  round ${round}: endpoint failed, stopping`);
      break;
    }

    remaining = data.remaining ?? 0;
    const count = data.translated ?? 0;
    totalTranslated += count;

    // Apply translations to local file
    const translations = data.translations ?? {};
    const keys = Object.keys(translations);
    if (keys.length > 0) {
      for (const [key, value] of Object.entries(translations)) {
        setNested(locData, key, value);
      }
      fs.writeFileSync(locFile, JSON.stringify(locData, null, 2) + "\n");
    }

    console.log(`  round ${round}: +${count} translated, ${remaining} remaining`);

    if (count === 0) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Write final state
  fs.writeFileSync(locFile, JSON.stringify(locData, null, 2) + "\n");
  return totalTranslated;
}

async function main() {
  console.log(`Translating via ${BASE_URL}`);
  console.log("---");

  let grandTotal = 0;
  for (const locale of LOCALES) {
    console.log(`\n[${locale}] Starting...`);
    const count = await translateLocale(locale);
    grandTotal += count;
    console.log(`[${locale}] Done — ${count} translations`);

    // Git commit after each locale if there were translations
    if (count > 0) {
      gitCommitAndPush(locale, count);
    }
  }

  console.log(`\n=== Grand total: ${grandTotal} translations ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
