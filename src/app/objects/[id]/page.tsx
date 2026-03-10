import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase/server";
import ObjectDetailClient from "./ObjectDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

async function getItem(id: string) {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from("items")
    .select("title, description, category, condition, location, photos")
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
  const photos = item.photos as string[] | null;
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
        image: (item.photos as string[] | null)?.[0] || undefined,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ObjectDetailClient />
    </>
  );
}
