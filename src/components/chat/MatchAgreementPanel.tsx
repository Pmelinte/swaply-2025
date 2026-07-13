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
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAppState } from "@/lib/state";
import { createExchangeFromMatchAgreement } from "@/lib/chat/exchangeHandoff";
import {
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
>;

function toDraft(agreement: MatchConversationAgreement): AgreementDraft {
  return {
    condition_notes: agreement.condition_notes,
    offer_notes: agreement.offer_notes,
    logistics_method: agreement.logistics_method,
    logistics_notes: agreement.logistics_notes,
    additional_terms: agreement.additional_terms,
  };
}

export function MatchAgreementPanel({ agenda, disabled = false }: Props) {
  const t = useTranslations("matchAgreement");
  const router = useRouter();
  const { user } = useAppState();
  const [agreement, setAgreement] = useState(agenda.agreement);
  const [draft, setDraft] = useState<AgreementDraft>(() =>
    toDraft(agenda.agreement),
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
    setDraft(toDraft(agenda.agreement));
    setDirty(false);
    setSaveFailed(false);
    setExchangeFailed(false);
  }, [agenda.conversation_id, agenda.agreement.revision]);

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

  const selfConfirmed = Boolean(
    user?.id && agreement.confirmed_by.includes(user.id),
  );
  const partnerConfirmed = agreement.confirmed_by.some(
    (participantId) => participantId !== user?.id,
  );
  const bothConfirmed = selfConfirmed && partnerConfirmed;
  const hasContent = hasMatchConversationAgreementContent(agreement);
  const exchangeCreated = Boolean(exchangeSwapId);
  const controlsDisabled =
    disabled || savingAction !== null || creatingExchange || exchangeCreated;
  const canConfirm =
    !controlsDisabled &&
    !dirty &&
    agreement.revision > 0 &&
    hasContent;
  const canCreateExchange =
    bothConfirmed &&
    !dirty &&
    !disabled &&
    !savingAction &&
    !creatingExchange &&
    !exchangeCreated;

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

  async function runAction(action: MatchAgreementAction) {
    const supabase = getSupabaseClient();
    if (
      !supabase ||
      !user ||
      !agenda.conversation_id ||
      savingAction ||
      disabled ||
      exchangeCreated
    ) {
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
      if (action === "save") {
        setDraft(toDraft(nextAgenda.agreement));
        setDirty(false);
      }
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

      {saveFailed ? (
        <p
          role="alert"
          data-testid="match-agreement-save-error"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {t("saveError")}
        </p>
      ) : null}

      {exchangeFailed ? (
        <p
          role="alert"
          data-testid="match-agreement-exchange-error"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {t("exchangeError")}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          <span>{t("fields.condition")}</span>
          <textarea
            data-testid="match-agreement-condition"
            value={draft.condition_notes}
            maxLength={1000}
            rows={3}
            disabled={controlsDisabled}
            onChange={(event) =>
              updateDraft("condition_notes", event.target.value)
            }
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          <span>{t("fields.offer")}</span>
          <textarea
            data-testid="match-agreement-offer"
            value={draft.offer_notes}
            maxLength={1000}
            rows={3}
            disabled={controlsDisabled}
            onChange={(event) => updateDraft("offer_notes", event.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>

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

        <label className="space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
          <span>{t("fields.logisticsNotes")}</span>
          <textarea
            data-testid="match-agreement-logistics-notes"
            value={draft.logistics_notes}
            maxLength={1000}
            rows={3}
            disabled={controlsDisabled}
            onChange={(event) =>
              updateDraft("logistics_notes", event.target.value)
            }
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
        <span>{t("fields.additionalTerms")}</span>
        <textarea
          data-testid="match-agreement-additional"
          value={draft.additional_terms}
          maxLength={1500}
          rows={3}
          disabled={controlsDisabled}
          onChange={(event) =>
            updateDraft("additional_terms", event.target.value)
          }
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-normal text-zinc-900 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>

      <p className="mt-3 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
        {exchangeCreated ? t("lockedNotice") : t("resetNotice")}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="match-agreement-save"
          disabled={!dirty || controlsDisabled}
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
          {selfConfirmed ? t("status.youConfirmed") : t("status.youPending")}
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
        data-testid="match-agreement-overall-status"
        className={`mt-3 text-xs font-semibold ${
          bothConfirmed || exchangeCreated
            ? "text-emerald-800 dark:text-emerald-200"
            : "text-zinc-600 dark:text-zinc-300"
        }`}
      >
        {confirmationLabel}
      </p>

      {bothConfirmed || exchangeCreated ? (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-white p-3 dark:border-emerald-800 dark:bg-zinc-900">
          <p
            data-testid="match-agreement-exchange-ready"
            className="text-xs font-semibold text-emerald-900 dark:text-emerald-100"
          >
            {exchangeCreated ? t("exchangeReady") : t("exchangeCtaHint")}
          </p>
          <button
            type="button"
            data-testid={
              exchangeCreated
                ? "match-agreement-open-exchange"
                : "match-agreement-create-exchange"
            }
            disabled={!exchangeCreated && !canCreateExchange}
            onClick={() => void handleExchangeAction()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {creatingExchange ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {creatingExchange
              ? t("creatingExchange")
              : exchangeCreated
                ? t("openExchange")
                : t("createExchange")}
          </button>
        </div>
      ) : null}

      <p className="mt-2 text-[11px] leading-5 text-zinc-500 dark:text-zinc-400">
        {exchangeCreated ? t("exchangeCreatedNotice") : t("noSideEffects")}
      </p>
    </section>
  );
}
