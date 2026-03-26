/**
 * Calls the admin translate-ui endpoint repeatedly for each locale
 * until all strings are translated.
 *
 * Usage: node scripts/call-translate-api.mjs [baseUrl] [secret]
 * Default: https://www.swaply.world swaply-translate-2026
 */

const BASE_URL = process.argv[2] || "https://www.swaply.world";
const SECRET = process.argv[3] || "swaply-translate-2026";

const LOCALES = [
  "it", "de", "fr", "es", "pt", "nl", "pl", "id", "vi", "th",
  "ar", "ja", "ko", "zh", "tr", "ru", "uk", "cs", "sk", "hu",
  "bg", "hr", "sr", "sl", "et", "lv", "lt", "fi", "sv", "da",
  "no", "el", "bn", "hi", "ms", "fil", "mn", "ga", "mt", "yi",
  "fa", "ro",
];

async function translateLocale(locale) {
  let remaining = 1;
  let totalTranslated = 0;
  let round = 0;

  while (remaining > 0) {
    round++;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/translate-ui`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: SECRET, locale }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`  ${locale} round ${round}: HTTP ${res.status} — ${errText.slice(0, 100)}`);
        break;
      }

      const data = await res.json();
      remaining = data.remaining;
      totalTranslated += data.translated;
      console.log(`  ${locale} round ${round}: +${data.translated} translated, ${remaining} remaining`);

      if (data.translated === 0) break; // No progress, stop

      // Small delay between rounds
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error(`  ${locale} round ${round}: Error —`, e.message);
      break;
    }
  }

  return totalTranslated;
}

async function main() {
  console.log(`Translating all locales via ${BASE_URL}/api/admin/translate-ui`);
  console.log(`Secret: ${SECRET.slice(0, 5)}...`);
  console.log("---");

  let grandTotal = 0;

  for (const locale of LOCALES) {
    console.log(`\n[${locale}] Starting...`);
    const count = await translateLocale(locale);
    grandTotal += count;
    console.log(`[${locale}] Done — ${count} translations applied`);
  }

  console.log(`\n===\nGrand total: ${grandTotal} translations across ${LOCALES.length} locales`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
