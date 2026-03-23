/**
 * SEO data for category and city landing pages.
 * Used by static generation (generateStaticParams) and metadata.
 */

/* ─── Categories ─── */

export interface SEOCategory {
  slug: string;
  name: string;
  /** Exact value stored in the items.category column in Supabase */
  dbCategory: string;
  /** Localized display name for H1/titles */
  nameLocal: string;
  /** Unique intro paragraph (150-200 words) */
  intro: string;
  /** Related category slugs for internal linking */
  related: string[];
  /** Lucide icon name */
  icon: string;
}

export const SEO_CATEGORIES: SEOCategory[] = [
  {
    slug: "electronics",
    name: "Electronics",
    dbCategory: "Electronică",
    nameLocal: "Electronics",
    intro:
      "Phones, laptops, gaming consoles, headphones, and gadgets — electronics are the most swapped items on Swaply. The rapid upgrade cycle leaves millions of functional devices unused in drawers. Instead of selling at a discount or throwing them away, you can swap them directly for another device you need. A previous-gen iPhone can become a gaming monitor. An old tablet can become premium wireless headphones. On Swaply, the AI algorithm analyzes condition, brand, and estimated value to suggest the fairest matches. No commissions, no waiting for buyers — just direct, fast, and safe swaps.",
    related: ["toys", "music", "tools"],
    icon: "monitor",
  },
  {
    slug: "sport",
    name: "Sport",
    dbCategory: "Sport & Outdoor",
    nameLocal: "Sport & Outdoor",
    intro:
      "Bicycles, fitness equipment, scooters, skis, camping gear, and everything related to sports and outdoor activities. The seasonal nature of sports makes bartering ideal: in winter swap your rollerblades for skis, in summer swap your sled for a bicycle. Quality sports equipment is expensive when new but retains functionality for years. On Swaply, you can swap those dumbbells you no longer use for a tennis racket, or the kids' trampoline for a camping tent. The active sports community grows constantly on the platform, and matches are quick thanks to high demand in this category.",
    related: ["fashion", "electronics", "garden"],
    icon: "bike",
  },
  {
    slug: "arts",
    name: "Arts",
    dbCategory: "Hobby & Jocuri",
    nameLocal: "Art & Hobby",
    intro:
      "Musical instruments, painting equipment, board games, collections, and everything related to creative hobbies. Passions change, but objects remain. The guitar you learned your first chords on can become a professional watercolor set for someone else. An unused Lego corner can become a 5000-piece puzzle. The Art & Hobby category is one of the most diverse on Swaply — here you'll find everything from rare vinyl records to analog photography equipment, from manga drawing sets to ceramics tools. Every item has a story, and through swapping, that story continues in the hands of someone who will truly use it.",
    related: ["books", "music", "toys"],
    icon: "palette",
  },
  {
    slug: "books",
    name: "Books",
    dbCategory: "Cărți & Media",
    nameLocal: "Books & Media",
    intro:
      "Novels, textbooks, self-help books, comics, DVDs, and vinyl records. Swaply has one of the most active book-swapping communities in Europe. A book read once doesn't need to gather dust on a shelf — it can reach a reader who's been looking for it for months. On Swaply, you can swap a batch of fiction books for a set of university textbooks, or your DVD collection for classic vinyl records. Our algorithm automatically detects the title, author, and edition from the photo, facilitating quick listing. The category also includes physical media: CDs, Blu-rays, vinyl records, and cassettes — everything that has value for collectors and enthusiasts.",
    related: ["arts", "toys", "music"],
    icon: "book-open",
  },
  {
    slug: "home",
    name: "Home",
    dbCategory: "Casă & Grădină",
    nameLocal: "Home & Garden",
    intro:
      "Furniture, appliances, decorations, kitchen utensils, and everything related to home improvement. Redecorating an apartment? Instead of buying everything new, swap what you no longer use for what you need. A couch in good condition can become an ergonomic desk. A professional pot set can become an upright vacuum. Furniture and household item bartering is extremely popular in major cities, where apartments are constantly being renovated. On Swaply, you can filter by location to find local swaps and avoid shipping costs for bulky items.",
    related: ["garden", "tools", "electronics"],
    icon: "home",
  },
  {
    slug: "fashion",
    name: "Fashion",
    dbCategory: "Modă & Accesorii",
    nameLocal: "Fashion & Accessories",
    intro:
      "Clothes, footwear, bags, watches, jewelry, and accessories. Fast fashion generates tons of textile waste annually, and bartering is the perfect antidote. On Swaply, you can swap brand clothes you no longer wear for new wardrobe pieces without spending a cent. The category includes clothing for men, women, and children, footwear of all types, bags and backpacks, watches and jewelry. Vintage and designer clothing swapping is particularly popular among young people. Every fashion swap is a small step toward sustainability.",
    related: ["sport", "arts", "home"],
    icon: "shirt",
  },
  {
    slug: "automotive",
    name: "Automotive",
    dbCategory: "Auto & Moto",
    nameLocal: "Auto & Moto",
    intro:
      "Auto parts, motorcycle accessories, tires, rims, maintenance equipment, and car gadgets. The automotive industry generates an enormous amount of reusable parts that can be swapped instead of scrapped. Winter tires you've replaced? Swap them for a set of summer tires. A dashcam you no longer use can become a set of auto tools. On Swaply, the Auto & Moto category connects car and motorcycle owners who want to exchange parts and accessories without intermediaries or expensive service centers.",
    related: ["tools", "electronics", "sport"],
    icon: "car",
  },
  {
    slug: "music",
    name: "Music",
    dbCategory: "Muzică & Audio",
    nameLocal: "Music & Audio",
    intro:
      "Musical instruments, audio equipment, vinyl records, turntables, amplifiers, and accessories. Music is a passion that evolves, and instruments that are no longer used deserve to reach someone who will bring them to life again. On Swaply, a beginner acoustic guitar can become a MIDI synthesizer. A set of acoustic drums can become a vintage turntable. The musical community is active and diverse, and instrument bartering eliminates the financial barrier that prevents many young people from learning a new instrument. The AI algorithm automatically recognizes the brand and model from the photo.",
    related: ["electronics", "arts", "books"],
    icon: "music",
  },
  {
    slug: "garden",
    name: "Garden",
    dbCategory: "Grădinărit & Exterior",
    nameLocal: "Gardening & Outdoor",
    intro:
      "Gardening tools, plants, outdoor furniture, barbecues, garden decorations, and everything related to outdoor spaces. Spring and summer bring a wave of interest in gardening, and bartering makes equipping a garden accessible without major investments. On Swaply, you can swap a gardening tool set for rare plant cuttings, or an old barbecue for a set of patio furniture. The amateur gardening community grows year after year, and the exchange of plants and seeds is one of the most appreciated forms of barter on the platform — natural, ecological, and completely free.",
    related: ["home", "tools", "sport"],
    icon: "sprout",
  },
  {
    slug: "toys",
    name: "Toys",
    dbCategory: "Jucării & Copii",
    nameLocal: "Toys & Kids",
    intro:
      "Toys, children's equipment, strollers, car seats, educational games, and everything related to the children's world. Kids grow fast, and their toys and equipment have a surprisingly short usage period. A stroller used for 8 months can become a car seat for the next stage. A Lego Duplo set can become a Lego Technic set. Toy and children's equipment bartering is one of the most active categories on Swaply, with parents constantly swapping as their little ones grow. It's circular economy in its most natural form — items circulate from one family to another.",
    related: ["books", "electronics", "fashion"],
    icon: "baby",
  },
  {
    slug: "tools",
    name: "Tools",
    dbCategory: "Unelte & Bricolaj",
    nameLocal: "Tools & DIY",
    intro:
      "Drills, wrench sets, ladders, welding equipment, power tools, and hand tools for DIY. Many tools are bought for a single project and then forgotten in the garage. On Swaply, that drill you used once can become a circular saw you need now. An air compressor can become a set of precision tools. The DIY and crafts community actively uses bartering to expand their tool arsenal without major investments. The category includes both professional power tools and hand tool sets for hobbyists.",
    related: ["home", "garden", "automotive"],
    icon: "hammer",
  },
  {
    slug: "other",
    name: "Other",
    dbCategory: "Altele",
    nameLocal: "Other",
    intro:
      "Everything that doesn't fit into a specific category has a place here. From unusual collectibles to specialized equipment, from craft materials to unique vintage pieces. The Other category is the space for items that defy traditional classification — and that's precisely why they're often the most interesting swaps on Swaply. Here you might find a vintage globe, an astronaut costume for parties, a working typewriter, or a complete set of theater curtains. Surprises are guaranteed, and the AI algorithm adapts to find matches even for the most unusual items.",
    related: ["arts", "home", "toys"],
    icon: "package",
  },
];

