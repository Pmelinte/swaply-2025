"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui-custom";
import { SwapTimeline } from "@/features/change/SwapTimeline";
import { SwapChat } from "@/components/SwapChat";
import type { SwapIntent, HouseAmenity, HouseRule, HouseSwapMode, PropertyType, ServiceCategory, SkillLevel, ServiceDelivery, ServiceMilestone, CancelReason } from "@/lib/types";
import { TrustCard } from "@/components/trust/TrustCard";
import { calculateTrustScore } from "@/lib/utils/trustScore";
import { MeetingModule } from "@/components/meetings/MeetingModule";
import { ShipmentModule } from "@/components/shipments/ShipmentModule";
import { DisputeWorkflow } from "@/features/disputes/DisputeWorkflow";
import { DisputeDetail } from "@/features/disputes/DisputeDetail";
import { BundleBuilder } from "@/features/bundles/BundleBuilder";
import type { Dispute, DisputeEvidence, DisputeReason, DisputeStatus, EvidenceType } from "@/lib/types";
import {
  MapPin, Truck, Package, Check, Globe, Plane, Home, Wrench, QrCode, Shield, Calendar,
  Wifi, Car, Snowflake, Flame as Heating, WashingMachine, CookingPot, Waves,
  Trees, Dog, Tv, Monitor, Ban, Clock, Users, Camera, Star,
  Palette, Code, GraduationCap, Hammer, Briefcase, Timer, CheckCircle2, XCircle,
  ArrowRightLeft, AlertTriangle, Lock,
} from "lucide-react";

const VALID_TRANSITIONS: Record<SwapIntent["status"], SwapIntent["status"][]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled", "disputed"],
  in_progress: ["delivered_by_a", "cancelled", "disputed"],
  delivered_by_a: ["delivered_by_b", "disputed"],
  delivered_by_b: ["completed", "disputed"],
  rejected: [],
  completed: [],
  cancelled: [],
  expired: [],
  disputed: ["resolved"],
  resolved: [],
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl transition-transform hover:scale-110"
        >
          <span className={star <= (hover || value) ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}>
            &#9733;
          </span>
        </button>
      ))}
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<SwapIntent["status"], string> = {
  pending: "proposed",
  accepted: "statusAccepted",
  in_progress: "statusInProgress",
  delivered_by_a: "statusDeliveredA",
  delivered_by_b: "statusDeliveredB",
  rejected: "cancelled",
  completed: "completed",
  cancelled: "cancelled",
  expired: "cancelled",
  disputed: "disputed",
  resolved: "statusResolved",
};

const LOCATION_TYPES: SwapIntent["logistics"]["locationType"][] = ["public_spot", "courier", "pickup"];

const METHOD_ICONS: Record<SwapIntent["logistics"]["locationType"], typeof MapPin> = {
  public_spot: MapPin,
  courier: Truck,
  pickup: Package,
};

const METHOD_KEYS: Record<SwapIntent["logistics"]["locationType"], string> = {
  public_spot: "methodPublicSpot",
  courier: "methodCourier",
  pickup: "methodPickup",
};

const METHOD_DESC_KEYS: Record<SwapIntent["logistics"]["locationType"], string> = {
  public_spot: "methodPublicSpotDesc",
  courier: "methodCourierDesc",
  pickup: "methodPickupDesc",
};

type ExchangeType = "local" | "courier_national" | "courier_international" | "vacation" | "house_swap" | "service_swap" | "cross";

const SWAP_TYPES: { key: ExchangeType; icon: typeof MapPin; titleKey: string; descKey: string }[] = [
  { key: "local", icon: MapPin, titleKey: "typeLocal", descKey: "typeLocalDesc" },
  { key: "courier_national", icon: Truck, titleKey: "typeCourierNational", descKey: "typeCourierNationalDesc" },
  { key: "courier_international", icon: Globe, titleKey: "typeCourierInternational", descKey: "typeCourierInternationalDesc" },
  { key: "vacation", icon: Plane, titleKey: "typeVacation", descKey: "typeVacationDesc" },
  { key: "house_swap", icon: Home, titleKey: "typeHouseSwap", descKey: "typeHouseSwapDesc" },
  { key: "service_swap", icon: Wrench, titleKey: "typeServiceSwap", descKey: "typeServiceSwapDesc" },
  { key: "cross", icon: ArrowRightLeft, titleKey: "typeCross", descKey: "typeCrossDesc" },
];

const CHECKLIST_KEYS = [
  "checkVerifyPhotos",
  "checkAgreeLogistics",
  "checkConfirmCondition",
  "checkSetMeetup",
  "checkBothConfirm",
] as const;

