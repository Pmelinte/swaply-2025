// Run with: node scripts/seed-part3.mjs
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
// Required: npm install @supabase/supabase-js groq-sdk
//
// Depends on scripts/seed-users.json from seed-part2.mjs.
// Creates 700 items (300 object / 150 property / 150 service / 100 event)
// using Groq vision to enrich title / description / category.
// Then creates 400 swaps across realistic type + status distributions.
//
// Idempotent-ish: caches Groq analysis in scripts/seed-image-analysis.json,
// item progress in scripts/seed-items.json, swap progress in scripts/seed-swaps.json.

import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!GROQ_API_KEY) {
  console.warn('GROQ_API_KEY not set — all items will use fallback title/description/categories.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const __dirname = dirname(fileURLToPath(import.meta.url));
const USERS_FILE = resolve(__dirname, 'seed-users.json');
const ITEMS_FILE = resolve(__dirname, 'seed-items.json');
const SWAPS_FILE = resolve(__dirname, 'seed-swaps.json');
const ANALYSIS_FILE = resolve(__dirname, 'seed-image-analysis.json');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Image templates ----------
const images = {
  object: [
    { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', title: 'iPhone 13 Pro',     cat1: 'electronics', cat2: 'smartphones' },
    { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853', title: 'MacBook Pro',        cat1: 'electronics', cat2: 'laptops' },
    { url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f', title: 'Instant Camera',    cat1: 'electronics', cat2: 'cameras' },
    { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', title: 'Nike Shoes',            cat1: 'clothing',    cat2: 'footwear' },
    { url: 'https://images.unsplash.com/photo-1524678714210-9917a6c619c2', title: 'Road Bicycle',       cat1: 'sports',      cat2: 'cycling' },
    { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', title: 'Acoustic Guitar',       cat1: 'art',         cat2: 'music' },
    { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc', title: 'Modern Sofa',           cat1: 'furniture',   cat2: 'sofas' },
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', title: 'Vintage Watch',     cat1: 'clothing',    cat2: 'accessories' },
    { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570', title: 'Book Collection',   cat1: 'books',       cat2: 'fiction' },
    { url: 'https://images.unsplash.com/photo-1525904097878-94fb15835963', title: 'Smart Watch',       cat1: 'electronics', cat2: 'wearables' },
    { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1', title: 'Coffee Machine',    cat1: 'electronics', cat2: 'appliances' },
    { url: 'https://images.unsplash.com/photo-1544816565-aa8c1166648f', title: 'LEGO Set',              cat1: 'toys',        cat2: 'lego' },
    { url: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad', title: 'Perfume',           cat1: 'clothing',    cat2: 'beauty' },
    { url: 'https://images.unsplash.com/photo-1560343090-f0409e92791a', title: 'Leather Shoes',        cat1: 'clothing',    cat2: 'footwear' },
    { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772', title: 'Sneakers',             cat1: 'clothing',    cat2: 'footwear' },
  ],
  property: [
    { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', title: 'Modern Villa',      cat1: 'property', cat2: 'villa' },
    { url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2', title: 'City Apartment',       cat1: 'property', cat2: 'apartment' },
    { url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000', title: 'Mountain Cabin',    cat1: 'property', cat2: 'cabin' },
    { url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9', title: 'Beach House',        cat1: 'property', cat2: 'house' },
    { url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', title: 'Luxury Penthouse',  cat1: 'property', cat2: 'penthouse' },
    { url: 'https://images.unsplash.com/photo-1464146072230-91cabc968266', title: 'Country Farmhouse', cat1: 'property', cat2: 'farmhouse' },
  ],
  service: [
    { url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085', title: 'Web Development',   cat1: 'service', cat2: 'technology' },
    { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40', title: 'Business Consulting', cat1: 'service', cat2: 'consulting' },
    { url: 'https://images.unsplash.com/photo-1588702547923-7408785e0f6e', title: 'Graphic Design',     cat1: 'service', cat2: 'design' },
    { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173', title: 'Language Tutoring',  cat1: 'service', cat2: 'education' },
    { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b', title: 'Personal Training',  cat1: 'service', cat2: 'fitness' },
    { url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216', title: 'Legal Advice',       cat1: 'service', cat2: 'legal' },
  ],
  event: [
    { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87', title: 'Concert Tickets',   cat1: 'event', cat2: 'music' },
    { url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4', title: 'Festival Pass',     cat1: 'event', cat2: 'festival' },
    { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3', title: 'Sports Ticket',     cat1: 'event', cat2: 'sports' },
    { url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828', title: 'Travel Package',    cat1: 'event', cat2: 'travel' },
  ],
};

const cityByCountry = {
  RO: 'București', FR: 'Paris', DE: 'Berlin', ES: 'Madrid', IT: 'Roma', PL: 'Warszawa',
  NL: 'Amsterdam', PT: 'Lisboa', SE: 'Stockholm', HU: 'Budapest', CZ: 'Praha', GR: 'Athína',
  US: 'New York', CA: 'Toronto', MX: 'Ciudad de México', BR: 'São Paulo', AR: 'Buenos Aires',
  CO: 'Bogotá', JP: 'Tokyo', KR: 'Seoul', IN: 'Mumbai', TR: 'Istanbul', AE: 'Dubai',
  TH: 'Bangkok', SG: 'Singapore', ZA: 'Cape Town', NG: 'Lagos', EG: 'Cairo',
  AU: 'Sydney', NZ: 'Auckland',
};

const localeByCountry = {
  RO: 'ro', FR: 'fr', DE: 'de', ES: 'es', IT: 'it', PL: 'pl',
  NL: 'en', PT: 'pt', SE: 'en', HU: 'en', CZ: 'en', GR: 'en',
  US: 'en', CA: 'en', MX: 'es', BR: 'pt', AR: 'es', CO: 'es',
  JP: 'ja', KR: 'ko', IN: 'hi', TR: 'en', AE: 'ar', TH: 'en',
  SG: 'en', ZA: 'en', NG: 'en', EG: 'ar', AU: 'en', NZ: 'en',
};

const swapMessages = {
  en: ['Hi! Interested in swapping?', 'Your item looks great, want to trade?', 'I think we could make a fair swap!'],
  ro: ['Salut! Vrei să facem un schimb?', 'Obiectul tău arată bine, facem schimb?', 'Cred că putem face un schimb corect!'],
  fr: ['Bonjour! Intéressé par un échange?', 'Votre article m\'intéresse.', 'Je pense qu\'on peut faire un bon échange!'],
  de: ['Hallo! Interesse am Tausch?', 'Ihr Artikel sieht toll aus.', 'Ich denke wir können fair tauschen!'],
  es: ['¡Hola! ¿Interesado en intercambiar?', 'Tu artículo se ve genial.', '¡Creo que podemos hacer un buen intercambio!'],
  it: ['Ciao! Interessato a uno scambio?', 'Il tuo oggetto sembra ottimo.', 'Penso che possiamo fare uno scambio equo!'],
  pl: ['Cześć! Zainteresowany wymianą?', 'Twój przedmiot wygląda świetnie.', 'Myślę, że możemy dokonać uczciwej wymiany!'],
  ja: ['こんにちは！交換しませんか？', 'あなたのアイテムに興味があります。', '公平な取引ができると思います！'],
  ko: ['안녕하세요! 교환하고 싶어요.', '당신의 물건이 마음에 들어요.', '공정한 거래를 할 수 있을 것 같아요!'],
  ar: ['مرحبا! هل أنت مهتم بالتبادل؟', 'عنصرك يبدو رائعاً.', 'أعتقد أننا نستطيع إجراء تبادل عادل!'],
  pt: ['Olá! Interessado em uma troca?', 'Seu item parece ótimo.', 'Acho que podemos fazer uma troca justa!'],
  hi: ['नमस्ते! क्या आप आदान-प्रदान में रुचि रखते हैं?', 'आपकी वस्तु बढ़िया लगती है।', 'मुझे लगता है हम उचित व्यापार कर सकते हैं!'],
};

// ---------- File helpers ----------
function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.warn(`Could not parse ${path}: ${err.message}`);
    return fallback;
  }
}

function saveJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

// ---------- Groq analysis ----------
function weightedValueTier() {
  const r = Math.random();
  if (r < 0.40) return 'small';
  if (r < 0.75) return 'medium';
  if (r < 0.95) return 'large';
  return 'special';
}

async function analyzeImageOnce(imageUrl, fallback) {
  if (!groq) {
    return { title: fallback.title, description: `${fallback.title} — ${fallback.cat2}, good condition.`, category_l1: fallback.cat1, category_l2: fallback.cat2 };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: 'Analyze this image for a swap marketplace. Return ONLY valid JSON: {"title":"max 60 chars","description":"max 250 chars mentioning condition and key features","category_l1":"one of electronics|furniture|clothing|books|sports|art|toys|property|service|event","category_l2":"subcategory max 30 chars"}' },
          ],
        }],
        max_tokens: 300,
      });
      const raw = response.choices?.[0]?.message?.content?.trim() ?? '';
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(cleaned);
      return {
        title: (json.title || fallback.title).slice(0, 60),
        description: (json.description || '').slice(0, 250),
        category_l1: json.category_l1 || fallback.cat1,
        category_l2: (json.category_l2 || fallback.cat2).slice(0, 30),
      };
    } catch (err) {
      if (attempt === 1) {
        console.warn(`  Groq analysis failed for ${imageUrl}: ${err.message}`);
      }
      await sleep(500);
    }
  }
  return { title: fallback.title, description: `${fallback.title} — ${fallback.cat2}, good condition.`, category_l1: fallback.cat1, category_l2: fallback.cat2 };
}

async function analyzeAllImages(cache) {
  const allTemplates = [
    ...images.object, ...images.property, ...images.service, ...images.event,
  ];
  const uncached = allTemplates.filter((t) => !cache[t.url]);

  if (uncached.length === 0) {
    console.log(`All ${allTemplates.length} image URLs already analyzed.`);
    return;
  }

  console.log(`Analyzing ${uncached.length} unique image URL(s) via Groq...`);
  for (let i = 0; i < uncached.length; i++) {
    const template = uncached[i];
    console.log(`  Analyzing image ${i + 1}/${uncached.length}: ${template.title}`);
    const analysis = await analyzeImageOnce(template.url, template);
    cache[template.url] = analysis;
    saveJson(ANALYSIS_FILE, cache);

    await sleep(500);
    if ((i + 1) % 10 === 0 && i + 1 < uncached.length) {
      console.log('  Pausing 5s between batches...');
      await sleep(5000);
    }
  }
}

// ---------- Item construction ----------
function assignTypeByIndex(idx, totals) {
  let cumulative = 0;
  for (const [type, count] of Object.entries(totals)) {
    cumulative += count;
    if (idx < cumulative) return type;
  }
  return 'object';
}

function buildItemRow({ user, type, template, analysis }) {
  const openTo = ['object', 'property', 'service', 'event'].filter(() => Math.random() > 0.5);
  const swapOpenTo = openTo.length > 0 ? openTo : ['object'];
  const valueTier = weightedValueTier();
  const partial = Math.random() > 0.7;

  return {
    id: crypto.randomUUID(),
    owner_id: user.userId,
    title: analysis.title,
    description: analysis.description,
    category_l1: analysis.category_l1,
    category_l2: analysis.category_l2,
    category_path: `${analysis.category_l1}/${analysis.category_l2}`,
    item_type: type,
    condition_v2: pick(['new', 'like_new', 'very_good', 'good', 'used']),
    perceived_value_tier: valueTier,
    swap_geo_preference: pick(['local', 'regional', 'international', 'vacation']),
    swap_open_to: swapOpenTo,
    swap_wants_value_tier: pick(['small', 'medium', 'large', 'any']),
    swap_wants_description: 'Looking for something of similar value',
    care_who_receives: Math.random() > 0.7,
    chain_swap_allowed: Math.random() > 0.7,
    cross_category_swap: Math.random() > 0.6,
    accepts_packages: Math.random() > 0.5,
    escrow_accepted: Math.random() > 0.6,
    swap_partial_allowed: partial,
    swap_partial_topup_eur: partial ? rand(10, 200) : null,
    location_city: cityByCountry[user.countryCode] ?? null,
    location_country: user.countryCode,
    image_url: template.url,
    images: [{ url: template.url, order: 0 }],
    status: 'active',
    is_active: true,
    is_demo: true,
    moderation_status: 'approved',
    created_at: new Date(Date.now() - rand(0, 60) * 86_400_000).toISOString(),
  };
}

function buildPropertyRow({ itemId, user }) {
  return {
    item_id: itemId,
    owner_id: user.userId,
    property_type: pick(['house', 'apartment', 'villa', 'cabin', 'farmhouse', 'studio']),
    listing_purpose: pick(['vacation_swap', 'home_exchange']),
    country_code: user.countryCode,
    city: cityByCountry[user.countryCode] ?? null,
    bedrooms: rand(1, 5),
    bathrooms: rand(1, 3),
    surface_total_sqm: rand(40, 300),
    exchange_type: pick(['simultaneous', 'non_simultaneous']),
    min_stay_days: rand(3, 14),
    max_stay_days: rand(14, 60),
    preferred_seasons: (() => {
      const s = ['spring', 'summer', 'autumn', 'winter'].filter(() => Math.random() > 0.5);
      return s.length > 0 ? s : ['summer'];
    })(),
    status: 'active',
  };
}

function buildServiceRow({ itemRow }) {
  return {
    item_id: itemRow.id,
    owner_id: itemRow.owner_id,
    category_l1: itemRow.category_l1,
    service_name: itemRow.title,
    delivery_mode: pick(['remote', 'onsite', 'both']),
    skill_level: pick(['intermediate', 'advanced', 'expert']),
    service_area_type: pick(['regional', 'national', 'international']),
    swap_open_to: itemRow.swap_open_to,
    swap_wants_value_tier: itemRow.swap_wants_value_tier,
    status: 'active',
  };
}

function buildEventRow({ itemRow, user }) {
  const startOffsetDays = rand(7, 180);
  const endOffsetDays = startOffsetDays + rand(1, 7);
  return {
    item_id: itemRow.id,
    owner_id: user.userId,
    event_group: pick(['entertainment', 'sports', 'travel', 'culture']),
    event_category: itemRow.category_l2,
    location_type: 'physical',
    country_code: user.countryCode,
    city: cityByCountry[user.countryCode] ?? null,
    start_date: new Date(Date.now() + startOffsetDays * 86_400_000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + endOffsetDays * 86_400_000).toISOString().split('T')[0],
    capacity_total: rand(1, 4),
    swap_open_to: itemRow.swap_open_to,
    status: 'active',
  };
}

// ---------- Items flow ----------
async function seedItems({ users, analysisCache, itemsState }) {
  const processedUserIds = new Set(itemsState.processedUserIds ?? []);
  itemsState.items = itemsState.items ?? [];

  const typeTotals = { object: 150, property: 75, service: 75, event: 50 };
  const typeByUserIndex = (i) => assignTypeByIndex(i, typeTotals);

  console.log(`Creating items for ${users.length} users (target 700 items, already done: ${processedUserIds.size} users).`);

  let createdCount = itemsState.items.length;
  let errorCount = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (processedUserIds.has(user.userId)) continue;

    const type = typeByUserIndex(i);
    const templatePool = images[type];
    const templates = [pick(templatePool), pick(templatePool)];

    for (const template of templates) {
      const analysis = analysisCache[template.url] ?? {
        title: template.title,
        description: `${template.title} — ${template.cat2}, good condition.`,
        category_l1: template.cat1,
        category_l2: template.cat2,
      };

      const itemRow = buildItemRow({ user, type, template, analysis });

      const { error: insertError } = await supabase.from('items').insert(itemRow);
      if (insertError) {
        errorCount++;
        console.error(`  item insert failed for ${user.username}: ${insertError.message}`);
        continue;
      }

      if (type === 'property') {
        const propRow = buildPropertyRow({ itemId: itemRow.id, user });
        const { error: propErr } = await supabase.from('properties').insert(propRow);
        if (propErr) {
          errorCount++;
          console.error(`    properties insert failed for item ${itemRow.id}: ${propErr.message}`);
        }
      } else if (type === 'service') {
        const svcRow = buildServiceRow({ itemRow });
        const { error: svcErr } = await supabase.from('services_listings').insert(svcRow);
        if (svcErr) {
          errorCount++;
          console.error(`    services_listings insert failed for item ${itemRow.id}: ${svcErr.message}`);
        }
      } else if (type === 'event') {
        const evtRow = buildEventRow({ itemRow, user });
        const { error: evtErr } = await supabase.from('events_listings').insert(evtRow);
        if (evtErr) {
          errorCount++;
          console.error(`    events_listings insert failed for item ${itemRow.id}: ${evtErr.message}`);
        }
      }

      createdCount++;
      itemsState.items.push({
        id: itemRow.id,
        owner_id: itemRow.owner_id,
        type,
        countryCode: user.countryCode,
      });
      console.log(`Item ${createdCount}/${users.length * 2}: ${itemRow.title} [${type}] for ${user.username}`);
    }

    processedUserIds.add(user.userId);
    itemsState.processedUserIds = Array.from(processedUserIds);

    if ((i + 1) % 10 === 0) {
      saveJson(ITEMS_FILE, itemsState);
    }
  }

  saveJson(ITEMS_FILE, itemsState);
  console.log(`Items done: ${createdCount} created, ${errorCount} errors`);
  return { createdCount, errorCount };
}

// ---------- Swaps flow ----------
function buildStatusPool() {
  const pool = [];
  const dist = { pending: 120, accepted: 100, completed: 80, rejected: 50, cancelled: 30, expired: 20 };
  for (const [status, count] of Object.entries(dist)) {
    for (let i = 0; i < count; i++) pool.push(status);
  }
  return pool;
}

function buildSwapPlan() {
  return [
    { offeredType: 'object',   requestedType: 'object',   count: 150 },
    { offeredType: 'object',   requestedType: 'service',  count: 60 },
    { offeredType: 'property', requestedType: 'property', count: 60 },
    { offeredType: 'service',  requestedType: 'service',  count: 50 },
    { offeredType: 'object',   requestedType: 'property', count: 40 },
    { offeredType: 'event',    requestedType: 'object',   count: 40 },
  ];
}

async function seedSwaps({ items, swapsState }) {
  swapsState.swaps = swapsState.swaps ?? [];
  const existingPairs = new Set(
    swapsState.swaps.map((s) => `${s.offered_item_id}|${s.requested_item_id}`),
  );

  const byType = {
    object: items.filter((it) => it.type === 'object'),
    property: items.filter((it) => it.type === 'property'),
    service: items.filter((it) => it.type === 'service'),
    event: items.filter((it) => it.type === 'event'),
  };

  const statusPool = buildStatusPool();
  const plan = buildSwapPlan();
  const totalTarget = plan.reduce((a, p) => a + p.count, 0);
  console.log(`Creating swaps (target ${totalTarget}, already done: ${swapsState.swaps.length}).`);

  let createdCount = swapsState.swaps.length;
  let errorCount = 0;
  let statusIdx = createdCount;

  for (const group of plan) {
    const offered = byType[group.offeredType];
    const requested = byType[group.requestedType];
    if (!offered.length || !requested.length) {
      console.warn(`  Skipping ${group.offeredType} ↔ ${group.requestedType} — not enough items.`);
      continue;
    }

    let madeForGroup = 0;
    let attempts = 0;
    const maxAttempts = group.count * 20;

    while (madeForGroup < group.count && attempts < maxAttempts) {
      attempts++;

      const offeredItem = pick(offered);
      const requestedItem = pick(requested);
      if (offeredItem.owner_id === requestedItem.owner_id) continue;

      const pairKey = `${offeredItem.id}|${requestedItem.id}`;
      if (existingPairs.has(pairKey)) continue;

      const status = statusPool[statusIdx % statusPool.length];
      statusIdx++;

      const daysAgo = rand(0, 60);
      const createdAt = new Date(Date.now() - daysAgo * 86_400_000);
      const completedAt = status === 'completed'
        ? new Date(createdAt.getTime() + rand(3, 30) * 86_400_000).toISOString()
        : null;

      const locale = localeByCountry[offeredItem.countryCode] ?? 'en';
      const message = pick(swapMessages[locale] ?? swapMessages.en);

      const swapRow = {
        id: crypto.randomUUID(),
        requester_id: offeredItem.owner_id,
        responder_id: requestedItem.owner_id,
        offered_item_id: offeredItem.id,
        requested_item_id: requestedItem.id,
        status,
        swap_type: offeredItem.type,
        message_initial: message,
        created_at: createdAt.toISOString(),
        completed_at: completedAt,
        logistics: { locationType: pick(['public_spot', 'courier', 'in_person']) },
        requester_confirmed: status === 'completed',
        responder_confirmed: status === 'completed',
      };

      const { error: insertError } = await supabase.from('swaps').insert(swapRow);
      if (insertError) {
        errorCount++;
        console.error(`  swap insert failed: ${insertError.message}`);
        continue;
      }

      existingPairs.add(pairKey);
      swapsState.swaps.push(swapRow);
      madeForGroup++;
      createdCount++;
      console.log(`Swap ${createdCount}/${totalTarget}: ${status} (${group.offeredType} ↔ ${group.requestedType})`);

      if (createdCount % 25 === 0) saveJson(SWAPS_FILE, swapsState);
    }

    if (madeForGroup < group.count) {
      console.warn(`  ${group.offeredType} ↔ ${group.requestedType}: only ${madeForGroup}/${group.count} created (attempt budget exhausted).`);
    }
  }

  saveJson(SWAPS_FILE, swapsState);
  console.log(`Swaps done: ${createdCount} created, ${errorCount} errors`);
  return { createdCount, errorCount };
}

// ---------- Main ----------
async function main() {
  if (!existsSync(USERS_FILE)) {
    console.error(`Missing ${USERS_FILE}. Run scripts/seed-part2.mjs first.`);
    process.exit(1);
  }

  const users = loadJson(USERS_FILE, []);
  if (!users.length) {
    console.error(`${USERS_FILE} is empty.`);
    process.exit(1);
  }

  const analysisCache = loadJson(ANALYSIS_FILE, {});
  const itemsState = loadJson(ITEMS_FILE, { items: [], processedUserIds: [] });
  const swapsState = loadJson(SWAPS_FILE, { swaps: [] });

  let itemErrors = 0;
  let swapErrors = 0;

  try {
    await analyzeAllImages(analysisCache);
  } catch (err) {
    console.error('Image analysis phase failed:', err.message);
  }

  try {
    const { errorCount } = await seedItems({ users, analysisCache, itemsState });
    itemErrors = errorCount;
  } catch (err) {
    console.error('Items phase failed:', err.message);
  }

  try {
    const { errorCount } = await seedSwaps({ items: itemsState.items, swapsState });
    swapErrors = errorCount;
  } catch (err) {
    console.error('Swaps phase failed:', err.message);
  }

  console.log('');
  console.log(`Items: ${itemsState.items.length}/700, Swaps: ${swapsState.swaps.length}/400, Errors: ${itemErrors + swapErrors}`);
}

main().catch((err) => {
  console.error('Seed-part3 failed:', err);
  process.exit(1);
});
