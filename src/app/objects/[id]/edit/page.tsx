"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { Item } from "@/lib/types";
import { ItemForm } from "@/features/items/ItemForm";
import { LoggedOutGate } from "@/components/gated";
import { SectionCard, StateShowcase } from "@/components/ui";

export default function EditObjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, user, upsertItem } = useAppState();
  const t = useTranslations("objectEdit");
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItem(items.find((i) => i.id === params.id) ?? null);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [items, params.id]);

  if (!user) {
    return <LoggedOutGate returnTo={`/objects/${params.id}/edit`} />;
  }

  if (loading) {
    return (
      <SectionCard
        title={t("loading")}
        description=""
      >
        <div className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </SectionCard>
    );
  }

  if (!item) {
    return (
      <SectionCard
        title={t("notFound")}
        description=""
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {t("notFoundDescription")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          <Link className="rounded-full bg-blue-600 px-4 py-2 text-white" href="/objects">
            Înapoi la obiecte
          </Link>
          <Link className="rounded-full bg-zinc-900 px-4 py-2 text-white" href="/objects/new">
            Adaugă obiect
          </Link>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={t("title")}
        description={t("editDescription")}
      >
        <ItemForm
          item={item}
          onSave={async (next) => {
            await upsertItem(next);
            router.push(`/objects/${params.id}`);
          }}
          onCancel={() => router.push(`/objects/${params.id}`)}
        />
      </SectionCard>

      <StateShowcase
        title="Stări EDITARE OBIECT"
        states={[
          {
            key: "loading",
            title: "Se încarcă valorile",
            description: "Skeleton pe câmpuri la montare + spinner pe buton până preluăm obiectul.",
          },
          {
            key: "empty",
            title: "Formular fără date",
            description: "Dacă obiectul nu returnează date, afișăm fallback cu link spre creare.",
          },
          {
            key: "error",
            title: "Eroare la salvare",
            description: "Mesaj clar și fără pierdere de date; utilizatorul poate reveni la /objects/[id].",
          },
        ]}
      />
    </div>
  );
}
