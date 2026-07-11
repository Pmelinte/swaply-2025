"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import type { Item } from "@/lib/types";
import { createMapItem } from "@/lib/state/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ItemForm } from "@/features/items/ItemForm";
import { LoggedOutGate } from "@/components/gated";
import { SectionCard, StateShowcase } from "@/components/ui-custom";

export default function EditObjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, user, loading: appLoading, upsertItem } = useAppState();
  const t = useTranslations("objectEdit");
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (appLoading.auth) {
      return () => {
        cancelled = true;
      };
    }

    if (!user) {
      setItem(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const stateItem = items.find(
      (candidate) =>
        candidate.id === params.id && candidate.ownerId === user.id,
    );

    if (stateItem) {
      setItem(stateItem);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setItem(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);

    void (async () => {
      try {
        const { data } = await supabase
          .from("items")
          .select("*")
          .eq("id", params.id)
          .eq("owner_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (!data) {
          setItem(null);
          setLoading(false);
          return;
        }

        const mapped = createMapItem({ current: user })(
          data as unknown as Partial<Item> & Record<string, unknown>,
        );
        setItem(mapped);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setItem(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appLoading.auth, items, params.id, user]);

  if (appLoading.auth) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!user) {
    return <LoggedOutGate returnTo={`/objects/${params.id}/edit`} />;
  }

  if (loading) {
    return (
      <SectionCard title={t("loading")} description="">
        <div className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </SectionCard>
    );
  }

  if (!item) {
    return (
      <SectionCard title={t("notFound")} description="">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {t("notFoundDescription")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          <Link
            className="rounded-full bg-blue-600 px-4 py-2 text-white"
            href="/objects"
          >
            {t("backToObjects")}
          </Link>
          <Link
            className="rounded-full bg-zinc-900 px-4 py-2 text-white"
            href="/objects/new"
          >
            {t("addObject")}
          </Link>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <SectionCard title={t("title")} description={t("editDescription")}>
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
        title="EDIT OBJECT States"
        states={[
          {
            key: "loading",
            title: "Loading values",
            description:
              "Skeleton on fields at mount + spinner on button until we fetch the object.",
          },
          {
            key: "empty",
            title: "Form without data",
            description:
              "If the object returns no data, we show a fallback with a link to create.",
          },
          {
            key: "error",
            title: "Save error",
            description:
              "Clear message without data loss; user can return to /objects/[id].",
          },
        ]}
      />
    </div>
  );
}
