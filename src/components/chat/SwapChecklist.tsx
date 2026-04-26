"use client";

import { useTranslations } from "next-intl";
import { CheckSquare } from "lucide-react";
import { AGENDA_ITEMS, agendaProgress } from "@/lib/chat/chatAgenda";
import type { AgendaState, AgendaStatus } from "@/lib/chat/chatAgenda";

interface Props {
  agendaState: AgendaState;
  myRole: "userA" | "userB";
  partnerName: string;
  onToggle: (key: string, nextStatus: AgendaStatus) => void;
  onContinueLater?: () => void;
  onGoToExchange?: () => void;
}

const GROUP_ORDER = ["items", "exchange", "bilateral", "individual", "final"] as const;
const GROUP_LABELS: Record<string, string> = {
  items: "Items",
  exchange: "Exchange",
  bilateral: "Bilateral Agreement",
  individual: "Individual",
  final: "Final",
};

type CheckState = "none" | "one" | "both";

function checkState(
  agendaState: AgendaState,
  key: string,
  myRole: "userA" | "userB",
  bilateral: boolean,
): CheckState {
  const item = agendaState[key];
  if (!item) return "none";
  if (!bilateral) return item[myRole] === "agreed" ? "both" : "none";
  const aOk = item.userA === "agreed";
  const bOk = item.userB === "agreed";
  if (aOk && bOk) return "both";
  if (aOk || bOk) return "one";
  return "none";
}

function toggleNext(current: AgendaStatus): AgendaStatus {
  return current === "agreed" ? "unchecked" : "agreed";
}

export function SwapChecklist({
  agendaState,
  myRole,
  partnerName,
  onToggle,
  onContinueLater,
  onGoToExchange,
}: Props) {
  const t = useTranslations("chat.agenda");
  const { agreed, total } = agendaProgress(agendaState);

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-zinc-900">Swap Checklist</span>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          {agreed}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 px-4 pt-2 pb-0">
        <div className="h-1 w-full rounded-full bg-zinc-100">
          <div
            className="h-1 rounded-full bg-blue-500 transition-all"
            style={{ width: `${total > 0 ? (agreed / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-4">
          {GROUP_ORDER.map((group) => {
            const items = AGENDA_ITEMS.filter((i) => i.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {GROUP_LABELS[group]}
                </p>
                <div className="space-y-1.5">
                  {items.map((item) => {
                    const myStatus = agendaState[item.key]?.[myRole] ?? "unchecked";
                    const state = checkState(agendaState, item.key, myRole, item.bilateral);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onToggle(item.key, toggleNext(myStatus))}
                        className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                          state === "both"
                            ? "border-green-200 bg-green-50"
                            : state === "one"
                              ? "border-blue-200 bg-blue-50"
                              : "border-zinc-100 bg-white hover:bg-zinc-50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 shrink-0 text-sm leading-none ${
                            state === "both"
                              ? "text-green-600"
                              : state === "one"
                                ? "text-blue-500"
                                : "text-zinc-400"
                          }`}
                        >
                          {state === "both" ? "✅" : state === "one" ? "🔵" : "☐"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium leading-tight ${
                              state === "both"
                                ? "text-green-700 line-through"
                                : "text-zinc-700"
                            }`}
                          >
                            {t(item.labelKey)}
                          </p>
                          {item.bilateral && state === "one" && (
                            <p className="mt-0.5 text-[10px] text-blue-500">
                              Waiting for @{partnerName}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 space-y-2 border-t border-zinc-100 p-3">
        <button
          type="button"
          onClick={onContinueLater}
          className="w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          Continue later
        </button>
        <button
          type="button"
          onClick={onGoToExchange}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          → Swaply
        </button>
      </div>
    </div>
  );
}
