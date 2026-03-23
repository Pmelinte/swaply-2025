/**
 * Categories taxonomy — curated from Google Product Taxonomy,
 * filtered for barter-relevant items, with English display names.
 *
 * Used by:
 * - ItemForm (cascading dropdown)
 * - Match engine (keyword matching + subcategory proximity)
 * - AI suggestions
 *
 * Structure: tree with max 2 levels (category → subcategory).
 * In Supabase mode, this is loaded from the categories table.
 * In mock mode, this static data is used directly.
 */

export interface CategoryNode {
  id: string;
  name: string;
  nameEn?: string;
  parentId: string | null;
  level: number;
  keywords: string[];
  icon?: string;
  sortOrder: number;
}

/** Full taxonomy as flat array (easily filterable) */
export const CATEGORIES_TAXONOMY: CategoryNode[] = [
  // ── Electronică ──
  { id: "cat-electronica", name: "Electronică", parentId: null, level: 0, keywords: ["electronica","electronic","tech","gadget","digital"], icon: "monitor", sortOrder: 10 },
  { id: "cat-e-telefoane", name: "Telefoane & Tablete", parentId: "cat-electronica", level: 1, keywords: ["telefon","phone","tablet","smartphone","iphone","samsung","huawei"], icon: "smartphone", sortOrder: 11 },
  { id: "cat-e-laptopuri", name: "Laptopuri & PC", parentId: "cat-electronica", level: 1, keywords: ["laptop","pc","calculator","computer","macbook","desktop"], icon: "laptop", sortOrder: 12 },
  { id: "cat-e-monitoare", name: "Monitoare & TV", parentId: "cat-electronica", level: 1, keywords: ["monitor","tv","televizor","ecran","display"], icon: "monitor", sortOrder: 13 },
  { id: "cat-e-audio", name: "Audio & Căști", parentId: "cat-electronica", level: 1, keywords: ["casti","headphones","boxe","speakers","audio","earbuds"], icon: "headphones", sortOrder: 14 },
  { id: "cat-e-console", name: "Console & Gaming", parentId: "cat-electronica", level: 1, keywords: ["console","gaming","playstation","xbox","nintendo","switch"], icon: "gamepad", sortOrder: 15 },
  { id: "cat-e-foto", name: "Foto & Video", parentId: "cat-electronica", level: 1, keywords: ["camera","foto","video","dslr","gopro","obiectiv","lens"], icon: "camera", sortOrder: 16 },
  { id: "cat-e-componente", name: "Componente & Periferice", parentId: "cat-electronica", level: 1, keywords: ["ssd","hdd","ram","tastatura","keyboard","mouse","placa","gpu"], icon: "cpu", sortOrder: 17 },
  { id: "cat-e-wearables", name: "Wearables & Smart", parentId: "cat-electronica", level: 1, keywords: ["smartwatch","ceas","smart","wearable","fitness","tracker"], icon: "watch", sortOrder: 18 },

  // ── Sport & Outdoor ──
  { id: "cat-sport", name: "Sport & Outdoor", parentId: null, level: 0, keywords: ["sport","outdoor","fitness","activ"], icon: "bike", sortOrder: 20 },
  { id: "cat-s-biciclete", name: "Biciclete & Trotinete", parentId: "cat-sport", level: 1, keywords: ["bicicleta","bike","trotineta","scooter","ciclism"], icon: "bike", sortOrder: 21 },
  { id: "cat-s-camping", name: "Camping & Drumeții", parentId: "cat-sport", level: 1, keywords: ["camping","cort","tent","hiking","drumetie","rucsac","sac"], icon: "tent", sortOrder: 22 },
  { id: "cat-s-fitness", name: "Fitness & Sală", parentId: "cat-sport", level: 1, keywords: ["fitness","sala","gym","greutati","gantere","yoga","benzi"], icon: "dumbbell", sortOrder: 23 },
  { id: "cat-s-sporturi", name: "Sporturi de echipă", parentId: "cat-sport", level: 1, keywords: ["fotbal","baschet","tenis","volei","badminton","racheta","minge"], icon: "ball", sortOrder: 24 },
  { id: "cat-s-iarna", name: "Sporturi de iarnă", parentId: "cat-sport", level: 1, keywords: ["schi","ski","snowboard","patine","iarna","winter"], icon: "snowflake", sortOrder: 25 },
  { id: "cat-s-apa", name: "Sporturi nautice", parentId: "cat-sport", level: 1, keywords: ["inot","kayak","surf","snorkel","scuba","nautic","barca"], icon: "anchor", sortOrder: 26 },
  { id: "cat-s-running", name: "Alergare & Atletism", parentId: "cat-sport", level: 1, keywords: ["running","alergare","pantofi","shoes","atletism","maraton"], icon: "footprints", sortOrder: 27 },

  // ── Hobby & Jocuri ──
  { id: "cat-hobby", name: "Hobby & Jocuri", parentId: null, level: 0, keywords: ["hobby","jocuri","joc","divertisment","creativ"], icon: "gamepad", sortOrder: 30 },
  { id: "cat-h-boardgames", name: "Jocuri de societate", parentId: "cat-hobby", level: 1, keywords: ["boardgame","board game","puzzle","sah","chess","table","joc"], icon: "dice", sortOrder: 31 },
  { id: "cat-h-muzica", name: "Instrumente muzicale", parentId: "cat-hobby", level: 1, keywords: ["chitara","guitar","pian","piano","vioara","tobe","drums","muzica"], icon: "music", sortOrder: 32 },
  { id: "cat-h-arta", name: "Artă & Pictură", parentId: "cat-hobby", level: 1, keywords: ["pictura","painting","arta","art","desen","canvas","acuarela"], icon: "palette", sortOrder: 33 },
  { id: "cat-h-colectie", name: "Colecții & Rarități", parentId: "cat-hobby", level: 1, keywords: ["colectie","collection","filatelic","monede","coins","stamps","rar"], icon: "gem", sortOrder: 34 },
  { id: "cat-h-modele", name: "Modelism & DIY", parentId: "cat-hobby", level: 1, keywords: ["lego","model","drone","rc","telecomanda","macheta","puzzle3d"], icon: "wrench", sortOrder: 35 },
  { id: "cat-h-foto", name: "Fotografie & Video", parentId: "cat-hobby", level: 1, keywords: ["fotografie","photography","video","editing","trepied","tripod"], icon: "camera", sortOrder: 36 },
  { id: "cat-h-gradinarit", name: "Grădinărit & Plante", parentId: "cat-hobby", level: 1, keywords: ["plante","gradinarit","gardening","seminte","seeds","ghiveci","bonsai"], icon: "sprout", sortOrder: 37 },

  // ── Cărți & Media ──
  { id: "cat-carti", name: "Cărți & Media", parentId: null, level: 0, keywords: ["carti","carte","media","muzica","film"], icon: "book", sortOrder: 40 },
  { id: "cat-c-ficiune", name: "Ficțiune & Romane", parentId: "cat-carti", level: 1, keywords: ["roman","ficiune","fiction","novel","povesti","literatura"], icon: "book-open", sortOrder: 41 },
  { id: "cat-c-nonfic", name: "Non-ficțiune & Știință", parentId: "cat-carti", level: 1, keywords: ["nonfictiune","stiinta","science","istorie","history","biografie"], icon: "graduation-cap", sortOrder: 42 },
  { id: "cat-c-comics", name: "Benzi desenate & Manga", parentId: "cat-carti", level: 1, keywords: ["comics","manga","bd","benzi","graphic","novel"], icon: "comic", sortOrder: 43 },
  { id: "cat-c-vinyl", name: "Vinyl & Muzică fizică", parentId: "cat-carti", level: 1, keywords: ["vinyl","cd","disc","muzica","album","caseta","cassette"], icon: "disc", sortOrder: 44 },
  { id: "cat-c-film", name: "DVD & Blu-ray", parentId: "cat-carti", level: 1, keywords: ["dvd","bluray","film","movie","serie","colectie"], icon: "film", sortOrder: 45 },
  { id: "cat-c-manuale", name: "Manuale & Cursuri", parentId: "cat-carti", level: 1, keywords: ["manual","curs","textbook","scoala","universitate","studiu"], icon: "notebook", sortOrder: 46 },
  { id: "cat-c-copii", name: "Cărți pentru copii", parentId: "cat-carti", level: 1, keywords: ["copii","children","kids","povesti","colorat","educativ"], icon: "baby", sortOrder: 47 },

  // ── Casă & Grădină ──
  { id: "cat-casa", name: "Casă & Grădină", parentId: null, level: 0, keywords: ["casa","home","gradina","garden","mobilier"], icon: "home", sortOrder: 50 },
  { id: "cat-g-mobilier", name: "Mobilier", parentId: "cat-casa", level: 1, keywords: ["mobilier","scaun","masa","birou","dulap","canapea","pat"], icon: "armchair", sortOrder: 51 },
  { id: "cat-g-bucatarie", name: "Bucătărie", parentId: "cat-casa", level: 1, keywords: ["bucatarie","kitchen","oala","tigaie","blender","mixer","cafetiera"], icon: "utensils", sortOrder: 52 },
  { id: "cat-g-unelte", name: "Unelte & Bricolaj", parentId: "cat-casa", level: 1, keywords: ["unelte","tools","bormasina","ciocan","surubelnita","bricolaj"], icon: "hammer", sortOrder: 53 },
  { id: "cat-g-decor", name: "Decor & Iluminat", parentId: "cat-casa", level: 1, keywords: ["decor","lampa","lamp","lustra","perdea","tablou","vaza"], icon: "lamp", sortOrder: 54 },
  { id: "cat-g-electro", name: "Electrocasnice", parentId: "cat-casa", level: 1, keywords: ["aspirator","vacuum","masina","spalat","frigider","cuptor","microunde"], icon: "plug", sortOrder: 55 },
  { id: "cat-g-gradina", name: "Grădină & Exterior", parentId: "cat-casa", level: 1, keywords: ["gradina","garden","gazon","furtun","gratar","umbrela","terasa"], icon: "tree", sortOrder: 56 },
  { id: "cat-g-baie", name: "Baie & Sanitare", parentId: "cat-casa", level: 1, keywords: ["baie","bathroom","dus","robinet","prosop","raft","oglinda"], icon: "droplet", sortOrder: 57 },

  // ── Modă & Accesorii ──
  { id: "cat-moda", name: "Modă & Accesorii", parentId: null, level: 0, keywords: ["moda","fashion","accesorii","imbracaminte"], icon: "shirt", sortOrder: 60 },
  { id: "cat-m-barbati", name: "Îmbrăcăminte bărbați", parentId: "cat-moda", level: 1, keywords: ["barbati","men","camasa","pantaloni","costum","jeans","tricou"], icon: "shirt", sortOrder: 61 },
  { id: "cat-m-femei", name: "Îmbrăcăminte femei", parentId: "cat-moda", level: 1, keywords: ["femei","women","rochie","fusta","bluza","dress","top"], icon: "shirt", sortOrder: 62 },
  { id: "cat-m-copii", name: "Îmbrăcăminte copii", parentId: "cat-moda", level: 1, keywords: ["copii","kids","children","body","salopeta","caciula"], icon: "baby", sortOrder: 63 },
  { id: "cat-m-incaltaminte", name: "Încălțăminte", parentId: "cat-moda", level: 1, keywords: ["pantofi","shoes","ghete","boots","adidasi","sneakers","sandale"], icon: "footprints", sortOrder: 64 },
  { id: "cat-m-genti", name: "Genți & Rucsacuri", parentId: "cat-moda", level: 1, keywords: ["geanta","bag","rucsac","backpack","poseta","troler","valiza"], icon: "briefcase", sortOrder: 65 },
  { id: "cat-m-ceasuri", name: "Ceasuri & Bijuterii", parentId: "cat-moda", level: 1, keywords: ["ceas","watch","bijuterii","jewelry","inel","bratara","lantisor"], icon: "watch", sortOrder: 66 },
  { id: "cat-m-ochelari", name: "Ochelari & Accesorii", parentId: "cat-moda", level: 1, keywords: ["ochelari","sunglasses","glasses","esarfa","palarie","curea","belt"], icon: "glasses", sortOrder: 67 },
];

