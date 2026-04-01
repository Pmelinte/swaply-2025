import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { getCategoryBySlug } from "@/lib/seo-data";
import { getCachedSubcategoryMeta } from "@/lib/cache/categories";
import { getTranslations } from "next-intl/server";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";

interface Props {
  params: Promise<{ locale: string; slug: string; subcat: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, subcat } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: "Not Found" };

  const subcatData = await getCachedSubcategoryMeta(slug, subcat);

  const subcatName = subcatData
    ? locale === "ro" ? subcatData.name_ro : subcatData.name_en
    : subcat.replace(/-/g, " ");

  return {
    title: `${subcatName} — ${cat.name} | Swaply`,
    description: `Browse and swap ${subcatName} items on Swaply. Find the best ${cat.name.toLowerCase()} deals.`,
  };
}

export default async function SubcategoryPage({ params }: Props) {
  const { locale, slug, subcat } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const t = await getTranslations({ locale, namespace: "objects" });
  const supabase = await getServerSupabase();

  // Fetch subcategory metadata (cached for hours)
  const subcatData = await getCachedSubcategoryMeta(slug, subcat);

  if (!subcatData) notFound();

  const subcatName = locale === "ro" ? subcatData.name_ro : subcatData.name_en;

  // Fetch items with this subcategory
  const items = supabase
    ? await supabase
        .from("items")
        .select("id, title, category, condition, images, location, created_at, subcategory_slug")
        .eq("subcategory_slug", subcat)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(24)
        .then((r) => r.data ?? [])
    : [];

  // Also fetch items from the parent category if few subcategory results
  const parentItems = items.length < 6 && supabase
    ? await supabase
        .from("items")
        .select("id, title, category, condition, images, location, created_at")
        .eq("category", cat.dbCategory)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12)
        .then((r) => r.data ?? [])
    : [];

  const allItems = [...items, ...parentItems.filter((pi) => !items.some((i) => i.id === pi.id))];

  // Fetch sibling subcategories for navigation
  const siblings = supabase
    ? await supabase
        .from("subcategories")
        .select("slug, name_en, name_ro, icon")
        .eq("category_slug", slug)
        .neq("slug", subcat)
        .order("sort_order", { ascending: true })
        .then((r) => r.data ?? [])
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/objects" className="hover:text-blue-600">
          {t("browseAll")}
        </Link>
        <span>/</span>
        <Link href={`/objects/category/${slug}`} className="hover:text-blue-600">
          {locale === "ro" ? cat.dbCategory : cat.nameLocal}
        </Link>
        <span>/</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {subcatData.icon} {subcatName}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {subcatData.icon} {subcatName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {allItems.length} {t("itemsAvailable")}
        </p>
      </div>

      {/* Items grid */}
      {allItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allItems.map((item) => (
            <Link
              key={item.id}
              href={`/objects/${item.id}`}
              className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-700">
                <SafeImage
                  src={(item.images as string[])?.[0] || NO_IMAGE_URL}
                  alt={item.title as string}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized={!(item.images as string[])?.[0]}
                />
              </div>
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.title as string}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">{item.condition as string}</p>
                {item.location && (
                  <p className="mt-1 truncate text-xs text-zinc-400">{item.location as string}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
          <Tag className="mx-auto h-8 w-8 text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-500">{t("noItemsInCategory")}</p>
          <Link
            href="/objects/new"
            className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t("addFirstItem")}
          </Link>
        </div>
      )}

      {/* Sibling subcategories */}
      {siblings.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            {t("relatedCategories")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {siblings.map((sib) => (
              <Link
                key={sib.slug}
                href={`/objects/category/${slug}/${sib.slug}`}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <span>{sib.icon}</span>
                {locale === "ro" ? sib.name_ro : sib.name_en}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8">
        <Link
          href={`/objects/category/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToCategory")}
        </Link>
      </div>
    </main>
  );
}
