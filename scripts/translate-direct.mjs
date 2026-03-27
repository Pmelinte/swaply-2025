/**
 * Translate all untranslated UI strings directly via Claude API.
 * Runs entirely locally — no Vercel endpoint needed.
 *
 * Usage: ANTHROPIC_API_KEY=xxx node scripts/translate-direct.mjs
 * Or in GitHub Actions with the secret set.
 */
import fs from "fs";

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("ANTHROPIC_API_KEY not set");
  process.exit(1);
}

const LOCALE_NAMES = {
  it: "Italian", de: "German", fr: "French", es: "Spanish", pt: "Portuguese",
  nl: "Dutch", pl: "Polish", id: "Indonesian", vi: "Vietnamese", th: "Thai",
  ro: "Romanian", hu: "Hungarian", cs: "Czech", sk: "Slovak", bg: "Bulgarian",
  hr: "Croatian", sl: "Slovenian", sr: "Serbian", sv: "Swedish", da: "Danish",
  fi: "Finnish", no: "Norwegian", lt: "Lithuanian", lv: "Latvian", et: "Estonian",
  ga: "Irish", mt: "Maltese", ru: "Russian", tr: "Turkish", ar: "Arabic",
  zh: "Chinese Simplified", hi: "Hindi", bn: "Bengali", ja: "Japanese",
  ko: "Korean", el: "Greek", fa: "Persian", mn: "Mongolian", uk: "Ukrainian",
  yi: "Yiddish", ms: "Malay", fil: "Filipino",
};

const LOCALES = Object.keys(LOCALE_NAMES);

function flatten(obj, prefix = "") {
  const r = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      Object.assign(r, flatten(v, p));
    } else {
      r[p] = v;
    }
  }
  return r;
}

function setNested(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

async function translateBatch(texts, targetLang) {
  const numbered = texts.map((t, i) => `[${i + 1}] ${t}`).join("\n");
  const delays = [5000, 15000, 30000];

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          system:
            `You are a professional UI translator for Swaply, a global barter/swap marketplace. ` +
            `Translate each numbered line to ${targetLang}. Keep the same [1] [2] format. ` +
            `Return ONLY numbered translations. Preserve {variables} and HTML tags.`,
          messages: [{ role: "user", content: `Translate to ${targetLang}:\n${numbered}` }],
        }),
      });

      if (res.status === 529 || res.status === 529) {
        if (attempt < delays.length) {
          console.log(`    API overloaded, waiting ${delays[attempt] / 1000}s...`);
          await new Promise((r) => setTimeout(r, delays[attempt]));
          continue;
        }
        return [];
      }

      if (!res.ok) {
        const err = await res.text();
        console.error(`    API error ${res.status}: ${err.slice(0, 100)}`);
        if (attempt < delays.length) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
          continue;
        }
        return [];
      }

      const data = await res.json();
      const output = data.content?.[0]?.text ?? "";
      const results = [];
      for (const line of output.split("\n")) {
        const m = line.match(/^\[(\d+)\]\s*(.+)$/);
        if (m) results[parseInt(m[1]) - 1] = m[2].trim();
      }
      return results;
    } catch (e) {
      if (attempt < delays.length) {
        console.log(`    ${e.message}, retrying in ${delays[attempt] / 1000}s...`);
        await new Promise((r) => setTimeout(r, delays[attempt]));
        continue;
      }
      return [];
    }
  }
  return [];
}

async function translateLocale(locale, enFlat) {
  const langName = LOCALE_NAMES[locale];
  const locFile = `src/messages/${locale}.json`;
  const locData = JSON.parse(fs.readFileSync(locFile, "utf8"));
  const locFlat = flatten(locData);

  // Find untranslated: identical to EN and > 3 chars
  const untranslated = [];
  for (const [key, enVal] of Object.entries(enFlat)) {
    if (locFlat[key] === enVal && typeof enVal === "string" && enVal.length > 3) {
      untranslated.push({ key, text: enVal });
    }
  }

  if (untranslated.length === 0) {
    console.log(`  Already complete!`);
    return 0;
  }

  console.log(`  ${untranslated.length} strings to translate`);

  // Deduplicate by text value
  const uniqueMap = new Map();
  for (const { key, text } of untranslated) {
    if (!uniqueMap.has(text)) uniqueMap.set(text, []);
    uniqueMap.get(text).push(key);
  }
  const uniqueTexts = [...uniqueMap.keys()];
  console.log(`  ${uniqueTexts.length} unique texts`);

  // Translate in batches of 25
  const BATCH = 25;
  const translationMap = {};
  let done = 0;

  for (let i = 0; i < uniqueTexts.length; i += BATCH) {
    const batch = uniqueTexts.slice(i, i + BATCH);
    const results = await translateBatch(batch, langName);

    for (let j = 0; j < batch.length; j++) {
      if (results[j]) {
        translationMap[batch[j]] = results[j];
        done++;
      }
    }

    process.stdout.write(
      `  Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(uniqueTexts.length / BATCH)} — ${done}/${uniqueTexts.length}\r`,
    );

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n  Translated ${done}/${uniqueTexts.length} unique texts`);

  // Apply to locale file
  let applied = 0;
  for (const { key, text } of untranslated) {
    if (translationMap[text]) {
      setNested(locData, key, translationMap[text]);
      applied++;
    }
  }

  fs.writeFileSync(locFile, JSON.stringify(locData, null, 2) + "\n");
  console.log(`  Applied ${applied} translations to ${locFile}`);
  return applied;
}

async function main() {
  // Accept optional locale argument: node translate-direct.mjs it
  const targetLocale = process.argv[2];
  const localesToProcess = targetLocale ? [targetLocale] : LOCALES;

  if (targetLocale && !LOCALE_NAMES[targetLocale]) {
    console.error(`Unknown locale: ${targetLocale}`);
    console.error(`Valid: ${Object.keys(LOCALE_NAMES).join(", ")}`);
    process.exit(1);
  }

  console.log("Direct translation via Claude API");
  console.log(`Locales: ${localesToProcess.join(", ")}\n`);

  const en = JSON.parse(fs.readFileSync("src/messages/en.json", "utf8"));
  const enFlat = flatten(en);
  console.log(`EN has ${Object.keys(enFlat).length} keys\n`);

  let grandTotal = 0;

  for (const locale of localesToProcess) {
    console.log(`\n[${locale}] ${LOCALE_NAMES[locale]}`);
    const count = await translateLocale(locale, enFlat);
    grandTotal += count;
  }

  console.log(`\n=== Done: ${grandTotal} total translations ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
