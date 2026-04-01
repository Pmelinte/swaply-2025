"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { Link } from "@/i18n/navigation";
import { SectionCard, Pill } from "@/components/ui-custom";
import type { SwapIntent, Conversation } from "@/lib/types";
import {
  ClipboardList,
  ArrowRightLeft,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Star,
  MessageCircle,
  ExternalLink,
  Package,
  Truck,
  Calendar,
} from "lucide-react";

/* ── Helpers ── */

interface DeskTask {
  id: string;
  type: "confirm_logistics" | "leave_review" | "respond_proposal" | "confirm_receipt" | "start_swap";
  labelKey: string;
  labelParams?: Record<string, string | number>;
  actionKey: string;
  href: string;
  urgency: "high" | "medium" | "low";
  deadline?: string;
}

interface DeskDeadline {
  id: string;
  labelKey: string;
  labelParams?: Record<string, string | number>;
  date: string;
  href: string;
}

function buildTasks(swaps: SwapIntent[], userId: string, items: { id: string; title: string }[]): DeskTask[] {
  const tasks: DeskTask[] = [];
  const itemTitle = (id: string) => items.find((i) => i.id === id)?.title ?? "—";

  for (const swap of swaps) {
    const isRequester = swap.requesterId === userId;
    const partnerName = isRequester ? "responder" : "requester";

    // Pending proposals needing response
    if (swap.status === "pending" && !isRequester) {
      tasks.push({
        id: `respond-${swap.id}`,
        type: "respond_proposal",
        labelKey: "taskRespondProposal",
        labelParams: { item: itemTitle(swap.responderItemId) },
        actionKey: "actionRespond",
        href: `/change?swap=${swap.id}`,
        urgency: "high",
        deadline: swap.createdAt ? new Date(new Date(swap.createdAt).getTime() + 72 * 3600000).toISOString() : undefined,
      });
    }

    // Accepted — need to confirm logistics / start swap
    if (swap.status === "accepted") {
      if (!swap.logistics.meetupPoint && !swap.logistics.courierTracking) {
        tasks.push({
          id: `logistics-${swap.id}`,
          type: "confirm_logistics",
          labelKey: "taskConfirmLogistics",
          labelParams: { item: itemTitle(isRequester ? swap.requesterItemId : swap.responderItemId) },
          actionKey: "actionConfirmLogistics",
          href: `/change?swap=${swap.id}`,
          urgency: "medium",
        });
      }
    }

    // In progress — confirm receipt
    if (swap.status === "delivered_by_a" || swap.status === "delivered_by_b") {
      const needsConfirm =
        (swap.status === "delivered_by_a" && !isRequester && !swap.responderConfirmed) ||
        (swap.status === "delivered_by_b" && isRequester && !swap.requesterConfirmed);
      if (needsConfirm) {
        tasks.push({
          id: `confirm-${swap.id}`,
          type: "confirm_receipt",
          labelKey: "taskConfirmReceipt",
          labelParams: { item: itemTitle(isRequester ? swap.responderItemId : swap.requesterItemId) },
          actionKey: "actionConfirmReceipt",
          href: `/change?swap=${swap.id}`,
          urgency: "high",
        });
      }
    }

    // Completed without feedback
    if (swap.status === "completed" && !swap.feedback) {
      tasks.push({
        id: `review-${swap.id}`,
        type: "leave_review",
        labelKey: "taskLeaveReview",
        labelParams: { item: itemTitle(isRequester ? swap.responderItemId : swap.requesterItemId) },
        actionKey: "actionLeaveReview",
        href: `/change?swap=${swap.id}`,
        urgency: "low",
      });
    }
  }

  // Sort by urgency
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  tasks.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return tasks;
}

