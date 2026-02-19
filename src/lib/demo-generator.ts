/**
 * Demo Data Generator — produces 10K–50K realistic items, users, matches
 * for funding pitches and load-testing. Toggle via URL ?demo=10000 or env.
 *
 * Usage:
 *   import { generateDemoData } from "@/lib/demo-generator";
 *   const { users, items, matches } = generateDemoData(10_000);
 */

import type {
  Item,
  UserProfile,
  MatchCandidate,
  MatchTier,
  ListingType,
  BadgeTier,
  ItemIntent,
  ItemFlexibility,
  ItemPerceivedValue,
  ItemConditionImpact,
  ItemClarity,
  ItemContext,
  HouseAmenity,
  HouseRule,
  PropertyType,
  HouseSwapMode,
  ServiceCategory,
  SkillLevel,
  ServiceDelivery,
} from "./types";

/* ─── Seeded PRNG for reproducible demo data ─── */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─── Catalog data ─── */

const ROMANIAN_CITIES = [
  { city: "București", region: "Ilfov", lat: 44.43, lng: 26.1 },
  { city: "Cluj-Napoca", region: "Cluj", lat: 46.77, lng: 23.59 },
  { city: "Timișoara", region: "Timiș", lat: 45.75, lng: 21.23 },
  { city: "Iași", region: "Iași", lat: 47.16, lng: 27.58 },
  { city: "Constanța", region: "Constanța", lat: 44.17, lng: 28.63 },
  { city: "Brașov", region: "Brașov", lat: 45.65, lng: 25.6 },
  { city: "Sibiu", region: "Sibiu", lat: 45.79, lng: 24.15 },
  { city: "Craiova", region: "Dolj", lat: 44.33, lng: 23.8 },
  { city: "Oradea", region: "Bihor", lat: 47.05, lng: 21.92 },
  { city: "Galați", region: "Galați", lat: 45.44, lng: 28.05 },
  { city: "Ploiești", region: "Prahova", lat: 44.94, lng: 26.03 },
  { city: "Arad", region: "Arad", lat: 46.17, lng: 21.32 },
  { city: "Pitești", region: "Argeș", lat: 44.86, lng: 24.87 },
  { city: "Târgu Mureș", region: "Mureș", lat: 46.54, lng: 24.56 },
  { city: "Baia Mare", region: "Maramureș", lat: 47.66, lng: 23.58 },
  { city: "Buzău", region: "Buzău", lat: 45.15, lng: 26.82 },
  { city: "Suceava", region: "Suceava", lat: 47.63, lng: 26.26 },
  { city: "Bacău", region: "Bacău", lat: 46.58, lng: 26.91 },
  { city: "Deva", region: "Hunedoara", lat: 45.88, lng: 22.9 },
  { city: "Alba Iulia", region: "Alba", lat: 46.07, lng: 23.58 },
];

const EU_CITIES = [
  { city: "Berlin", region: "Berlin", lat: 52.52, lng: 13.41 },
  { city: "Paris", region: "Île-de-France", lat: 48.86, lng: 2.35 },
  { city: "Madrid", region: "Madrid", lat: 40.42, lng: -3.7 },
  { city: "Rome", region: "Lazio", lat: 41.9, lng: 12.5 },
  { city: "Vienna", region: "Wien", lat: 48.21, lng: 16.37 },
  { city: "Budapest", region: "Pest", lat: 47.5, lng: 19.04 },
  { city: "Prague", region: "Praha", lat: 50.08, lng: 14.44 },
  { city: "Warsaw", region: "Masovia", lat: 52.23, lng: 21.01 },
  { city: "Amsterdam", region: "Noord-Holland", lat: 52.37, lng: 4.9 },
  { city: "Lisbon", region: "Lisboa", lat: 38.72, lng: -9.14 },
];

const ALL_CITIES = [...ROMANIAN_CITIES, ...EU_CITIES];

const OBJECT_CATEGORIES = [
  "Electronică", "Cărți", "Îmbrăcăminte", "Sport & Outdoor", "Casă & Grădină",
  "Jucării", "Artă", "Muzică", "Vehicule", "Unelte", "Hobby & Jocuri",
  "Mobilă", "Electronice mici", "Bijuterii", "Fotografie",
];

