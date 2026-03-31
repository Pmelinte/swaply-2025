import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import Script from "next/script";
import { getServerSupabase } from "@/lib/supabase/server";
import ObjectDetailClient from "./ObjectDetailClient";

export const revalidate = 300;

interface Props {
  params: Promise<{ id: string }>;
}

async function getItem(id: string) {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("items")
    .select("title, description, category, condition, location, images")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    return { title: "Object not found — Swaply" };
  }

  const title = `${item.title} — Swaply`;
  const description =
    (item.description as string)?.slice(0, 160) ||
    `${item.category} · ${item.condition}${item.location ? ` · ${item.location}` : ""}`;
  const photos = item.images as string[] | null;
  const image = photos?.[0] || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: item.title as string }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: {
      canonical: `https://www.swaply.world/en/objects/${id}`,
      languages: Object.fromEntries([
        ...locales.map((loc) => [loc, `https://www.swaply.world/${loc}/objects/${id}`]),
        ["x-default", `https://www.swaply.world/en/objects/${id}`],
      ]),
    },
  };
}

export default async function ObjectDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getItem(id);

  // JSON-LD structured data for SEO
  const jsonLd = item
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item.title as string,
        description: (item.description as string)?.slice(0, 500) || "",
        category: item.category as string,
        image: (item.images as string[] | null)?.[0] || undefined,
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceCurrency: "RON",
          price: "0",
          description: "Disponibil pentru schimb (barter)",
        },
        ...(item.condition ? { itemCondition: `https://schema.org/${item.condition === "new" ? "NewCondition" : "UsedCondition"}` } : {}),
        ...(item.location ? { availableAtOrFrom: { "@type": "Place", name: item.location as string } } : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="product-schema"
          type="application/ld+json"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ObjectDetailClient />
    </>
  );
}
