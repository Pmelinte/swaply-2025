"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { ItemForm } from "@/features/items/ItemForm";
import { LoggedOutGate } from "@/components/gated";
import { SectionCard, StateShowcase } from "@/components/ui";
import { Item } from "@/lib/types";

export default function NewObjectPage() {
  const { user, startNewItem, upsertItem } = useAppState();
  const t = useTranslations("objectNew");
  const router = useRouter();
  const [item] = useState<Item | null>(startNewItem());

  if (!user || !item) {
    return <LoggedOutGate returnTo="/objects/new" />;
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("title")}
        description={t("description")}
      >
        <ItemForm
          item={item}
          onSave={async (next) => {
            await upsertItem(next);
            router.push("/objects");
          }}
          onCancel={() => router.push("/objects")}
        />
      </SectionCard>
      <StateShowcase
        title="Stări ADAUGĂ OBIECT"
        states={[
          {
            key: "loading",
            title: "Preluare schemă formular",
            description: "Afișăm skeleton pe câmpuri cât timp verificăm permisiunile utilizatorului.",
          },
          {
            key: "empty",
            title: "Formular gol",
            description: "Validarea minimă previne submit-ul fără titlu, categorie și imagine. Upload are fallback.",
          },
          {
            key: "error",
            title: "Eroare la salvare",
            description: "Mesaj clar și redirecționare sigură către /objects fără a rupe build-ul.",
          },
        ]}
      />
    </div>
  );
}