const OBJECT_TITLES: Record<string, string[]> = {
  "Electronică": [
    "Laptop Dell Inspiron", "Monitor 27'' 4K", "Tastatură mecanică RGB", "Mouse wireless gaming",
    "Tabletă Samsung Galaxy", "Ceas smart Garmin", "Difuzor Bluetooth JBL", "Consolă PlayStation 4",
    "Cameră web Logitech", "SSD extern 1TB", "Încărcător wireless", "Căști noise-cancelling",
    "Router WiFi 6", "Imprimantă color", "Cititor e-book Kindle", "Proiector mini LED",
    "Stație de andocare USB-C", "Powerbank 20000mAh", "Boxă inteligentă Alexa", "Telecomandă universală",
  ],
  "Cărți": [
    "Colecție Harry Potter", "Sapiens – Yuval Noah Harari", "Atlas de anatomie", "Carte de bucate vegane",
    "Enciclopedie pentru copii", "Trilogia Stăpânul Inelelor", "Ghid de programare Python",
    "Roman de Paulo Coelho", "Manual de fotografie", "Carte de design grafic",
    "Dicționar Oxford EN-RO", "Biblia (ediție de lux)", "Colecție reviste National Geographic",
    "Carte de meditație", "Ghid turistic Europa",
  ],
  "Îmbrăcăminte": [
    "Geacă de iarnă North Face", "Adidași Nike Air Max", "Ceas Casio G-Shock", "Rucsac Osprey 40L",
    "Pantaloni ski Salomon", "Rochie de seară", "Costum bărbătesc M", "Palton lână Zara",
    "Bocanci drumeție", "Ochelari de soare Ray-Ban", "Cravată mătase", "Curea piele naturală",
    "Pulover cașmir", "Șapcă New Era", "Mănuși touchscreen",
  ],
  "Sport & Outdoor": [
    "Bicicletă urbană", "Set gantere 20kg", "Bandă de alergat", "Corturi camping 4 pers",
    "Skateboard electric", "Rachete badminton", "Minge fotbal Adidas", "Sac de dormit -10°C",
    "Caiac gonflabil", "Trotineta electrică", "Aparat fitness multifuncțional", "Set yoga complet",
    "Rolele inline", "Crose de golf", "Mingii de tenis (set)",
  ],
  "Casă & Grădină": [
    "Aspirator robot", "Mașina de spălat vase", "Set de cuțite profesional", "Grill pe gaz Weber",
    "Set de grădinărit", "Perdele blackout", "Candelabru cristal", "Covor persan 2x3m",
    "Pernă memory foam", "Uscător de haine", "Robot de bucătărie", "Aparat de făcut pâine",
    "Set de prosoape bamboo", "Oglindă baie LED", "Masă pliabilă lemn",
  ],
  "Jucării": [
    "Set Lego Technic", "Păpușă Barbie", "Puzzle 3D", "Trenuleț electric",
    "Robot programabil", "Set chimie copii", "Joc de societate Monopoly", "Nerf Blaster",
    "Drona mini pentru copii", "Kit construcție K'NEX",
  ],
  "Artă": [
    "Set picturi acrilic", "Șevalet profesional", "Tablou artă modernă", "Set ceramică handmade",
    "Sculptură lemn tradițională", "Kit caligrafie", "Albume foto artizanale",
    "Set desene pastel", "Gravură pe lemn", "Poster vintage colecție",
  ],
  "Muzică": [
    "Chitară acustică Yamaha", "Pian digital Casio", "Amplificator Marshall", "Mixerul audio 4 canale",
    "Set tobe electronice", "Vioară 4/4", "Ukulele concert", "Microfon studio USB",
    "Platane vinyl", "Fluier irland",
  ],
  "Vehicule": [
    "Bicicletă mountain bike", "Trotinetă electrică Xiaomi", "Accesorii auto LED",
    "Portbagaj acoperiș", "Set cauciucuri iarnă", "Suport bicicletă auto",
    "Kit reparații pneuri", "Husă scaun auto", "Modulator FM Bluetooth",
  ],
  "Unelte": [
    "Bormasina acumulator Bosch", "Set chei tubulare", "Fierăstrău circular",
    "Polizor unghiular", "Kit sudură", "Banc de lucru", "Set șurubelnițe precision",
    "Nivel laser", "Compresor aer", "Multi-tool Leatherman",
  ],
  "Hobby & Jocuri": [
    "Puzzle 1000 piese", "Set poker profesional", "Drona cu cameră 4K", "Telescop astronomic",
    "Kit broderie", "Set origami premium", "Cub Rubik speedcube", "Set pinball vintage",
    "Binoclu Nikon", "Kit aeromodele",
  ],
  "Mobilă": [
    "Birou ergonomic reglabil", "Scaun gaming", "Raft cărți lemn masiv",
    "Canapea extensibilă", "Dulap hol", "Pat supraetajat copii",
    "Masă sufragerie extensibilă", "Comodă vintage", "Noptieră minimalistă",
  ],
  "Electronice mici": [
    "Ceas fitness Xiaomi", "AirPods replica", "Căști in-ear Sony",
    "Stick USB 128GB", "Card SD 256GB", "Baterie externă", "Cablu USB-C rapid",
    "Adaptor universal călătorie", "Termometru digital",
  ],
  "Bijuterii": [
    "Brățară argint handmade", "Colier perle naturale", "Inel logodnă placat aur",
    "Cercei cristal Swarovski", "Ceas de damă Fossil", "Lanț argint 925",
    "Broșă vintage", "Set bijuterii oțel inoxidabil",
  ],
  "Fotografie": [
    "Aparat foto DSLR Canon", "Obiectiv 50mm f/1.8", "Trepied carbon", "Flash extern Godox",
    "Filtru ND set", "Geantă foto Lowepro", "Stabilizator gimbal", "Kit studio foto",
    "Drone DJI Mini", "Card CFexpress",
  ],
};

