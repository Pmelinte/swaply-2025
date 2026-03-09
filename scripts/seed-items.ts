/**
 * Seed script: populates the items table with 3-5 realistic Romanian swap objects per user.
 *
 * Usage:  npx tsx scripts/seed-items.ts
 *
 * Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// Load .env.local manually (no dotenv dependency needed)
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

// ── Categories & templates ──────────────────────────────────────────────────

interface ItemTemplate {
  title: string;
  category: string;
  description: string;
  wishlist: string;
  condition: "new" | "good" | "used";
  tags: string[];
  photos: string[];
}

const cities = [
  "București", "Cluj-Napoca", "Timișoara", "Iași", "Brașov",
  "Constanța", "Oradea", "Sibiu", "Craiova", "Galați",
  "Ploiești", "Arad", "Târgu Mureș", "Baia Mare", "Buzău",
];

const templates: ItemTemplate[] = [
  // Artă
  {
    title: "Tablou în ulei – peisaj de toamnă",
    category: "Artă",
    description: "Tablou original pictat în ulei pe pânză, 60×80 cm. Peisaj de toamnă din zona Bran. Ramă din lemn masiv. Perfect pentru living sau birou.",
    wishlist: "Sculptură, ceramică artizanală sau cărți de artă",
    condition: "good",
    tags: ["artă", "pictură", "tablou", "ulei", "peisaj"],
    photos: ["https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400"],
  },
  {
    title: "Set acuarele profesionale Winsor & Newton",
    category: "Artă",
    description: "Set complet 24 culori acuarelă profesională, folosit de 2 ori. Include pensule și bloc hârtie specială.",
    wishlist: "Set uleiuri sau pasteluri de calitate",
    condition: "new",
    tags: ["artă", "acuarelă", "picturi", "winsor-newton"],
    photos: ["https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400"],
  },

  // Unelte
  {
    title: "Bormașină Bosch cu percuție + set burghie",
    category: "Unelte",
    description: "Bosch Professional GSB 13 RE, 600W, în valiză originală. Include set 20 burghie diverse. Funcționează impecabil.",
    wishlist: "Șlefuitor sau fierăstrău circular",
    condition: "good",
    tags: ["bormasina", "bosch", "scule", "bricolaj"],
    photos: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400"],
  },
  {
    title: "Trusă scule complete – 120 piese",
    category: "Unelte",
    description: "Trusă completă cu chei, clești, șurubelnițe, cheie dinamometrică. Ideală pentru casă și auto.",
    wishlist: "Mașină de găurit sau polizor unghiular",
    condition: "good",
    tags: ["scule", "trusă", "bricolaj", "reparații"],
    photos: ["https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400"],
  },

  // Cărți
  {
    title: "Colecție 15 romane clasice românești",
    category: "Cărți",
    description: "Ediții complete: Rebreanu, Sadoveanu, Caragiale, Creangă, Eminescu. Stare bună, unele cu cotor ușor uzat.",
    wishlist: "Cărți SF sau fantasy în engleză",
    condition: "used",
    tags: ["cărți", "română", "clasice", "literatură"],
    photos: ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400"],
  },
  {
    title: "Manual programare Python – ediția 2024",
    category: "Cărți",
    description: "\"Python Crash Course\" de Eric Matthes, ediția a 3-a. Fără note sau sublinieri.",
    wishlist: "Cărți despre JavaScript, React sau machine learning",
    condition: "new",
    tags: ["cărți", "programare", "python", "IT"],
    photos: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400"],
  },

  // Electronice
  {
    title: "Monitor Dell 27\" 4K IPS",
    category: "Electronice",
    description: "Dell U2720Q, 4K UHD, USB-C, calibrat. Fără pixeli morți. Include cabluri originale.",
    wishlist: "Tabletă grafică sau laptop ușor",
    condition: "good",
    tags: ["monitor", "dell", "4K", "USB-C"],
    photos: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400"],
  },
  {
    title: "Căști Sony WH-1000XM4 – noise cancelling",
    category: "Electronice",
    description: "Căști wireless cu anulare activă zgomot. Baterie 30h, stare excelentă. Includ husa originală.",
    wishlist: "Boxe bluetooth sau microfon podcast",
    condition: "good",
    tags: ["căști", "sony", "wireless", "noise-cancelling"],
    photos: ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400"],
  },
  {
    title: "Tastatură mecanică Keychron K2",
    category: "Electronice",
    description: "Switch-uri Gateron Brown, layout 75%, RGB. Dual mode: Bluetooth + USB-C. Perfectă pentru programatori.",
    wishlist: "Mouse ergonomic sau webcam 4K",
    condition: "new",
    tags: ["tastatură", "mecanică", "keychron", "bluetooth"],
    photos: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400"],
  },

  // Sport
  {
    title: "Bicicletă MTB Rockrider ST 520",
    category: "Sport",
    description: "Cadru aluminiu, 27.5\", 21 viteze. Folosită un sezon. Frâne disc mecanice. Include pompă și kit reparații.",
    wishlist: "Role inline sau echipament schi",
    condition: "good",
    tags: ["bicicletă", "MTB", "sport", "outdoor"],
    photos: ["https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400"],
  },
  {
    title: "Set gantere reglabile 2×20 kg",
    category: "Sport",
    description: "Set complet cu bară și discuri, cromaj intact. Include suport metalic.",
    wishlist: "Bancă fitness sau bandă alergare",
    condition: "good",
    tags: ["fitness", "gantere", "sport", "acasă"],
    photos: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"],
  },

  // Casă
  {
    title: "Espressor DeLonghi Magnifica",
    category: "Casă",
    description: "Espressor automat, măcină boabele, spumă de lapte. Detartrat recent, funcțional 100%.",
    wishlist: "Robot de bucătărie sau blender profesional",
    condition: "good",
    tags: ["espressor", "cafea", "delonghi", "casă"],
    photos: ["https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400"],
  },
  {
    title: "Aspirator robot Xiaomi Roborock S5",
    category: "Casă",
    description: "Aspirare + mop, navigare LiDAR. Baterie excelentă, include piese de schimb.",
    wishlist: "Purificator de aer sau umidificator",
    condition: "good",
    tags: ["aspirator", "robot", "xiaomi", "smart-home"],
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"],
  },

  // Medical
  {
    title: "Tensiometru digital Omron M3",
    category: "Medical",
    description: "Tensiometru de braț, ecran mare, memorie 60 măsurători. Calibrat, funcționează perfect.",
    wishlist: "Pulsoximetru sau termometru digital fără contact",
    condition: "good",
    tags: ["medical", "tensiometru", "omron", "sănătate"],
    photos: ["https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400"],
  },
  {
    title: "Masă de masaj pliabilă profesională",
    category: "Medical",
    description: "Aluminiu ușor, tapițerie din piele ecologică, include husă transport. Ideală pentru terapeuți.",
    wishlist: "Saltea yoga premium sau echipament fizioterapie",
    condition: "new",
    tags: ["masaj", "medical", "terapie", "profesional"],
    photos: ["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400"],
  },

  // Grădinărit
  {
    title: "Motocositoare Honda GX35",
    category: "Grădinărit",
    description: "Motor Honda 4 timpi, coasă cu fir și disc. Pornește din prima, consum mic.",
    wishlist: "Drujbă sau fierăstrău electric",
    condition: "good",
    tags: ["grădină", "motocositoare", "honda", "gazon"],
    photos: ["https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400"],
  },
  {
    title: "Seră de grădină 3×6 m cu irigare",
    category: "Grădinărit",
    description: "Structură metalică galvanizată, policarbonat UV, sistem picurare inclus. Demontabilă.",
    wishlist: "Compostator sau set mobilier de grădină",
    condition: "good",
    tags: ["seră", "grădină", "legume", "irigare"],
    photos: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"],
  },

  // Auto
  {
    title: "Set anvelope iarnă Michelin 205/55 R16",
    category: "Auto",
    description: "4 anvelope Michelin Alpin 6, profil 6mm, un sezon folosite. DOT 2024.",
    wishlist: "Anvelope vară sau portbagaj plafon",
    condition: "good",
    tags: ["auto", "anvelope", "michelin", "iarnă"],
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400"],
  },
  {
    title: "Cameră auto DVR dublu – față + spate",
    category: "Auto",
    description: "Rezoluție 2K față, 1080p spate. GPS integrat, mod parcare. Card 64GB inclus.",
    wishlist: "Compresor auto sau kit prim ajutor",
    condition: "new",
    tags: ["auto", "cameră", "DVR", "dashcam"],
    photos: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400"],
  },

  // Muzică
  {
    title: "Chitară clasică Yamaha C40",
    category: "Muzică",
    description: "Chitară clasică pentru începători și intermediari. Sunet cald, corzi noi. Include husă și acordor.",
    wishlist: "Ukulele, cajon sau clape MIDI",
    condition: "good",
    tags: ["chitară", "muzică", "yamaha", "clasică"],
    photos: ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400"],
  },
  {
    title: "Pedală de efect Boss DS-1 Distortion",
    category: "Muzică",
    description: "Pedale clasice Boss DS-1, sunet iconic. Alimentator inclus.",
    wishlist: "Alte pedale de efect sau capodastru de calitate",
    condition: "good",
    tags: ["muzică", "pedală", "boss", "chitară-electrică"],
    photos: ["https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400"],
  },

  // IT
  {
    title: "Raspberry Pi 4 Model B – 8GB RAM",
    category: "IT",
    description: "Kit complet: placă, carcasă aluminiu cu răcire, alimentator USB-C, card 32GB. Perfect pentru proiecte IoT.",
    wishlist: "Arduino kit sau senzori electronici",
    condition: "new",
    tags: ["raspberry-pi", "IT", "IoT", "programare"],
    photos: ["https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=400"],
  },
  {
    title: "Router Mikrotik hAP ac3 – dual band",
    category: "IT",
    description: "Router profesional, dual band, configurat RouterOS. Ideal pentru rețele mici/medii.",
    wishlist: "Switch managed sau access point WiFi 6",
    condition: "good",
    tags: ["router", "mikrotik", "networking", "IT"],
    photos: ["https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400"],
  },

  // Gastronomie
  {
    title: "Set cuțite profesionale japoneze – 5 piese",
    category: "Gastronomie",
    description: "Cuțite din oțel damasc, mânere din lemn de trandafir. Include: santoku, nakiri, petty, paring, bread knife.",
    wishlist: "Oală din fontă sau set wok profesional",
    condition: "new",
    tags: ["cuțite", "gastronomie", "japoneză", "profesional"],
    photos: ["https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400"],
  },
  {
    title: "Cuptor pizza pe lemne portabil Ooni Koda",
    category: "Gastronomie",
    description: "Cuptor pe gaz, încălzire la 500°C în 15 min. Pizza autentică napolitană. Folosit de 3 ori.",
    wishlist: "Grill Weber sau afumătoare",
    condition: "good",
    tags: ["pizza", "cuptor", "ooni", "gastronomie"],
    photos: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"],
  },
];

// ── Seed logic ──────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomCity(): string {
  return cities[Math.floor(Math.random() * cities.length)];
}

async function main() {
  // 1. Fetch all existing users
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name");

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("No users found in the profiles table. Nothing to seed.");
    process.exit(0);
  }

  console.log(`Found ${profiles.length} users. Generating items...`);

  const intents: Array<"explore" | "open" | "committed" | "high_commitment"> = [
    "explore", "open", "committed", "high_commitment",
  ];
  const flexibilities: Array<"strict" | "moderate" | "broad"> = [
    "strict", "moderate", "broad",
  ];
  const contexts: Array<"permanent" | "vacation" | "temporary"> = [
    "permanent", "vacation", "temporary",
  ];

  let totalInserted = 0;
  const allRows: Record<string, unknown>[] = [];

  for (const profile of profiles) {
    const itemCount = 3 + Math.floor(Math.random() * 3); // 3-5 items
    const selected = pickRandom(templates, itemCount);

    for (const tpl of selected) {
      const row = {
        id: randomUUID(),
        owner_id: profile.id,
        title: tpl.title,
        category: tpl.category,
        condition: tpl.condition,
        description: tpl.description,
        wishlist: tpl.wishlist,
        status: "active",
        is_demo: false,
        is_active: true,
        location: randomCity(),
        ai_suggested_tags: tpl.tags,
        user_final_tags: tpl.tags,
        photos: tpl.photos,
        ai_metadata: {
          intent: intents[Math.floor(Math.random() * intents.length)],
          flexibility: flexibilities[Math.floor(Math.random() * flexibilities.length)],
          perceivedValue: ["small", "medium", "large"][Math.floor(Math.random() * 3)],
          clarity: ["exploring", "have_idea", "know_exactly"][Math.floor(Math.random() * 3)],
          context: contexts[Math.floor(Math.random() * contexts.length)],
          acceptsBundle: Math.random() > 0.5,
          recipientMatters: Math.random() > 0.7,
          conditionImpact: [],
          aiNote: null,
        },
        created_at: new Date(
          Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
        ).toISOString(),
        updated_at: new Date().toISOString(),
      };

      allRows.push(row);
    }
  }

  // Insert in batches of 50
  const BATCH = 50;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await supabase.from("items").insert(batch);
    if (error) {
      console.error(`Error inserting batch ${i / BATCH + 1}:`, error.message);
    } else {
      totalInserted += batch.length;
      console.log(`  Inserted batch ${Math.floor(i / BATCH) + 1}: ${batch.length} items`);
    }
  }

  console.log(`\nDone! Inserted ${totalInserted} items for ${profiles.length} users.`);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
