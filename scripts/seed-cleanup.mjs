// Run with: node scripts/seed-cleanup.mjs
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required: npm install @supabase/supabase-js
//
// Removes every row this seed pipeline inserted:
//   1. swaps where offered_item_id or requested_item_id belongs to a demo item
//   2. events_listings, services_listings, properties where item_id is demo
//   3. items where is_demo = true
//   4. onboarding_progress rows for every user in scripts/seed-users.json
//   5. profiles rows for every user in scripts/seed-users.json
//   6. auth.users for every user in scripts/seed-users.json
//
// Safe to re-run: each step deletes what's there and logs a count.
// Does NOT touch rows outside the seed-users.json list or items with is_demo=false.

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const USERS_FILE = resolve(__dirname, 'seed-users.json');

async function fetchDemoItemIds() {
  const ids = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .eq('is_demo', true)
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`items lookup failed: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) ids.push(row.id);

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

async function deleteInChunks(label, deleter, ids, chunkSize = 500) {
  if (ids.length === 0) {
    console.log(`  ${label}: nothing to delete`);
    return 0;
  }
  let total = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const slice = ids.slice(i, i + chunkSize);
    const { error, count } = await deleter(slice);
    if (error) {
      console.error(`  ${label}: batch ${Math.floor(i / chunkSize) + 1} failed: ${error.message}`);
      continue;
    }
    total += typeof count === 'number' ? count : slice.length;
  }
  console.log(`  ${label}: deleted ${total} rows`);
  return total;
}

async function deleteSwapsForItems(itemIds) {
  if (itemIds.length === 0) {
    console.log('  swaps: no demo items, skipping');
    return 0;
  }
  let offeredTotal = 0;
  let requestedTotal = 0;

  for (let i = 0; i < itemIds.length; i += 500) {
    const chunk = itemIds.slice(i, i + 500);

    const { error: offeredErr, count: offeredCount } = await supabase
      .from('swaps')
      .delete({ count: 'exact' })
      .in('offered_item_id', chunk);
    if (offeredErr) {
      console.error(`  swaps(offered) chunk ${Math.floor(i / 500) + 1} failed: ${offeredErr.message}`);
    } else {
      offeredTotal += typeof offeredCount === 'number' ? offeredCount : 0;
    }

    const { error: requestedErr, count: requestedCount } = await supabase
      .from('swaps')
      .delete({ count: 'exact' })
      .in('requested_item_id', chunk);
    if (requestedErr) {
      console.error(`  swaps(requested) chunk ${Math.floor(i / 500) + 1} failed: ${requestedErr.message}`);
    } else {
      requestedTotal += typeof requestedCount === 'number' ? requestedCount : 0;
    }
  }

  const total = offeredTotal + requestedTotal;
  console.log(`  swaps: deleted ${total} rows (${offeredTotal} by offered, ${requestedTotal} by requested)`);
  return total;
}

async function deleteAuthUsers(userIds) {
  if (userIds.length === 0) {
    console.log('  auth.users: nothing to delete');
    return { deleted: 0, errors: 0 };
  }
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < userIds.length; i++) {
    const id = userIds[i];
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      if (error.status === 404 || /not found/i.test(error.message)) {
        // Already gone — count as "deleted"
        deleted++;
      } else {
        errors++;
        console.error(`    auth.users delete failed for ${id}: ${error.message}`);
      }
    } else {
      deleted++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`    auth.users progress: ${i + 1}/${userIds.length}`);
    }
  }

  console.log(`  auth.users: deleted ${deleted} (errors ${errors})`);
  return { deleted, errors };
}

async function main() {
  console.log('Seed cleanup starting...');

  let seedUsers = [];
  if (existsSync(USERS_FILE)) {
    try {
      const raw = JSON.parse(readFileSync(USERS_FILE, 'utf8'));
      if (Array.isArray(raw)) seedUsers = raw;
    } catch (err) {
      console.warn(`Could not parse ${USERS_FILE}: ${err.message}`);
    }
  } else {
    console.warn(`${USERS_FILE} not found — will only clean up demo items/swaps.`);
  }

  const userIds = seedUsers.map((u) => u.userId).filter(Boolean);

  console.log(`Found ${userIds.length} seed users in ${USERS_FILE}.`);

  console.log('\n1. Fetching demo item IDs...');
  let demoItemIds = [];
  try {
    demoItemIds = await fetchDemoItemIds();
  } catch (err) {
    console.error(`  Failed: ${err.message}`);
  }
  console.log(`  Found ${demoItemIds.length} items with is_demo=true.`);

  console.log('\n2. Deleting swaps tied to demo items...');
  await deleteSwapsForItems(demoItemIds);

  console.log('\n3. Deleting events_listings, services_listings, properties for demo items...');
  await deleteInChunks(
    'events_listings',
    (chunk) => supabase.from('events_listings').delete({ count: 'exact' }).in('item_id', chunk),
    demoItemIds,
  );
  await deleteInChunks(
    'services_listings',
    (chunk) => supabase.from('services_listings').delete({ count: 'exact' }).in('item_id', chunk),
    demoItemIds,
  );
  await deleteInChunks(
    'properties',
    (chunk) => supabase.from('properties').delete({ count: 'exact' }).in('item_id', chunk),
    demoItemIds,
  );

  console.log('\n4. Deleting demo items...');
  await deleteInChunks(
    'items',
    (chunk) => supabase.from('items').delete({ count: 'exact' }).in('id', chunk),
    demoItemIds,
  );

  console.log('\n5. Deleting onboarding_progress rows for seed users...');
  await deleteInChunks(
    'onboarding_progress',
    (chunk) => supabase.from('onboarding_progress').delete({ count: 'exact' }).in('user_id', chunk),
    userIds,
  );

  console.log('\n6. Deleting profiles for seed users...');
  await deleteInChunks(
    'profiles',
    (chunk) => supabase.from('profiles').delete({ count: 'exact' }).in('user_id', chunk),
    userIds,
  );

  console.log('\n7. Deleting auth.users for seed users...');
  const authResult = await deleteAuthUsers(userIds);

  console.log('\nCleanup summary:');
  console.log(`  demo items:    ${demoItemIds.length} targeted`);
  console.log(`  auth.users:    ${authResult.deleted} deleted, ${authResult.errors} errors`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