const PROPERTY_TITLES = [
  "Apartament 2 camere central", "Vilă la munte", "Cabană Bucovina", "Garsonieră modernă",
  "Casă cu grădină", "Apartament 3 camere", "Studio design", "Penthouse cu terasă",
  "Casă tradițională", "Apartament la mare", "Vilă cu piscină", "Cameră în centru",
  "Apartament Airbnb-ready", "Cabină lemn munte", "Duplex cu curte",
];

const SERVICE_TITLES = [
  "Lecții programare", "Ore de engleză", "Design grafic", "Fotografie profesională",
  "Masaj terapeutic", "Reparații electrice", "Coaching personal", "Lecții chitară",
  "Training fitness", "Consultanță IT", "Dezvoltare web", "Lecții pictură",
  "Meditații matematică", "Traduceri EN-RO", "Lecții de gătit",
];

const FIRST_NAMES = [
  "Ana", "Mihai", "Elena", "Alexandru", "Maria", "Andrei", "Ioana", "Cristian",
  "Andreea", "Vlad", "Diana", "George", "Raluca", "Dan", "Bianca", "Tudor",
  "Florina", "Bogdan", "Simona", "Radu", "Carmen", "Ion", "Laura", "Cosmin",
  "Monica", "Adrian", "Alina", "Stefan", "Mara", "Pavel",
];
const LAST_NAMES = [
  "Popescu", "Ionescu", "Popa", "Stan", "Stoica", "Gheorghe", "Rusu", "Dumitru",
  "Munteanu", "Matei", "Marin", "Constantin", "Dobre", "Barbu", "Moldovan",
  "Toma", "Radu", "Luca", "Crișan", "Mureșan",
];

const WISHLISTS = [
  "Electronică sau gadget-uri", "Cărți sau jocuri de societate", "Echipament sport",
  "Mobilă sau accesorii casă", "Instrumente muzicale", "Cursuri online",
  "Obiecte artizanale", "Unelte bricolaj", "Haine brand", "Bijuterii handmade",
  "Aparatură foto", "Bicicletă sau trotinetă", "Echipament camping",
  "Set bucătărie profesional", "Puzzle-uri sau Lego", "Orice interesant",
  "Servicii design grafic", "Lecții de muzică", "Cazare la mare sau munte",
  "Schimb de servicii IT",
];

