"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import { ItemForm } from "@/features/items/ItemForm";
import { LoggedOutGate } from "@/components/gated";
import { SectionCard } from "@/components/ui";
import { Item } from "@/lib/types";

export default function NewObjectPage() {
  const { user, startNewItem, upsertItem } = useAppState();
  const router = useRouter();
  const [item] = useState<Item | null>(startNewItem());

  if (!user || !item) {
    return <LoggedOutGate returnTo="/objects/new" />;
  }

  return (
    <SectionCard
      title="Adaugă obiect"
      description="Formular complet, fără a rupe build-ul."
    >
      <ItemForm
        item={item}
        onSave={(next) => {
          upsertItem(next);
          router.push("/objects");
        }}
        onCancel={() => router.push("/objects")}
      />
    </SectionCard>
  );
}
