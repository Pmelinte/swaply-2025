import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const evidenceDirectory = resolve(
  process.cwd(),
  process.env.RECOVERY_EVIDENCE_DIR?.trim() || "recovery-evidence",
);

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required for the read-only recovery inventory.");
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is required for the read-only recovery inventory.",
  );
}

const parsedUrl = new URL(supabaseUrl);
if (parsedUrl.protocol !== "https:") {
  throw new Error("SUPABASE_URL must use HTTPS.");
}

const expectedProjectRef = process.env.SUPABASE_PROJECT_REF?.trim();
if (expectedProjectRef && !parsedUrl.hostname.startsWith(`${expectedProjectRef}.`)) {
  throw new Error(
    `SUPABASE_URL does not match SUPABASE_PROJECT_REF ${expectedProjectRef}.`,
  );
}

const criticalTables = [
  "profiles",
  "items",
  "properties",
  "services_listings",
  "events_listings",
  "swaps",
  "conversations",
  "messages",
  "stories",
  "story_consents",
  "swapleni_ledger",
  "blog_posts",
  "blog_contributions",
  "domain_listing_private_data",
  "property_reservations",
  "service_deliveries",
  "event_transfers",
  "gdpr_requests",
  "reports",
  "disputes",
];

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
  global: {
    headers: {
      "X-Swaply-Recovery-Inventory": "v1-10-1",
    },
  },
});

const tableCounts = {};
for (const table of criticalTables) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Read-only count failed for ${table}: ${error.message}`);
  }

  tableCounts[table] = count ?? 0;
}

let authUserCount = 0;
for (let page = 1; page <= 100; page += 1) {
  const { data: userPage, error: userError } =
    await supabase.auth.admin.listUsers({ page, perPage: 1000 });

  if (userError) {
    throw new Error(`Read-only Auth inventory failed: ${userError.message}`);
  }

  authUserCount += userPage.users.length;
  if (userPage.users.length < 1000) break;

  if (page === 100) {
    throw new Error("Auth inventory exceeded the 100-page safety limit.");
  }
}

const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
if (bucketError) {
  throw new Error(`Read-only Storage inventory failed: ${bucketError.message}`);
}

const storageBuckets = [];
for (const bucket of buckets ?? []) {
  const { data: objects, error: objectError } = await supabase.storage
    .from(bucket.id)
    .list("", {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

  if (objectError) {
    throw new Error(
      `Read-only Storage inventory failed for bucket ${bucket.id}: ${objectError.message}`,
    );
  }

  storageBuckets.push({
    id: bucket.id,
    public: bucket.public,
    topLevelObjectCount: objects?.length ?? 0,
  });
}

storageBuckets.sort((left, right) => left.id.localeCompare(right.id));

const stableInventory = {
  contractVersion: "1.0.0",
  package: "V1-10.1",
  mode: "READ_ONLY_COUNTS_ONLY",
  projectHost: parsedUrl.hostname,
  authUserCount,
  tableCounts,
  storageBuckets,
  guarantees: {
    rawRowsExported: false,
    userEmailsLogged: false,
    storageObjectNamesLogged: false,
    productionWritesPerformed: false,
  },
};

const manifestHash = createHash("sha256")
  .update(JSON.stringify(stableInventory))
  .digest("hex");

const inventory = {
  ...stableInventory,
  generatedAt: new Date().toISOString(),
  manifestHash,
};

await mkdir(evidenceDirectory, { recursive: true });
await writeFile(
  resolve(evidenceDirectory, "production-inventory.json"),
  `${JSON.stringify(inventory, null, 2)}\n`,
  "utf8",
);

const markdown = [
  "# V1-10.1 Production recovery inventory",
  "",
  `- Project host: \`${inventory.projectHost}\``,
  `- Auth users: \`${inventory.authUserCount}\``,
  `- Critical public tables counted: \`${criticalTables.length}\``,
  `- Storage buckets counted: \`${storageBuckets.length}\``,
  `- Manifest SHA-256: \`${manifestHash}\``,
  "- Mode: `READ_ONLY_COUNTS_ONLY`",
  "- Raw rows, emails and object names are intentionally excluded.",
  "- Production writes performed: `false`.",
  "",
  "## Critical table counts",
  "",
  ...Object.entries(tableCounts).map(
    ([table, count]) => `- \`${table}\`: \`${count}\``,
  ),
  "",
  "## Storage inventory",
  "",
  ...(storageBuckets.length > 0
    ? storageBuckets.map(
        (bucket) =>
          `- \`${bucket.id}\`: public=\`${bucket.public}\`, top-level objects=\`${bucket.topLevelObjectCount}\``,
      )
    : ["- No buckets returned by the Storage API."]),
  "",
].join("\n");

await writeFile(
  resolve(evidenceDirectory, "production-inventory.md"),
  markdown,
  "utf8",
);

console.log(
  `V1-10.1 read-only inventory complete: ${criticalTables.length} tables, ${inventory.authUserCount} auth users, ${storageBuckets.length} buckets.`,
);
console.log(`Manifest SHA-256: ${manifestHash}`);
