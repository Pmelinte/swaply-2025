"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";
import { SwapTimeline } from "@/features/change/SwapTimeline";
import type { SwapIntent } from "@/lib/types";
import { MapPin, Truck, Package, Check, Globe, Plane, Home, Wrench } from "lucide-react";

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

  const handleStatusChange = (status: SwapIntent["status"], label: string, color: string) => {
    if (status === "cancelled" || status === "completed") {
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
        message={
          confirmAction?.status === "cancelled"
            ? t("confirmCancelMessage")
            : t("confirmCompleteMessage")
        }
        confirmLabel={confirmAction?.label ?? ""}
        confirmColor={confirmAction?.color ?? "bg-blue-600 hover:bg-blue-700"}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirmAction(null)}
      />

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

                {/* house_swap: houseDuration + meetupPoint */}
                {swapType === "house_swap" && (
                  <>
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                      {t("houseDuration")}
                      <div className="relative mt-1">
                        <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={houseDuration}
                          onChange={(e) => setHouseDuration(e.target.value)}
                          placeholder={t("houseDurationPlaceholder")}
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

                {/* service_swap: serviceDescription textarea */}
                {swapType === "service_swap" && (
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {t("serviceDescription")}
                    <textarea
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder={t("serviceDescPlaceholder")}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </label>
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
                <div className="mt-3">
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
