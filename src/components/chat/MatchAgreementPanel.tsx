"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DomainAgreementTermsEditor } from "@/components/chat/DomainAgreementTermsEditor";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAppState } from "@/lib/state";
import { createExchangeFromMatchAgreement } from "@/lib/chat/exchangeHandoff";
import {
  buildDomainTermsFromContext,
  domainTermsAreComplete,
  type MatchAgreementContext,
  type MatchAgreementDomainTerm,
} from "@/lib/chat/domainAgreement";
import {
  fetchMatchAgreementContext,
  hasMatchConversationAgreementContent,
  updateMatchConversationAgreement,
  type MatchAgreementAction,
  type MatchAgreementLogisticsMethod,
  type MatchConversationAgendaState,
  type MatchConversationAgreement,
} from "@/lib/chat/chatQueries";

interface Props {
  agenda: MatchConversationAgendaState;
  disabled?: boolean;
}

type AgreementDraft = Pick<
  MatchConversationAgreement,
  | "condition_notes"
  | "offer_notes"
  | "logistics_method"
  | "logistics_notes"
  | "additional_terms"
  | "domain_terms"
>;

function toDraft(
  agreement: MatchConversationAgreement,
  context: MatchAgreementContext | null,
): AgreementDraft {
  return {
    condition_notes: agreement.condition_notes,
    offer_notes: agreement.offer_notes,
    logistics_method: agreement.logistics_method,
    logistics_notes: agreement.logistics_notes,
    additional_terms: agreement.additional_terms,
    domain_terms: buildDomainTermsFromContext(
      context,
      agreement.domain_terms,
    ),
  };
}

function isConfirmedForCurrentContent(
  agreement: MatchConversationAgreement,
  participantId: string,
): boolean {
  const confirmation = agreement.confirmations[participantId];
  return Boolean(
    agreement.confirmed_by.includes(participantId) &&
      agreement.revision > 0 &&
      agreement.content_hash &&
      confirmation?.revision === agreement.revision &&
      confirmation.content_hash === agreement.content_hash,
  );
}

