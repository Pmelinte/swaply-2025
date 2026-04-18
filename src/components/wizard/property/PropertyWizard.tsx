"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { INITIAL_FORM, DRAFT_STORAGE_KEY } from "@/lib/wizard/propertyWizardStore";
import type { PropertyFormData } from "@/lib/wizard/propertyWizardStore";
import { submitPropertyWizard } from "@/lib/wizard/propertyWizardSubmit";
import { PropertyWizardProgress } from "./PropertyWizardProgress";
import { Step1TypeClassification } from "./steps/Step1TypeClassification";
import { Step2Location } from "./steps/Step2Location";
import { Step3Structure } from "./steps/Step3Structure";
import { Step4Amenities } from "./steps/Step4Amenities";
import { Step5Utilities } from "./steps/Step5Utilities";
import { Step6ExchangeTerms } from "./steps/Step6ExchangeTerms";
import { Step7Rules } from "./steps/Step7Rules";
import { Step8Confirmation } from "./steps/Step8Confirmation";

const WIZARD_STEPS = 8;

function validateStep(step: number, form: PropertyFormData): string | null {
  if (step === 1) {
    if (!form.property_type) return "Property type is required";
    if (!form.property_category) return "Property category is required";
  }
  if (step === 2) {
    if (!form.country) return "Country is required";
    if (!form.city) return "City is required";
  }
  if (step === 3) {
    if (!form.total_area_sqm) return "Total area is required";
  }
  if (step === 4) {
    if (!form.furnishing_level) return "Furnishing level is required";
  }
  if (step === 6) {
    if (!form.exchange_type) return "Exchange type is required";
    if (!form.desired_exchange_description.trim())
      return "Please describe what you are looking for in return";
  }
  if (step === 7) {
    if (!form.check_in_time) return "Check-in time is required";
    if (!form.check_out_time) return "Check-out time is required";
    if (form.cctv_present && !form.cctv_disclosure.trim())
      return "CCTV disclosure is required (GDPR)";
  }
  if (step === 8) {
    if (!form.confirm_vacation_only) return "You must confirm vacation-only use";
    if (!form.confirm_accurate_info) return "You must confirm the information is accurate";
    if (!form.confirm_terms) return "You must accept the Terms of Use";
  }
  return null;
}

export function PropertyWizard() {
  const t = useTranslations("propertyWizard");
  const { user } = useAppState();
  const router = useRouter();
  const locale = useLocale();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PropertyFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const { step: savedStep, data } = JSON.parse(raw);
        if (data) setForm((prev) => ({ ...prev, ...data }));
        if (savedStep && savedStep > 1 && savedStep <= WIZARD_STEPS) setStep(savedStep);
      }
    } catch {
      // ignore corrupt draft
    }
  }, []);

  const updateForm = (updates: Partial<PropertyFormData>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      // Persist draft
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ step, data: next }));
      } catch {/* quota exceeded — ignore */}
      return next;
    });
  };

  const goToStep = (newStep: number) => {
    if (newStep >= 1 && newStep <= WIZARD_STEPS) {
      setStep(newStep);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    const err = validateStep(step, form);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    // Save progress with updated step
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ step: step + 1, data: form }));
    } catch {/* ignore */}
    goToStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    goToStep(step - 1);
  };

  const handlePublish = async () => {
    const err = validateStep(8, form);
    if (err) {
      setError(err);
      return;
    }
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await submitPropertyWizard(form, user.id);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setSuccess(true);
      const itemId = data?.[0]?.id;
      setTimeout(() => {
        if (itemId) {
          router.push(`/${locale}/properties/${itemId}`);
        } else {
          router.push(`/${locale}/properties`);
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save property. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 p-4 dark:from-zinc-950 dark:to-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-700 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("step8Success")}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("step8SuccessMessage")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 dark:from-zinc-950 dark:to-slate-900 p-4">
      <div className="mx-auto w-full max-w-2xl">
        <PropertyWizardProgress step={step} />

        {/* Card */}
        <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-700 space-y-6">
          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-950/30 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Steps */}
          {step === 1 && <Step1TypeClassification form={form} updateForm={updateForm} />}
          {step === 2 && <Step2Location form={form} updateForm={updateForm} />}
          {step === 3 && <Step3Structure form={form} updateForm={updateForm} />}
          {step === 4 && <Step4Amenities form={form} updateForm={updateForm} />}
          {step === 5 && <Step5Utilities form={form} updateForm={updateForm} />}
          {step === 6 && <Step6ExchangeTerms form={form} updateForm={updateForm} />}
          {step === 7 && <Step7Rules form={form} updateForm={updateForm} />}
          {step === 8 && <Step8Confirmation form={form} updateForm={updateForm} />}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </button>

          {step < WIZARD_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  ✅ {t("publish")}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
