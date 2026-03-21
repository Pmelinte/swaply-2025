import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, ChevronRight, Tag } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { SEO_CITIES, SEO_CATEGORIES, getCityBySlug } from "@/lib/seo-data";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return SEO_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return { title: "Oraș negăsit — Swaply" };

  const title = `Schimb de obiecte în ${city.name} | Swaply.world`;
  const description = `Schimbă obiecte fără bani în ${city.name}. Obiecte disponibile local. Platformă de barter gratuită.`;

  return {
    title,
    description,
    keywords: [
      `schimb obiecte ${city.name}`,
      `barter ${city.name}`,
      `obiecte second hand ${city.name}`,
    ],
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
    alternates: {
      canonical: `https://swaply.world/objects/city/${citySlug}`,
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
            Caută: {item.wishlist}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const { local, nearby } = await getCityItems(city.name, city.county);
  const totalCount = local.length + nearby.length;

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Swaply ${city.name}`,
    description: `Platformă de schimb de obiecte fără bani în ${city.name}, România.`,
    url: `https://swaply.world/objects/city/${citySlug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressCountry: "RO",
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
        Toate obiectele
      </Link>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Schimb de obiecte în {city.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Comunitatea Swaply din {city.name} conectează utilizatori activi care
          vor să facă schimb de obiecte. Găsește obiecte de schimbat în
          apropierea ta sau schimbă prin curier cu orice utilizator din țară.
        </p>
      </header>

      {/* Local items */}
      {local.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Obiecte în {city.name}
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

      {/* Nearby / national fallback */}
      {nearby.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {local.length < 3
              ? `Obiecte din județul ${city.county} și din toată România`
              : `Alte obiecte din ${city.county}`}
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
          <MapPin className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Niciun obiect disponibil momentan în {city.name}.
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Fii primul care listează un obiect în acest oraș!
          </p>
          <Link
            href="/objects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Listează un obiect
          </Link>
        </div>
      )}

      {/* Browse categories in this city */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Categorii populare în {city.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          {SEO_CATEGORIES.filter((c) => c.slug !== "other").map((cat) => (
            <Link
              key={cat.slug}
              href={`/objects/category/${cat.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
            >
              <Tag className="h-3 w-3" />
              {cat.nameRo}
            </Link>
          ))}
        </div>
      </section>

      {/* Other cities */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Alte orașe active
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
          Schimbă obiecte în {city.name}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Creează un cont gratuit și listează primul tău obiect.
        </p>
        <Link
          href="/register"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          Încearcă Swaply gratuit →
        </Link>
      </div>
    </div>
  );
}
