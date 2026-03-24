"use client";

import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Link2,
  Loader2,
  Lock,
  Play,
  XCircle,
} from "lucide-react";
import type { SwapChain, SwapChainStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  SwapChainStatus,
  { key: string; color: string; icon: typeof Clock }
> = {
  forming: { key: "statusForming", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200", icon: Clock },
  confirmed: { key: "statusConfirmed", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200", icon: CheckCircle2 },
  locked: { key: "statusLocked", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200", icon: Lock },
  in_progress: { key: "statusInProgress", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200", icon: Play },
  completed: { key: "statusCompleted", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200", icon: CheckCircle2 },
  cancelled: { key: "statusCancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200", icon: XCircle },
};

export function ChainVisualization({
  chain,
  currentUserId,
  onConfirmLink,
  onStartChain,
  onCompleteChain,
  onCancelChain,
}: {
  chain: SwapChain;
  currentUserId: string;
  onConfirmLink?: (chainId: string, linkId: string) => void;
  onStartChain?: (chainId: string) => void;
  onCompleteChain?: (chainId: string) => void;
  onCancelChain?: (chainId: string) => void;
}) {
  const t = useTranslations("chains");
  const status = STATUS_CONFIG[chain.status] ?? STATUS_CONFIG.forming;
  const StatusIcon = status.icon;
  const isInitiator = chain.initiatorId === currentUserId;
  const allConfirmed = chain.links.every((l) => l.confirmed);
  const sortedLinks = [...chain.links].sort((a, b) => a.position - b.position);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/90 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {chain.name}
          </h3>
          <span className="text-xs text-zinc-400">
            ({sortedLinks.length} {t("participants")})
          </span>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {t(status.key)}
        </span>
      </div>

      {/* Chain visualization */}
      <div className="p-4">
        <div className="space-y-0">
          {sortedLinks.map((link, idx) => {
            const isMyLink = link.giverId === currentUserId || link.receiverId === currentUserId;
            const canConfirm = chain.status === "forming" && !link.confirmed && isMyLink;

            return (
              <div key={link.id} className="relative">
                {/* Link row */}
                <div
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    isMyLink
                      ? "bg-violet-50 ring-1 ring-violet-200 dark:bg-violet-950/20 dark:ring-violet-800"
                      : ""
                  }`}
                >
                  {/* Position */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                    {idx + 1}
                  </span>

                  {/* Giver → Item → Receiver */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className={`truncate text-sm font-semibold ${isMyLink && link.giverId === currentUserId ? "text-violet-700 dark:text-violet-300" : "text-zinc-800 dark:text-zinc-200"}`}>
                      {link.giverName ?? link.giverId.slice(0, 8)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="truncate rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {link.itemTitle ?? link.itemId.slice(0, 8)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className={`truncate text-sm font-semibold ${isMyLink && link.receiverId === currentUserId ? "text-violet-700 dark:text-violet-300" : "text-zinc-800 dark:text-zinc-200"}`}>
                      {link.receiverName ?? link.receiverId.slice(0, 8)}
                    </span>
                  </div>

                  {/* Confirmation status */}
                  <div className="shrink-0">
                    {link.confirmed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        <Check className="h-3 w-3" />
                        {t("confirmed")}
                      </span>
                    ) : canConfirm ? (
                      <button
                        type="button"
                        onClick={() => onConfirmLink?.(chain.id, link.id)}
                        className="rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold text-white transition hover:bg-violet-700"
                      >
                        {t("confirmBtn")}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {t("waiting")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow between links */}
                {idx < sortedLinks.length - 1 && (
                  <div className="ml-5 flex h-4 items-center">
                    <div className="h-full w-px bg-zinc-300 dark:bg-zinc-600" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Chain complete indicator */}
          {sortedLinks.length >= 2 && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 dark:bg-green-950/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                {t("chainComplete")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-zinc-100 dark:border-zinc-800">
        {chain.status === "forming" && allConfirmed && isInitiator && onStartChain && (
          <button
            type="button"
            onClick={() => onStartChain(chain.id)}
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase text-violet-700 transition hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30"
          >
            <Lock className="h-3.5 w-3.5" />
            {t("lockAndStart")}
          </button>
        )}
        {(chain.status === "locked" || chain.status === "confirmed") && isInitiator && onStartChain && (
          <button
            type="button"
            onClick={() => onStartChain(chain.id)}
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase text-indigo-700 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
          >
            <Play className="h-3.5 w-3.5" />
            {t("startExecution")}
          </button>
        )}
        {chain.status === "in_progress" && isInitiator && onCompleteChain && (
          <button
            type="button"
            onClick={() => onCompleteChain(chain.id)}
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase text-green-700 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("markComplete")}
          </button>
        )}
        {chain.status !== "completed" && chain.status !== "cancelled" && onCancelChain && (
          <button
            type="button"
            onClick={() => onCancelChain(chain.id)}
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <XCircle className="h-3.5 w-3.5" />
            {t("cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
