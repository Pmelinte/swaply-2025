"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { CheckCircle2 } from "lucide-react";
import {
  INITIAL_SERVICE_FORM,
  SERVICE_DRAFT_KEY,
} from "@/lib/wizard/serviceWizardStore";
import type { ServiceFormData } from "@/lib/wizard/serviceWizardStore";
import { submitServiceWizard } from "@/lib/wizard/serviceWizardSubmit";
import { updateDomainListing } from "@/lib/listings/domainListingMutationSubmit";
import { WizardProgress } from "@/components/wizard/shared/WizardProgress";
import { WizardNavButtons } from "@/components/wizard/shared/WizardNavButtons";
import { Step1ServiceType } from "./steps/Step1ServiceType";
import { Step2Description } from "./steps/Step2Description";
import { Step3Availability } from "./steps/Step3Availability";
import { Step4ExchangeTerms } from "./steps/Step4ExchangeTerms";
import { Step5Confirmation } from "./steps/Step5Confirmation";

const TOTAL_STEPS = 5;

const STEP_TITLE_KEYS = ["", "step1Title", "step2Title", "step3Title", "step4Title", "step5Title"] as const;

type ServiceWizardProps = {
  initialForm?: ServiceFormData;
  itemId?: string;
  initialRevision?: number;
  mode?: "create" | "edit";
};

function validateStep(step: number, form: ServiceFormData): string | null {
  if (step === 1) {
    if (!form.service_category_l1) return "Service category is required";
    if (!form.service_title.trim()) return "Title is required";
    if (!form.service_modality) return "Modality is required";
  }
  if (step === 2) {
    if (form.service_full_description.trim().length < 50) return "Description must be at least 50 characters";
    if (!form.experience_level) return "Experience level is required";
    if (!form.provider_type) return "Provider type is required";
  }
  if (step === 3) {
    if (form.availability_days.length === 0) return "Select at least one available day";
  }
  if (step === 4) {
    if (form.swap_for_type.length === 0) return "Select at least one swap type";
    if (!form.swap_wants_description.trim()) return "Describe what you want in return";
    if (!form.perceived_value_tier) return "Value tier is required";
  }
  if (step === 5) {
    if (!form.confirm_authorized) return "You must confirm you are authorized";
    if (!form.confirm_accurate) return "You must confirm the info is accurate";
    if (!form.confirm_terms) return "You must accept the Terms of Use";
  }
  return null;
}

export function ServiceWizard({
  initialForm,
  itemId,
  initialRevision,
  mode = "create",
}: ServiceWizardProps = {}) {
  const t = useTranslations("serviceWizard");
  const tc = useTranslations("common");
  const { user } = useAppState();
  const router = useRouter();
  const locale = useLocale();
  const isEdit = mode === "edit";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ServiceFormData>(() => ({
    ...INITIAL_SERVICE_FORM,
    ...initialForm,
  }));
  const [revision, setRevision] = useState(initialRevision ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isEdit) return;
    try {
      const raw = localStorage.getItem(SERVICE_DRAFT_KEY);
      if (raw) {
        const { step: savedStep, data } = JSON.parse(raw);
        if (data) setForm((prev) => ({ ...prev, ...data }));
        if (savedStep && savedStep > 1 && savedStep <= TOTAL_STEPS) setStep(savedStep);
      }
    } catch {
      // Ignore a corrupt draft.
    }
  }, [isEdit]);

  const updateForm = (updates: Partial<ServiceFormData>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      if (!isEdit) {
        try {
          localStorage.setItem(SERVICE_DRAFT_KEY, JSON.stringify({ step, data: next }));
        } catch {
          // Browser storage is optional.
        }
      }
      return next;
    });
  };

  const goToStep = (newStep: number) => {
    if (newStep >= 1 && newStep <= TOTAL_STEPS) {
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
    if (!isEdit) {
      try {
        localStorage.setItem(SERVICE_DRAFT_KEY, JSON.stringify({ step: step + 1, data: form }));
      } catch {
        // Browser storage is optional.
      }
    }
    goToStep(step + 1);
  };

  const handleBack = () => goToStep(step - 1);

  const handlePublish = async () => {
    const err = validateStep(5, form);
    if (err) {
      setError(err);
      return;
    }
    if (!user) return;
    if (isEdit && (!itemId || !initialRevision)) {
      setError(tc("errorOccurred"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let savedItemId = itemId;
      if (isEdit && itemId) {
        const result = await updateDomainListing({
          domain: "service",
          itemId,
          form,
          expectedRevision: revision,
        });
        savedItemId = result.itemId;
        setRevision(result.revision);
      } else {
        const data = await submitServiceWizard(form);
        localStorage.removeItem(SERVICE_DRAFT_KEY);
        savedItemId = data?.[0]?.id;
      }

      setSuccess(true);
      setTimeout(() => {
        if (savedItemId) router.push(`/${locale}/services/${savedItemId}`);
        else router.push(`/${locale}/services`);
      }, 900);
    } catch (publishError: unknown) {
      setError(
        isEdit
          ? tc("errorOccurred")
          : publishError instanceof Error
            ? publishError.message
            : tc("errorOccurred"),
      );
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
            {isEdit ? tc("success") : t("successTitle")}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isEdit ? tc("loading") : t("successMessage")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 dark:from-zinc-950 dark:to-slate-900 p-4">
      <div className="mx-auto w-full max-w-2xl">
        {isEdit && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
            {tc("edit")} · #{revision}
          </div>
        )}
        <WizardProgress
          step={step}
          totalSteps={TOTAL_STEPS}
          title={t(STEP_TITLE_KEYS[step])}
        />

        <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-700 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-950/30 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {step === 1 && <Step1ServiceType form={form} updateForm={updateForm} />}
          {step === 2 && <Step2Description form={form} updateForm={updateForm} />}
          {step === 3 && <Step3Availability form={form} updateForm={updateForm} />}
          {step === 4 && <Step4ExchangeTerms form={form} updateForm={updateForm} />}
          {step === 5 && <Step5Confirmation form={form} updateForm={updateForm} />}
        </div>

        <WizardNavButtons
          step={step}
          totalSteps={TOTAL_STEPS}
          loading={loading}
          onBack={handleBack}
          onNext={handleNext}
          onPublish={handlePublish}
          publishLabel={isEdit ? tc("save") : t("publishLabel")}
        />
      </div>
    </div>
  );
}
