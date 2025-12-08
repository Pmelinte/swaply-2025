// Catalog central de categorii + subcategorii pentru obiecte Swaply
// Va fi folosit de:
// - AI classification (mapare text → categorie/subcategorie)
// - formulare (dropdown-uri, filtre)
// - viitor DB / API de categorii (același model putem să-l punem în Supabase)

export type ItemCondition =
  | "new"
  | "like_new"
  | "used_good"
  | "used_fair"
  | "for_parts";

export interface TranslatedLabel {
  ro: string;
  en: string;
}

export interface ItemSubcategory {
  id: string; // cheie stabilă, folosită în DB / AI (ex: "smartphones")
  label: TranslatedLabel;
  examples?: string[]; // exemple pentru AI și pentru tooltips
}

export interface ItemCategory {
  id: string; // cheie stabilă, folosită în DB / AI (ex: "electronics")
  label: TranslatedLabel;
  icon?: string; // optional, pentru UI (ex: "ph:device-mobile")
  subcategories: ItemSubcategory[];
}

// Lista principală de categorii Swaply
// NOTĂ: id-urile sunt în engleză, label-ul este tradus RO / EN.
// AI-ul va returna id-uri (category_id, subcategory_id), nu label-uri brute.

export const ITEM_CATEGORIES: ItemCategory[] = [
  {
    id: "electronics",
    label: {
      ro: "Electronice",
      en: "Electronics",
    },
    icon: "ph:device-mobile",
    subcategories: [
      {
        id: "smartphones",
        label: { ro: "Telefoane mobile", en: "Smartphones" },
        examples: ["iPhone 13", "Samsung S22", "Xiaomi Redmi"],
      },
      {
        id: "tablets",
        label: { ro: "Tablete", en: "Tablets" },
        examples: ["iPad", "Samsung Tab", "Lenovo Tab"],
      },
      {
        id: "laptops",
        label: { ro: "Laptopuri", en: "Laptops" },
        examples: ["Ultrabook", "Gaming laptop"],
      },
      {
        id: "tvs",
        label: { ro: "Televizoare", en: "TVs" },
        examples: ["Smart TV", "OLED", "LED"],
      },
      {
        id: "audio",
        label: { ro: "Audio & boxe", en: "Audio & Speakers" },
        examples: ["Boxe Bluetooth", "Căști", "Soundbar"],
      },
      {
        id: "photo_video",
        label: { ro: "Foto & Video", en: "Photo & Video" },
        examples: ["DSLR", "Mirrorless", "GoPro"],
      },
      {
        id: "other_electronics",
        label: { ro: "Alte electronice", en: "Other electronics" },
      },
    ],
  },
  {
    id: "computers",
    label: {
      ro: "PC & componente",
      en: "PC & Components",
    },
    icon: "ph:desktop-tower",
    subcategories: [
      {
        id: "desktops",
        label: { ro: "Sisteme PC", en: "Desktop PCs" },
        examples: ["PC office", "PC gaming"],
      },
      {
        id: "components",
        label: { ro: "Componente", en: "Components" },
        examples: ["Placă video", "RAM", "SSD", "CPU"],
      },
      {
        id: "peripherals",
        label: { ro: "Periferice", en: "Peripherals" },
        examples: ["Mouse", "Tastatură", "Monitor"],
      },
      {
        id: "networking",
        label: { ro: "Networking", en: "Networking" },
        examples: ["Router", "Switch", "Access point"],
      },
      {
        id: "other_pc",
        label: { ro: "Altele PC", en: "Other PC" },
      },
    ],
  },
  {
    id: "home_appliances",
    label: {
      ro: "Electrocasnice",
      en: "Home appliances",
    },
    icon: "ph:washing-machine",
    subcategories: [
      {
        id: "kitchen_appliances",
        label: { ro: "Bucătărie", en: "Kitchen appliances" },
        examples: ["Cuptor", "Frigider", "Robot de bucătărie"],
      },
      {
        id: "cleaning",
        label: { ro: "Curățenie", en: "Cleaning" },
        examples: ["Aspirator", "Steam mop"],
      },
      {
        id: "climate",
        label: { ro: "Climatizare", en: "Climate" },
        examples: ["Aer condiționat", "Aeroterma", "Purificator aer"],
      },
      {
        id: "laundry",
        label: { ro: "Spălătorie", en: "Laundry" },
        examples: ["Mașină de spălat", "Uscător"],
      },
      {
        id: "other_appliances",
        label: { ro: "Alte electrocasnice", en: "Other appliances" },
      },
    ],
  },
  {
    id: "furniture",
    label: {
      ro: "Mobilier & decor",
      en: "Furniture & decor",
    },
    icon: "ph:armchair",
    subcategories: [
      {
        id: "living",
        label: { ro: "Living", en: "Living room" },
        examples: ["Canapea", "Bibliotecă", "Măsuță"],
      },
      {
        id: "bedroom",
        label: { ro: "Dormitor", en: "Bedroom" },
        examples: ["Pat", "Dulap", "Noptieră"],
      },
      {
        id: "office_furniture",
        label: { ro: "Office", en: "Office furniture" },
        examples: ["Birou", "Scaun ergonomic"],
      },
      {
        id: "decor",
        label: { ro: "Decor", en: "Decor" },
        examples: ["Lămpi", "Tablouri", "Covor"],
      },
      {
        id: "other_furniture",
        label: { ro: "Alt mobilier", en: "Other furniture" },
      },
    ],
  },
  {
    id: "fashion",
    label: {
      ro: "Fashion & accesorii",
      en: "Fashion & accessories",
    },
    icon: "ph:t-shirt",
    subcategories: [
      {
        id: "mens_clothing",
        label: { ro: "Îmbrăcăminte bărbați", en: "Men's clothing" },
      },
      {
        id: "womens_clothing",
        label: { ro: "Îmbrăcăminte femei", en: "Women's clothing" },
      },
      {
        id: "shoes",
        label: { ro: "Încălțăminte", en: "Shoes" },
      },
      {
        id: "accessories",
        label: { ro: "Accesorii", en: "Accessories" },
        examples: ["Genți", "Curele", "Ceasuri"],
      },
      {
        id: "kids_clothing",
        label: { ro: "Îmbrăcăminte copii", en: "Kids clothing" },
      },
      {
        id: "other_fashion",
        label: { ro: "Alte fashion", en: "Other fashion" },
      },
    ],
  },
  {
    id: "sports",
    label: {
      ro: "Sport & outdoor",
      en: "Sports & outdoor",
    },
    icon: "ph:soccer-ball",
    subcategories: [
      {
        id: "fitness",
        label: { ro: "Fitness", en: "Fitness" },
        examples: ["Ganteră", "Bancă fitness"],
      },
      {
        id: "cycling",
        label: { ro: "Ciclism", en: "Cycling" },
      },
      {
        id: "camping",
        label: { ro: "Camping & drumeții", en: "Camping & hiking" },
      },
      {
        id: "sports_equipment",
        label: { ro: "Echipament sportiv", en: "Sports equipment" },
        examples: ["Minge", "Rachetă tenis"],
      },
      {
        id: "other_sports",
        label: { ro: "Alte sport", en: "Other sports" },
      },
    ],
  },
  {
    id: "books_media",
    label: {
      ro: "Cărți & media",
      en: "Books & media",
    },
    icon: "ph:book-open",
    subcategories: [
      {
        id: "books",
        label: { ro: "Cărți", en: "Books" },
      },
      {
        id: "comics",
        label: { ro: "Benzi desenate", en: "Comics" },
      },
      {
        id: "music",
        label: { ro: "Muzică", en: "Music" },
        examples: ["Vinyl", "CD", "Casete"],
      },
      {
        id: "movies",
        label: { ro: "Filme & seriale", en: "Movies & series" },
      },
      {
        id: "other_media",
        label: { ro: "Alt media", en: "Other media" },
      },
    ],
  },
  {
    id: "kids_baby",
    label: {
      ro: "Copii & bebeluși",
      en: "Kids & baby",
    },
    icon: "ph:baby",
    subcategories: [
      {
        id: "toys",
        label: { ro: "Jucării", en: "Toys" },
      },
      {
        id: "baby_gear",
        label: { ro: "Echipamente bebeluși", en: "Baby gear" },
        examples: ["Cărucior", "Scaun auto"],
      },
      {
        id: "kids_furniture",
        label: { ro: "Mobilier copii", en: "Kids furniture" },
      },
      {
        id: "other_kids",
        label: { ro: "Altele copii", en: "Other kids" },
      },
    ],
  },
  {
    id: "tools_diy",
    label: {
      ro: "Scule & DIY",
      en: "Tools & DIY",
    },
    icon: "ph:toolbox",
    subcategories: [
      {
        id: "power_tools",
        label: { ro: "Scule electrice", en: "Power tools" },
        examples: ["Bormașină", "Flex", "Fierăstrău electric"],
      },
      {
        id: "hand_tools",
        label: { ro: "Scule manuale", en: "Hand tools" },
        examples: ["Chei", "Șurubelnițe", "Ciocan"],
      },
      {
        id: "garden_tools",
        label: { ro: "Grădinărit", en: "Garden tools" },
        examples: ["Mașină de tuns iarba", "Foarfecă gard viu"],
      },
      {
        id: "materials",
        label: { ro: "Materiale", en: "Materials" },
      },
      {
        id: "other_tools",
        label: { ro: "Alte scule", en: "Other tools" },
      },
    ],
  },
  {
    id: "collectibles_hobby",
    label: {
      ro: "Colecții & hobby",
      en: "Collectibles & hobby",
    },
    icon: "ph:cards",
    subcategories: [
      {
        id: "collectibles",
        label: { ro: "Colecționabile", en: "Collectibles" },
        examples: ["Monede", "Timbre", "Figurine"],
      },
      {
        id: "board_games",
        label: { ro: "Jocuri de societate", en: "Board games" },
      },
      {
        id: "models",
        label: { ro: "Modelism", en: "Modeling" },
      },
      {
        id: "art",
        label: { ro: "Artă & handmade", en: "Art & handmade" },
      },
      {
        id: "other_hobby",
        label: { ro: "Alte hobby", en: "Other hobby" },
      },
    ],
  },
  {
    id: "other",
    label: {
      ro: "Altele",
      en: "Other",
    },
    icon: "ph:dots-three",
    subcategories: [
      {
        id: "misc",
        label: { ro: "Diverse", en: "Miscellaneous" },
      },
    ],
  },
];

// Helpers simple pentru lookup / integrare AI

export function findCategoryById(id: string): ItemCategory | undefined {
  return ITEM_CATEGORIES.find((cat) => cat.id === id);
}

export function findSubcategoryById(
  categoryId: string,
  subcategoryId: string
): ItemSubcategory | undefined {
  const category = findCategoryById(categoryId);
  if (!category) return undefined;
  return category.subcategories.find((sub) => sub.id === subcategoryId);
}

// Lista simplă de id-uri (utilă pentru AI sau validare)
export const ITEM_CATEGORY_IDS = ITEM_CATEGORIES.map((c) => c.id);

// Flatten pentru subcategorii (ex: pentru AI label → id)
export const ITEM_SUBCATEGORY_IDS = ITEM_CATEGORIES.flatMap((c) =>
  c.subcategories.map((s) => `${c.id}:${s.id}`)
);
