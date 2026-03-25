import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/config";
import { notFound } from "next/navigation";
import { MapPin, Tag, ChevronRight, Home } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  SEO_CITIES,
  SEO_CATEGORIES,
  getCityBySlug,
  getCategoryBySlug,
  type SEOCategory,
} from "@/lib/seo-data";

interface Props {
  params: Promise<{ city: string; category: string }>;
}

// ── ISR: regenerate every hour instead of static generation ──
// Avoids generating 43 locales × 90+ cities × 11 categories = 45k+ pages at build time
export const revalidate = 3600;

// ── Metadata from seo_content table or fallback ──

interface SeoContentRow {
  h1: string;
  intro_paragraph: string;
  meta_title: string;
  meta_description: string;
}

async function getSeoContent(
  citySlug: string,
  categorySlug: string,
): Promise<SeoContentRow | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("seo_content")
    .select("h1, intro_paragraph, meta_title, meta_description")
    .eq("page_type", "category_city")
    .eq("category_slug", categorySlug)
    .eq("city_slug", citySlug)
    .eq("lang", "en")
    .maybeSingle();

  return data as SeoContentRow | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, category: catSlug } = await params;
  const city = getCityBySlug(citySlug);
  const cat = getCategoryBySlug(catSlug);
  if (!city || !cat) return { title: "Page Not Found — Swaply" };

  // Try DB-stored SEO content first
  const seo = await getSeoContent(citySlug, catSlug);

  const title = seo?.meta_title ?? `Swap ${cat.nameLocal} in ${city.name} | Swaply.world`;
  const description =
    seo?.meta_description ??
    `Find ${cat.nameLocal.toLowerCase()} to swap in ${city.name}. Free barter platform, no money needed. Browse available items now.`;

  const path = `/objects/city/${citySlug}/${catSlug}`;

  return {
    title,
    description,
    keywords: [
      `swap ${cat.nameLocal.toLowerCase()} ${city.name}`,
      `barter ${cat.nameLocal.toLowerCase()} ${city.name}`,
      `${cat.nameLocal.toLowerCase()} exchange ${city.name}`,
      `second hand ${cat.nameLocal.toLowerCase()} ${city.name}`,
    ],
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
    alternates: {
      canonical: `https://www.swaply.world/en${path}`,
      languages: Object.fromEntries([
        ...locales.map((loc) => [loc, `https://www.swaply.world/${loc}${path}`]),
        ["x-default", `https://www.swaply.world/en${path}`],
      ]),
    },
  };
}

// ── Data fetching ──

interface ItemRow {
  id: string;
  title: string;
  category: string;
  condition: string;
  photos: string[] | null;
  location: string | null;
  wishlist: string | null;
  created_at: string;
}

async function getCityCategoryItems(
  cityName: string,
  countyName: string,
  dbCategory: string,
): Promise<{ local: ItemRow[]; nearby: ItemRow[] }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { local: [], nearby: [] };

  // Items matching both city AND category
  const { data: localData } = await supabase
    .from("items")
    .select("id, title, category, condition, photos, location, wishlist, created_at")
    .eq("category", dbCategory)
    .ilike("location", `%${cityName}%`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  const local = (localData as ItemRow[]) ?? [];

  // If few local results, broaden to county/national with same category
  let nearby: ItemRow[] = [];
  if (local.length < 3) {
    const localIds = new Set(local.map((i) => i.id));
    const { data: countyData } = await supabase
      .from("items")
      .select("id, title, category, condition, photos, location, wishlist, created_at")
      .eq("category", dbCategory)
      .ilike("location", `%${countyName}%`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12);

    const countyItems = ((countyData as ItemRow[]) ?? []).filter(
      (i) => !localIds.has(i.id),
    );

    if (countyItems.length + local.length < 3) {
      const { data: nationalData } = await supabase
        .from("items")
        .select("id, title, category, condition, photos, location, wishlist, created_at")
        .eq("category", dbCategory)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12);

      const allIds = new Set([...localIds, ...countyItems.map((i) => i.id)]);
      nearby = [
        ...countyItems,
        ...((nationalData as ItemRow[]) ?? []).filter((i) => !allIds.has(i.id)),
      ].slice(0, 12);
    } else {
      nearby = countyItems;
    }
  }

  return { local, nearby };
}

