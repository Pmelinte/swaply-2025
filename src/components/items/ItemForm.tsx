"use client";

import { useMemo, useState } from "react";

export type ItemFormData = {
  title: string;
  description: string;
  image_url: string; // URL final (extern sau rezultat din upload)
  condition: string;
  locationCity: string;
  locationCountry: string;
  valueApprox: string; // ținem ca string în form, backend poate converti
  currency: string;
};

type Props = {
  mode?: "create" | "edit";
  initialValues?: Partial<ItemFormData>;
  onSubmit: (values: ItemFormData) => Promise<any>;
};

const DEFAULTS: ItemFormData = {
  title: "",
  description: "",
  image_url: "",
  condition: "Bun",
  locationCity: "",
  locationCountry: "",
  valueApprox: "",
  currency: "RON",
};

export default function ItemForm({ mode = "create", initialValues, onSubmit }: Props) {
  const [values, setValues] = useState<ItemFormData>({
    ...DEFAULTS,
    ...(initialValues ?? {}),
    title: (initialValues?.title ?? DEFAULTS.title) as string,
    description: (initialValues?.description ?? DEFAULTS.description) as string,
    image_url: (initialValues?.image_url ?? DEFAULTS.image_url) as string,
    condition: (initialValues?.condition ?? DEFAULTS.condition) as string,
    locationCity: (initialValues?.locationCity ?? DEFAULTS.locationCity) as string,
    locationCountry: (initialValues?.locationCountry ?? DEFAULTS.locationCountry) as string,
    valueApprox: (initialValues?.valueApprox ?? DEFAULTS.valueApprox) as string,
    currency: (initialValues?.currency ?? DEFAULTS.currency) as string,
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return values.title.trim().length > 0 && !saving && !uploading;
  }, [values.title, saving, uploading]);

  function patch<K extends keyof ItemFormData>(key: K, val: ItemFormData[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleLocalFile(file: File) {
    setUploadError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      // IMPORTANT: numele câmpului "file" e cel mai frecvent folosit în route handlers
      fd.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          `Upload failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      // Acceptăm mai multe forme de răspuns, ca să nu “bâjbâim” iar:
      const url =
        (data && (data.url || data.secure_url)) ||
        (data && data.result && (data.result.url || data.result.secure_url));

      if (!url || typeof url !== "string") {
        throw new Error("Upload ok, dar nu am primit URL în răspuns.");
      }

      patch("image_url", url);
    } catch (e: any) {
      setUploadError(e?.message || "Eroare la upload.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError(null);
    setSaving(true);

    try {
      // Normalizare ușoară
      const payload: ItemFormData = {
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        image_url: values.image_url.trim(),
        locationCity: values.locationCity.trim(),
        locationCountry: values.locationCountry.trim(),
        valueApprox: values.valueApprox.trim(),
        currency: values.currency.trim() || "RON",
      };

      await onSubmit(payload);
    } catch (e: any) {
      setError(e?.message || "A apărut o eroare la salvare.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Titlu</label>
          <input
            value={values.title}
            onChange={(e) => patch("title", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="Ex: Laptop"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descriere</label>
          <textarea
            value={values.description}
            onChange={(e) => patch("description", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={4}
            placeholder="Detalii…"
          />
        </div>

        {/* Upload local + URL */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Imagine (upload local)
            </label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleLocalFile(f);
              }}
              disabled={uploading || saving}
            />
            <p className="mt-1 text-xs text-gray-500">
              Selectezi o poză locală → o urcăm și completăm automat câmpul URL.
            </p>

            {uploading ? (
              <p className="mt-2 text-sm text-gray-600">Se încarcă imaginea…</p>
            ) : null}

            {uploadError ? (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Imagine (URL)
            </label>
            <input
              value={values.image_url}
              onChange={(e) => patch("image_url", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="https://..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Merge și cu link extern. Pentru afișare corectă, ItemCard trebuie să folosească
              object-contain (fără crop).
            </p>
          </div>

          {/* Preview fără crop */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="flex h-56 items-center justify-center overflow-hidden rounded-md bg-white">
              {values.image_url ? (
                <img
                  src={values.image_url}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-sm text-gray-400">Preview imagine</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Condiție</label>
          <select
            value={values.condition}
            onChange={(e) => patch("condition", e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            <option value="Nou">Nou</option>
            <option value="Foarte bun">Foarte bun</option>
            <option value="Bun">Bun</option>
            <option value="Utilizat">Utilizat</option>
            <option value="Defect">Defect</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Oraș</label>
            <input
              value={values.locationCity}
              onChange={(e) => patch("locationCity", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: Tulcea"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Țară</label>
            <input
              value={values.locationCountry}
              onChange={(e) => patch("locationCountry", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: România"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Valoare (aprox.)</label>
            <input
              value={values.valueApprox}
              onChange={(e) => patch("valueApprox", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Ex: 1500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monedă</label>
            <input
              value={values.currency}
              onChange={(e) => patch("currency", e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="RON"
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Se salvează…" : mode === "edit" ? "Salvează" : "Creează"}
          </button>
        </div>
      </div>
    </div>
  );
}