const DESCRIPTIONS_SUFFIX = [
  "Stare excelentă, puțin folosit.", "Funcționează perfect.", "Câteva urme de utilizare.",
  "Ca nou, folosit doar câteva luni.", "Include toate accesoriile originale.",
  "Ideal pentru cadou.", "Preț de magazin mult mai mare.", "Rare, greu de găsit.",
  "Perfect pentru colecționari.", "Disponibil imediat.", "Negociabil.",
  "Accept și schimb parțial + diferență.", "Ambalaj original inclus.",
];

const UNSPLASH_IDS = [
  "photo-1517336714731-489689fd1ca8", "photo-1529429617124-aee4a233f16b",
  "photo-1582719478248-54e9f2a41349", "photo-1551288049-bebda4e38f71",
  "photo-1461749280684-dccba630e2f6", "photo-1452587925148-ce544e77e70d",
  "photo-1449158743715-0a90ebb6d2d8", "photo-1502672260266-1c1ef2d93688",
  "photo-1558618666-fcd25c85f82e", "photo-1586023492125-27b2c045efd7",
  "photo-1503602642458-232111445657", "photo-1556742049-0cfed4f6a45d",
  "photo-1555041469-a586c61ea9bc", "photo-1560448204-e02f11c3d0e2",
  "photo-1519389950473-47ba0277781c", "photo-1573164574572-cb89e39749b4",
  "photo-1487611459768-bd414656ea10", "photo-1595950653106-6c9ebd614d3a",
  "photo-1542291026-7eec264c27ff", "photo-1506126613408-eca07ce68773",
];

const AMENITIES: HouseAmenity[] = ["wifi", "parking", "ac", "heating", "washer", "dryer", "kitchen", "pool", "garden", "balcony", "elevator", "pet_friendly", "tv", "workspace"];
const RULES: HouseRule[] = ["no_smoking", "no_pets", "no_parties", "no_shoes", "quiet_hours"];
const PROPERTY_TYPES: PropertyType[] = ["apartment", "house", "villa", "cabin", "studio", "room"];
const SWAP_MODES: HouseSwapMode[] = ["simultaneous", "non_simultaneous", "one_way_hosting"];
const SERVICE_CATS: ServiceCategory[] = ["creative", "technical", "education", "physical", "professional"];
const SKILL_LEVELS: SkillLevel[] = ["beginner", "intermediate", "expert"];
const DELIVERIES: ServiceDelivery[] = ["remote", "in_person", "hybrid"];

/* ─── Generator ─── */

export interface DemoData {
  users: UserProfile[];
  items: Item[];
  matches: MatchCandidate[];
}