// ── Item card component ──

function ItemCard({ item }: { item: ItemRow }) {
  return (
    <Link
      href={`/objects/${item.id}`}
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600"
    >
      <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-zinc-100 dark:bg-zinc-700">
        {item.photos?.[0] ? (
          <img
            src={item.photos[0]}
            alt={item.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-bold text-zinc-300 dark:text-zinc-600">
            {item.title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-400">
          {item.title}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {item.category} · {item.condition}
        </p>
        {item.location && (
          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
            <MapPin className="h-3 w-3" />
            {item.location}
          </p>
        )}
        {item.wishlist && (
          <p className="mt-1 truncate text-xs text-blue-500">
            Looking for: {item.wishlist}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Page component ──

export default async function CategoryCityPage({ params }: Props) {
  const { city: citySlug, category: catSlug } = await params;
  const city = getCityBySlug(citySlug);
  const cat = getCategoryBySlug(catSlug);
  if (!city || !cat) notFound();

  const [{ local, nearby }, seo] = await Promise.all([
    getCityCategoryItems(city.name, city.county, cat.dbCategory),
    getSeoContent(citySlug, catSlug),
  ]);

  const totalCount = local.length + nearby.length;
  const h1 = seo?.h1 ?? `Swap ${cat.nameLocal} in ${city.name}`;
  const intro =
    seo?.intro_paragraph ??
    `Browse ${cat.nameLocal.toLowerCase()} available for swapping in ${city.name}. Swaply is a free barter platform where you can exchange items directly with other users — no money involved. Find what you need, offer what you no longer use, and make a fair swap today.`;

  // Related categories in this city (exclude current)
  const relatedCategories = cat.related
    .map((r) => getCategoryBySlug(r))
    .filter(Boolean) as SEOCategory[];

  // Other cities for the same category
  const otherCities = SEO_CITIES.filter((c) => c.slug !== citySlug).slice(0, 8);

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: h1,
    description: intro.slice(0, 160),
    url: `https://swaply.world/en/objects/city/${citySlug}/${catSlug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Swaply",
      url: "https://swaply.world",
    },
    about: {
      "@type": "Thing",
      name: cat.nameLocal,
    },
    spatialCoverage: {
      "@type": "City",
      name: city.name,
    },
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-200">
          <Home className="h-3.5 w-3.5" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/objects" className="hover:text-zinc-700 dark:hover:text-zinc-200">
          Objects
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/objects/city/${citySlug}`}
          className="hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          {city.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          {cat.nameLocal}
        </span>
      </nav>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {h1}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {totalCount} items available for swap
        </p>
      </header>

      {/* SEO intro paragraph */}
      <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 text-sm leading-relaxed text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
        {intro}
      </div>

      {/* Local items */}
      {local.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {cat.nameLocal} in {city.name}
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {local.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {local.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Nearby / fallback */}
      {nearby.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {local.length < 3
              ? `${cat.nameLocal} from ${city.county} and beyond`
              : `More ${cat.nameLocal.toLowerCase()} nearby`}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nearby.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-700">
          <Tag className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No {cat.nameLocal.toLowerCase()} available in {city.name} right now.
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Be the first to list one!
          </p>
          <Link
            href="/objects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            List an item
          </Link>
        </div>
      )}

      {/* Browse all in this city */}
      <div className="text-center">
        <Link
          href={`/objects/city/${citySlug}`}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          All items in {city.name}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Related categories in this city */}
      {relatedCategories.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Related categories in {city.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedCategories.map((rc) => (
              <Link
                key={rc.slug}
                href={`/objects/city/${citySlug}/${rc.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
              >
                <Tag className="h-3 w-3" />
                {rc.nameLocal}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Same category in other cities */}
      {otherCities.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {cat.nameLocal} in other cities
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/objects/city/${c.slug}/${catSlug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
              >
                <MapPin className="h-3 w-3" />
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Have {cat.nameLocal.toLowerCase()} to swap in {city.name}?
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create a free account and list your first item.
        </p>
        <Link
          href="/register"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Try Swaply for free →
        </Link>
      </div>
    </div>
  );
}
