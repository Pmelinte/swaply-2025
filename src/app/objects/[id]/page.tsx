import type { Metadata } from "next";
import { getServerSupabase } from "@/lib/supabase/server";
import ObjectDetailClient from "./ObjectDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = getServerSupabase();

  if (!supabase) {
    return { title: "Object — Swaply" };
  }

  const { data: item } = await supabase
    .from("items")
    .select("title, description, category, condition, location, photos")
    .eq("id", id)
    .maybeSingle();

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

export default function ObjectDetailPage() {
  return <ObjectDetailClient />;
}
