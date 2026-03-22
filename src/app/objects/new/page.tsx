"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { ItemForm } from "@/features/items/ItemForm";
import { LoggedOutGate } from "@/components/gated";
import { SectionCard, StateShowcase } from "@/components/ui";

export default function NewObjectPage() {
  const { user, loading, startNewItem, upsertItem } = useAppState();
  const t = useTranslations("objectNew");
  const router = useRouter();
  if (loading.auth) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!user) {
    return <LoggedOutGate returnTo="/objects/new" />;
  }

  const item = startNewItem()!;

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
