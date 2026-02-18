"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";
import { SwapTimeline } from "@/features/change/SwapTimeline";
import type { SwapIntent, HouseAmenity, HouseRule, HouseSwapMode, PropertyType, ServiceCategory, SkillLevel, ServiceDelivery, ServiceMilestone, CancelReason } from "@/lib/types";
import {
  MapPin, Truck, Package, Check, Globe, Plane, Home, Wrench, QrCode, Shield, Calendar,
  Wifi, Car, Snowflake, Flame as Heating, WashingMachine, CookingPot, Waves,
  Trees, Dog, Tv, Monitor, Ban, Clock, Users, Camera, Star,
  Palette, Code, GraduationCap, Hammer, Briefcase, Timer, CheckCircle2, XCircle,
  Wallet, ArrowRightLeft, FileText, AlertTriangle, Award,
} from "lucide-react";

const VALID_TRANSITIONS: Record<SwapIntent["status"], SwapIntent["status"][]> = {
  proposed: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
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
  proposed: "proposed",
  scheduled: "scheduled",
  in_progress: "inProgress",
  completed: "completed",
  cancelled: "cancelled",
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

type SwapType = "local" | "courier_national" | "courier_international" | "vacation" | "house_swap" | "service_swap";

const SWAP_TYPES: { key: SwapType; icon: typeof MapPin; titleKey: string; descKey: string }[] = [
  { key: "local", icon: MapPin, titleKey: "typeLocal", descKey: "typeLocalDesc" },
  { key: "courier_national", icon: Truck, titleKey: "typeCourierNational", descKey: "typeCourierNationalDesc" },
  { key: "courier_international", icon: Globe, titleKey: "typeCourierInternational", descKey: "typeCourierInternationalDesc" },
  { key: "vacation", icon: Plane, titleKey: "typeVacation", descKey: "typeVacationDesc" },
  { key: "house_swap", icon: Home, titleKey: "typeHouseSwap", descKey: "typeHouseSwapDesc" },
  { key: "service_swap", icon: Wrench, titleKey: "typeServiceSwap", descKey: "typeServiceSwapDesc" },
];

const CHECKLIST_KEYS = [
  "checkVerifyPhotos",
  "checkAgreeLogistics",
  "checkConfirmCondition",
  "checkSetMeetup",
  "checkBothConfirm",
] as const;

export function ChangeClient({ swapFromQuery }: { swapFromQuery?: string | null }) {
  const { user, swaps, updateSwapStatus, addSwapFeedback, updateSwapLogistics, items, trackEvent } = useAppState();
  const t = useTranslations("change");
  const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
  const [statusError, setStatusError] = useState<string | null>(null);
  const [activeSwapId, setActiveSwapId] = useState<string | null>(swapFromQuery ?? null);
  const [confirmAction, setConfirmAction] = useState<{
    status: SwapIntent["status"];
    label: string;
    color: string;
  } | null>(null);

  // Swap type state
  const [swapType, setSwapType] = useState<SwapType>("local");
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
  const [serviceTimeBank, setServiceTimeBank] = useState({ earned: 0, spent: 0 });

  // Cancel reason
  const [cancelReason, setCancelReason] = useState<CancelReason>("changed_mind");
  const [cancelNote, setCancelNote] = useState("");

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
  }, [swap?.id, swap?.logistics.locationType, swap?.logistics.meetupPoint, swap?.logistics.courierTracking]);
  const requesterItem = swap ? items.find((i) => i.id === swap.requesterItemId) : null;
  const responderItem = swap ? items.find((i) => i.id === swap.responderItemId) : null;
  const isRequester = swap && user ? swap.requesterId === user.id : false;

  if (!user) {
    return <LoggedOutGate returnTo="/change" />;
  }

  const [showCancelDialog, setShowCancelDialog] = useState(false);

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
          {swap.status === "in_progress" && (
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
              {VALID_TRANSITIONS[swap.status].includes("scheduled") ? (
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={() => handleStatusChange("scheduled", t("schedule"), "bg-blue-600 hover:bg-blue-700")}
                >
                  {t("schedule")}
                </button>
              ) : null}
              {VALID_TRANSITIONS[swap.status].includes("in_progress") ? (
                <button
                  type="button"
                  className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  onClick={() => handleStatusChange("in_progress", t("markInProgress"), "bg-blue-600 hover:bg-blue-700")}
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
        steps={[
          { label: t("leaveFeedback"), href: "/change", description: t("leaveFeedbackDescription") },
          { label: t("findAnotherMatch"), href: "/match", description: t("findAnotherMatchDescription") },
          { label: t("viewStats"), href: "/info#stats", description: t("viewStatsDescription") },
        ]}
      />

      <StateShowcase
        title="Stări CHANGE / SWAPLY"
        states={[
          {
            key: "loading",
            title: "Timeline în încărcare",
            description: "Afișăm skeleton pe pași și butoanele sunt disabled până sosesc datele swap.",
          },
          {
            key: "empty",
            title: "Niciun swap activ",
            description: "Mesaj de empty state (există deja) + CTA spre /match sau /chat pentru inițiere.",
          },
          {
            key: "error",
            title: "Blocaje de confirmare",
            description: "Mesaj clar când statusul nu poate fi actualizat; oferim buton reîncearcă sau contact suport.",
          },
        ]}
      />
    </div>
  );
}
