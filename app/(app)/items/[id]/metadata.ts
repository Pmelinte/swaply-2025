// src/app/(app)/items/[id]/metadata.ts

import type { Metadata } from "next";
import { getItemServer } from "@/features/items/server/items-actions";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItemServer(params.id);

  if (!item) {
    return {
      title: "Item inexistent",
      description: "Acest item nu a fost găsit.",
    };
  }

  const title = item.title ? `${item.title} – Swaply` : "Item – Swaply";
  const description =
    (item.description && item.description.trim().slice(0, 160)) ||
    "Vezi detalii despre item pe Swaply.";

  const imageUrl =
    item.images?.find((i: any) => i?.isPrimary)?.url ||
    item.images?.[0]?.url ||
    undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

export default function MetadataShim() {
  // Next cere un default export în unele setup-uri; nu renderizăm nimic.
  return null;
}