/** Top-level categories only */
export const TOP_CATEGORIES = CATEGORIES_TAXONOMY.filter((c) => c.level === 0);

/** Get subcategories for a given parent ID */
export function getSubcategories(parentId: string): CategoryNode[] {
  return CATEGORIES_TAXONOMY.filter((c) => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get top-level category names (backward compatible with ITEM_CATEGORIES) */
export const CATEGORY_NAMES = TOP_CATEGORIES.map((c) => c.name);

/** Find category node by name (case-insensitive, accent-tolerant) */
export function findCategoryByName(name: string): CategoryNode | undefined {
  const norm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return CATEGORIES_TAXONOMY.find((c) =>
    c.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === norm
  );
}

/** Get the parent category name for a subcategory */
export function getParentName(categoryName: string): string | null {
  const node = findCategoryByName(categoryName);
  if (!node?.parentId) return null;
  const parent = CATEGORIES_TAXONOMY.find((c) => c.id === node.parentId);
  return parent?.name ?? null;
}

/** Check if two categories share the same parent (sibling proximity) */
export function areSiblingCategories(catA: string, catB: string): boolean {
  const nodeA = findCategoryByName(catA);
  const nodeB = findCategoryByName(catB);
  if (!nodeA || !nodeB) return false;
  // Same parent
  if (nodeA.parentId && nodeA.parentId === nodeB.parentId) return true;
  // One is parent of the other
  if (nodeA.id === nodeB.parentId || nodeB.id === nodeA.parentId) return true;
  return false;
}

/** Get all keywords for a category (including parent keywords) */
export function getAllKeywords(categoryName: string): string[] {
  const node = findCategoryByName(categoryName);
  if (!node) return [];
  const keywords = [...node.keywords];
  if (node.parentId) {
    const parent = CATEGORIES_TAXONOMY.find((c) => c.id === node.parentId);
    if (parent) keywords.push(...parent.keywords);
  }
  return keywords;
}
