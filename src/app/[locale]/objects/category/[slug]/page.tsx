import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/config";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag, MapPin, ChevronRight } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  SEO_CATEGORIES,
  getCategoryBySlug,
  type SEOCategory,
} from "@/lib/seo-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SEO_CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: "Categorie negăsită — Swaply" };

  const title = `Schimb ${cat.nameLocal} fără bani | Swaply.world`;
  const description = `Găsește ${cat.nameLocal} de schimbat în România. Obiecte disponibile acum. Barter fără bani, fără comisioane.`;

  return {
    title,
    description,
    keywords: [
      `schimb ${cat.nameLocal.toLowerCase()}`,
      `barter ${cat.nameLocal.toLowerCase()}`,
      `${cat.nameLocal.toLowerCase()} second hand Romania`,
    ],
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
    alternates: {
      canonical: `https://www.swaply.world/en/objects/category/${slug}`,
      languages: Object.fromEntries([
        ...locales.map((loc) => [loc, `https://www.swaply.world/${loc}/objects/category/${slug}`]),
        ["x-default", `https://www.swaply.world/en/objects/category/${slug}`],
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

async function getItems(categoryName: string): Promise<ItemRow[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("items")
    .select("id, title, category, condition, photos, location, wishlist, created_at")
    .eq("category", categoryName)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  return (data as ItemRow[]) ?? [];
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const items = await getItems(cat.dbCategory);
  const relatedCategories = cat.related
    .map((r) => getCategoryBySlug(r))
    .filter(Boolean) as SEOCategory[];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
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
          Schimb de {cat.nameLocal} în România
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {items.length} obiecte disponibile pentru schimb
        </p>
      </header>

      {/* Intro paragraph */}
      <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 text-sm leading-relaxed text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
        {cat.intro}
      </div>

      {/* Items grid */}
      {items.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Obiecte disponibile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <Link
                key={item.id}
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
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Niciun obiect disponibil momentan în această categorie.
          </p>
          <Link
            href="/objects/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Listează primul obiect
          </Link>
        </div>
      )}

      {/* Browse all link */}
      <div className="text-center">
        <Link
          href="/objects"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Vezi toate obiectele disponibile
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Related categories */}
      {relatedCategories.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Categorii înrudite
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedCategories.map((rc) => (
              <Link
                key={rc.slug}
                href={`/objects/category/${rc.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
              >
                <Tag className="h-3.5 w-3.5" />
                {rc.nameLocal}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Ai {cat.nameLocal.toLowerCase()} de schimbat?
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Listează gratuit și găsește un schimb în câteva minute.
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
