"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Conversation, ChatMessage } from "@/lib/types";
import { useAppState } from "@/lib/state";
import { formatDate } from "@/lib/utils";
import { Badge, Pill } from "@/components/ui";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Paperclip,
  Search,
  Shield,
  Smile,
  X,
} from "lucide-react";

const BLOCKED_EXTENSIONS = [".exe", ".bat", ".sh", ".cmd", ".zip", ".rar", ".7z", ".tar"];
const URL_REGEX = /https?:\/\/[^\s]+/i;

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "👏"];

/** Round coordinates to ~100m for privacy */
function roundCoord(val: number): number {
  return Math.round(val * 1000) / 1000;
}

function LocationBubble({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  const tc = useTranslations("chat");
  return (
    <div className="mt-1 rounded-xl border border-blue-200 bg-blue-50/80 p-2 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
        <MapPin className="h-3.5 w-3.5" />
        {label || tc("sharedLocation")}
      </div>
      <div className="mt-1.5 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-blue-100 text-xs text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
        <div className="text-center">
          <MapPin className="mx-auto h-6 w-6 text-red-500" />
          <p className="mt-1 text-[10px]">{lat.toFixed(3)}, {lng.toFixed(3)}</p>
          <p className="text-[9px] text-blue-500/70">{tc("approxLocation")}</p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isMe,
  targetLang,
  showOriginal,
  onToggleOriginal,
  onReact,
}: {
  msg: ChatMessage;
  isMe: boolean;
  targetLang: string;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  onReact: (emoji: string) => void;
}) {
  const t = useTranslations("chatPanel");
  const tc = useTranslations("chat");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const detectLang = /[ăâîșț]/i.test(msg.content)
        ? "ro"
        : /[ñáéíóú]/i.test(msg.content)
          ? "es"
          : "en";
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: msg.content,
          from: detectLang,
          to: targetLang,
        }),
      });
      const data = await res.json();
      setTranslatedText(data.translated);
    } catch {
      setTranslatedText(t("translationError"));
    } finally {
      setTranslating(false);
    }
  };

  const isLocation = msg.messageType === "location" && msg.locationData;
  const reactions = msg.reactions ?? {};
  const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0);

  return (
    <div
      className={`group relative max-w-[80%] rounded-2xl p-3 shadow-sm ${
        isMe
          ? "ml-auto bg-blue-50 dark:bg-blue-950/40"
          : "mr-auto bg-white dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{isMe ? t("you") : t("partner")}</span>
        <div className="flex items-center gap-1.5">
          <span>{formatDate(msg.createdAt)}</span>
          {/* Read receipts */}
          {isMe && (
            <span className="ml-0.5">
              {msg.readBy && msg.readBy.length > 0 ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3 text-zinc-400" />
              )}
            </span>
          )}
        </div>
      </div>
      {/* Location message */}
      {isLocation ? (
        <LocationBubble lat={msg.locationData!.lat} lng={msg.locationData!.lng} label={msg.locationData!.label} />
      ) : translatedText && !showOriginal ? (
        <p className="mt-1 rounded-lg bg-purple-50 p-2 text-sm text-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
          {translatedText}
        </p>
      ) : (
        <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">{msg.content}</p>
      )}
      {/* Reactions display */}
      {reactionEntries.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {reactionEntries.map(([emoji, users]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              className="inline-flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white px-1.5 py-0.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <span>{emoji}</span>
              <span className="text-[10px] font-medium text-zinc-500">{users.length}</span>
            </button>
          ))}
        </div>
      )}
      {/* Reaction picker (hover) */}
      <button
        type="button"
        onClick={() => setShowReactions(!showReactions)}
        className="absolute -top-2 right-2 hidden rounded-full bg-white p-1 shadow-sm group-hover:flex dark:bg-zinc-800"
        aria-label="React to message"
      >
        <Smile className="h-3.5 w-3.5 text-zinc-400" />
      </button>
      {showReactions && (
        <div className="absolute -top-8 right-0 flex gap-0.5 rounded-full border border-zinc-200 bg-white px-1.5 py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => { onReact(emoji); setShowReactions(false); }}
              className="rounded-full p-0.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
        {msg.translated ? <Pill color="blue">{t("translated")}</Pill> : null}
        {msg.moderated ? <Pill color="amber">{t("moderated")}</Pill> : null}
        {msg.attachments?.map((att) => (
          <Pill key={att.id} color={att.safe ? "green" : "amber"}>
            {att.name}
          </Pill>
        ))}
        {!translatedText && !isLocation ? (
          <button
            type="button"
            onClick={() => void handleTranslate()}
            disabled={translating}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {translating ? "..." : t("translate")}
          </button>
        ) : null}
        {translatedText ? (
          <button
            type="button"
            onClick={onToggleOriginal}
            className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
          >
            {showOriginal ? tc("showTranslation") : tc("showOriginal")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ChatPanel({
  conversations,
  initialConversationId,
}: {
  conversations: Conversation[];
  initialConversationId?: string;
}) {
  const t = useTranslations("chatPanel");
  const tc = useTranslations("chat");
  const { addMessage, toggleConversationTranslation, items, swaps, user, setTyping, markMessagesRead } = useAppState();
  const language = useLocale();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState("");
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show safety warning for 3 seconds then auto-clear
  const showSafetyWarning = useCallback((message: string) => {
    setSafetyWarning(message);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    safetyTimerRef.current = setTimeout(() => setSafetyWarning(null), 3000);
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Toggle show-original for a specific message
  const toggleShowOriginal = useCallback((messageId: string) => {
    setShowOriginalMap((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  }, []);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.participantName.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const effectiveActiveId =
    (selectedId && conversations.some((c) => c.id === selectedId) ? selectedId : undefined) ??
    (initialConversationId && conversations.some((c) => c.id === initialConversationId)
      ? initialConversationId
      : undefined) ??
    conversations[0]?.id;

  const active = conversations.find((c) => c.id === effectiveActiveId);

  // Track read counts — mark messages as "read" when conversation is viewed
  useEffect(() => {
    if (active) {
      setReadCounts((prev) => ({ ...prev, [active.id]: active.messages.length }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.messages.length]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length]);

  // Find swap context for active conversation
  const swapContext = active && user ? (() => {
    const participantId = active.participantId;
    const relevantSwaps = swaps.filter(
      (s) =>
        (s.requesterId === user.id && s.responderId === participantId) ||
        (s.responderId === user.id && s.requesterId === participantId),
    );
    if (relevantSwaps.length === 0) return null;
    const latestSwap = relevantSwaps[0];
    const reqItem = items.find((i) => i.id === latestSwap.requesterItemId);
    const resItem = items.find((i) => i.id === latestSwap.responderItemId);
    return { swap: latestSwap, reqItem, resItem };
  })() : null;

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (active?.id) {
      void markMessagesRead(active.id);
    }
  }, [active?.id, active?.messages.length, markMessagesRead]);

  // Handle typing indicator — sends to Supabase Realtime
  const handleTyping = useCallback(() => {
    if (!active) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    void setTyping(active.id, true);
    typingTimeoutRef.current = setTimeout(() => {
      void setTyping(active.id, false);
    }, 2000);
  }, [active, setTyping]);

  // Handle reaction on a message
  const handleReaction = useCallback((messageId: string, emoji: string) => {
    // In production, this would update via API/WebSocket
    // For now, update local state via a custom event pattern
    if (!active) return;
    const msg = active.messages.find((m) => m.id === messageId);
    if (!msg) return;
    const reactions = { ...(msg.reactions ?? {}) };
    const userId = user?.id ?? "me";
    if (reactions[emoji]?.includes(userId)) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== userId);
    } else {
      reactions[emoji] = [...(reactions[emoji] ?? []), userId];
    }
    msg.reactions = reactions;
    // Force re-render
    setReadCounts((prev) => ({ ...prev }));
  }, [active, user?.id]);

  // Handle location sharing
  const handleShareLocation = useCallback(async () => {
    if (!active || locationSharing) return;
    setLocationSharing(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        });
      });
      const lat = roundCoord(position.coords.latitude);
      const lng = roundCoord(position.coords.longitude);
      // Send as a special location message
      await addMessage(active.id, `📍 ${lat},${lng}`);
    } catch {
      showSafetyWarning(tc("locationError"));
    } finally {
      setLocationSharing(false);
    }
  }, [active, locationSharing, addMessage, showSafetyWarning, tc]);

  const handleSend = async () => {
    if (!draft.trim() || !active) return;

    // Safety: block messages containing URLs
    if (URL_REGEX.test(draft)) {
      showSafetyWarning(tc("linkBlocked"));
      return;
    }

    setSending(true);
    setModerationError(null);

    try {
      const modRes = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
      });
      const modData = await modRes.json();

      if (!modData.safe) {
        setModerationError(modData.message || t("blockedByModeration"));
        setSending(false);
        return;
      }

      await addMessage(active.id, draft);
      setDraft("");
    } catch {
      setModerationError(t("sendError"));
    } finally {
      setSending(false);
    }
  };

  // Safety: validate attached file extension
  const handleFileSelect = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      showSafetyWarning(tc("fileBlocked"));
      setAttachedFile(null);
      return;
    }
    setAttachedFile(file);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Conversation list */}
      <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("conversations")}</h3>
        {/* Search conversations */}
        {conversations.length > 1 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchConversations")}
              className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        )}
        {filteredConversations.length === 0 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("noConversations")}
          </p>
        ) : null}
        {filteredConversations.map((conv) => {
          const readCount = readCounts[conv.id] ?? 0;
          const totalMessages = conv.messages.length;
          const unread = totalMessages > readCount ? totalMessages - readCount : 0;

          return (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full rounded-xl border px-3 py-2 text-left ${
                conv.id === effectiveActiveId
                  ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                  : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{conv.participantName}</div>
                  <Badge tier={conv.participantBadge} />
                </div>
                {unread > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                ) : null}
              </div>
              <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                {conv.lastMessage}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active conversation */}
      <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        {active ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-zinc-500">{t("secureChat")}</p>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {active.participantName}
                </h3>
              </div>
              <button
                type="button"
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  active.translationEnabled
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
                }`}
                onClick={() => toggleConversationTranslation(active.id)}
              >
                {t("translation")} {active.translationEnabled ? t("on") : t("off")}
              </button>
            </div>

            {/* Swap context header */}
            {swapContext ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 dark:border-blue-900 dark:bg-blue-950/30">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{t("swapContext")}:</span>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {swapContext.reqItem?.title ?? "?"} ↔ {swapContext.resItem?.title ?? "?"}
                </span>
                <Pill color="blue">{swapContext.swap.status}</Pill>
              </div>
            ) : null}

            {/* AI Summary — collapsible */}
            {swapContext ? (
              <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-800/60">
                <button
                  type="button"
                  onClick={() => setSummaryExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                      {tc("aiSummary")}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {tc("aiSummaryDesc")}
                    </span>
                  </div>
                  {summaryExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                </button>
                {summaryExpanded && (
                  <div className="space-y-2 border-t border-zinc-200 px-3 pb-3 pt-2 dark:border-zinc-700">
                    {/* Agreed section */}
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        {tc("agreedItems")}
                      </p>
                      <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
                        <li className="flex items-center gap-1.5">
                          <span className="text-emerald-500">&#10003;</span>
                          {tc("summaryItems", {
                            req: swapContext.reqItem?.title ?? "?",
                            res: swapContext.resItem?.title ?? "?",
                          })}
                        </li>
                        {swapContext.swap.logistics.locationType ? (
                          <li className="flex items-center gap-1.5">
                            <span className="text-emerald-500">&#10003;</span>
                            {tc("summaryLogistics", {
                              method: swapContext.swap.logistics.locationType,
                            })}
                          </li>
                        ) : null}
                        {swapContext.swap.logistics.meetupPoint ? (
                          <li className="flex items-center gap-1.5">
                            <span className="text-emerald-500">&#10003;</span>
                            {tc("summaryMeetup", {
                              point: swapContext.swap.logistics.meetupPoint,
                            })}
                          </li>
                        ) : null}
                      </ul>
                    </div>
                    {/* Pending section */}
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        {tc("pendingItems")}
                      </p>
                      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {!swapContext.swap.logistics.locationType && (
                          <li className="flex items-center gap-1.5">
                            <span className="text-zinc-400">&#9744;</span>
                            {tc("summaryLogistics", { method: tc("summaryNotAgreed") })}
                          </li>
                        )}
                        {!swapContext.swap.logistics.meetupPoint && (
                          <li className="flex items-center gap-1.5">
                            <span className="text-zinc-400">&#9744;</span>
                            {tc("summaryMeetup", { point: tc("summaryNotAgreed") })}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Go to Exchange CTA */}
            {swapContext ? (
              <div className="mt-2 flex items-center gap-3">
                <Link
                  href="/change"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-emerald-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  {tc("goToExchange")}
                </Link>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {tc("goToExchangeDesc")}
                </span>
              </div>
            ) : null}

            {/* Messages — responsive height */}
            <div
              className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
              style={{ maxHeight: "calc(100vh - 380px)", minHeight: "200px" }}
            >
              {/* Safety / moderation warning banner */}
              {safetyWarning ? (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 dark:bg-amber-950/30">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    {safetyWarning}
                  </p>
                </div>
              ) : null}
              {/* Persistent moderation reminder */}
              <p className="text-center text-[10px] text-amber-600/70 dark:text-amber-400/60">
                {tc("safetyWarning")}
              </p>
              {active.messages.map((msg) => {
                // Detect location messages from content pattern
                const locMatch = msg.content.match(/^📍\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
                const enrichedMsg = locMatch ? {
                  ...msg,
                  messageType: "location" as const,
                  locationData: { lat: parseFloat(locMatch[1]), lng: parseFloat(locMatch[2]) },
                } : msg;
                return (
                  <MessageBubble
                    key={msg.id}
                    msg={enrichedMsg}
                    isMe={msg.senderId !== active.participantId}
                    targetLang={language}
                    showOriginal={showOriginalMap[msg.id] ?? true}
                    onToggleOriginal={() => toggleShowOriginal(msg.id)}
                    onReact={(emoji) => handleReaction(msg.id, emoji)}
                  />
                );
              })}
              {/* Typing indicator */}
              {active.participantTyping && (
                <div className="mr-auto flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-zinc-900">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{t("partner")}</span>
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Moderation error */}
            {moderationError ? (
              <div className="mt-2 rounded-xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-200">
                {moderationError}
              </div>
            ) : null}

            {/* Attached file preview */}
            {attachedFile && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs dark:bg-blue-950/30">
                <Paperclip className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="flex-1 truncate text-blue-800 dark:text-blue-200">
                  {t("fileSelected", { name: attachedFile.name })}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input */}
            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={t("attachFile")}
                aria-label={t("attachFile")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              {/* Location share button */}
              <button
                type="button"
                onClick={() => void handleShareLocation()}
                disabled={locationSharing}
                title={tc("shareLocation")}
                aria-label={tc("shareLocation")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                {locationSharing ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </button>
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setModerationError(null);
                  handleTyping();
                }}
                placeholder={t("writeMessage")}
                disabled={sending}
                className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {sending ? "..." : t("send")}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-300">
              {t("selectConversation")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
