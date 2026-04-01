"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { ItemForm } from "@/features/items/ItemForm";
import { LoggedOutGate } from "@/components/gated";
import { SectionCard, StateShowcase } from "@/components/ui-custom";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  Package,
  Search,
  Loader2,
  CheckCircle2,
  Tag,
  MapPin,
  ArrowRightLeft,
} from "lucide-react";

type ListingMode = "object" | "wanted";

function WantedRequestForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("wanted");
  const tc = useTranslations("common");
  const { user } = useAppState();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState(user?.location?.city ?? "");
  const [offerDesc, setOfferDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const session = supabase ? await supabase.auth.getSession() : null;
      const token = session?.data?.session?.access_token;

      if (token) {
        const res = await fetch("/api/wanted", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            category: category.trim() || undefined,
            city: city.trim() || undefined,
            offerDescription: offerDesc.trim() || undefined,
          }),
        });

        if (res.ok) {
          setSuccess(true);
          setTimeout(onSubmit, 1500);
          return;
        }
      }
    } catch {
      // Silent
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{t("requestPublished")}</p>
        <p className="text-sm text-zinc-500">{t("redirecting")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase text-zinc-500">
          {t("whatLookingFor")} *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase text-zinc-500">
          {t("descriptionLabel")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          rows={3}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      {/* Category + City */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase text-zinc-500">
            <Tag className="h-3 w-3" /> {t("categoryLabel")}
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("categoryPlaceholder")}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase text-zinc-500">
            <MapPin className="h-3 w-3" /> {t("cityLabel")}
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("cityPlaceholder")}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* What can you offer */}
      <div>
        <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase text-zinc-500">
          <ArrowRightLeft className="h-3 w-3" /> {t("offerLabel")}
        </label>
        <input
          type="text"
          value={offerDesc}
          onChange={(e) => setOfferDesc(e.target.value)}
          placeholder={t("offerPlaceholder")}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <p className="mt-1 text-[10px] text-zinc-400">{t("offerHint")}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!title.trim() || saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("publishRequest")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {tc("cancel")}
        </button>
      </div>
    </div>
  );
}

export default function NewObjectPage() {
  const { user, loading, startNewItem, upsertItem } = useAppState();
  const t = useTranslations("objectNew");
  const router = useRouter();
  const [listingMode, setListingMode] = useState<ListingMode>("object");

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
      {/* Mode selector */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setListingMode("object")}
          className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
            listingMode === "object"
              ? "border-green-300 bg-green-50 ring-1 ring-green-300 dark:border-green-700 dark:bg-green-950/40 dark:ring-green-700"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
          }`}
        >
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${listingMode === "object" ? "bg-green-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700"}`}>
            <Package className="h-5 w-5" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${listingMode === "object" ? "text-green-700 dark:text-green-300" : "text-zinc-900 dark:text-zinc-50"}`}>
              {t("modeObject")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("modeObjectDesc")}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setListingMode("wanted")}
          className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
            listingMode === "wanted"
              ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40 dark:ring-blue-700"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
          }`}
        >
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${listingMode === "wanted" ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700"}`}>
            <Search className="h-5 w-5" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${listingMode === "wanted" ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-zinc-50"}`}>
              {t("modeWanted")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{t("modeWantedDesc")}</p>
          </div>
        </button>
      </div>

      {/* Form based on mode */}
      {listingMode === "object" ? (
        <SectionCard title={t("title")} description={t("description")}>
          <ItemForm
            item={item}
            onSave={async (next) => {
              await upsertItem(next);
              router.push("/objects");
            }}
            onCancel={() => router.push("/objects")}
          />
        </SectionCard>
      ) : (
        <SectionCard title={t("wantedTitle")} description={t("wantedDescription")}>
          <WantedRequestForm
            onSubmit={() => router.push("/wanted")}
            onCancel={() => router.push("/objects")}
          />
        </SectionCard>
      )}

      <StateShowcase
        title="ADD OBJECT States"
        states={[
          {
            key: "loading",
            title: "Loading form schema",
            description: "Skeleton on fields while we verify user permissions.",
          },
          {
            key: "empty",
            title: "Empty form",
            description: "Minimal validation prevents submit without title, category and image. Upload has fallback.",
          },
          {
            key: "error",
            title: "Save error",
            description: "Clear message and safe redirect to /objects without breaking the build.",
          },
        ]}
      />
    </div>
  );
}