export function getCategoryBySlug(slug: string): SEOCategory | undefined {
  return SEO_CATEGORIES.find((c) => c.slug === slug);
}

/* ─── Cities ─── */

export interface SEOCity {
  slug: string;
  name: string;
  county: string;
}

export const SEO_CITIES: SEOCity[] = [
  { slug: "london", name: "London", county: "England" },
  { slug: "berlin", name: "Berlin", county: "Berlin" },
  { slug: "paris", name: "Paris", county: "Île-de-France" },
  { slug: "madrid", name: "Madrid", county: "Madrid" },
  { slug: "rome", name: "Rome", county: "Lazio" },
  { slug: "amsterdam", name: "Amsterdam", county: "Noord-Holland" },
  { slug: "vienna", name: "Vienna", county: "Wien" },
  { slug: "prague", name: "Prague", county: "Praha" },
  { slug: "stockholm", name: "Stockholm", county: "Stockholm" },
  { slug: "warsaw", name: "Warsaw", county: "Masovia" },
  { slug: "budapest", name: "Budapest", county: "Pest" },
  { slug: "lisbon", name: "Lisbon", county: "Lisboa" },
  { slug: "barcelona", name: "Barcelona", county: "Catalonia" },
  { slug: "munich", name: "Munich", county: "Bavaria" },
  { slug: "milan", name: "Milan", county: "Lombardy" },
];

export function getCityBySlug(slug: string): SEOCity | undefined {
  return SEO_CITIES.find((c) => c.slug === slug);
}
