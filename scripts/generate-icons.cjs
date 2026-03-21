#!/usr/bin/env node
/**
 * Generate PWA icons from the SVG source icon.
 * Usage: node scripts/generate-icons.js
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SOURCE = path.join(__dirname, "..", "public", "icon-192.svg");
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(SOURCE);

  // Generate standard icons
  for (const size of SIZES) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT_DIR, `icon-${size}x${size}.png`));
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Generate maskable icons (with 10% safe-zone padding)
  for (const size of MASKABLE_SIZES) {
    const innerSize = Math.round(size * 0.8);
    const padding = Math.round((size - innerSize) / 2);

    const inner = await sharp(svgBuffer).resize(innerSize, innerSize).png().toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 37, g: 99, b: 235, alpha: 1 }, // #2563eb
      },
    })
      .composite([{ input: inner, left: padding, top: padding }])
      .png()
      .toFile(path.join(OUT_DIR, `icon-maskable-${size}x${size}.png`));
    console.log(`  ✓ icon-maskable-${size}x${size}.png`);
  }

  // Generate apple-touch-icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(OUT_DIR, "apple-touch-icon.png"));
  console.log("  ✓ apple-touch-icon.png");

  // Generate favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(OUT_DIR, "favicon-32x32.png"));
  console.log("  ✓ favicon-32x32.png");

  console.log("\nDone! All icons generated in public/icons/");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