export function ChangeClient({ swapFromQuery, serverAuthenticated = true }: { swapFromQuery?: string | null; serverAuthenticated?: boolean }) {
  const { user, loading, swaps, updateSwapStatus, addSwapFeedback, updateSwapLogistics, items, trackEvent, confirmDelivery, fileDispute } = useAppState();
  const t = useTranslations("change");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
  const [statusError, setStatusError] = useState<string | null>(null);
  const [activeSwapId, setActiveSwapId] = useState<string | null>(swapFromQuery ?? null);
  const [confirmAction, setConfirmAction] = useState<{
    status: SwapIntent["status"];
    label: string;
    color: string;
  } | null>(null);

  // Swap type state
  const [swapType, setSwapType] = useState<ExchangeType>("local");
  const [checklistState, setChecklistState] = useState([false, false, false, false, false]);

  // Swap-type-specific field states
  const [meetupDateTime, setMeetupDateTime] = useState("");
  const [awbOutgoing, setAwbOutgoing] = useState("");
  const [awbIncoming, setAwbIncoming] = useState("");
  const [internationalLeg1, setInternationalLeg1] = useState("");
  const [internationalLeg2, setInternationalLeg2] = useState("");
  const [travelDates, setTravelDates] = useState("");
  const [houseDuration, setHouseDuration] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");

  // House swap state
  const [housePropertyType, setHousePropertyType] = useState<PropertyType>("apartment");
  const [houseBedrooms, setHouseBedrooms] = useState(1);
  const [houseBathrooms, setHouseBathrooms] = useState(1);
  const [houseMaxGuests, setHouseMaxGuests] = useState(2);
  const [houseAmenities, setHouseAmenities] = useState<HouseAmenity[]>([]);
  const [houseRules, setHouseRules] = useState<HouseRule[]>([]);
  const [houseDescription, setHouseDescription] = useState("");
  const [houseNeighborhood, setHouseNeighborhood] = useState("");
  const [houseSwapMode, setHouseSwapMode] = useState<HouseSwapMode>("simultaneous");
  const [houseDateFrom, setHouseDateFrom] = useState("");
  const [houseDateTo, setHouseDateTo] = useState("");
  const [houseEmergencyContact, setHouseEmergencyContact] = useState("");
  const [houseInsuranceAck, setHouseInsuranceAck] = useState(false);
  const [houseInspectionNotes, setHouseInspectionNotes] = useState("");

  // Service swap state
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("creative");
  const [serviceSkillName, setServiceSkillName] = useState("");
  const [serviceSkillLevel, setServiceSkillLevel] = useState<SkillLevel>("intermediate");
  const [serviceDelivery, setServiceDelivery] = useState<ServiceDelivery>("remote");
  const [serviceHoursPerWeek, setServiceHoursPerWeek] = useState(5);
  const [servicePortfolio, setServicePortfolio] = useState("");
  const [serviceMilestones, setServiceMilestones] = useState<ServiceMilestone[]>([]);
  const [serviceNewMilestone, setServiceNewMilestone] = useState("");
  const [serviceTimeBank] = useState({ earned: 0, spent: 0 });

  // Cancel reason
  const [cancelReason, setCancelReason] = useState<CancelReason>("changed_mind");
  const [cancelNote, setCancelNote] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Dispute state
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState<NonNullable<SwapIntent["dispute"]>["reason"]>("item_not_received");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  // New dispute workflow state
  const [showDisputeWorkflow, setShowDisputeWorkflow] = useState(false);
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [activeDisputeEvidence, setActiveDisputeEvidence] = useState<DisputeEvidence[]>([]);

  // Bundle builder state
  const [bundleSelectedIds, setBundleSelectedIds] = useState<string[]>([]);
  const [bundleNotes, setBundleNotes] = useState("");
  const [bundleValue, setBundleValue] = useState<number | null>(null);
  const [bundleLocked, setBundleLocked] = useState(false);
  const [bundleSaving, setBundleSaving] = useState(false);

  // Logistics local state
  const [logisticsType, setLogisticsType] = useState<SwapIntent["logistics"]["locationType"]>("public_spot");
  const [meetupPoint, setMeetupPoint] = useState("");
  const [courierTracking, setCourierTracking] = useState("");
  const [logisticsSaved, setLogisticsSaved] = useState(false);

  const swap = swaps.find((s) => s.id === activeSwapId) ?? swaps[0];

  // Sync local logistics state when swap changes
   
  useEffect(() => {
    if (swap) {
      setLogisticsType(swap.logistics.locationType);
      setMeetupPoint(swap.logistics.meetupPoint ?? "");
      setCourierTracking(swap.logistics.courierTracking ?? "");
      setLogisticsSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swap?.id, swap?.logistics.locationType, swap?.logistics.meetupPoint, swap?.logistics.courierTracking]);

  const requesterItem = swap ? items.find((i) => i.id === swap.requesterItemId) : null;
  const responderItem = swap ? items.find((i) => i.id === swap.responderItemId) : null;
  const isRequester = swap && user ? swap.requesterId === user.id : false;

  // Sync bundle state when swap changes
  useEffect(() => {
    if (swap) {
      const amRequester = user ? swap.requesterId === user.id : false;
      const myBundleIds = amRequester ? (swap.requesterBundleIds ?? []) : (swap.responderBundleIds ?? []);
      setBundleSelectedIds(myBundleIds);
      const myBundle = amRequester ? swap.requesterBundle : swap.responderBundle;
      setBundleNotes(myBundle?.notes ?? "");
      setBundleValue(myBundle?.totalEstimatedValue ?? null);
      setBundleLocked(myBundle?.locked ?? (swap.status !== "pending"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swap?.id, swap?.status, user?.id]);

  // Skip auth spinner when server already resolved auth status
  if (loading.auth && serverAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <SectionCard title={t("guestTitle")} description={t("guestDescription")}>
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            {/* Visual timeline */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto rounded-xl bg-gradient-to-r from-blue-50 to-green-50 p-4 dark:from-blue-950/30 dark:to-green-950/30">
              {[
                { key: "guestStep1Title" as const, icon: <Package className="h-5 w-5" />, color: "text-blue-600 dark:text-blue-400" },
                { key: "guestStep2Title" as const, icon: <Check className="h-5 w-5" />, color: "text-green-600 dark:text-green-400" },
                { key: "guestStep3Title" as const, icon: <Truck className="h-5 w-5" />, color: "text-amber-600 dark:text-amber-400" },
                { key: "guestStep4Title" as const, icon: <Shield className="h-5 w-5" />, color: "text-purple-600 dark:text-purple-400" },
                { key: "guestStep5Title" as const, icon: <Star className="h-5 w-5" />, color: "text-yellow-600 dark:text-yellow-400" },
              ].map((step, i) => (
                <div key={step.key} className="flex items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800 ${step.color}`}>
                      {step.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">{t(step.key)}</span>
                  </div>
                  {i < 4 && <div className="mx-1 h-0.5 w-6 bg-zinc-300 dark:bg-zinc-600 sm:w-10" />}
                </div>
              ))}
            </div>

            {/* Step descriptions */}
            <div className="grid gap-2 sm:grid-cols-5">
              {(["guestStep1Desc", "guestStep2Desc", "guestStep3Desc", "guestStep4Desc", "guestStep5Desc"] as const).map((key) => (
                <p key={key} className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">{t(key)}</p>
              ))}
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {t("guestLogistics")}
            </p>
          </div>
        </SectionCard>

        <div className="text-center">
          <CTAButton href="/register">{t("guestCta")}</CTAButton>
        </div>
      </div>
    );
  }

  const handleStatusChange = (status: SwapIntent["status"], label: string, color: string) => {
    if (status === "cancelled") {
      setShowCancelDialog(true);
    } else if (status === "completed") {
      setConfirmAction({ status, label, color });
    } else {
      setStatusError(null);
      void updateSwapStatus(swap.id, status);
    }
  };

  const confirmStatusChange = () => {
    if (!confirmAction || !swap) return;
    setStatusError(null);
    void updateSwapStatus(swap.id, confirmAction.status);
    trackEvent("exchange_status_change", { swapId: swap.id, newStatus: confirmAction.status });
    if (confirmAction.status === "completed") {
      trackEvent("exchange_confirmed", { swapId: swap.id });
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={!!confirmAction}
        title={t("confirmActionTitle")}
        message={t("confirmCompleteMessage")}
        confirmLabel={confirmAction?.label ?? ""}
        confirmColor={confirmAction?.color ?? "bg-blue-600 hover:bg-blue-700"}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Cancel with reason dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t("cancelReasonTitle")}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{t("cancelReasonDesc")}</p>
            <div className="mt-4 space-y-2">
              {(["changed_mind", "found_better", "no_response", "condition_mismatch", "logistics_issue", "safety_concern", "other"] as CancelReason[]).map((reason) => (
                <label key={reason} className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-sm transition cursor-pointer ${
                  cancelReason === reason
                    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                    : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                }`}>
                  <input type="radio" name="cancel_reason" checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="h-4 w-4 text-red-600" />
                  <span className="text-zinc-700 dark:text-zinc-200">{t(`cancelReason_${reason}` as Parameters<typeof t>[0])}</span>
                </label>
              ))}
            </div>
            {cancelReason === "other" && (
              <textarea value={cancelNote} onChange={(e) => setCancelNote(e.target.value)}
                placeholder={t("cancelNotePlaceholder")} rows={2}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCancelDialog(false)}
                className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200">
                {t("keepSwap")}
              </button>
              <button type="button" onClick={() => {
                trackEvent("swap_cancelled", { swapId: swap.id, reason: cancelReason, note: cancelNote });
                void updateSwapStatus(swap.id, "cancelled");
                setShowCancelDialog(false);
              }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                {t("confirmCancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionCard
        title={t("title")}
        description={t("description")}
      >
        {swaps.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {swaps.map((s) => {
              const left = items.find((i) => i.id === s.requesterItemId)?.title ?? s.requesterItemId;
              const right =
                items.find((i) => i.id === s.responderItemId)?.title ?? s.responderItemId;
              const active = s.id === swap?.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSwapId(s.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {left} ↔ {right}
                </button>
              );
            })}
          </div>
        ) : null}
        {swap ? (
          <SwapTimeline
            swap={swap}
            requesterLabel={requesterItem?.title ?? swap.requesterItemId}
            responderLabel={responderItem?.title ?? swap.responderItemId}
          />
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {t("noSwaps")}
          </p>
        )}
      </SectionCard>

      {swap && user ? (
        <SwapChat
          swapId={swap.id}
          currentUserId={user.id}
          partnerId={isRequester ? swap.responderId : swap.requesterId}
        />
      ) : null}

      {swap ? (
        <>
          {/* Bilateral status */}
          <SectionCard title={t("bilateralStatus")} description={t("bilateralDescription")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`rounded-xl border p-3 ${isRequester ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30" : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"}`}>
                <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("requester")}</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {requesterItem?.title ?? swap.requesterItemId}
                </p>
                {swap.requesterBundleIds && swap.requesterBundleIds.length > 0 && (
                  <div className="mt-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        bundleLocked && isRequester
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                      }`}>
                        {bundleLocked && isRequester ? <Lock className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                        {t("bundleItems", { count: swap.requesterBundleIds.length + 1 })}
                      </span>
                      {swap.requesterBundleIds.map((bid) => {
                        const bundleItem = items.find((i) => i.id === bid);
                        return (
                          <span key={bid} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            {bundleItem?.title ?? bid.slice(0, 8) + "\u2026"}
                          </span>
                        );
                      })}
                    </div>
                    {swap.requesterBundle?.totalEstimatedValue != null && swap.requesterBundle.totalEstimatedValue > 0 && (
                      <p className="mt-0.5 text-[10px] text-zinc-500">{t("bundleEstimatedValue")}: {swap.requesterBundle.totalEstimatedValue.toLocaleString()} {t("bundleCurrency")}</p>
                    )}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${swap.status !== "cancelled" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-xs text-zinc-600 dark:text-zinc-300">
                    {t(STATUS_LABELS[swap.status])}
                  </span>
                </div>
                {isRequester ? <Pill color="blue">{t("you")}</Pill> : null}
              </div>
              <div className={`rounded-xl border p-3 ${!isRequester ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30" : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"}`}>
                <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">{t("responder")}</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {responderItem?.title ?? swap.responderItemId}
                </p>
                {swap.responderBundleIds && swap.responderBundleIds.length > 0 && (
                  <div className="mt-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        bundleLocked && !isRequester
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                      }`}>
                        {bundleLocked && !isRequester ? <Lock className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                        {t("bundleItems", { count: swap.responderBundleIds.length + 1 })}
                      </span>
                      {swap.responderBundleIds.map((bid) => {
                        const bundleItem = items.find((i) => i.id === bid);
                        return (
                          <span key={bid} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            {bundleItem?.title ?? bid.slice(0, 8) + "\u2026"}
                          </span>
                        );
                      })}
                    </div>
                    {swap.responderBundle?.totalEstimatedValue != null && swap.responderBundle.totalEstimatedValue > 0 && (
                      <p className="mt-0.5 text-[10px] text-zinc-500">{t("bundleEstimatedValue")}: {swap.responderBundle.totalEstimatedValue.toLocaleString()} {t("bundleCurrency")}</p>
                    )}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${swap.status !== "cancelled" ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-xs text-zinc-600 dark:text-zinc-300">
                    {t(STATUS_LABELS[swap.status])}
                  </span>
                </div>
                {!isRequester ? <Pill color="blue">{t("you")}</Pill> : null}
              </div>
            </div>
          </SectionCard>

          {/* Bundle Builder */}
          {swap.status !== "completed" && swap.status !== "cancelled" && (
            <SectionCard title={t("bundleTitle")} description={t("bundleDesc")}>
              <BundleBuilder
                availableItems={items.filter((i) => i.ownerId === user?.id)}
                primaryItemId={isRequester ? swap.requesterItemId : swap.responderItemId}
                selectedIds={bundleSelectedIds}
                notes={bundleNotes}
                estimatedValue={bundleValue}
                locked={bundleLocked}
                saving={bundleSaving}
                onAddItem={(id) => setBundleSelectedIds((prev) => [...prev, id])}
                onRemoveItem={(id) => setBundleSelectedIds((prev) => prev.filter((x) => x !== id))}
                onNotesChange={setBundleNotes}
                onValueChange={setBundleValue}
                onSave={async () => {
                  setBundleSaving(true);
                  try {
                    const sb = (await import("@/lib/supabase/client")).getSupabaseClient();
                    const session = await sb?.auth.getSession();
                    const token = session?.data.session?.access_token;
                    await fetch("/api/bundles", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({
                        swapId: swap.id,
                        side: isRequester ? "requester" : "responder",
                        itemIds: bundleSelectedIds,
                        notes: bundleNotes,
                        totalEstimatedValue: bundleValue,
                      }),
                    });
                  } catch { /* handled */ }
                  setBundleSaving(false);
                }}
              />
            </SectionCard>
          )}

          {/* Trust Score */}
          <SectionCard title={t("trustTitle")} description={t("trustDescription")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {user && requesterItem && (
                <TrustCard
                  result={calculateTrustScore(user, isRequester ? requesterItem : responderItem ?? null, swaps)}
                  participantLabel={isRequester
                    ? (requesterItem?.title ?? swap.requesterItemId)
                    : (responderItem?.title ?? swap.responderItemId)}
                />
              )}
              {user && responderItem && (
                <TrustCard
                  result={calculateTrustScore(
                    { ...user, id: isRequester ? swap.responderId : swap.requesterId },
                    isRequester ? responderItem : requesterItem ?? null,
                    swaps,
                  )}
                  participantLabel={isRequester
                    ? (responderItem?.title ?? swap.responderItemId)
                    : (requesterItem?.title ?? swap.requesterItemId)}
                />
              )}
            </div>
          </SectionCard>

          {/* Swap Type Selector */}
          {swap.status !== "completed" && swap.status !== "cancelled" && (
            <SectionCard title={t("swapType")} description={t("swapTypeDesc")}>
              {/* Type grid */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {SWAP_TYPES.map((st) => {
                  const Icon = st.icon;
                  const active = swapType === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setSwapType(st.key)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40 dark:ring-blue-700"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${active ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-zinc-50"}`}>
                          {t(st.titleKey as Parameters<typeof t>[0])}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {t(st.descKey as Parameters<typeof t>[0])}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Conditional fields per swap type */}
              <div className="mt-4 space-y-3">
                {/* local: meetupPoint + meetupDateTime */}
                {swapType === "local" && (
                  <>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("meetupPoint")}
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={meetupPoint}
                          onChange={(e) => {
                            setMeetupPoint(e.target.value);
                            setLogisticsSaved(false);
                          }}
                          placeholder={t("meetupPointPlaceholder")}
                          className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </label>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("meetupDateTime")}
                      <input
                        type="text"
                        value={meetupDateTime}
                        onChange={(e) => setMeetupDateTime(e.target.value)}
                        placeholder={t("meetupDateTimePlaceholder")}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </label>
                  </>
                )}

                {/* courier_national: awbOutgoing + awbIncoming */}
                {swapType === "courier_national" && (
                  <>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("awbOutgoing")}
                      <div className="relative mt-1">
                        <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={awbOutgoing}
                          onChange={(e) => setAwbOutgoing(e.target.value)}
                          placeholder={t("courierTrackingPlaceholder")}
                          className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </label>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("awbIncoming")}
                      <div className="relative mt-1">
                        <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={awbIncoming}
                          onChange={(e) => setAwbIncoming(e.target.value)}
                          placeholder={t("courierTrackingPlaceholder")}
                          className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </label>
                  </>
                )}

                {/* courier_international: internationalLeg1 + internationalLeg2 */}
                {swapType === "courier_international" && (
                  <>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("internationalLeg1")}
                      <div className="relative mt-1">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={internationalLeg1}
                          onChange={(e) => setInternationalLeg1(e.target.value)}
                          placeholder={t("courierTrackingPlaceholder")}
                          className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </label>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("internationalLeg2")}
                      <div className="relative mt-1">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={internationalLeg2}
                          onChange={(e) => setInternationalLeg2(e.target.value)}
                          placeholder={t("courierTrackingPlaceholder")}
                          className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </label>
                  </>
                )}

                {/* vacation: travelDates + meetupPoint */}
                {swapType === "vacation" && (
                  <>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("travelDates")}
                      <div className="relative mt-1">
                        <Plane className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={travelDates}
                          onChange={(e) => setTravelDates(e.target.value)}
                          placeholder={t("travelDatesPlaceholder")}
                          className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </label>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("meetupPoint")}
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={meetupPoint}
                          onChange={(e) => {
                            setMeetupPoint(e.target.value);
                            setLogisticsSaved(false);
                          }}
                          placeholder={t("meetupPointPlaceholder")}
                          className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      </div>
                    </label>
                  </>
                )}

                {/* house_swap: Full property profile */}
                {swapType === "house_swap" && (
                  <div className="space-y-4">
                    {/* Swap Mode */}
                    <div>
                      <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("houseSwapMode")}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(["simultaneous", "non_simultaneous", "one_way_hosting", "permanent"] as HouseSwapMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setHouseSwapMode(mode)}
                            className={`rounded-xl border p-2.5 text-left text-xs transition ${
                              houseSwapMode === mode
                                ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40"
                                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                            }`}
                          >
                            <p className={`font-semibold ${houseSwapMode === mode ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-zinc-50"}`}>
                              {t(`houseMode_${mode}` as Parameters<typeof t>[0])}
                            </p>
                            <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                              {t(`houseModeDesc_${mode}` as Parameters<typeof t>[0])}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Property Type + Basics */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("housePropertyType")}
                        <select
                          value={housePropertyType}
                          onChange={(e) => setHousePropertyType(e.target.value as PropertyType)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        >
                          {(["apartment", "house", "villa", "cabin", "studio", "room"] as PropertyType[]).map((pt) => (
                            <option key={pt} value={pt}>{t(`propType_${pt}` as Parameters<typeof t>[0])}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("houseBedrooms")}
                        <input type="number" min={0} max={20} value={houseBedrooms} onChange={(e) => setHouseBedrooms(+e.target.value)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </label>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("houseBathrooms")}
                        <input type="number" min={0} max={10} value={houseBathrooms} onChange={(e) => setHouseBathrooms(+e.target.value)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </label>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("houseMaxGuests")}
                        <input type="number" min={1} max={50} value={houseMaxGuests} onChange={(e) => setHouseMaxGuests(+e.target.value)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </label>
                    </div>

                    {/* Amenities */}
                    <div>
                      <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("houseAmenities")}</p>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { key: "wifi", icon: Wifi }, { key: "parking", icon: Car }, { key: "ac", icon: Snowflake },
                          { key: "heating", icon: Heating }, { key: "washer", icon: WashingMachine }, { key: "kitchen", icon: CookingPot },
                          { key: "pool", icon: Waves }, { key: "garden", icon: Trees }, { key: "pet_friendly", icon: Dog },
                          { key: "tv", icon: Tv }, { key: "workspace", icon: Monitor },
                        ] as { key: HouseAmenity; icon: typeof Wifi }[]).map(({ key, icon: Icon }) => {
                          const active = houseAmenities.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setHouseAmenities((prev) => active ? prev.filter((a) => a !== key) : [...prev, key])}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                active
                                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {t(`amenity_${key}` as Parameters<typeof t>[0])}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* House Rules */}
                    <div>
                      <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("houseRulesTitle")}</p>
                      <div className="flex flex-wrap gap-2">
                        {(["no_smoking", "no_pets", "no_parties", "no_shoes", "quiet_hours", "max_guests"] as HouseRule[]).map((rule) => {
                          const active = houseRules.includes(rule);
                          return (
                            <button
                              key={rule}
                              type="button"
                              onClick={() => setHouseRules((prev) => active ? prev.filter((r) => r !== rule) : [...prev, rule])}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                active
                                  ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
                                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                              }`}
                            >
                              <Ban className="h-3 w-3" />
                              {t(`rule_${rule}` as Parameters<typeof t>[0])}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dates & Duration */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("houseDateFrom")}
                        <input type="date" value={houseDateFrom} onChange={(e) => setHouseDateFrom(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </label>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("houseDateTo")}
                        <input type="date" value={houseDateTo} onChange={(e) => setHouseDateTo(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </label>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("houseDuration")}
                        <input type="text" value={houseDuration} onChange={(e) => setHouseDuration(e.target.value)}
                          placeholder={t("houseDurationPlaceholder")}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </label>
                    </div>

                    {/* Description & Neighborhood */}
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("houseDesc")}
                      <textarea value={houseDescription} onChange={(e) => setHouseDescription(e.target.value)}
                        placeholder={t("houseDescPlaceholder")} rows={3}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </label>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("houseNeighborhood")}
                      <input type="text" value={houseNeighborhood} onChange={(e) => setHouseNeighborhood(e.target.value)}
                        placeholder={t("houseNeighborhoodPlaceholder")}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </label>

                    {/* Inspection Checklist */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <Camera className="h-3.5 w-3.5" />
                        {t("houseInspection")}
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400">{t("houseInspectionDesc")}</p>
                      <textarea value={houseInspectionNotes} onChange={(e) => setHouseInspectionNotes(e.target.value)}
                        placeholder={t("houseInspectionPlaceholder")} rows={2}
                        className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs dark:border-amber-800 dark:bg-zinc-800 dark:text-zinc-100" />
                    </div>

                    {/* Emergency Contact */}
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("houseEmergencyContact")}
                      <input type="text" value={houseEmergencyContact} onChange={(e) => setHouseEmergencyContact(e.target.value)}
                        placeholder={t("houseEmergencyPlaceholder")}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </label>

                    {/* Insurance Reminder */}
                    <label className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                      <input type="checkbox" checked={houseInsuranceAck} onChange={(e) => setHouseInsuranceAck(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{t("houseInsurance")}</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400">{t("houseInsuranceDesc")}</p>
                      </div>
                    </label>
                  </div>
                )}

                {/* service_swap: Full service exchange UI */}
                {swapType === "service_swap" && (
                  <div className="space-y-4">
                    {/* Service Category */}
                    <div>
                      <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("serviceCategory")}</p>
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
                        {([
                          { key: "creative", icon: Palette },
                          { key: "technical", icon: Code },
                          { key: "education", icon: GraduationCap },
                          { key: "physical", icon: Hammer },
                          { key: "professional", icon: Briefcase },
                        ] as { key: ServiceCategory; icon: typeof Palette }[]).map(({ key, icon: Icon }) => {
                          const active = serviceCategory === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setServiceCategory(key)}
                              className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs transition ${
                                active
                                  ? "border-violet-300 bg-violet-50 ring-1 ring-violet-300 dark:border-violet-700 dark:bg-violet-950/40"
                                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                              }`}
                            >
                              <Icon className={`h-4 w-4 ${active ? "text-violet-600" : "text-zinc-400"}`} />
                              <span className={`font-semibold ${active ? "text-violet-700 dark:text-violet-300" : "text-zinc-700 dark:text-zinc-200"}`}>
                                {t(`svcCat_${key}` as Parameters<typeof t>[0])}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-400">{t(`svcCatDesc_${serviceCategory}` as Parameters<typeof t>[0])}</p>
                    </div>

                    {/* Skill Name + Level + Delivery */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("serviceSkillName")}
                        <input type="text" value={serviceSkillName} onChange={(e) => setServiceSkillName(e.target.value)}
                          placeholder={t("serviceSkillPlaceholder")}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </label>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("serviceLevel")}
                        <select value={serviceSkillLevel} onChange={(e) => setServiceSkillLevel(e.target.value as SkillLevel)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                          <option value="beginner">{t("svcLevelBeginner")}</option>
                          <option value="intermediate">{t("svcLevelIntermediate")}</option>
                          <option value="expert">{t("svcLevelExpert")}</option>
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("serviceDeliveryMethod")}
                        <select value={serviceDelivery} onChange={(e) => setServiceDelivery(e.target.value as ServiceDelivery)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                          <option value="remote">{t("svcDeliveryRemote")}</option>
                          <option value="in_person">{t("svcDeliveryInPerson")}</option>
                          <option value="hybrid">{t("svcDeliveryHybrid")}</option>
                        </select>
                      </label>
                    </div>

                    {/* Hours/Week + Description */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("serviceHoursPerWeek")}
                        <div className="mt-1 flex items-center gap-2">
                          <input type="range" min={1} max={40} value={serviceHoursPerWeek}
                            onChange={(e) => setServiceHoursPerWeek(+e.target.value)}
                            className="flex-1" />
                          <span className="w-12 text-center text-sm font-bold text-zinc-700 dark:text-zinc-200">{serviceHoursPerWeek}h</span>
                        </div>
                      </label>
                      <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {t("servicePortfolioLink")}
                        <input type="text" value={servicePortfolio} onChange={(e) => setServicePortfolio(e.target.value)}
                          placeholder={t("servicePortfolioPlaceholder")}
                          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </label>
                    </div>

                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("serviceDescription")}
                      <textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)}
                        placeholder={t("serviceDescPlaceholder")} rows={3}
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    </label>

                    {/* Time Banking Info */}
                    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
                        <Timer className="h-3.5 w-3.5" />
                        {t("serviceTimeBank")}
                      </div>
                      <p className="text-xs text-violet-600 dark:text-violet-400">{t("serviceTimeBankDesc")}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-violet-200 bg-white p-2.5 text-center dark:border-violet-800 dark:bg-zinc-800">
                          <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{serviceTimeBank.earned}h</p>
                          <p className="text-[10px] text-violet-500">{t("svcTimeEarned")}</p>
                        </div>
                        <div className="rounded-lg border border-violet-200 bg-white p-2.5 text-center dark:border-violet-800 dark:bg-zinc-800">
                          <p className="text-lg font-bold text-violet-700 dark:text-violet-300">{serviceTimeBank.spent}h</p>
                          <p className="text-[10px] text-violet-500">{t("svcTimeSpent")}</p>
                        </div>
                        <div className="rounded-lg border border-violet-200 bg-white p-2.5 text-center dark:border-violet-800 dark:bg-zinc-800">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">{serviceTimeBank.earned - serviceTimeBank.spent}h</p>
                          <p className="text-[10px] text-violet-500">{t("svcTimeBalance")}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-violet-500 dark:text-violet-400">{t("serviceTimeBankNote")}</p>
                    </div>

                    {/* Milestones */}
                    <div>
                      <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("serviceMilestones")}</p>
                      <div className="space-y-2">
                        {serviceMilestones.map((ms, idx) => (
                          <div key={ms.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                            <button
                              type="button"
                              onClick={() => setServiceMilestones((prev) => prev.map((m, i) => i === idx ? { ...m, completed: !m.completed } : m))}
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ms.completed ? "bg-green-500 text-white" : "border-2 border-zinc-300 text-transparent dark:border-zinc-600"}`}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <span className={`flex-1 text-sm ${ms.completed ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-200"}`}>
                              {ms.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => setServiceMilestones((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-zinc-400 hover:text-red-500"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input type="text" value={serviceNewMilestone} onChange={(e) => setServiceNewMilestone(e.target.value)}
                          placeholder={t("serviceMilestonePlaceholder")}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && serviceNewMilestone.trim()) {
                              e.preventDefault();
                              setServiceMilestones((prev) => [...prev, {
                                id: crypto.randomUUID(), title: serviceNewMilestone.trim(), description: "",
                                completed: false, confirmedByProvider: false, confirmedByReceiver: false,
                              }]);
                              setServiceNewMilestone("");
                            }
                          }}
                          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                        <button
                          type="button"
                          disabled={!serviceNewMilestone.trim()}
                          onClick={() => {
                            if (!serviceNewMilestone.trim()) return;
                            setServiceMilestones((prev) => [...prev, {
                              id: crypto.randomUUID(), title: serviceNewMilestone.trim(), description: "",
                              completed: false, confirmedByProvider: false, confirmedByReceiver: false,
                            }]);
                            setServiceNewMilestone("");
                          }}
                          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
                        >
                          {t("serviceMilestoneAdd")}
                        </button>
                      </div>
                    </div>

                    {/* Service Rating Dimensions */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                      <p className="mb-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("serviceRatingDimensions")}</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {t("svcRateQuality")}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-400" /> {t("svcRatePunctuality")}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3 text-green-400" /> {t("svcRateCommunication")}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Cross-swap (mixed exchange) ── */}
                {swapType === "cross" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRightLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <p className="text-sm font-bold text-purple-800 dark:text-purple-200">{t("typeCross")}</p>
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">{t("crossSwapExplanation")}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-1" />
                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">{t("crossObjects")}</p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400">{t("crossObjectsDesc")}</p>
                      </div>
                      <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-800 dark:bg-purple-950/20">
                        <Home className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-1" />
                        <p className="text-xs font-semibold text-purple-800 dark:text-purple-200">{t("crossProperties")}</p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400">{t("crossPropertiesDesc")}</p>
                      </div>
                      <div className="rounded-xl border border-green-200 bg-green-50/50 p-3 dark:border-green-800 dark:bg-green-950/20">
                        <Wrench className="h-5 w-5 text-green-600 dark:text-green-400 mb-1" />
                        <p className="text-xs font-semibold text-green-800 dark:text-green-200">{t("crossServices")}</p>
                        <p className="text-[10px] text-green-600 dark:text-green-400">{t("crossServicesDesc")}</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {t("crossSwapNote")}
                      </p>
                      <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">{t("crossSwapNoteDesc")}</p>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("crossSwapExample")}</p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Logistics */}
          {swap.status !== "completed" && swap.status !== "cancelled" && (
            <SectionCard title={t("logistics")} description={t("logisticsDescription")}>
              {/* Method chooser */}
              <div className="grid gap-2 sm:grid-cols-3">
                {LOCATION_TYPES.map((type) => {
                  const Icon = METHOD_ICONS[type];
                  const active = logisticsType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setLogisticsType(type);
                        setLogisticsSaved(false);
                      }}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40 dark:ring-blue-700"
                          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300"
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${active ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-zinc-50"}`}>
                          {t(METHOD_KEYS[type] as Parameters<typeof t>[0])}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {t(METHOD_DESC_KEYS[type] as Parameters<typeof t>[0])}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Meetup point input */}
              {(logisticsType === "public_spot" || logisticsType === "pickup") && (
                <div className="mt-3 space-y-2">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {t("meetupPoint")}
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={meetupPoint}
                        onChange={(e) => {
                          setMeetupPoint(e.target.value);
                          setLogisticsSaved(false);
                        }}
                        placeholder={t("meetupPointPlaceholder")}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  </label>
                  {/* Safe Meeting Points Suggestions */}
                  <div className="rounded-xl border border-green-200 bg-green-50/50 p-3 dark:border-green-900 dark:bg-green-950/20">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-300">
                      <Shield className="h-3.5 w-3.5" />
                      {t("safeMeetingPoints")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        t("safePointPolice"),
                        t("safePointMall"),
                        t("safePointCafe"),
                        t("safePointBank"),
                        t("safePointMetro"),
                      ].map((point) => (
                        <button
                          key={point}
                          type="button"
                          onClick={() => { setMeetupPoint(point); setLogisticsSaved(false); }}
                          className="rounded-full border border-green-200 bg-white px-2.5 py-1 text-[11px] font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-900/50"
                        >
                          {point}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-green-600 dark:text-green-400">{t("safeMeetingTip")}</p>
                  </div>
                </div>
              )}

              {/* Transport affiliate links */}
              {(logisticsType === "public_spot" || logisticsType === "pickup") && meetupPoint && (
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                  <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-300">{t("transportToMeetup")}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://m.bolt.eu/action/requestRide?destination_name=${encodeURIComponent(meetupPoint)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
                    >
                      <span>🚗</span> Bolt
                    </a>
                    <a
                      href={`https://m.uber.com/ul/?action=setPickup&dropoff[nickname]=${encodeURIComponent(meetupPoint)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      <span>🚕</span> Uber
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(meetupPoint)}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                    >
                      <span>🗺️</span> Waze
                    </a>
                  </div>
                </div>
              )}

              {/* Courier tracking input */}
              {logisticsType === "courier" && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {t("courierTracking")}
                    <div className="relative mt-1">
                      <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={courierTracking}
                        onChange={(e) => {
                          setCourierTracking(e.target.value);
                          setLogisticsSaved(false);
                        }}
                        placeholder={t("courierTrackingPlaceholder")}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  </label>
                </div>
              )}

              {/* Save + help */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void updateSwapLogistics(swap.id, {
                      locationType: logisticsType,
                      meetupPoint: logisticsType !== "courier" ? meetupPoint || undefined : undefined,
                      courierTracking: logisticsType === "courier" ? courierTracking || undefined : undefined,
                    });
                    setLogisticsSaved(true);
                  }}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {t("saveLogistics")}
                </button>
                {logisticsSaved && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <Check className="h-3.5 w-3.5" />
                    {t("logisticsSaved")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                {t("logisticsHelp")}
              </p>
            </SectionCard>
          )}

          {/* Escrow Guarantee Banner — courier swaps only */}
          {swap.status !== "completed" && swap.status !== "cancelled" && user &&
           (logisticsType === "courier" || swapType === "courier_national" || swapType === "courier_international") && (
            <SectionCard title={t("escrowTitle")} description={t("escrowDescription")}>
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      {t("escrowBannerTitle")}
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      {t("escrowBannerDesc")}
                    </p>
                  </div>
                </div>

                {/* Escrow status for both parties */}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className={`rounded-lg border p-2.5 ${
                    swap.escrow?.requesterStatus === "held"
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                      : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  }`}>
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">{t("requester")}</p>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      {swap.escrow?.requesterStatus === "held"
                        ? t("escrowStatusHeld")
                        : swap.escrow?.requesterStatus === "released"
                          ? t("escrowStatusReleased")
                          : swap.escrow?.requesterStatus === "disputed"
                            ? t("escrowStatusDisputed")
                            : t("escrowStatusPending")}
                    </p>
                  </div>
                  <div className={`rounded-lg border p-2.5 ${
                    swap.escrow?.responderStatus === "held"
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                      : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  }`}>
                    <p className="text-[10px] font-semibold uppercase text-zinc-500">{t("responder")}</p>
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      {swap.escrow?.responderStatus === "held"
                        ? t("escrowStatusHeld")
                        : swap.escrow?.responderStatus === "released"
                          ? t("escrowStatusReleased")
                          : swap.escrow?.responderStatus === "disputed"
                            ? t("escrowStatusDisputed")
                            : t("escrowStatusPending")}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                {((isRequester && swap.escrow?.requesterStatus !== "held" && swap.escrow?.requesterStatus !== "released") ||
                  (!isRequester && swap.escrow?.responderStatus !== "held" && swap.escrow?.responderStatus !== "released")) && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const sb = (await import("@/lib/supabase/client")).getSupabaseClient();
                        const session = await sb?.auth.getSession();
                        const tkn = session?.data.session?.access_token;
                        await fetch("/api/payments/escrow", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
                          },
                          body: JSON.stringify({ action: "create", swapId: swap.id, userId: user.id }),
                        });
                        trackEvent("escrow_guarantee_paid", { swapId: swap.id });
                      } catch { /* handled */ }
                    }}
                    className="mt-3 w-full rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                  >
                    {t("escrowPayButton")}
                  </button>
                )}

                {/* Both held — show release info */}
                {swap.escrow?.requesterStatus === "held" && swap.escrow?.responderStatus === "held" && (
                  <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-center text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {t("escrowBothHeld")}
                  </div>
                )}

                {/* Released */}
                {swap.escrow?.requesterStatus === "released" && swap.escrow?.responderStatus === "released" && (
                  <div className="mt-3 rounded-lg bg-green-50 p-2.5 text-center text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">
                    {t("escrowReleased")}
                  </div>
                )}

                <p className="mt-3 text-[10px] text-amber-600/80 dark:text-amber-400/60">
                  {t("escrowNote")}
                </p>
              </div>
            </SectionCard>
          )}

          {/* Safe Meeting Module */}
          {swap.status !== "completed" && swap.status !== "cancelled" && user && (
            <MeetingModule
              swap={swap}
              currentUserId={user.id}
              isRequester={isRequester}
            />
          )}

          {/* Shipment / Courier Tracking Module */}
          {swap.status !== "completed" && swap.status !== "cancelled" && user && (
            <ShipmentModule
              swap={swap}
              currentUserId={user.id}
              isRequester={isRequester}
            />
          )}

          {/* Pre-exchange checklist */}
          {swap.status !== "completed" && swap.status !== "cancelled" && (
            <SectionCard title={t("checklist")}>
              <div className="space-y-2">
                {CHECKLIST_KEYS.map((key, idx) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600"
                  >
                    <input
                      type="checkbox"
                      checked={checklistState[idx]}
                      onChange={() => {
                        setChecklistState((prev) => {
                          const next = [...prev];
                          next[idx] = !next[idx];
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`text-sm ${
                        checklistState[idx]
                          ? "text-zinc-500 line-through dark:text-zinc-400"
                          : "text-zinc-700 dark:text-zinc-200"
                      }`}
                    >
                      {t(key as Parameters<typeof t>[0])}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                {t("dualConfirmRequired")}
              </p>
            </SectionCard>
          )}

          {/* QR Code Confirmation */}
          {swap.status === "accepted" && (
            <SectionCard title={t("qrConfirmation")} description={t("qrConfirmationDesc")}>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30">
                  <div className="text-center">
                    <QrCode className="mx-auto h-12 w-12 text-blue-500" />
                    <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                      {t("qrSwapCode")}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-blue-800 dark:text-blue-200">
                      {swap.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{t("qrInstructions")}</p>
                  <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <p>1. {t("qrStep1")}</p>
                    <p>2. {t("qrStep2")}</p>
                    <p>3. {t("qrStep3")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(swap.id.slice(0, 8).toUpperCase());
                    }}
                    className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {t("qrCopyCode")}
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Delivery Confirmation + Dispute */}
          {(swap.status === "accepted" || swap.status === "disputed") && (
            <SectionCard title={t("deliveryConfirmation")} description={t("deliveryConfirmationDesc")}>
              {/* Confirmation status indicators */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`rounded-xl border p-3 ${swap.requesterConfirmed ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"}`}>
                  <div className="flex items-center gap-2">
                    {swap.requesterConfirmed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-zinc-400" />
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase text-zinc-500">{t("requesterLabel")}</p>
                      <p className={`text-sm font-bold ${swap.requesterConfirmed ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-300"}`}>
                        {swap.requesterConfirmed ? `${t("confirmed")} ✓` : t("awaitingConfirmation")}
                      </p>
                    </div>
                  </div>
                  {isRequester && !swap.requesterConfirmed && swap.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => void confirmDelivery(swap.id, "requester")}
                      className="mt-2 w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      {t("handedOver")}
                    </button>
                  )}
                </div>

                <div className={`rounded-xl border p-3 ${swap.responderConfirmed ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"}`}>
                  <div className="flex items-center gap-2">
                    {swap.responderConfirmed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-zinc-400" />
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase text-zinc-500">{t("responderLabel")}</p>
                      <p className={`text-sm font-bold ${swap.responderConfirmed ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-300"}`}>
                        {swap.responderConfirmed ? `${t("confirmed")} ✓` : t("awaitingConfirmation")}
                      </p>
                    </div>
                  </div>
                  {!isRequester && !swap.responderConfirmed && swap.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => void confirmDelivery(swap.id, "responder")}
                      className="mt-2 w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      {t("received")}
                    </button>
                  )}
                </div>
              </div>

              {swap.requesterConfirmed && swap.responderConfirmed && (
                <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {t("bothConfirmed")}
                </div>
              )}

              {/* Active dispute — full detail view */}
              {swap.dispute && activeDispute ? (
                <div className="mt-4">
                  <DisputeDetail
                    dispute={activeDispute}
                    evidence={activeDisputeEvidence}
                    currentUserId={user?.id ?? ""}
                    isAdmin={user?.role === "admin" || user?.role === "moderator"}
                    onResolve={async (resolution, notes) => {
                      try {
                        const session = await (await import("@/lib/supabase/client")).getSupabaseClient()?.auth.getSession();
                        const token = session?.data.session?.access_token;
                        await fetch("/api/disputes/resolve", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                          body: JSON.stringify({ disputeId: activeDispute.id, resolution, notes }),
                        });
                        setActiveDispute({ ...activeDispute, status: resolution, resolutionNotes: notes, resolvedAt: new Date().toISOString() });
                      } catch { /* handled */ }
                    }}
                  />
                </div>
              ) : swap.dispute && !activeDispute ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="text-sm font-bold text-red-800 dark:text-red-200">{t("disputeDetailTitle")}</h4>
                    <span className="ml-auto rounded-full bg-red-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-800 dark:bg-red-800 dark:text-red-200">
                      {swap.dispute.status}
                    </span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    <span className="font-semibold">{t("disputeReason")}</span> {swap.dispute.reason.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{swap.dispute.description}</p>
                  {swap.dispute.evidencePhotos && swap.dispute.evidencePhotos.length > 0 && (
                    <p className="mt-1 text-[10px] text-red-500">{t("disputeEvidenceCount", { count: swap.dispute.evidencePhotos.length })}</p>
                  )}
                  <p className="mt-2 text-[10px] text-red-500 dark:text-red-400">
                    {t("disputeOpenedOn", { date: new Date(swap.dispute.filedAt).toLocaleDateString(locale) })}
                  </p>
                </div>
              ) : null}

              {/* File dispute — new 3-step workflow */}
              {!swap.dispute && VALID_TRANSITIONS[swap.status].includes("disputed") && (
                <div className="mt-4">
                  {!showDisputeWorkflow ? (
                    <button
                      type="button"
                      onClick={() => setShowDisputeWorkflow(true)}
                      className="flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t("disputeWorkflowTitle")}
                    </button>
                  ) : (
                    <DisputeWorkflow
                      swapId={swap.id}
                      onCancel={() => setShowDisputeWorkflow(false)}
                      onSubmit={async ({ reason, description, evidence }) => {
                        await fileDispute(swap.id, reason as NonNullable<SwapIntent["dispute"]>["reason"], description, evidence.map((e) => e.content));
                        setShowDisputeWorkflow(false);
                      }}
                    />
                  )}
                </div>
              )}
            </SectionCard>
          )}

          {/* Calendar / Availability */}
          {swap.status !== "completed" && swap.status !== "cancelled" && (
            <SectionCard title={t("availability")} description={t("availabilityDesc")}>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { day: t("availMorning"), time: "09:00 - 12:00" },
                  { day: t("availAfternoon"), time: "12:00 - 18:00" },
                  { day: t("availEvening"), time: "18:00 - 21:00" },
                ].map((slot) => (
                  <label
                    key={slot.day}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-700"
                  >
                    <Calendar className="h-4 w-4 text-zinc-400" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{slot.day}</p>
                      <p className="text-[10px] text-zinc-500">{slot.time}</p>
                    </div>
                  </label>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Status transitions + Feedback */}
          <SectionCard title={t("confirmations")} description={t("updateStatus")}>
            {statusError ? (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-900 dark:bg-red-900/40 dark:text-red-100">
                {statusError}
              </div>
            ) : null}
            <div className="mb-2 text-xs text-zinc-500">
              {t("currentStatus")} <span className="font-semibold">{t(STATUS_LABELS[swap.status])}</span>
              {VALID_TRANSITIONS[swap.status].length > 0
                ? ` — ${t("possibleTransitions")} ${VALID_TRANSITIONS[swap.status].map((s) => t(STATUS_LABELS[s])).join(", ")}`
                : ` — ${t("noMoreTransitions")}`}
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              {VALID_TRANSITIONS[swap.status].includes("accepted") ? (
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={() => handleStatusChange("accepted", t("schedule"), "bg-blue-600 hover:bg-blue-700")}
                >
                  {t("schedule")}
                </button>
              ) : null}
              {VALID_TRANSITIONS[swap.status].includes("accepted") ? (
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={() => handleStatusChange("accepted", t("markInProgress"), "bg-blue-600 hover:bg-blue-700")}
                >
                  {t("markInProgress")}
                </button>
              ) : null}
              {VALID_TRANSITIONS[swap.status].includes("completed") ? (
                <button
                  type="button"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                  onClick={() => handleStatusChange("completed", t("confirmCompletion"), "bg-emerald-600 hover:bg-emerald-700")}
                >
                  {t("confirmCompletion")}
                </button>
              ) : null}
              {VALID_TRANSITIONS[swap.status].includes("disputed") ? (
                <button
                  type="button"
                  className="rounded-full bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
                  onClick={() => setShowDisputeWorkflow(true)}
                >
                  {t("disputeWorkflowTitle")}
                </button>
              ) : null}
              {VALID_TRANSITIONS[swap.status].includes("cancelled") ? (
                <button
                  type="button"
                  className="rounded-full bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  onClick={() => handleStatusChange("cancelled", t("cancelSwap"), "bg-red-600 hover:bg-red-700")}
                >
                  {t("cancelSwap")}
                </button>
              ) : null}
            </div>

            {/* Feedback section */}
            <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <p className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("rateExperience")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("rating")}</p>
                  <StarRating value={feedback.rating} onChange={(v) => setFeedback({ ...feedback, rating: v })} />
                  <p className="mt-1 text-xs text-zinc-400">{feedback.rating}/5</p>
                </div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {t("comment")}
                  <input
                    value={feedback.comment}
                    onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                    placeholder={t("commentPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                </label>
              </div>
              <button
                type="button"
                className="mt-3 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                onClick={() => void addSwapFeedback(swap.id, feedback.rating, feedback.comment)}
              >
                {t("submitFeedback")}
              </button>
              {swap.feedback ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 p-2 text-xs text-green-800 dark:bg-green-950/30 dark:text-green-200">
                  <span>&#10003;</span>
                  <span>{t("feedbackSent")} — {swap.feedback.rating}/5</span>
                </div>
              ) : null}
            </div>
          </SectionCard>
        </>
      ) : null}

      <SectionCard title={t("usageSteps")} description={t("usageStepsDescription")}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: t("step1Title"), desc: t("step1Description") },
              { step: "2", title: t("step2Title"), desc: t("step2Description") },
              { step: "3", title: t("step3Title"), desc: t("step3Description") },
              { step: "4", title: t("step4Title"), desc: t("step4Description") },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70"
              >
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {s.step}
                </div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("demoNote")}
          </p>
        </div>
      </SectionCard>

      <SectionCard title={t("safety")} description={t("safetyDescription")}>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <Pill color="blue">{t("premiumPins")}</Pill>
          <Pill color="amber">{t("mapFallback")}</Pill>
          <Pill color="green">{t("automatedNotifications")}</Pill>
        </div>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {t("statusNote")}
        </p>
        <CTAButton href="/info" variant="ghost">{t("viewPolicies")}</CTAButton>
      </SectionCard>

      <NextStepRecommendation
        title={tc("nextStepRecommended")}
        steps={[
          { label: t("leaveFeedback"), href: "/change", description: t("leaveFeedbackDescription") },
          { label: t("findAnotherMatch"), href: "/match", description: t("findAnotherMatchDescription") },
          { label: t("viewStats"), href: "/info#stats", description: t("viewStatsDescription") },
        ]}
      />

      <StateShowcase
        title="EXCHANGE States"
        states={[
          {
            key: "loading",
            title: "Loading timeline",
            description: "Skeleton on steps and buttons are disabled until swap data arrives.",
          },
          {
            key: "empty",
            title: "No active swaps",
            description: "Empty state message + CTA to /match or /chat to initiate.",
          },
          {
            key: "error",
            title: "Confirmation blockers",
            description: "Clear message when status cannot be updated; retry button or contact support.",
          },
        ]}
      />
    </div>
  );
}
