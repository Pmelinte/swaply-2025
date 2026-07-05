const requiredPublic = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const recommendedServer = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SWAPLY_TEST_EMAIL",
  "SWAPLY_TEST_PASSWORD",
  "SWAPLY_DEMO_MATCH_ID",
  "SWAPLY_DEMO_SWAP_ID",
  "SWAPLY_DEMO_CONVERSATION_ID",
  "SWAPLY_DEMO_OBJECT_ID",
  "SWAPLY_DEMO_PROFILE_ID",
];

const missingRequired = requiredPublic.filter((name) => !process.env[name]);
const missingRecommended = recommendedServer.filter((name) => !process.env[name]);

if (missingRequired.length > 0) {
  console.error("Missing required public environment variables:");
  for (const name of missingRequired) console.error(`- ${name}`);
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.warn("Missing recommended release/test environment variables:");
  for (const name of missingRecommended) console.warn(`- ${name}`);
} else {
  console.log("All recommended release/test environment variables are present.");
}

console.log("Release environment check completed.");
