"use client";

import { useLocale } from "next-intl";
import { SectionCard } from "@/components/ui-custom";
import type { UserProfile } from "@/lib/types";
import {
  getGlobalProfileContract,
} from "@/lib/profile/userProfilePersistence";
import type {
  GlobalProfileContract,
  ProfileAvailabilityStatus,
  ProfileUserType,
} from "@/lib/profile/profileContract";
import type { GlobalUserProfile } from "@/lib/profile/profileTypes";

interface GlobalProfileSettingsCardProps {
  draft: UserProfile;
  update: (partial: Partial<UserProfile>) => void;
}

const labels = {
  ro: {
    title: "Contract global de profil",
    description: "Setări comune pentru toate domeniile Swaply. Fusul orar rămâne privat.",
    userType: "Tip utilizator",
    individual: "Persoană",
    professional: "Profesional",
    organization: "Organizație",
    availability: "Disponibilitate generală",
    available: "Disponibil",
    limited: "Limitată",
    away: "Indisponibil temporar",
    timezone: "Fus orar privat",
    detectTimezone: "Detectează automat",
    publicFields: "Câmpuri publice opționale",
    publicFieldsDescription: "Aceste date apar în profilul public numai când le activezi explicit.",
    showBio: "Arată biografia",
    showInterests: "Arată interesele și grupurile de afinitate",
    showOccupation: "Arată ocupația",
    showWebsite: "Arată site-ul",
    showSocialLinks: "Arată legăturile sociale",
  },
  en: {
    title: "Global profile contract",
    description: "Shared settings for every Swaply domain. Your timezone remains private.",
    userType: "User type",
    individual: "Individual",
    professional: "Professional",
    organization: "Organization",
    availability: "General availability",
    available: "Available",
    limited: "Limited",
    away: "Temporarily away",
    timezone: "Private timezone",
    detectTimezone: "Detect automatically",
    publicFields: "Optional public fields",
    publicFieldsDescription: "These fields appear publicly only after explicit consent.",
    showBio: "Show biography",
    showInterests: "Show interests and affinity groups",
    showOccupation: "Show occupation",
    showWebsite: "Show website",
    showSocialLinks: "Show social links",
  },
} as const;

export default function GlobalProfileSettingsCard({
  draft,
  update,
}: GlobalProfileSettingsCardProps) {
  const locale = useLocale();
  const text = locale === "ro" ? labels.ro : labels.en;
  const contract = getGlobalProfileContract(draft, locale);

  const applyContract = (next: GlobalProfileContract) => {
    update({
      visibility: {
        ...draft.visibility,
        publicProfile: next.visibility.publicProfile,
        itemsVisibility: next.visibility.itemsVisibility,
        showExactLocation: next.visibility.showExactLocation,
        showLastSeen: next.visibility.showLastSeen,
      },
      globalProfile: next,
      profileRevision: next.revision,
    } as Partial<GlobalUserProfile>);
  };

  const updateVisibility = (
    key: keyof GlobalProfileContract["visibility"],
    value: boolean,
  ) => {
    applyContract({
      ...contract,
      visibility: {
        ...contract.visibility,
        [key]: value,
      },
    });
  };

  return (
    <SectionCard title={text.title} description={text.description}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {text.userType}
          <select
            value={contract.userType}
            onChange={(event) => applyContract({
              ...contract,
              userType: event.target.value as ProfileUserType,
            })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="individual">{text.individual}</option>
            <option value="professional">{text.professional}</option>
            <option value="organization">{text.organization}</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {text.availability}
          <select
            value={contract.availabilityStatus}
            onChange={(event) => applyContract({
              ...contract,
              availabilityStatus: event.target.value as ProfileAvailabilityStatus,
            })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="available">{text.available}</option>
            <option value="limited">{text.limited}</option>
            <option value="away">{text.away}</option>
          </select>
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {text.timezone}
          <input
            value={contract.timezone}
            onChange={(event) => applyContract({
              ...contract,
              timezone: event.target.value,
            })}
            placeholder="Europe/Bucharest"
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (detected) applyContract({ ...contract, timezone: detected });
          }}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-200"
        >
          {text.detectTimezone}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {text.publicFields}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {text.publicFieldsDescription}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {([
            ["showBio", text.showBio],
            ["showInterests", text.showInterests],
            ["showOccupation", text.showOccupation],
            ["showWebsite", text.showWebsite],
            ["showSocialLinks", text.showSocialLinks],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={contract.visibility[key]}
                onChange={(event) => updateVisibility(key, event.target.checked)}
                className="mt-0.5"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
