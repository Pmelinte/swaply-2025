/**
 * Translate all untranslated UI strings for a given locale using Claude Haiku.
 * Usage: ANTHROPIC_API_KEY=xxx node scripts/translate-locale.mjs <locale>
 * Example: node scripts/translate-locale.mjs it
 */
import fs from 'fs';

const LOCALE = process.argv[2];
if (!LOCALE) { console.error('Usage: node scripts/translate-locale.mjs <locale>'); process.exit(1); }

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1); }

const LOCALE_NAMES = {
  it: 'Italian', de: 'German', fr: 'French', es: 'Spanish', pt: 'Portuguese',
  nl: 'Dutch', pl: 'Polish', id: 'Indonesian', vi: 'Vietnamese', th: 'Thai',
  ro: 'Romanian', hu: 'Hungarian', cs: 'Czech', sk: 'Slovak', bg: 'Bulgarian',
  hr: 'Croatian', sl: 'Slovenian', sr: 'Serbian', sv: 'Swedish', da: 'Danish',
  fi: 'Finnish', no: 'Norwegian', lt: 'Lithuanian', lv: 'Latvian', et: 'Estonian',
  ga: 'Irish', mt: 'Maltese', ru: 'Russian', tr: 'Turkish', ar: 'Arabic',
  zh: 'Chinese Simplified', hi: 'Hindi', bn: 'Bengali', ja: 'Japanese',
  ko: 'Korean', el: 'Greek', fa: 'Persian', mn: 'Mongolian', uk: 'Ukrainian',
  yi: 'Yiddish', ms: 'Malay', fil: 'Filipino',
};

function flatten(obj, prefix = '') {
  const r = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) Object.assign(r, flatten(v, p));
    else r[p] = v;
  }
  return r;
}

function setNested(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur)) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

async function translateBatch(texts, targetLang) {
  // Join texts with numbered markers for batch translation
  const numbered = texts.map((t, i) => `[${i + 1}] ${t}`).join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `You are a professional UI translator for Swaply, a global barter/swap marketplace. Translate each numbered line to ${targetLang}. Keep the same numbered format [1] [2] etc. Return ONLY the numbered translations, nothing else. Preserve {variables} and HTML tags as-is.`,
      messages: [{ role: 'user', content: `Translate to ${targetLang}:\n${numbered}` }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const output = data.content[0].text;

  // Parse numbered results
  const results = [];
  const lines = output.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const m = line.match(/^\[(\d+)\]\s*(.+)$/);
    if (m) {
      results[parseInt(m[1]) - 1] = m[2].trim();
    }
  }

  return results;
}

async function main() {
  const langName = LOCALE_NAMES[LOCALE] || LOCALE;
  console.log(`Translating to ${langName} (${LOCALE})...`);

  const en = JSON.parse(fs.readFileSync('src/messages/en.json', 'utf8'));
  const locFile = `src/messages/${LOCALE}.json`;
  const loc = JSON.parse(fs.readFileSync(locFile, 'utf8'));

  const enFlat = flatten(en);
  const locFlat = flatten(loc);

  // Find untranslated (identical to EN, length > 3)
  const toTranslate = [];
  for (const [key, enVal] of Object.entries(enFlat)) {
    if (locFlat[key] === enVal && typeof enVal === 'string' && enVal.length > 3) {
      toTranslate.push({ key, text: enVal });
    }
  }

  console.log(`Found ${toTranslate.length} untranslated strings`);
  if (toTranslate.length === 0) { console.log('Already complete!'); return; }

  // Deduplicate by text value
  const uniqueTexts = [...new Set(toTranslate.map(t => t.text))];
  console.log(`${uniqueTexts.length} unique texts to translate`);

  // Translate in batches of 25
  const BATCH = 25;
  const translationMap = {};
  let translated = 0;

  for (let i = 0; i < uniqueTexts.length; i += BATCH) {
    const batch = uniqueTexts.slice(i, i + BATCH);
    try {
      const results = await translateBatch(batch, langName);
      for (let j = 0; j < batch.length; j++) {
        if (results[j]) {
          translationMap[batch[j]] = results[j];
          translated++;
        }
      }
      process.stdout.write(`  Batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(uniqueTexts.length / BATCH)} — ${translated}/${uniqueTexts.length} done\r`);
    } catch (e) {
      console.error(`\n  Error at batch ${Math.floor(i / BATCH) + 1}:`, e.message);
      // Wait and retry once
      await new Promise(r => setTimeout(r, 2000));
      try {
        const results = await translateBatch(batch, langName);
        for (let j = 0; j < batch.length; j++) {
          if (results[j]) { translationMap[batch[j]] = results[j]; translated++; }
        }
      } catch (e2) {
        console.error(`  Retry failed:`, e2.message);
      }
    }
    // Rate limit: small delay between batches
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nTranslated ${translated}/${uniqueTexts.length} unique texts`);

  // Apply translations to locale file
  let applied = 0;
  for (const { key, text } of toTranslate) {
    if (translationMap[text]) {
      setNested(loc, key, translationMap[text]);
      applied++;
    }
  }

  fs.writeFileSync(locFile, JSON.stringify(loc, null, 2) + '\n');
  console.log(`Applied ${applied} translations to ${locFile}`);
}

main().catch(e => { console.error(e); process.exit(1); });
