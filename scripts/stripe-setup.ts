/**
 * Stripe Product Setup Script
 * Creates all 6 Swaply products + prices in your Stripe account.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts
 */

const Stripe = require("stripe");

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("❌  Setează STRIPE_SECRET_KEY:");
  console.error("   STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/stripe-setup.ts");
  process.exit(1);
}

const stripe = new Stripe(key);

async function main() {
  console.log("🚀 Creez produsele Swaply în Stripe...\n");

  // ── 1. Swaply Premium (subscription) ──
  const premium = await stripe.products.create({
    name: "Swaply Premium",
    description: "50 listări active, 50 tokens/lună, matching prioritar, filtre avansate, analytics, fără reclame, 2 boost slots, 1 featured slot",
    metadata: { swaply_plan: "premium" },
  });
  console.log(`✅ Produs: Swaply Premium (${premium.id})`);

  const premiumMonthly = await stripe.prices.create({
    product: premium.id,
    unit_amount: 499, // $4.99
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { swaply_plan: "premium", interval: "monthly" },
  });
  console.log(`   💰 Preț lunar: $4.99/lună (${premiumMonthly.id})`);

  const premiumYearly = await stripe.prices.create({
    product: premium.id,
    unit_amount: 4788, // $47.88
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { swaply_plan: "premium", interval: "yearly" },
  });
  console.log(`   💰 Preț anual: $47.88/an (${premiumYearly.id})`);

  // ── 2. Swaply Platinum (subscription) ──
  const platinum = await stripe.products.create({
    name: "Swaply Platinum",
    description: "Listări nelimitate, 999 tokens/lună, export rapoarte PDF/CSV, mod licitație, suport prioritar, 5 boost slots, 3 featured slots",
    metadata: { swaply_plan: "platinum" },
  });
  console.log(`\n✅ Produs: Swaply Platinum (${platinum.id})`);

  const platinumMonthly = await stripe.prices.create({
    product: platinum.id,
    unit_amount: 999, // $9.99
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { swaply_plan: "platinum", interval: "monthly" },
  });
  console.log(`   💰 Preț lunar: $9.99/lună (${platinumMonthly.id})`);

  const platinumYearly = await stripe.prices.create({
    product: platinum.id,
    unit_amount: 9588, // $95.88
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { swaply_plan: "platinum", interval: "yearly" },
  });
  console.log(`   💰 Preț anual: $95.88/an (${platinumYearly.id})`);

  // ── 3-6. Token Packages (one-time) ──
  const tokenPackages = [
    { name: "Swaply Tokens — Starter", tokens: 100, priceUsd: 299, label: "100 tokens" },
    { name: "Swaply Tokens — Popular", tokens: 500, priceUsd: 999, label: "500 tokens" },
    { name: "Swaply Tokens — Pro", tokens: 1000, priceUsd: 1499, label: "1000 tokens" },
    { name: "Swaply Tokens — Mega", tokens: 5000, priceUsd: 4999, label: "5000 tokens" },
  ];

  console.log("");
  for (const pkg of tokenPackages) {
    const product = await stripe.products.create({
      name: pkg.name,
      description: `${pkg.label} pentru contul tău Swaply`,
      metadata: { swaply_type: "token_package", tokens: String(pkg.tokens) },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: pkg.priceUsd,
      currency: "usd",
      metadata: { swaply_type: "token_package", tokens: String(pkg.tokens) },
    });

    console.log(`✅ ${pkg.name}: $${(pkg.priceUsd / 100).toFixed(2)} (${price.id})`);
  }

  // ── 7-9. Boost / Featured / Insurance (one-time, EUR) ──
  const oneTimeProducts = [
    { name: "Swaply Boost 24h", amount: 99, currency: "eur", desc: "Articol promovat 24 de ore", type: "boost_24h" },
    { name: "Swaply Featured 48h", amount: 199, currency: "eur", desc: "Articol pe homepage 48 de ore", type: "featured_48h" },
    { name: "Swaply Super Boost 7 zile", amount: 499, currency: "eur", desc: "Top rezultate + notificări push 7 zile", type: "super_boost_7d" },
    { name: "Swaply Asigurare Swap", amount: 299, currency: "eur", desc: "Protecție completă pentru schimbul tău", type: "swap_insurance" },
  ];

  console.log("");
  for (const prod of oneTimeProducts) {
    const product = await stripe.products.create({
      name: prod.name,
      description: prod.desc,
      metadata: { swaply_type: prod.type },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: prod.amount,
      currency: prod.currency,
      metadata: { swaply_type: prod.type },
    });

    const symbol = prod.currency === "eur" ? "€" : "$";
    console.log(`✅ ${prod.name}: ${symbol}${(prod.amount / 100).toFixed(2)} (${price.id})`);
  }

  // ── Summary ──
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Toate produsele au fost create cu succes!\n");
  console.log("Adaugă aceste variabile în .env.local:\n");
  console.log(`STRIPE_PRICE_PREMIUM_MONTHLY=${premiumMonthly.id}`);
  console.log(`STRIPE_PRICE_PREMIUM_YEARLY=${premiumYearly.id}`);
  console.log(`STRIPE_PRICE_PLATINUM_MONTHLY=${platinumMonthly.id}`);
  console.log(`STRIPE_PRICE_PLATINUM_YEARLY=${platinumYearly.id}`);
  console.log("\n" + "═".repeat(60));
}

main().catch((err) => {
  console.error("❌ Eroare:", err.message);
  process.exit(1);
});
