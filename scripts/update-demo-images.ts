/**
 * Updates demo item images to category-relevant Unsplash photos.
 *
 * Usage:  npx tsx scripts/update-demo-images.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Title → relevant Unsplash image URLs ───────────────────────────────────

const titleImageMap: Record<string, string[]> = {
  // Electronică
  "Tastatură Mecanică RGB": [
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&h=300&fit=crop",
  ],
  "Căști Wireless ANC": [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
  ],
  "Raspberry Pi 4 Kit": [
    "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
  ],
  "Consolă Retro Gaming": [
    "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop",
  ],
  "Webcam HD 1080p": [
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1596566787710-19dc5a83266b?w=400&h=300&fit=crop",
  ],
  "SSD Extern 500GB": [
    "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=300&fit=crop",
  ],
  "Boxă Bluetooth Portabilă": [
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=400&h=300&fit=crop",
  ],
  "Ceas Smart Fitness": [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=300&fit=crop",
  ],
  "Tabletă 10\" 64GB": [
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=300&fit=crop",
  ],
  "Monitor IPS 24\"": [
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400&h=300&fit=crop",
  ],
  // Electronice (old category)
  "Căști Bluetooth Sony": [
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=300&fit=crop",
  ],

  // Sport & Outdoor
  "Bicicletă Urbană Hybrid": [
    "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop",
  ],
  "Minge Fotbal Profesională": [
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&h=300&fit=crop",
  ],
  "Rachetă Tenis Grafit": [
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&h=300&fit=crop",
  ],
  "Rucsac Drumeție 40L": [
    "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&h=300&fit=crop",
  ],
  "Set Yoga Complet": [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
  ],
  "Skateboard Complet": [
    "https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1564429238961-bf8bb48e7089?w=400&h=300&fit=crop",
  ],
  "Cort Camping 3 Persoane": [
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1478131143263-91f856e9ef7b?w=400&h=300&fit=crop",
  ],
  "Pantofi Alergare Trail": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=300&fit=crop",
  ],
  "Placă Surf 6ft": [
    "https://images.unsplash.com/photo-1502680390548-bdbac40c26e2?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=400&h=300&fit=crop",
  ],
  "Trotinetă Electrică": [
    "https://images.unsplash.com/photo-1604868189066-04b0f1a9b8e5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop",
  ],

  // Hobby & Jocuri
  "Catan + Extensie": [
    "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1606503153255-59d7cff16a18?w=400&h=300&fit=crop",
  ],
  "Set Lego Technic 800+ piese": [
    "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1560961911-ba7ef651a56c?w=400&h=300&fit=crop",
  ],
  "Puzzle 1000 Piese": [
    "https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1606503153255-59d7cff16a18?w=400&h=300&fit=crop",
  ],
  "Set Șah din Lemn": [
    "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=400&h=300&fit=crop",
  ],
  "Chitară Acustică": [
    "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400&h=300&fit=crop",
  ],
  "Set Pictură Acrilice": [
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
  ],
  "Mini Dronă cu Cameră HD": [
    "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&h=300&fit=crop",
  ],
  "Telescop Amator 700mm": [
    "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop",
  ],

  // Cărți & Media
  "Colecția Harry Potter": [
    "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop",
  ],
  "Curs Python Programming": [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1515879218367-8466d910aeb9?w=400&h=300&fit=crop",
  ],
  "Carte Rețete Tradiționale": [
    "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
  ],
  "Discuri Vinyl Clasice": [
    "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&h=300&fit=crop",
  ],
  "LOTR Extended Edition Box": [
    "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=300&fit=crop",
  ],
  "Manga One Piece vol 1-20": [
    "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
  ],

  // Modă & Accesorii
  "Adidași Sneakers Nike Air": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&h=300&fit=crop",
  ],
  "Ceas Analog Minimalist": [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&h=300&fit=crop",
  ],
  "Geantă Tote Handmade": [
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop",
  ],
  "Jachetă Piele Biker": [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=400&h=300&fit=crop",
  ],
  "Ochelari de Soare Polarizați": [
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=300&fit=crop",
  ],
  "Rochie Vintage Boho": [
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=300&fit=crop",
  ],
  "Rucsac din Piele Naturală": [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
  ],

  // Casă & Grădină
  "Aspirator Robot": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1589894404892-2a2fea7ccd62?w=400&h=300&fit=crop",
  ],
  "Hamac Dublu cu Suport": [
    "https://images.unsplash.com/photo-1520168961918-75e6cd6e2df3?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1504457047772-27faf1c00561?w=400&h=300&fit=crop",
  ],
  "Lampă LED de Birou": [
    "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop",
  ],
  "Presă Cafea French Press": [
    "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop",
  ],
  "Set Ghivece Ceramice": [
    "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop",
  ],
  "Set Unelte Grădină": [
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&h=300&fit=crop",
  ],

  // Empty category
  "Laptop": [
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop",
  ],
};

// ── Update logic ───────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const { data: items, error: fetchError } = await supabase
    .from("items")
    .select("id, title")
    .order("title");

  if (fetchError) {
    console.error("Error fetching items:", fetchError.message);
    process.exit(1);
  }

  if (!items || items.length === 0) {
    console.log("No items found.");
    process.exit(0);
  }

  console.log(`Found ${items.length} items. Updating images...`);

  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const images = titleImageMap[item.title];

    if (!images) {
      console.warn(`  ⚠ No image mapping for: "${item.title}" — skipping`);
      skipped++;
      continue;
    }

    try {
      const { error } = await supabase
        .from("items")
        .update({
          images,
          image_url: images[0],
        })
        .eq("id", item.id);

      if (error) {
        console.error(`  ✗ Error updating "${item.title}":`, error.message);
      } else {
        updated++;
      }
    } catch (err) {
      console.error(`  ✗ Exception updating "${item.title}":`, err);
    }

    await sleep(100);
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
