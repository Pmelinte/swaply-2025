// Run with: node scripts/fix-subcategories.mjs
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Updates subcategory for items where subcategory is null, 'other', or 'Other'
// using keyword inference from title + description.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SUBCATEGORIES = {
  object:   ['electronics', 'books', 'clothing', 'tools', 'toys', 'kitchen', 'sports', 'art', 'collectibles', 'furniture', 'jewelry', 'vehicles', 'music', 'garden'],
  property: ['apartment', 'house', 'studio', 'villa', 'office', 'loft', 'cabin', 'land', 'parking'],
  service:  ['cleaning', 'tutoring', 'plumbing', 'design', 'photography', 'gardening', 'cooking', 'transport', 'tech_support', 'legal', 'medical', 'beauty', 'music_lessons'],
  event:    ['concert', 'festival', 'conference', 'workshop', 'sport', 'theatre', 'expo', 'class', 'party'],
};

const KEYWORD_MAP = {
  // objects
  electronics:  ['phone', 'laptop', 'camera', 'tablet', 'headphone', 'tv', 'computer', 'smartphone', 'electronic', 'smartwatch', 'console', 'gaming'],
  books:        ['book', 'novel', 'library', 'collection', 'reading', 'fiction', 'textbook'],
  clothing:     ['shirt', 't-shirt', 'dress', 'jacket', 'shoes', 'pants', 'clothing', 'fashion', 'sneakers', 'boots', 'coat', 'perfume', 'watch'],
  furniture:    ['table', 'chair', 'sofa', 'desk', 'bed', 'shelf', 'cabinet', 'pool', 'cabana', 'couch', 'wardrobe'],
  vehicles:     ['car', 'bike', 'scooter', 'motorcycle', 'bicycle', 'vehicle', 'moped'],
  art:          ['painting', 'sculpture', 'art', 'graphic', 'canvas', 'print', 'illustration'],
  kitchen:      ['coffee', 'roaster', 'kitchen', 'blender', 'mixer', 'espresso', 'cookware', 'pot'],
  sports:       ['sport', 'fitness', 'gym', 'tennis', 'football', 'yoga', 'surf', 'ski', 'cycling', 'bicycle'],
  tools:        ['tool', 'drill', 'hammer', 'saw', 'wrench', 'screwdriver', 'equipment'],
  toys:         ['toy', 'lego', 'game', 'puzzle', 'doll', 'action figure', 'board game'],
  music:        ['guitar', 'piano', 'violin', 'drum', 'instrument', 'amplifier', 'microphone'],
  collectibles: ['collectible', 'vintage', 'antique', 'rare', 'limited edition', 'coin', 'stamp'],
  jewelry:      ['ring', 'necklace', 'bracelet', 'earring', 'jewelry', 'gold', 'silver', 'diamond'],
  garden:       ['garden', 'plant', 'flower', 'lawn', 'outdoor', 'patio'],
  // properties
  apartment:    ['apartment', 'flat', 'condo', 'penthouse'],
  house:        ['house', 'home', 'villa', 'pool house', 'farmhouse', 'bungalow'],
  studio:       ['studio', 'open plan', 'bachelor'],
  loft:         ['loft', 'industrial', 'converted'],
  office:       ['office', 'workspace', 'coworking', 'commercial'],
  cabin:        ['cabin', 'chalet', 'cottage', 'mountain', 'forest'],
  villa:        ['villa', 'luxury', 'mansion', 'estate'],
  land:         ['land', 'plot', 'farm', 'field', 'lot'],
  parking:      ['parking', 'garage', 'spot'],
  // services
  photography:  ['photo', 'portrait', 'photography', 'shoot', 'studio session'],
  design:       ['design', 'logo', 'branding', 'ui', 'ux', 'illustration', 'graphic'],
  cleaning:     ['clean', 'housekeep', 'maid', 'janitor', 'sanit'],
  tutoring:     ['tutor', 'teach', 'lesson', 'course', 'class', 'mentor', 'coach'],
  cooking:      ['cooking', 'chef', 'baking', 'catering', 'meal prep'],
  gardening:    ['garden', 'landscaping', 'lawn', 'plant', 'tree trim'],
  plumbing:     ['plumb', 'pipe', 'leak', 'drain', 'water'],
  transport:    ['transport', 'delivery', 'driver', 'moving', 'relocation'],
  tech_support: ['tech', 'it support', 'computer help', 'software', 'network'],
  legal:        ['legal', 'lawyer', 'attorney', 'contract', 'advice'],
  medical:      ['medical', 'health', 'nurse', 'therapy', 'massage'],
  beauty:       ['beauty', 'hair', 'makeup', 'nail', 'spa', 'salon'],
  music_lessons:['music lesson', 'guitar lesson', 'piano lesson', 'singing', 'voice'],
  // events
  concert:      ['concert', 'music', 'gig', 'show', 'ticket', 'live'],
  festival:     ['festival', 'outdoor event', 'fair'],
  conference:   ['conference', 'summit', 'talk', 'speaker', 'seminar'],
  workshop:     ['workshop', 'training', 'skill', 'hands-on'],
  sport:        ['sport', 'match', 'game', 'tournament', 'race'],
  theatre:      ['theatre', 'theater', 'play', 'opera', 'ballet', 'performance'],
  expo:         ['expo', 'exhibition', 'trade show', 'fair'],
  class:        ['class', 'course', 'session', 'lesson'],
  party:        ['party', 'celebration', 'birthday', 'wedding', 'gala'],
};

function inferSubcategory(category, title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const validSubs = SUBCATEGORIES[category] || [];

  for (const sub of validSubs) {
    const keywords = KEYWORD_MAP[sub] || [sub];
    if (keywords.some((kw) => text.includes(kw))) {
      return sub;
    }
  }

  // Fallback: random from valid enum — never 'other'
  const fallbacks = validSubs.filter((s) => s !== 'other');
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

async function main() {
  console.log('Fetching items with missing or "other" subcategory...');

  const { data: items, error } = await supabase
    .from('items')
    .select('id, category, subcategory, title, description')
    .or('subcategory.is.null,subcategory.eq.other,subcategory.eq.Other');

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  if (!items || items.length === 0) {
    console.log('No items to fix. All good!');
    return;
  }

  console.log(`Found ${items.length} items to fix.\n`);

  let updated = 0;
  let failed = 0;

  for (const item of items) {
    const newSub = inferSubcategory(
      item.category,
      item.title || '',
      item.description || '',
    );

    const { error: updateError } = await supabase
      .from('items')
      .update({ subcategory: newSub })
      .eq('id', item.id);

    if (updateError) {
      console.error(`  FAILED ${item.id}: ${updateError.message}`);
      failed++;
    } else {
      console.log(`  ${(item.title || '').slice(0, 40).padEnd(42)} [${item.category}] → ${newSub}`);
      updated++;
    }
  }

  console.log(`\nDone — updated ${updated}, failed ${failed} (total ${items.length})`);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
