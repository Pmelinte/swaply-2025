/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import type { LanguageCode } from "@/lib/types";
import { languageNames, type Locale } from "@/i18n/config";
import {
  isAtLeastSixteen,
  stepNumberFromStoredStep,
  type OnboardingProfileState,
} from "@/lib/profile/onboardingState";

interface FormState extends OnboardingProfileState {
  languages: string[];
  swap_context: string[];
  open_to_types: string[];
  affinity_groups: string[];
  interests: string[];
}

const EMPTY: FormState = {
  languages: [], swap_context: [], open_to_types: [], affinity_groups: [], interests: [],
};

export function ResumableOnboardingClient() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tp = useTranslations("profile");
  const tc = useTranslations("common");
  const { user, loading } = useAppState();
  const redirecting = useRef(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ ...EMPTY, languages: [locale] });
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading.auth && !user && !redirecting.current) {
      redirecting.current = true;
      window.location.href = `/${locale}/login?returnTo=/onboarding`;
    }
  }, [loading.auth, user, locale]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/onboarding/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load onboarding profile");
        return response.json() as Promise<{ profile: OnboardingProfileState }>;
      })
      .then(({ profile }) => {
        if (cancelled) return;
        if (profile.onboarding_completed) {
          redirecting.current = true;
          router.replace("/");
          return;
        }
        setForm({
          ...EMPTY,
          ...profile,
          languages: profile.languages?.length ? profile.languages : [locale],
          swap_context: profile.swap_context ?? [],
          open_to_types: profile.open_to_types ?? [],
          affinity_groups: profile.affinity_groups ?? [],
          interests: profile.interests ?? [],
        });
        setStep(stepNumberFromStoredStep(profile.onboarding_step));
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : tc("errorOccurred"));
      })
      .finally(() => { if (!cancelled) setHydrating(false); });
    return () => { cancelled = true; };
  }, [user, locale, router, tc]);

  const set = (key: keyof FormState, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const toggle = (key: "languages" | "swap_context" | "open_to_types", value: string) => {
    const values = form[key];
    set(key, values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const payloadForStep = (): Record<string, unknown> => {
    if (step === 1) return {
      display_name: form.display_name?.trim(), first_name: form.first_name?.trim() || null,
      avatar_url: form.avatar_url?.trim() || null, date_of_birth: form.date_of_birth,
    };
    if (step === 2) return {
      address_country: form.address_country, address_city: form.address_city?.trim() || null,
      location: { country: form.address_country, city: form.address_city?.trim() || null },
    };
    if (step === 3) return { languages: form.languages };
    if (step === 4) return {
      swap_geo_range: form.swap_geo_range || "regional", swap_context: form.swap_context,
      open_to_types: form.open_to_types, swap_intent: form.swap_intent || "open",
    };
    return {
      bio: form.bio?.trim() || null, affinity_groups: form.affinity_groups,
      interests: form.interests, occupation: form.occupation?.trim() || null,
    };
  };

  const validate = () => {
    if (step === 1) {
      if ((form.display_name?.trim().length ?? 0) < 2) return tp("displayNameRequired");
      if (!form.date_of_birth) return tp("dateOfBirthRequired");
      if (!isAtLeastSixteen(form.date_of_birth)) return tp("ageMinimum");
    }
    if (step === 2 && !form.address_country) return tp("countryRequired");
    if (step === 3 && form.languages.length === 0) return tp("languageRequired");
    return null;
  };

  const save = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/onboarding/profile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: payloadForStep(), currentStep: step, requestId: crypto.randomUUID() }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to save onboarding profile");
      if (step < 5) { setStep(step + 1); return; }
      const completion = await fetch("/api/onboarding/complete", { method: "POST" });
      const completionBody = await completion.json().catch(() => ({})) as { error?: string };
      if (!completion.ok) throw new Error(completionBody.error || "Unable to complete onboarding");
      redirecting.current = true;
      router.replace("/objects/new");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : tc("errorOccurred"));
    } finally { setSaving(false); }
  };

  if (loading.auth || hydrating) return <Loading label={tc("loading")} />;
  if (!user) return null;

  return <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between text-sm"><strong>{step}/5</strong><span>{t((["wizardStep1Title","wizardStep2Title","wizardStep3Title","wizardStep4Title","step5Title"] as const)[step - 1])}</span></div>
      <div className="mb-6 h-1 overflow-hidden rounded bg-zinc-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${step * 20}%` }} /></div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {step === 1 && <Identity form={form} set={set} t={t} tp={tp} />}
        {step === 2 && <Location form={form} set={set} t={t} />}
        {step === 3 && <Languages form={form} toggle={toggle} t={t} />}
        {step === 4 && <Preferences form={form} set={set} toggle={toggle} t={t} />}
        {step === 5 && <Interests form={form} set={set} t={t} tp={tp} />}
        <div className="mt-8 flex gap-3">
          {step > 1 && <button type="button" disabled={saving} onClick={() => setStep(step - 1)} className="flex-1 rounded-full border px-5 py-3 font-semibold disabled:opacity-50">{tc("back")}</button>}
          <button type="button" disabled={saving} onClick={save} className="flex-1 rounded-full bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? tc("saving") : step === 5 ? t("start") : tc("next")}</button>
        </div>
      </div>
    </div>
  </div>;
}