export function generateDemoData(itemCount: number = 10_000, seed: number = 42): DemoData {
  const rand = mulberry32(seed);
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
  const pickN = <T>(arr: readonly T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => rand() - 0.5);
    return shuffled.slice(0, n);
  };
  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
  const randId = () => `demo-${(rand() * 1e12).toString(36).slice(0, 10)}`;

  // Generate users (1 user per ~5 items on average)
  const userCount = Math.max(100, Math.floor(itemCount / 5));
  const users: UserProfile[] = [];
  const badges: BadgeTier[] = ["free", "free", "free", "premium", "premium", "platinum"];

  for (let i = 0; i < userCount; i++) {
    const fn = pick(FIRST_NAMES);
    const ln = pick(LAST_NAMES);
    const loc = pick(ALL_CITIES);
    const badge = pick(badges);
    users.push({
      id: `user-demo-${i}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@swaply.demo`,
      displayName: `${fn} ${ln}`,
      firstName: fn,
      avatarUrl: `https://ui-avatars.com/api/?name=${fn}+${ln}&background=random`,
      bio: `Utilizator Swaply din ${loc.city}. Pasionat de schimburi echitabile.`,
      languages: ["ro", ...(rand() > 0.5 ? ["en" as const] : []), ...(rand() > 0.8 ? [pick(["fr", "de", "es", "it", "hu"] as const)] : [])],
      badge,
      location: {
        country: "România",
        region: loc.region,
        city: loc.city,
        postalCode: `${randInt(100000, 999999)}`,
        coordinates: { lat: loc.lat + (rand() - 0.5) * 0.1, lng: loc.lng + (rand() - 0.5) * 0.1 },
        travelRadiusKm: pick([10, 25, 50, 100, 200]),
      },
      visibility: {
        publicProfile: true,
        itemsVisibility: rand() > 0.3 ? "public" : "match_only",
        showExactLocation: rand() > 0.6,
        showLastSeen: rand() > 0.4,
      },
      notifications: { email: true, push: rand() > 0.3, chat: true, matches: true, swapUpdates: true },
      swapPreferences: {
        logistics: pick(["in_person", "courier", "flexible"]),
        notes: rand() > 0.5 ? "Prefer zone publice pentru întâlniri." : undefined,
      },
      security: {
        twoFactorEnabled: rand() > 0.7,
        method: rand() > 0.7 ? "totp" : null,
        passkeysEnabled: false,
      },
      stats: {
        tokens: randInt(10, 500),
        reputation: pick(["starter", "trusted", "ambassador"]),
        completedSwaps: randInt(0, 30),
        activeListings: randInt(1, 8),
      },
    });
  }

  // Generate items
  const items: Item[] = [];
  const intents: ItemIntent[] = ["explore", "open", "committed", "high_commitment"];
  const flexibilities: ItemFlexibility[] = ["strict", "moderate", "broad"];
  const values: ItemPerceivedValue[] = ["small", "medium", "large", "sentimental"];
  const condImpacts: ItemConditionImpact[] = ["affects_value", "affects_usage", "affects_durability", "affects_appearance"];
  const clarities: ItemClarity[] = ["exploring", "have_idea", "know_exactly"];
  const contexts: ItemContext[] = ["permanent", "vacation", "temporary", "urgent"];
  const conditions: ("new" | "good" | "used")[] = ["new", "good", "good", "used"]; // weighted toward "good"

  // 70% objects, 15% property, 15% service
  for (let i = 0; i < itemCount; i++) {
    const owner = pick(users);
    const typeRoll = rand();
    const listingType: ListingType = typeRoll < 0.7 ? "object" : typeRoll < 0.85 ? "property" : "service";
    const loc = pick(ALL_CITIES);
    const baseDate = new Date(Date.now() - randInt(0, 180) * 24 * 60 * 60 * 1000);
    const condition = pick(conditions);

    let title: string;
    let category: string;
    let description: string;

    if (listingType === "object") {
      category = pick(OBJECT_CATEGORIES);
      const catTitles = OBJECT_TITLES[category] ?? OBJECT_TITLES["Electronică"];
      title = pick(catTitles);
      description = `${title}. ${pick(DESCRIPTIONS_SUFFIX)}`;
    } else if (listingType === "property") {
      title = pick(PROPERTY_TITLES);
      category = "Cazare";
      description = `${title} în ${loc.city}. ${pick(DESCRIPTIONS_SUFFIX)}`;
    } else {
      title = pick(SERVICE_TITLES);
      category = pick(["Educație", "IT & Tech", "Sănătate", "Artă", "Sport"]);
      description = `${title} — experiență ${pick(["2", "3", "5", "8", "10"])} ani. ${pick(DESCRIPTIONS_SUFFIX)}`;
    }

    const item: Item = {
      id: `item-demo-${i}`,
      ownerId: owner.id,
      title,
      category,
      condition,
      description,
      wishlist: pick(WISHLISTS),
      status: pick(["active", "active", "active", "active", "paused"]),
      isActive: true,
      isDemo: true,
      createdAt: baseDate.toISOString(),
      location: loc.city,
      aiSuggestedTags: pickN(title.toLowerCase().split(/\s+/), Math.min(3, title.split(/\s+/).length)),
      userFinalTags: pickN([...title.toLowerCase().split(/\s+/), category.toLowerCase()], 3),
      photos: [`https://images.unsplash.com/${pick(UNSPLASH_IDS)}?w=400`],
      listingType,
      intent: pick(intents),
      flexibility: pick(flexibilities),
      perceivedValue: pick(values),
      conditionImpact: pickN(condImpacts, randInt(1, 2)),
      acceptsBundle: rand() > 0.6,
      recipientMatters: rand() > 0.7,
      clarity: pick(clarities),
      context: pick(contexts),
    };

    // Add houseProfile for property
    if (listingType === "property") {
      item.houseProfile = {
        propertyType: pick(PROPERTY_TYPES),
        bedrooms: randInt(1, 5),
        bathrooms: randInt(1, 3),
        maxGuests: randInt(2, 10),
        squareMeters: randInt(30, 200),
        amenities: pickN(AMENITIES, randInt(3, 8)) as HouseAmenity[],
        rules: pickN(RULES, randInt(1, 3)) as HouseRule[],
        description: `Proprietate în ${loc.city}, ${loc.region}.`,
        neighborhood: `Zonă liniștită, acces facil la transport.`,
        nearbyAttractions: `Centre comerciale, parcuri, restaurante.`,
        transport: `Transport public la ${randInt(2, 15)} min.`,
        photos: [`https://images.unsplash.com/${pick(UNSPLASH_IDS)}?w=400`],
        availableDates: [{ from: "2026-03-01", to: "2026-12-31" }],
        minStayDays: pick([2, 3, 5, 7]),
        maxStayDays: pick([14, 21, 30, 60]),
        swapMode: pick(SWAP_MODES),
        verified: rand() > 0.7,
        insuranceReminder: true,
      };
    }

    // Add serviceProfile for service
    if (listingType === "service") {
      item.serviceProfile = {
        category: pick(SERVICE_CATS),
        skillName: title,
        skillLevel: pick(SKILL_LEVELS),
        description: description,
        portfolio: [],
        hoursPerWeek: randInt(2, 20),
        delivery: pick(DELIVERIES),
        hourlyEquivalent: 0,
      };
    }

    items.push(item);
  }

  // Generate matches (1 match per ~3 items)
  const matchCount = Math.floor(itemCount / 3);
  const matches: MatchCandidate[] = [];
  const tiers: MatchTier[] = ["weak", "possible", "good", "strong"];

  const reasonTemplates = [
    "Categorii reciproc compatibile",
    "Wishlist-ul se potrivește cu oferta",
    "Valoare percepută apropiată",
    "Aceeași locație — logistică simplă",
    "Intenție de schimb compatibilă",
    "Flexibilitate ridicată la ambele părți",
    "Tag-uri comune detectate",
    "Condiție similară a obiectelor",
    "Subcategorii înrudite",
    "Destinatar potrivit pentru obiect sentimental",
  ];

  for (let i = 0; i < matchCount; i++) {
    const offered = items[randInt(0, items.length - 1)];
    let requested = items[randInt(0, items.length - 1)];
    // Make sure different owners
    let tries = 0;
    while (requested.ownerId === offered.ownerId && tries < 10) {
      requested = items[randInt(0, items.length - 1)];
      tries++;
    }
    if (requested.ownerId === offered.ownerId) continue;

    const score = randInt(15, 98);
    const tier: MatchTier = score >= 85 ? "strong" : score >= 70 ? "good" : score >= 40 ? "possible" : "weak";
    const reasonCount = randInt(2, 5);
    const reasons = pickN(reasonTemplates, reasonCount);

    matches.push({
      id: `match-demo-${i}`,
      itemOffered: offered,
      itemRequested: requested,
      compatibilityScore: score,
      tier,
      reasons,
      reason: reasons.join(". ") + ".",
    });
  }

  return { users, items, matches };
}

/**
 * Quick stats for demo data display.
 */
export function demoStats(data: DemoData) {
  const objectCount = data.items.filter((i) => (i.listingType ?? "object") === "object").length;
  const propertyCount = data.items.filter((i) => i.listingType === "property").length;
  const serviceCount = data.items.filter((i) => i.listingType === "service").length;
  const citySet = new Set(data.items.map((i) => i.location));
  return {
    totalItems: data.items.length,
    totalUsers: data.users.length,
    totalMatches: data.matches.length,
    objectCount,
    propertyCount,
    serviceCount,
    uniqueCities: citySet.size,
    avgMatchScore: Math.round(data.matches.reduce((s, m) => s + m.compatibilityScore, 0) / (data.matches.length || 1)),
  };
}
