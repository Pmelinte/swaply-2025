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

const MAJOR_CITIES = [
  { city: "London", region: "England", lat: 51.51, lng: -0.13 },
  { city: "New York", region: "New York", lat: 40.71, lng: -74.01 },
  { city: "Tokyo", region: "Kanto", lat: 35.68, lng: 139.69 },
  { city: "Sydney", region: "NSW", lat: -33.87, lng: 151.21 },
  { city: "Toronto", region: "Ontario", lat: 43.65, lng: -79.38 },
  { city: "São Paulo", region: "São Paulo", lat: -23.55, lng: -46.63 },
  { city: "Mumbai", region: "Maharashtra", lat: 19.08, lng: 72.88 },
  { city: "Seoul", region: "Seoul", lat: 37.57, lng: 126.98 },
  { city: "Mexico City", region: "CDMX", lat: 19.43, lng: -99.13 },
  { city: "Istanbul", region: "Istanbul", lat: 41.01, lng: 28.98 },
  { city: "Bangkok", region: "Bangkok", lat: 13.76, lng: 100.50 },
  { city: "Lagos", region: "Lagos", lat: 6.52, lng: 3.38 },
  { city: "Cairo", region: "Cairo", lat: 30.04, lng: 31.24 },
  { city: "Buenos Aires", region: "CABA", lat: -34.60, lng: -58.38 },
  { city: "Johannesburg", region: "Gauteng", lat: -26.20, lng: 28.05 },
  { city: "Singapore", region: "Singapore", lat: 1.35, lng: 103.82 },
  { city: "Dubai", region: "Dubai", lat: 25.20, lng: 55.27 },
  { city: "Stockholm", region: "Stockholm", lat: 59.33, lng: 18.07 },
  { city: "Bucharest", region: "Ilfov", lat: 44.43, lng: 26.1 },
  { city: "Warsaw", region: "Masovia", lat: 52.23, lng: 21.01 },
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

const ALL_CITIES = [...MAJOR_CITIES, ...EU_CITIES];

const OBJECT_CATEGORIES = [
  "Electronics", "Books", "Clothing", "Sport & Outdoor", "Home & Garden",
  "Toys", "Art", "Music", "Vehicles", "Tools", "Hobby & Games",
  "Furniture", "Small Electronics", "Jewelry", "Photography",
];

const OBJECT_TITLES: Record<string, string[]> = {
  "Electronics": [
    "Dell Inspiron Laptop", "27'' 4K Monitor", "RGB Mechanical Keyboard", "Wireless Gaming Mouse",
    "Samsung Galaxy Tablet", "Garmin Smartwatch", "JBL Bluetooth Speaker", "PlayStation 4 Console",
    "Logitech Webcam", "1TB External SSD", "Wireless Charger", "Noise-cancelling Headphones",
    "WiFi 6 Router", "Color Printer", "Kindle E-reader", "Mini LED Projector",
    "USB-C Docking Station", "20000mAh Powerbank", "Alexa Smart Speaker", "Universal Remote",
  ],
  "Books": [
    "Harry Potter Collection", "Sapiens – Yuval Noah Harari", "Anatomy Atlas", "Vegan Cookbook",
    "Children's Encyclopedia", "Lord of the Rings Trilogy", "Python Programming Guide",
    "Paulo Coelho Novel", "Photography Manual", "Graphic Design Book",
    "Oxford Dictionary", "Bible (Luxury Edition)", "National Geographic Collection",
    "Meditation Book", "Europe Travel Guide",
  ],
  "Clothing": [
    "North Face Winter Jacket", "Nike Air Max Sneakers", "Casio G-Shock Watch", "Osprey 40L Backpack",
    "Salomon Ski Pants", "Evening Dress", "Men's Suit M", "Zara Wool Coat",
    "Hiking Boots", "Ray-Ban Sunglasses", "Silk Tie", "Genuine Leather Belt",
    "Cashmere Sweater", "New Era Cap", "Touchscreen Gloves",
  ],
  "Sport & Outdoor": [
    "Urban Bicycle", "20kg Dumbbell Set", "Treadmill", "4-Person Camping Tent",
    "Electric Skateboard", "Badminton Rackets", "Adidas Football", "-10°C Sleeping Bag",
    "Inflatable Kayak", "Electric Scooter", "Multi-function Fitness Machine", "Complete Yoga Set",
    "Inline Skates", "Golf Clubs", "Tennis Balls (Set)",
  ],
  "Home & Garden": [
    "Robot Vacuum", "Dishwasher", "Professional Knife Set", "Weber Gas Grill",
    "Gardening Tool Set", "Blackout Curtains", "Crystal Chandelier", "Persian Rug 2x3m",
    "Memory Foam Pillow", "Clothes Dryer", "Food Processor", "Bread Maker",
    "Bamboo Towel Set", "LED Bathroom Mirror", "Foldable Wood Table",
  ],
  "Toys": [
    "Lego Technic Set", "Barbie Doll", "3D Puzzle", "Electric Train",
    "Programmable Robot", "Kids Chemistry Set", "Monopoly Board Game", "Nerf Blaster",
    "Mini Drone for Kids", "K'NEX Construction Kit",
  ],
  "Art": [
    "Acrylic Paint Set", "Professional Easel", "Modern Art Painting", "Handmade Ceramics Set",
    "Traditional Wood Sculpture", "Calligraphy Kit", "Artisan Photo Albums",
    "Pastel Drawing Set", "Wood Engraving", "Vintage Poster Collection",
  ],
  "Music": [
    "Yamaha Acoustic Guitar", "Casio Digital Piano", "Marshall Amplifier", "4-Channel Audio Mixer",
    "Electronic Drum Set", "4/4 Violin", "Concert Ukulele", "USB Studio Microphone",
    "Vinyl Turntable", "Irish Flute",
  ],
  "Vehicles": [
    "Mountain Bike", "Xiaomi Electric Scooter", "LED Car Accessories",
    "Roof Rack", "Winter Tire Set", "Car Bike Rack",
    "Tire Repair Kit", "Car Seat Cover", "Bluetooth FM Transmitter",
  ],
  "Tools": [
    "Bosch Cordless Drill", "Socket Wrench Set", "Circular Saw",
    "Angle Grinder", "Welding Kit", "Workbench", "Precision Screwdriver Set",
    "Laser Level", "Air Compressor", "Leatherman Multi-tool",
  ],
  "Hobby & Games": [
    "1000 Piece Puzzle", "Professional Poker Set", "4K Camera Drone", "Astronomical Telescope",
    "Embroidery Kit", "Premium Origami Set", "Speedcube Rubik's Cube", "Vintage Pinball Set",
    "Nikon Binoculars", "Model Aircraft Kit",
  ],
  "Furniture": [
    "Adjustable Ergonomic Desk", "Gaming Chair", "Solid Wood Bookshelf",
    "Sofa Bed", "Hallway Cabinet", "Kids Bunk Bed",
    "Extendable Dining Table", "Vintage Dresser", "Minimalist Nightstand",
  ],
  "Small Electronics": [
    "Xiaomi Fitness Watch", "AirPods Replica", "Sony In-ear Headphones",
    "128GB USB Stick", "256GB SD Card", "Power Bank", "Fast USB-C Cable",
    "Universal Travel Adapter", "Digital Thermometer",
  ],
  "Jewelry": [
    "Handmade Silver Bracelet", "Natural Pearl Necklace", "Gold-plated Engagement Ring",
    "Swarovski Crystal Earrings", "Fossil Women's Watch", "925 Silver Chain",
    "Vintage Brooch", "Stainless Steel Jewelry Set",
  ],
  "Photography": [
    "Canon DSLR Camera", "50mm f/1.8 Lens", "Carbon Tripod", "Godox External Flash",
    "ND Filter Set", "Lowepro Camera Bag", "Gimbal Stabilizer", "Photo Studio Kit",
    "DJI Mini Drone", "CFexpress Card",
  ],
};

const PROPERTY_TITLES = [
  "2-Bedroom Central Apartment", "Mountain Villa", "Countryside Cabin", "Modern Studio",
  "House with Garden", "3-Bedroom Apartment", "Design Studio", "Penthouse with Terrace",
  "Traditional House", "Seaside Apartment", "Villa with Pool", "Room in City Center",
  "Airbnb-ready Apartment", "Wooden Mountain Cabin", "Duplex with Yard",
];

const SERVICE_TITLES = [
  "Programming Lessons", "English Classes", "Graphic Design", "Professional Photography",
  "Therapeutic Massage", "Electrical Repairs", "Personal Coaching", "Guitar Lessons",
  "Fitness Training", "IT Consulting", "Web Development", "Painting Lessons",
  "Math Tutoring", "Translation Services", "Cooking Lessons",
];

const FIRST_NAMES = [
  "Emma", "James", "Sofia", "Lucas", "Yuki", "Mohammed", "Isabella", "Alexander",
  "Priya", "Noah", "Mei", "Oscar", "Fatima", "Leo", "Amara", "Felix",
  "Aisha", "Hugo", "Sakura", "Marcus", "Zara", "Ivan", "Luna", "Arjun",
  "Chloe", "Mateo", "Hana", "Erik", "Maya", "Pavel",
];
const LAST_NAMES = [
  "Smith", "Garcia", "Kim", "Mueller", "Singh", "Tanaka", "Johnson", "Silva",
  "Chen", "Martinez", "Petrov", "Ahmed", "Williams", "Nakamura", "Anderson",
  "Dubois", "Kowalski", "Santos", "Brown", "Sato",
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