function Loading({ label }: { label: string }) { return <div className="flex min-h-screen flex-col items-center justify-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" /><p>{label}</p></div>; }
const inputClass = "mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:ring-2 focus:ring-blue-500";
function Identity({ form, set, t, tp }: any) { return <section className="space-y-5"><h1 className="text-2xl font-bold">{t("wizardStep1Title")}</h1><label className="block">{tp("displayName")} *<input className={inputClass} value={form.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} /></label><label className="block">{tp("firstName")}<input className={inputClass} value={form.first_name ?? ""} onChange={(e) => set("first_name", e.target.value)} /></label><label className="block">{tp("avatarUrl")}<input type="url" className={inputClass} value={form.avatar_url ?? ""} onChange={(e) => set("avatar_url", e.target.value)} /></label><label className="block">{t("dateOfBirthLabel")} *<input type="date" className={inputClass} value={form.date_of_birth ?? ""} onChange={(e) => set("date_of_birth", e.target.value)} /></label></section>; }
function Location({ form, set, t }: any) { return <section className="space-y-5"><h1 className="text-2xl font-bold">{t("wizardStep2Title")}</h1><label className="block">{t("countryLabel")} *<input className={inputClass} value={form.address_country ?? ""} onChange={(e) => set("address_country", e.target.value.toUpperCase().slice(0, 2))} placeholder="RO" /></label><label className="block">{t("cityLabel")}<input className={inputClass} value={form.address_city ?? ""} onChange={(e) => set("address_city", e.target.value)} placeholder={t("cityPlaceholder")} /></label></section>; }
function Languages({ form, toggle, t }: any) { const codes: LanguageCode[] = ["ro","en","fr","de","es","it","pt","nl","pl","el","hu","bg","cs","sk","hr","sl","sr","sv","da","fi","no","lt","lv","et","ru","tr","ar","zh","hi","ja","ko"]; return <section><h1 className="mb-5 text-2xl font-bold">{t("wizardStep3Title")}</h1><div className="flex flex-wrap gap-2">{codes.map((code) => <button type="button" key={code} onClick={() => toggle("languages", code)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${form.languages.includes(code) ? "bg-blue-600 text-white" : "bg-white"}`}>{languageNames[code as Locale]?.nativeName ?? code.toUpperCase()}</button>)}</div></section>; }
function Preferences({ form, set, toggle, t }: any) { return <section className="space-y-6"><h1 className="text-2xl font-bold">{t("wizardStep4Title")}</h1><Choice title={t("geoRangeLabel")} values={["local","regional","international","vacation"]} selected={form.swap_geo_range} onClick={(v: string) => set("swap_geo_range", v)} /><Choice title={t("swapContextLabel")} values={["permanent","vacation","temporary","urgent"]} selected={form.swap_context} onClick={(v: string) => toggle("swap_context", v)} /><Choice title={t("openToLabel")} values={["object","property","service","event"]} selected={form.open_to_types} onClick={(v: string) => toggle("open_to_types", v)} /><Choice title={t("intentLabel")} values={["exploring","open","clear","serious"]} selected={form.swap_intent} onClick={(v: string) => set("swap_intent", v)} /></section>; }
function Choice({ title, values, selected, onClick }: any) { return <div><h2 className="mb-2 font-semibold">{title}</h2><div className="flex flex-wrap gap-2">{values.map((value: string) => { const active = Array.isArray(selected) ? selected.includes(value) : selected === value; return <button type="button" key={value} onClick={() => onClick(value)} className={`rounded-full border px-3 py-2 text-sm capitalize ${active ? "bg-blue-600 text-white" : "bg-white"}`}>{value}</button>; })}</div></div>; }
function Interests({ form, set, t, tp }: any) { return <section className="space-y-5"><h1 className="text-2xl font-bold">{t("step5Title")}</h1><label className="block">{tp("bio")}<textarea className={inputClass} rows={4} maxLength={500} value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></label><label className="block">{t("interestsLabel")}<input className={inputClass} value={form.interests.join(", ")} onChange={(e) => set("interests", e.target.value.split(",").map((v: string) => v.trim()).filter(Boolean).slice(0, 10))} /></label><label className="block">{t("affinityLabel")}<input className={inputClass} value={form.affinity_groups.join(", ")} onChange={(e) => set("affinity_groups", e.target.value.split(",").map((v: string) => v.trim()).filter(Boolean).slice(0, 10))} /></label><label className="block">{t("occupationLabel")}<input className={inputClass} value={form.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} /></label></section>; }
