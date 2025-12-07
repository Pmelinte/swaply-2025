// src/app/(app)/items/[id]/metadata.ts

import { getItemAction } from "@/features/items/server/items-actions";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItemAction(params.id);

  if (!item) {
    return {
      title: "Obiect inexistent | Swaply",
      description: "Acest obiect nu există sau a fost șters.",
    };
  }

  const title = item.title ?? "Obiect pe Swaply";
  const description =
    item.description?.slice(0, 150) ??
    "Vezi detalii despre acest obiect pe Swaply.";

  // candidat pentru imagine: prima poză sau fallback OG
  const imageCandidate =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : "/og-default.jpg";

  // siguranță: evităm string gol / null / undefined
  const image =
    typeof imageCandidate === "string" && imageCandidate.trim().length > 5
      ? imageCandidate
      : "/og-default.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