export function MatchAgreementPanel({ agenda, disabled = false }: Props) {
  const t = useTranslations("matchAgreement");
  const router = useRouter();
  const { user } = useAppState();
  const [agreement, setAgreement] = useState(agenda.agreement);
  const [context, setContext] = useState<MatchAgreementContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextFailed, setContextFailed] = useState(false);
  const [draft, setDraft] = useState<AgreementDraft>(() =>
    toDraft(agenda.agreement, null),
  );
  const [dirty, setDirty] = useState(false);
  const [savingAction, setSavingAction] =
    useState<MatchAgreementAction | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [exchangeSwapId, setExchangeSwapId] = useState<string | null>(null);
  const [creatingExchange, setCreatingExchange] = useState(false);
  const [exchangeFailed, setExchangeFailed] = useState(false);

  useEffect(() => {
    setAgreement(agenda.agreement);
  }, [agenda.agreement]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !agenda.conversation_id) {
      setContext(null);
      setContextLoading(false);
      setContextFailed(true);
      return;
    }

    let cancelled = false;
    setContextLoading(true);
    setContextFailed(false);

    fetchMatchAgreementContext(supabase, agenda.conversation_id).then(
      (nextContext) => {
        if (cancelled) return;
        setContext(nextContext);
        setContextLoading(false);
        setContextFailed(!nextContext);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [agenda.conversation_id]);

  useEffect(() => {
    if (dirty) return;
    setDraft(toDraft(agenda.agreement, context));
    setSaveFailed(false);
    setExchangeFailed(false);
  }, [agenda.agreement, context, dirty]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !agenda.conversation_id) {
      setExchangeSwapId(null);
      return;
    }

    let cancelled = false;

    supabase
      .from("conversations")
      .select("swap_id")
      .eq("id", agenda.conversation_id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("MatchAgreementPanel Exchange lookup failed", error);
          return;
        }
        setExchangeSwapId(
          data && typeof data.swap_id === "string" ? data.swap_id : null,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [agenda.conversation_id, agenda.updated_at]);

  const validConfirmedIds = agreement.confirmed_by.filter((participantId) =>
    isConfirmedForCurrentContent(agreement, participantId),
  );
  const selfConfirmed = Boolean(
    user?.id && validConfirmedIds.includes(user.id),
  );
  const partnerConfirmed = validConfirmedIds.some(
    (participantId) => participantId !== user?.id,
  );
  const bothConfirmed =
    validConfirmedIds.length === 2 && selfConfirmed && partnerConfirmed;
  const hasContent = hasMatchConversationAgreementContent(agreement);
  const draftDomainTermsComplete = domainTermsAreComplete(
    context,
    draft.domain_terms,
  );
  const exchangeCreated = Boolean(exchangeSwapId);
  const controlsDisabled =
    disabled ||
    savingAction !== null ||
    creatingExchange ||
    exchangeCreated ||
    contextLoading ||
    contextFailed;
  const canSave = dirty && !controlsDisabled && draftDomainTermsComplete;
  const canConfirm =
    !controlsDisabled &&
    !dirty &&
    agreement.schema_version === "3.0" &&
    agreement.revision > 0 &&
    /^[a-f0-9]{64}$/.test(agreement.content_hash) &&
    hasContent &&
    domainTermsAreComplete(context, agreement.domain_terms);
  const canCreateExchange =
    bothConfirmed &&
    !dirty &&
    !disabled &&
    !savingAction &&
    !creatingExchange &&
    !exchangeCreated &&
    domainTermsAreComplete(context, agreement.domain_terms);

  const updateDraft = <Key extends keyof AgreementDraft>(
    key: Key,
    value: AgreementDraft[Key],
  ) => {
    if (exchangeCreated) return;
    setDraft((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
    setSaveFailed(false);
    setExchangeFailed(false);
  };

  function updateDomainTerms(nextTerms: MatchAgreementDomainTerm[]) {
    updateDraft("domain_terms", nextTerms);
  }

  async function runAction(action: MatchAgreementAction) {
    const supabase = getSupabaseClient();
    if (
      !supabase ||
      !user ||
      !agenda.conversation_id ||
      savingAction ||
      disabled ||
      exchangeCreated ||
      !context
    ) {
      return;
    }

    if (action === "save" && !draftDomainTermsComplete) {
      setSaveFailed(true);
      return;
    }

    setSavingAction(action);
    setSaveFailed(false);
    setExchangeFailed(false);

    try {
      const nextAgenda = await updateMatchConversationAgreement(supabase, {
        conversationId: agenda.conversation_id,
        action,
        expectedRevision: agreement.revision,
        agreement: action === "save" ? draft : undefined,
      });

      if (!nextAgenda) {
        setSaveFailed(true);
        return;
      }

      setAgreement(nextAgenda.agreement);
      setDraft(toDraft(nextAgenda.agreement, context));
      setDirty(false);
    } finally {
      setSavingAction(null);
    }
  }

  async function handleExchangeAction() {
    if (exchangeSwapId) {
      router.push(`/exchange/${exchangeSwapId}`);
      return;
    }

    const supabase = getSupabaseClient();
    if (
      !supabase ||
      !agenda.conversation_id ||
      !canCreateExchange
    ) {
      return;
    }

    setCreatingExchange(true);
    setExchangeFailed(false);

    try {
      const result = await createExchangeFromMatchAgreement(supabase, {
        conversationId: agenda.conversation_id,
        expectedRevision: agreement.revision,
      });

      if (!result) {
        setExchangeFailed(true);
        return;
      }

      setExchangeSwapId(result.swapId);
      router.push(`/exchange/${result.swapId}`);
    } finally {
      setCreatingExchange(false);
    }
  }

  const confirmationLabel = useMemo(() => {
    if (exchangeCreated) return t("status.exchangeCreated");
    if (bothConfirmed) return t("status.bothConfirmed");
    if (selfConfirmed) return t("status.youConfirmed");
    return t("status.awaitingYourConfirmation");
  }, [bothConfirmed, exchangeCreated, selfConfirmed, t]);

  return (
    <section
      data-testid="match-agreement-panel"
      className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h4>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600 dark:text-zinc-300">
            {t("description")}
          </p>
        </div>
        <span
          data-testid="match-agreement-revision"
          className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm dark:bg-zinc-900 dark:text-emerald-200"
        >
          {t("revision", { revision: agreement.revision })}
        </span>
      </div>

      {(saveFailed || contextFailed) && (
        <p
          role="alert"
          data-testid="match-agreement-save-error"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {t("saveError")}
        </p>
      )}

      {exchangeFailed && (
        <p
          role="alert"
          data-testid="match-agreement-exchange-error"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {t("exchangeError")}
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AgreementTextarea
          testId="match-agreement-condition"
          label={t("fields.condition")}
          value={draft.condition_notes}
          maxLength={1000}
          disabled={controlsDisabled}
          onChange={(value) => updateDraft("condition_notes", value)}
        />
        <AgreementTextarea
          testId="match-agreement-offer"
          label={t("fields.offer")}
          value={draft.offer_notes}
          maxLength={1000}
          disabled={controlsDisabled}
          onChange={(value) => updateDraft("offer_notes", value)}
        />

        <label className="space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          <span>{t("fields.logisticsMethod")}</span>
          <select
            data-testid="match-agreement-logistics-method"
            value={draft.logistics_method ?? ""}
            disabled={controlsDisabled}
            onChange={(event) =>
              updateDraft(
                "logistics_method",
                (event.target.value || null) as MatchAgreementLogisticsMethod | null,
              )
            }
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          >
            <option value="">{t("logistics.undecided")}</option>
            <option value="local_handover">{t("logistics.local")}</option>
            <option value="national_courier">{t("logistics.national")}</option>
            <option value="international_courier">
              {t("logistics.international")}
            </option>
            <option value="other">{t("logistics.other")}</option>
          </select>
        </label>

        <AgreementTextarea
          testId="match-agreement-logistics-notes"
          label={t("fields.logisticsNotes")}
          value={draft.logistics_notes}
          maxLength={1000}
          disabled={controlsDisabled}
          onChange={(value) => updateDraft("logistics_notes", value)}
        />
      </div>

      <div className="mt-4">
        <AgreementTextarea
          testId="match-agreement-additional"
          label={t("fields.additionalTerms")}
          value={draft.additional_terms}
          maxLength={1500}
          disabled={controlsDisabled}
          onChange={(value) => updateDraft("additional_terms", value)}
        />
      </div>

      {contextLoading ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("saving")}
        </div>
      ) : context ? (
        <DomainAgreementTermsEditor
          context={context}
          terms={draft.domain_terms}
          disabled={controlsDisabled}
          onChange={updateDomainTerms}
        />
      ) : null}

      <p className="mt-3 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
        {exchangeCreated ? t("lockedNotice") : t("resetNotice")}
      </p>

      {!draftDomainTermsComplete && context && !exchangeCreated && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {t("description")}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="match-agreement-save"
          disabled={!canSave}
          onClick={() => void runAction("save")}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-200"
        >
          <Save className="h-4 w-4" />
          {savingAction === "save" ? t("saving") : t("save")}
        </button>

        {!exchangeCreated && selfConfirmed ? (
          <button
            type="button"
            data-testid="match-agreement-withdraw"
            disabled={disabled || savingAction !== null || creatingExchange}
            onClick={() => void runAction("withdraw")}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <RotateCcw className="h-4 w-4" />
            {savingAction === "withdraw" ? t("saving") : t("withdraw")}
          </button>
        ) : !exchangeCreated ? (
          <button
            type="button"
            data-testid="match-agreement-confirm"
            disabled={!canConfirm}
            onClick={() => void runAction("confirm")}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            {savingAction === "confirm" ? t("saving") : t("confirm")}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div
          data-testid="match-agreement-self-status"
          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
            selfConfirmed
              ? "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          {selfConfirmed
            ? t("status.youConfirmed")
            : t("status.youPending")}
        </div>
        <div
          data-testid="match-agreement-partner-status"
          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
            partnerConfirmed
              ? "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          {partnerConfirmed
            ? t("status.partnerConfirmed")
            : t("status.partnerPending")}
        </div>
      </div>

      <p
        data-testid="match-agreement-status"
        className="mt-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200"
      >
        {confirmationLabel}
      </p>

      <p className="mt-2 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
        {t("noSideEffects")}
      </p>

      {(bothConfirmed || exchangeCreated) && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
            {exchangeCreated ? t("exchangeReady") : t("exchangeCtaHint")}
          </p>
          {exchangeCreated && (
            <p className="mt-1 text-[11px] leading-5 text-blue-700 dark:text-blue-300">
              {t("exchangeCreatedNotice")}
            </p>
          )}
          <button
            type="button"
            data-testid="match-agreement-create-exchange"
            disabled={!exchangeCreated && !canCreateExchange}
            onClick={() => void handleExchangeAction()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {creatingExchange ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : exchangeCreated ? (
              <ArrowRight className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {creatingExchange
              ? t("creatingExchange")
              : exchangeCreated
                ? t("openExchange")
                : t("createExchange")}
          </button>
        </div>
      )}
    </section>
  );
}

function AgreementTextarea({
  testId,
  label,
  value,
  maxLength,
  disabled,
  onChange,
}: {
  testId: string;
  label: string;
  value: string;
  maxLength: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
      <span>{label}</span>
      <textarea
        data-testid={testId}
        value={value}
        maxLength={maxLength}
        rows={3}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
      />
    </label>
  );
}