function buildDeadlines(swaps: SwapIntent[], userId: string, items: { id: string; title: string }[]): DeskDeadline[] {
  const deadlines: DeskDeadline[] = [];
  const itemTitle = (id: string) => items.find((i) => i.id === id)?.title ?? "—";
  const now = Date.now();

  for (const swap of swaps) {
    const isRequester = swap.requesterId === userId;

    // Pending proposals expire in 72h
    if (swap.status === "pending" && swap.createdAt) {
      const expiresAt = new Date(new Date(swap.createdAt).getTime() + 72 * 3600000);
      if (expiresAt.getTime() > now) {
        deadlines.push({
          id: `expire-${swap.id}`,
          labelKey: "deadlineProposalExpires",
          labelParams: { item: itemTitle(isRequester ? swap.requesterItemId : swap.responderItemId) },
          date: expiresAt.toISOString(),
          href: `/change?swap=${swap.id}`,
        });
      }
    }

    // Meeting points as deadlines
    if (swap.logistics.meetupPoint && (swap.status === "accepted" || swap.status === "in_progress")) {
      deadlines.push({
        id: `meetup-${swap.id}`,
        labelKey: "deadlineMeetup",
        labelParams: { location: swap.logistics.meetupPoint },
        date: swap.updatedAt ?? swap.createdAt ?? new Date().toISOString(),
        href: `/change?swap=${swap.id}`,
      });
    }

    // Courier tracking as deadlines
    if (swap.logistics.courierTracking && swap.status === "in_progress") {
      deadlines.push({
        id: `courier-${swap.id}`,
        labelKey: "deadlineCourier",
        labelParams: { tracking: swap.logistics.courierTracking },
        date: swap.updatedAt ?? new Date().toISOString(),
        href: `/change?swap=${swap.id}`,
      });
    }
  }

  deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return deadlines;
}

function getSwapConversations(conversations: Conversation[], swaps: SwapIntent[], userId: string): Conversation[] {
  // Conversations with participants who are involved in active swaps
  const swapPartnerIds = new Set<string>();
  for (const s of swaps) {
    if (["pending", "accepted", "in_progress", "delivered_by_a", "delivered_by_b"].includes(s.status)) {
      if (s.requesterId === userId) swapPartnerIds.add(s.responderId);
      else swapPartnerIds.add(s.requesterId);
    }
  }
  return conversations.filter((c) => swapPartnerIds.has(c.participantId));
}

const ACTIVE_STATUSES = new Set(["pending", "accepted", "in_progress", "delivered_by_a", "delivered_by_b"]);

