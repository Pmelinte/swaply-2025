// Run with: node scripts/backfill-images.mjs
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Adds Unsplash images to property/service/event items that have no image_url.

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

const IMAGES = {
  property: {
    apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    house:     'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    villa:     'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    studio:    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&q=80',
    office:    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    loft:      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80',
    cabin:     'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&q=80',
    default:   'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
  },
  service: {
    cleaning:    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    tutoring:    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    plumbing:    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    design:      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    photography: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80',
    gardening:   'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
    cooking:     'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800&q=80',
    transport:   'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
    default:     'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
  },
  event: {
    concert:    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
    festival:   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    workshop:   'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    sport:      'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800&q=80',
    theatre:    'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&q=80',
    expo:       'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    default:    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  },
};

function pickImage(category, subcategory) {
  const map = IMAGES[category] || {};
  const key = subcategory?.toLowerCase() || 'default';
  return map[key] || map.default;
}

async function main() {
  console.log('Fetching property/service/event items without images...');

  const { data: items, error } = await supabase
    .from('items')
    .select('id, category, subcategory')
    .in('category', ['property', 'service', 'event'])
    .or('image_url.is.null,image_url.eq.');

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  if (!items || items.length === 0) {
    console.log('No items without images found. Nothing to do.');
    return;
  }

  console.log(`Found ${items.length} items to backfill.`);

  let updated = 0;
  let failed = 0;

  for (const item of items) {
    const url = pickImage(item.category, item.subcategory);
    const { error: updateError } = await supabase
      .from('items')
      .update({ image_url: url, images: [{ url, order: 0 }] })
      .eq('id', item.id);

    if (updateError) {
      console.error(`  Failed ${item.id}: ${updateError.message}`);
      failed++;
    } else {
      console.log(`  Updated ${item.id} (${item.category}/${item.subcategory ?? 'default'})`);
      updated++;
    }
  }

  console.log(`Done — updated ${updated}, failed ${failed}`);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
