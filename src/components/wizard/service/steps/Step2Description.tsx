"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useState } from "react";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";

interface Props {
  form: ServiceFormData;
  updateForm: (updates: Partial<ServiceFormData>) => void;
}

function Stepper({ value, min = 0, max = 50, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-8 w-8 rounded-full border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-lg leading-none transition"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-8 w-8 rounded-full border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-lg leading-none transition"
      >
        +
      </button>
    </div>
  );
}

function ToggleChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        selected
          ? "bg-blue-600 text-white"
          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
      }`}
    >
      {label}
    </button>
  );
}

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

const EXPERIENCE_LEVELS = [
  { emoji: "🌱", key: "levelBeginner", value: "Beginner" },
  { emoji: "🔧", key: "levelIntermediate", value: "Intermediate" },
  { emoji: "⭐", key: "levelExpert", value: "Expert" },
  { emoji: "🏆", key: "levelVeteran", value: "10+ years" },
];

const CERTIFICATIONS = [
  { key: "certLicensed", value: "Licensed" },
  { key: "certInsured", value: "Insured" },
  { key: "certBackground", value: "Background Check" },
  { key: "certProfessional", value: "Professional Certificate" },
  { key: "certIso", value: "ISO Certified" },
  { key: "certNone", value: "None" },
];

const LANGUAGES = ["English", "Romanian", "Spanish", "French", "German", "Italian", "Russian", "Ukrainian", "Polish", "Turkish", "Arabic", "Chinese"];

const PROVIDER_TYPES = [
  { emoji: "👤", key: "providerIndividual", value: "Individual" },
  { emoji: "💼", key: "providerFreelancer", value: "Freelancer" },
  { emoji: "🏪", key: "providerSmallBusiness", value: "Small Business" },
  { emoji: "🏢", key: "providerCompany", value: "Company" },
];

export function Step2Description({ form, updateForm }: Props) {
  const t = useTranslations("serviceWizard");
  const [newUrl, setNewUrl] = useState("");

  const addPortfolioUrl = () => {
    const trimmed = newUrl.trim();
    if (trimmed && !form.portfolio_urls.includes(trimmed)) {
      updateForm({ portfolio_urls: [...form.portfolio_urls, trimmed] });
      setNewUrl("");
    }
  };

  const removePortfolioUrl = (url: string) => {
    updateForm({ portfolio_urls: form.portfolio_urls.filter((u) => u !== url) });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("step2Subtitle")}</p>

      {/* Full description */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step2DescriptionLabel")} *
        </label>
        <textarea
          value={form.service_full_description}
          onChange={(e) => updateForm({ service_full_description: e.target.value })}
          placeholder={t("step2DescriptionPlaceholder")}
          rows={6}
          maxLength={3000}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {form.service_full_description.length}/3000 {t("step2MinChars")}
        </p>
      </div>

      {/* Experience years */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("step2ExperienceYearsLabel")}
        </label>
        <Stepper value={form.experience_years} min={0} max={50} onChange={(v) => updateForm({ experience_years: v })} />
      </div>

      {/* Experience level */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step2ExperienceLevelLabel")} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EXPERIENCE_LEVELS.map((lv) => (
            <button
              key={lv.value}
              type="button"
              onClick={() => updateForm({ experience_level: lv.value })}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                form.experience_level === lv.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-xl">{lv.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{t(lv.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step2CertificationsLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {CERTIFICATIONS.map((c) => (
            <ToggleChip
              key={c.value}
              label={t(c.key)}
              selected={form.certifications.includes(c.value)}
              onClick={() => updateForm({ certifications: toggleMulti(form.certifications, c.value) })}
            />
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step2LanguagesLabel")}
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <ToggleChip
              key={lang}
              label={lang}
              selected={form.languages_service.includes(lang)}
              onClick={() => updateForm({ languages_service: toggleMulti(form.languages_service, lang) })}
            />
          ))}
        </div>
      </div>

      {/* Portfolio URLs */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          {t("step2PortfolioUrlsLabel")}
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPortfolioUrl();
              }
            }}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={addPortfolioUrl}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            {t("addUrl")}
          </button>
        </div>
        {form.portfolio_urls.length > 0 && (
          <ul className="mt-2 space-y-1">
            {form.portfolio_urls.map((url) => (
              <li
                key={url}
                className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 px-3 py-1.5 text-xs dark:bg-zinc-800"
              >
                <span className="truncate text-zinc-700 dark:text-zinc-300">{url}</span>
                <button
                  type="button"
                  onClick={() => removePortfolioUrl(url)}
                  className="shrink-0 text-zinc-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Provider Type */}
      <div>
        <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
          {t("step2ProviderTypeLabel")} *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROVIDER_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => updateForm({ provider_type: pt.value })}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                form.provider_type === pt.value
                  ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
              }`}
            >
              <span className="text-xl">{pt.emoji}</span>
              <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50">{t(pt.key)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