/* ── Urgency badge helper ── */
function UrgencyDot({ urgency }: { urgency: "high" | "medium" | "low" }) {
  const colors = {
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-blue-400",
  };
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors[urgency]}`} />;
}

/* ── Time formatting ── */
function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "—";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/* ── Status color ── */
function statusColor(status: SwapIntent["status"]): "green" | "blue" | "amber" | "red" | "zinc" {
  switch (status) {
    case "completed": return "green";
    case "in_progress":
    case "delivered_by_a":
    case "delivered_by_b": return "blue";
    case "pending":
    case "accepted": return "amber";
    case "disputed": return "red";
    default: return "zinc";
  }
}

/* ── Main component ── */

export function DeskClient() {
  const t = useTranslations("desk");
  const { user, swaps, items, conversations } = useAppState();

  const activeSwaps = useMemo(
    () => swaps.filter((s) => ACTIVE_STATUSES.has(s.status)),
    [swaps],
  );

  const recentCompleted = useMemo(
    () => swaps.filter((s) => s.status === "completed" && !s.feedback),
    [swaps],
  );

  const allRelevant = useMemo(
    () => [...activeSwaps, ...recentCompleted],
    [activeSwaps, recentCompleted],
  );

  const tasks = useMemo(
    () => (user ? buildTasks(allRelevant, user.id, items) : []),
    [allRelevant, user, items],
  );

  const deadlines = useMemo(
    () => (user ? buildDeadlines(allRelevant, user.id, items) : []),
    [allRelevant, user, items],
  );

  const swapConversations = useMemo(
    () => (user ? getSwapConversations(conversations, swaps, user.id) : []),
    [conversations, swaps, user],
  );

  const pendingCount = tasks.filter((t) => t.urgency === "high").length;

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <ClipboardList className="mx-auto mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
        <p className="text-zinc-500 dark:text-zinc-400">{t("loginRequired")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── TASKS ── */}
        <SectionCard
          title={t("tasksTitle")}
          description={t("tasksDescription", { count: tasks.length })}
          action={
            pendingCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                <AlertTriangle className="h-3 w-3" />
                {pendingCount}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("allClear")}
              </span>
            )
          }
        >
          {tasks.length === 0 ? (
            <p className="py-4 text-center text-zinc-400 dark:text-zinc-500">{t("noTasks")}</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3 py-2.5">
                  <UrgencyDot urgency={task.urgency} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      {t(task.labelKey, task.labelParams)}
                    </p>
                    {task.deadline && (
                      <p className="text-xs text-zinc-400">{timeLeft(task.deadline)} {t("remaining")}</p>
                    )}
                  </div>
                  <Link
                    href={task.href}
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                  >
                    {t(task.actionKey)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ── ACTIVE SWAPS ── */}
        <SectionCard
          title={t("activeSwapsTitle")}
          description={t("activeSwapsDescription", { count: activeSwaps.length })}
          action={
            <Link href="/change" className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t("viewAll")}
            </Link>
          }
        >
          {activeSwaps.length === 0 ? (
            <p className="py-4 text-center text-zinc-400 dark:text-zinc-500">{t("noActiveSwaps")}</p>
          ) : (
            <ul className="space-y-3">
              {activeSwaps.map((swap) => {
                const myItem = items.find((i) => i.id === (swap.requesterId === user.id ? swap.requesterItemId : swap.responderItemId));
                const theirItem = items.find((i) => i.id === (swap.requesterId === user.id ? swap.responderItemId : swap.requesterItemId));
                return (
                  <li key={swap.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
                    <div className="flex items-start gap-3">
                      {/* Photos placeholder */}
                      <div className="flex -space-x-2">
                        {[myItem, theirItem].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white bg-zinc-200 text-xs font-bold text-zinc-500 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-300"
                          >
                            {item?.photos?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.photos[0]} alt="" className="h-full w-full rounded-lg object-cover" />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                          {myItem?.title ?? "—"} <ArrowRightLeft className="inline h-3 w-3 text-zinc-400" /> {theirItem?.title ?? "—"}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <Pill color={statusColor(swap.status)}>
                            {t(`status_${swap.status}`)}
                          </Pill>
                          {swap.logistics.courierTracking && (
                            <span className="flex items-center gap-1 text-xs text-zinc-400">
                              <Truck className="h-3 w-3" />
                              {swap.logistics.courierTracking}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Link
                          href={`/change?swap=${swap.id}`}
                          className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                        >
                          <ExternalLink className="inline h-3 w-3" /> {t("open")}
                        </Link>
                        <Link
                          href={`/chat?to=${swap.requesterId === user.id ? swap.responderId : swap.requesterId}`}
                          className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                        >
                          <MessageCircle className="inline h-3 w-3" /> {t("chat")}
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* ── DEADLINES ── */}
        <SectionCard
          title={t("deadlinesTitle")}
          description={t("deadlinesDescription")}
        >
          {deadlines.length === 0 ? (
            <p className="py-4 text-center text-zinc-400 dark:text-zinc-500">{t("noDeadlines")}</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {deadlines.map((dl) => (
                <li key={dl.id} className="flex items-center gap-3 py-2.5">
                  <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">
                      {t(dl.labelKey, dl.labelParams)}
                    </p>
                    <p className="text-xs text-zinc-400">{formatDate(dl.date)}</p>
                  </div>
                  <Link
                    href={dl.href}
                    className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {t("view")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* ── SWAP MESSAGES ── */}
        <SectionCard
          title={t("messagesTitle")}
          description={t("messagesDescription")}
          action={
            <Link href="/chat" className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t("viewAll")}
            </Link>
          }
        >
          {swapConversations.length === 0 ? (
            <p className="py-4 text-center text-zinc-400 dark:text-zinc-500">{t("noMessages")}</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {swapConversations.slice(0, 5).map((conv) => {
                const unread = conv.messages.filter((m) => !m.isRead && m.senderId !== user.id).length;
                return (
                  <li key={conv.id} className="flex items-center gap-3 py-2.5">
                    <MessageSquare className="h-4 w-4 shrink-0 text-violet-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {conv.participantName}
                      </p>
                      <p className="truncate text-xs text-zinc-400">{conv.lastMessage}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                      <Link
                        href={`/chat?conversation=${conv.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        {t("open")}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
