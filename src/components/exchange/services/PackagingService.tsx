"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  onSave: (details: Record<string, unknown>) => Promise<void>;
}

const OPTIONS = ["standard", "premium", "original", "fragile"] as const;

export function PackagingService({ onSave }: Props) {
  const t = useTranslations("exchangePage");
  const [option, setOption] = useState<string>("standard");
  const [dims, setDims] = useState({ l: "", w: "", h: "", kg: "" });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({ option, dimensions: dims, notes });
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        📦 {t("packagingTitle")}
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setOption(opt)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
              option === opt
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700"
            }`}
          >
            {t(`packaging${opt.charAt(0).toUpperCase()}${opt.slice(1)}` as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t("dimensions")}</p>
        <div className="flex gap-2">
          {(["l", "w", "h"] as const).map((dim) => (
            <input
              key={dim}
              type="number"
              placeholder={dim.toUpperCase()}
              value={dims[dim]}
              onChange={(e) => setDims((d) => ({ ...d, [dim]: e.target.value }))}
              className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          ))}
          <input
            type="number"
            placeholder="kg"
            value={dims.kg}
            onChange={(e) => setDims((d) => ({ ...d, kg: e.target.value }))}
            className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t("specialNotes")}</p>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? "…" : "💾 Save packaging"}
      </button>
    </div>
  );
}
