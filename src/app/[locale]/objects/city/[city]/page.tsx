import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/config";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Tag } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { SEO_CITIES, SEO_CATEGORIES, getCityBySlug } from "@/lib/seo-data";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ locale: string; city: string }>;
}

// ── ISR: regenerate every hour instead of static generation ──
// Avoids generating 43 locales × 90+ cities = 3.8k+ pages at build time
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  const t = await getTranslations({ locale, namespace: "cityPage" });

  if (!city) return { title: t("notFoundTitle") };

  const title = t("metaTitle", { city: city.name });
  const description = t("metaDescription", { city: city.name });

  return {
    title,
    description,
    keywords: [
      t("keyword_swap", { city: city.name }),
      t("keyword_barter", { city: city.name }),
      t("keyword_secondhand", { city: city.name }),
    ],
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
    alternates: {
      canonical: `https://www.swaply.world/en/objects/city/${citySlug}`,
      languages: Object.fromEntries([
        ...locales.map((loc) => [loc, `https://www.swaply.world/${loc}/objects/city/${citySlug}`]),
        ["x-default", `https://www.swaply.world/en/objects/city/${citySlug}`],
      ]),
    },
  };
}

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

async function getCityItems(
  cityName: string,
  countyName: string,
): Promise<{ local: ItemRow[]; nearby: ItemRow[] }> {
  const supabase = await getServerSupabase();
  if (!supabase) return { local: [], nearby: [] };

  // Local items matching city name
  const { data: localData } = await supabase
    .from("items")
    .select("id, title, category, condition, photos, location, wishlist, created_at")
    .ilike("location", `%${cityName}%`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  const local = (localData as ItemRow[]) ?? [];

  // If fewer than 3 local items, fetch county/national items
  let nearby: ItemRow[] = [];
  if (local.length < 3) {
    const localIds = new Set(local.map((i) => i.id));
    const { data: countyData } = await supabase
      .from("items")
      .select("id, title, category, condition, photos, location, wishlist, created_at")
      .ilike("location", `%${countyName}%`)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(12);

    const countyItems = ((countyData as ItemRow[]) ?? []).filter(
      (i) => !localIds.has(i.id),
    );

    if (countyItems.length + local.length < 3) {
      // Fallback to national
      const { data: nationalData } = await supabase
        .from("items")
        .select("id, title, category, condition, photos, location, wishlist, created_at")
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

function ItemCard({ item, lookingForLabel }: { item: ItemRow; lookingForLabel: string }) {
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
            {lookingForLabel}
          </p>
        )}
      </div>
    </Link>
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  ro: "Romania",
  en: "Romania",
};

const COUNTRY_CODES: Record<string, string> = {
  ro: "RO",
  en: "RO",
};

export default async function CityPage({ params }: Props) {
  const { locale, city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const t = await getTranslations({ locale, namespace: "cityPage" });
  const countryName = COUNTRY_NAMES[locale] ?? "Romania";
  const countryCode = COUNTRY_CODES[locale] ?? "RO";

  const { local, nearby } = await getCityItems(city.name, city.county);
  const totalCount = local.length + nearby.length;

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Swaply ${city.name}`,
    description: t("jsonLdDescription", { city: city.name, country: countryName }),
    url: `https://swaply.world/objects/city/${citySlug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressCountry: countryCode,
    },
    areaServed: {
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

      {/* Back */}
      <Link
        href="/objects"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("allObjects")}
      </Link>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("heroTitle", { city: city.name })}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {t("heroDescription", { city: city.name })}
        </p>
      </header>

      {/* Local items */}
      {local.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t("localItemsTitle", { city: city.name })}
            </h2>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {local.length}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {local.map((item) => (
              <ItemCard key={item.id} item={item} lookingForLabel={t("lookingFor", { wishlist: item.wishlist ?? "" })} />
            ))}
          </div>
        </section>
      )}

      {/* Nearby / national fallback */}
      {nearby.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {local.length < 3
              ? t("nearbyItemsFallback", { county: city.county, country: countryName })
              : t("nearbyItemsTitle", { county: city.county })}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nearby.map((item) => (
              <ItemCard key={item.id} item={item} lookingForLabel={t("lookingFor", { wishlist: item.wishlist ?? "" })} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-700">
          <MapPin className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            {t("emptyStateMessage", { city: city.name })}
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {t("emptyStateHint")}
          </p>
          <Link
            href="/objects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t("listObject")}
          </Link>
        </div>
      )}

      {/* Browse categories in this city — links to category+city intersection */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("popularCategories", { city: city.name })}
        </h2>
        <div className="flex flex-wrap gap-2">
          {SEO_CATEGORIES.filter((c) => c.slug !== "other").map((cat) => (
            <Link
              key={cat.slug}
              href={`/objects/city/${citySlug}/${cat.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
            >
              <Tag className="h-3 w-3" />
              {cat.nameLocal}
            </Link>
          ))}
        </div>
      </section>

      {/* Other cities */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("otherCities")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {SEO_CITIES.filter((c) => c.slug !== citySlug).map((c) => (
            <Link
              key={c.slug}
              href={`/objects/city/${c.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
            >
              <MapPin className="h-3 w-3" />
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("ctaTitle", { city: city.name })}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("ctaDescription")}
        </p>
        <Link
          href="/register"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          {t("ctaButton")}
        </Link>
      </div>
    </div>
  );
}
