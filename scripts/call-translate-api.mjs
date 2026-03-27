/**
 * Calls the admin translate-ui endpoint repeatedly for each locale
 * and applies returned translations to local JSON files.
 *
 * Usage: node scripts/call-translate-api.mjs [baseUrl] [secret]
 * Default: https://swaply-2025-git-claude-fix-issue-z2ymi-petrus-projects-d4a0946c.vercel.app swaply-translate-2026
 */
import fs from "fs";

const BASE_URL = process.argv[2] || "https://swaply-2025-git-claude-fix-issue-z2ymi-petrus-projects-d4a0946c.vercel.app";
const SECRET = process.argv[3] || "swaply-translate-2026";

const LOCALES = [
  "it", "de", "fr", "es", "pt", "nl", "pl", "id", "vi", "th",
  "ar", "ja", "ko", "zh", "tr", "ru", "uk", "cs", "sk", "hu",
  "bg", "hr", "sr", "sl", "et", "lv", "lt", "fi", "sv", "da",
  "no", "el", "bn", "hi", "ms", "fil", "mn", "ga", "mt", "yi",
  "fa", "ro",
];

function setNested(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

async function translateLocale(locale) {
  let remaining = 1;
  let totalTranslated = 0;
  let round = 0;
  const locFile = `src/messages/${locale}.json`;
  let locData = JSON.parse(fs.readFileSync(locFile, "utf8"));

  while (remaining > 0) {
    round++;
    let data = null;
    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries <= MAX_RETRIES) {
      try {
        const res = await fetch(`${BASE_URL}/api/admin/translate-ui`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: SECRET, locale }),
        });

        if (!res.ok) {
          const errText = await res.text();
          if (retries < MAX_RETRIES) {
            const delay = (retries + 1) * 10;
            console.log(`  ${locale} round ${round}: HTTP ${res.status}, retrying in ${delay}s...`);
            await new Promise((r) => setTimeout(r, delay * 1000));
            retries++;
            continue;
          }
          console.error(`  ${locale} round ${round}: HTTP ${res.status} after ${MAX_RETRIES} retries — ${errText.slice(0, 100)}`);
          break;
        }

        data = await res.json();
        break; // success
      } catch (e) {
        if (retries < MAX_RETRIES) {
          const delay = (retries + 1) * 10;
          console.log(`  ${locale} round ${round}: ${e.message}, retrying in ${delay}s...`);
          await new Promise((r) => setTimeout(r, delay * 1000));
          retries++;
          continue;
        }
        console.error(`  ${locale} round ${round}: ${e.message} after ${MAX_RETRIES} retries`);
        break;
      }
    }

    if (!data) break;
    remaining = data.remaining;
    totalTranslated += data.translated;

      // Apply translations to local file
      if (data.translations && Object.keys(data.translations).length > 0) {
        for (const [key, value] of Object.entries(data.translations)) {
          setNested(locData, key, value);
        }
        fs.writeFileSync(locFile, JSON.stringify(locData, null, 2) + "\n");
        // Re-read for next round (so the API sees updated data)
        // Actually the API reads its own bundled copy, so we just accumulate locally
      }

      console.log(`  ${locale} round ${round}: +${data.translated} translated, ${remaining} remaining`);

      if (data.translated === 0) break;
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error(`  ${locale} round ${round}: Error —`, e.message);
      break;
    }
  }

  // Final write
  fs.writeFileSync(locFile, JSON.stringify(locData, null, 2) + "\n");
  return totalTranslated;
}

async function main() {
  console.log(`Translating via ${BASE_URL}/api/admin/translate-ui`);
  console.log("---");

  let grandTotal = 0;
  for (const locale of LOCALES) {
    console.log(`\n[${locale}] Starting...`);
    const count = await translateLocale(locale);
    grandTotal += count;
    console.log(`[${locale}] Done — ${count} translations`);
  }

  console.log(`\n=== Grand total: ${grandTotal} translations ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
