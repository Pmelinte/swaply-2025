"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin, Calendar, Clock, Check, Copy, AlertTriangle, Shield, UserCheck, XCircle,
} from "lucide-react";
import type { MeetingSession, MeetingNoShowReport, SwapIntent } from "@/lib/types";
import { SectionCard } from "@/components/ui";

/* ── Suggested safe locations ── */
const SAFE_LOCATIONS = [
  { key: "police", icon: Shield },
  { key: "mall", icon: MapPin },
  { key: "cafe", icon: MapPin },
  { key: "bank", icon: MapPin },
  { key: "metro", icon: MapPin },
] as const;

/* ── Helpers ── */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function isMeetingDay(scheduledAt: string): boolean {
  const now = new Date();
  const meeting = new Date(scheduledAt);
  return (
    now.getFullYear() === meeting.getFullYear() &&
    now.getMonth() === meeting.getMonth() &&
    now.getDate() === meeting.getDate()
  );
}

function isPastMeeting(scheduledAt: string): boolean {
  return new Date(scheduledAt).getTime() < Date.now();
}

/* ── Component ── */
export function MeetingModule({
  swap,
  currentUserId,
  isRequester,
}: {
  swap: SwapIntent;
  currentUserId: string;
  isRequester: boolean;
}) {
  const t = useTranslations("meeting");

  // Meeting session state (persisted locally for demo; in prod → Supabase)
  const [meeting, setMeeting] = useState<MeetingSession | null>(null);
  const [noShowReports, setNoShowReports] = useState<MeetingNoShowReport[]>([]);

  // Form state
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  // No-show form
  const [showNoShowForm, setShowNoShowForm] = useState(false);
  const [noShowNotes, setNoShowNotes] = useState("");

  const otherUserId = isRequester ? swap.responderId : swap.requesterId;
  const iAmA = isRequester; // "A" is requester, "B" is responder

  const canSchedule = !meeting && swap.status !== "completed" && swap.status !== "cancelled";
  const meetingIsToday = meeting ? isMeetingDay(meeting.scheduledAt) : false;
  const meetingIsPast = meeting ? isPastMeeting(meeting.scheduledAt) : false;

  const myCheckIn = useMemo(() => {
    if (!meeting) return false;
    return iAmA ? !!meeting.aCheckedInAt : !!meeting.bCheckedInAt;
  }, [meeting, iAmA]);

  const otherCheckIn = useMemo(() => {
    if (!meeting) return false;
    return iAmA ? !!meeting.bCheckedInAt : !!meeting.aCheckedInAt;
  }, [meeting, iAmA]);

  const alreadyReportedNoShow = useMemo(
    () => noShowReports.some((r) => r.reporterId === currentUserId),
    [noShowReports, currentUserId],
  );

  /* ── Actions ── */
  const handleSchedule = useCallback(() => {
    if (!locationName || !scheduledDate || !scheduledTime) return;
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    const newMeeting: MeetingSession = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      swapId: swap.id,
      proposerId: currentUserId,
      locationName,
      locationAddress: locationAddress || undefined,
      scheduledAt,
      confirmationCode: generateCode(),
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };
    setMeeting(newMeeting);
  }, [locationName, locationAddress, scheduledDate, scheduledTime, swap.id, currentUserId]);

  const handleCheckIn = useCallback(() => {
    if (!meeting) return;
    const now = new Date().toISOString();
    const updated = { ...meeting };

    if (iAmA) {
      updated.aCheckedInAt = now;
      if (updated.bCheckedInAt) {
        updated.status = "completed";
      } else {
        updated.status = "confirmed_a";
      }
    } else {
      updated.bCheckedInAt = now;
      if (updated.aCheckedInAt) {
        updated.status = "completed";
      } else {
        updated.status = "confirmed_b";
      }
    }
    setMeeting(updated);
  }, [meeting, iAmA]);

  const handleNoShowReport = useCallback(() => {
    if (!meeting || !noShowNotes.trim()) return;
    const report: MeetingNoShowReport = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      meetingId: meeting.id,
      reporterId: currentUserId,
      reportedUserId: otherUserId,
      notes: noShowNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    setNoShowReports((prev) => [...prev, report]);
    setMeeting({ ...meeting, status: "no_show" });
    setShowNoShowForm(false);
    setNoShowNotes("");
  }, [meeting, noShowNotes, currentUserId, otherUserId]);

  const copyCode = useCallback(() => {
    if (!meeting) return;
    void navigator.clipboard.writeText(meeting.confirmationCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [meeting]);

  /* ── Minimum date = today ── */
  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  /* ── Render ── */
  return (
    <SectionCard
      title={t("title")}
      description={t("description")}
    >
      {/* ── STEP 1: Schedule meeting ── */}
      {canSchedule && (
        <div className="space-y-3">
          {/* Location */}
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("locationLabel")}
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={t("locationPlaceholder")}
                className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </label>

          {/* Safe location suggestions */}
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-3 dark:border-green-900 dark:bg-green-950/20">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-300">
              <Shield className="h-3.5 w-3.5" />
              {t("safeLocations")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAFE_LOCATIONS.map(({ key }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLocationName(t(`safe_${key}` as Parameters<typeof t>[0]))}
                  className="rounded-full border border-green-200 bg-white px-2.5 py-1 text-[11px] font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-900/50"
                >
                  {t(`safe_${key}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
          </div>

          {/* Address (optional) */}
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("addressLabel")}
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder={t("addressPlaceholder")}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white py-2.5 px-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>

          {/* Date & time */}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("dateLabel")}
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="date"
                  value={scheduledDate}
                  min={minDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </label>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("timeLabel")}
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </label>
          </div>

          {/* Schedule button */}
          <button
            type="button"
            onClick={handleSchedule}
            disabled={!locationName || !scheduledDate || !scheduledTime}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("scheduleButton")}
          </button>
        </div>
      )}

      {/* ── STEP 2: Meeting scheduled — show confirmation code ── */}
      {meeting && (
        <div className="space-y-4">
          {/* Meeting info card */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
                  <MapPin className="h-4 w-4" />
                  {meeting.locationName}
                </div>
                {meeting.locationAddress && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">{meeting.locationAddress}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Calendar className="h-4 w-4" />
                  {new Date(meeting.scheduledAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <Clock className="h-4 w-4" />
                  {new Date(meeting.scheduledAt).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Status pill */}
              <div
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  meeting.status === "completed"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : meeting.status === "no_show"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                }`}
              >
                {t(`status_${meeting.status}` as Parameters<typeof t>[0])}
              </div>
            </div>
          </div>

          {/* Confirmation code */}
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-5 dark:border-amber-700 dark:bg-amber-950/20">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
              {t("confirmationCodeLabel")}
            </p>
            <p className="font-mono text-4xl font-black tracking-[0.3em] text-amber-800 dark:text-amber-200">
              {meeting.confirmationCode}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
            >
              {codeCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {codeCopied ? t("copied") : t("copyCode")}
            </button>
            <p className="text-center text-xs text-amber-600 dark:text-amber-400">
              {t("codeTip")}
            </p>
          </div>

          {/* ── STEP 3: Meeting day — check-in buttons ── */}
          {(meetingIsToday || meetingIsPast) && meeting.status !== "completed" && meeting.status !== "no_show" && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{t("checkInTitle")}</h4>

              {/* Check-in status for both parties */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* My check-in */}
                <div className={`rounded-xl border p-3 ${
                  myCheckIn
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                }`}>
                  <div className="flex items-center gap-2">
                    {myCheckIn ? (
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-zinc-400" />
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase text-zinc-500">{t("you")}</p>
                      <p className={`text-sm font-bold ${myCheckIn ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-300"}`}>
                        {myCheckIn ? t("checkedIn") : t("notCheckedIn")}
                      </p>
                    </div>
                  </div>
                  {!myCheckIn && (
                    <button
                      type="button"
                      onClick={handleCheckIn}
                      className="mt-2 w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      {t("checkInButton")}
                    </button>
                  )}
                </div>

                {/* Other party check-in */}
                <div className={`rounded-xl border p-3 ${
                  otherCheckIn
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                }`}>
                  <div className="flex items-center gap-2">
                    {otherCheckIn ? (
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-zinc-400" />
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase text-zinc-500">{t("otherParty")}</p>
                      <p className={`text-sm font-bold ${otherCheckIn ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-300"}`}>
                        {otherCheckIn ? t("checkedIn") : t("notCheckedIn")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Both checked in → completed message */}
              {myCheckIn && otherCheckIn && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
                  <Check className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {t("meetingCompleted")}
                  </p>
                </div>
              )}

              {/* No-show button */}
              {!myCheckIn && meetingIsPast && !alreadyReportedNoShow && (
                <button
                  type="button"
                  onClick={() => setShowNoShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/30"
                >
                  <XCircle className="h-4 w-4" />
                  {t("reportNoShow")}
                </button>
              )}

              {/* No-show form */}
              {showNoShowForm && (
                <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-800 dark:bg-red-950/20">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-4 w-4" />
                    {t("noShowTitle")}
                  </div>
                  <p className="mb-3 text-xs text-red-600 dark:text-red-400">
                    {t("noShowWarning")}
                  </p>
                  <textarea
                    value={noShowNotes}
                    onChange={(e) => setNoShowNotes(e.target.value)}
                    placeholder={t("noShowNotesPlaceholder")}
                    rows={3}
                    className="w-full rounded-lg border border-red-200 bg-white p-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 dark:border-red-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleNoShowReport}
                      disabled={!noShowNotes.trim()}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {t("submitNoShow")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNoShowForm(false); setNoShowNotes(""); }}
                      className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}

              {/* Already reported */}
              {alreadyReportedNoShow && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {t("noShowReported")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
