"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Truck, Package, MapPin, Globe, LocateFixed,
  Check, ExternalLink, Clock, AlertTriangle, CheckCircle2,
  Mail, FileText,
} from "lucide-react";
import type { SwapIntent, SwapShipment, DeliveryType, ShipmentDirection, ShipmentPaidBy, ShipmentStatus } from "@/lib/types";
import { SectionCard, Pill } from "@/components/ui-custom";
import { useCouriers, type CourierOption } from "@/hooks/useCouriers";
import { PackagingSection, TravelSection } from "@/components/shipments/AffiliateServiceLinks";

/* ── Constants ── */

const DELIVERY_TYPES: { key: DeliveryType; icon: typeof MapPin; titleKey: string }[] = [
  { key: "face_to_face", icon: MapPin, titleKey: "deliveryFaceToFace" },
  { key: "courier_same_city", icon: Truck, titleKey: "deliveryCourierSameCity" },
  { key: "courier_national", icon: Truck, titleKey: "deliveryCourierNational" },
  { key: "courier_international", icon: Globe, titleKey: "deliveryCourierInternational" },
  { key: "locker_pickup", icon: LocateFixed, titleKey: "deliveryLockerPickup" },
];

/** Fallback couriers when API is unavailable */
const FALLBACK_COURIERS: CourierOption[] = [
  { name: "DHL", websiteUrl: "https://dhl.com", logoUrl: null, countryCode: null, type: "international" },
  { name: "FedEx", websiteUrl: "https://fedex.com", logoUrl: null, countryCode: null, type: "international" },
  { name: "UPS", websiteUrl: "https://ups.com", logoUrl: null, countryCode: null, type: "international" },
];

const PAID_BY_OPTIONS: { key: ShipmentPaidBy; labelKey: string }[] = [
  { key: "sender", labelKey: "paidBySender" },
  { key: "receiver", labelKey: "paidByReceiver" },
  { key: "split", labelKey: "paidBySplit" },
];

const STATUS_TIMELINE: { status: ShipmentStatus; iconKey: string; labelKey: string }[] = [
  { status: "pending", iconKey: "clock", labelKey: "timelineOrdered" },
  { status: "picked_up", iconKey: "package", labelKey: "timelinePickedUp" },
  { status: "in_transit", iconKey: "truck", labelKey: "timelineInTransit" },
  { status: "delivered", iconKey: "check", labelKey: "timelineDelivered" },
];

const STATUS_ORDER: ShipmentStatus[] = ["pending", "picked_up", "in_transit", "delivered"];

function getStatusIcon(status: string) {
  switch (status) {
    case "pending": return <Clock className="h-4 w-4" />;
    case "picked_up": return <Package className="h-4 w-4" />;
    case "in_transit": return <Truck className="h-4 w-4" />;
    case "delivered": return <CheckCircle2 className="h-4 w-4" />;
    case "failed": return <AlertTriangle className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

function formatTimestamp(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/* ── Shipment Form ── */

interface ShipmentFormProps {
  direction: ShipmentDirection;
  directionLabel: string;
  onSave: (data: Omit<SwapShipment, "id" | "createdAt">) => void;
  swapId: string;
  existing?: SwapShipment;
  courierOptions: CourierOption[];
}

function ShipmentForm({ direction, directionLabel, onSave, swapId, existing, courierOptions }: ShipmentFormProps) {
  const t = useTranslations("change");
  const [courier, setCourier] = useState(existing?.courier ?? "");
  const [awb, setAwb] = useState(existing?.awb ?? "");
  const [trackingUrl, setTrackingUrl] = useState(existing?.trackingUrl ?? "");
  const [estimatedCost, setEstimatedCost] = useState(existing?.estimatedCost?.toString() ?? "");
  const [paidBy, setPaidBy] = useState<ShipmentPaidBy>(existing?.paidBy ?? "sender");
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    onSave({
      swapId,
      direction,
      courier: courier || undefined,
      awb: awb || undefined,
      trackingUrl: trackingUrl || undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      paidBy,
      status: existing?.status ?? "pending",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [swapId, direction, courier, awb, trackingUrl, estimatedCost, paidBy, existing?.status, onSave]);

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        <Truck className="h-4 w-4 text-blue-500" />
        {directionLabel}
      </h4>

      {/* Courier select */}
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {t("selectCourier")}
        <select
          value={courier}
          onChange={(e) => { setCourier(e.target.value); setSaved(false); }}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">{t("selectCourier")}...</option>
          {courierOptions.filter((c) => c.type === "domestic").length > 0 && (
            <optgroup label={t("courierDomestic")}>
              {courierOptions.filter((c) => c.type === "domestic").map((c) => (
                <option key={`d-${c.name}`} value={c.name}>{c.name}</option>
              ))}
            </optgroup>
          )}
          <optgroup label={t("courierInternational")}>
            {courierOptions.filter((c) => c.type === "international").map((c) => (
              <option key={`i-${c.name}`} value={c.name}>{c.name}</option>
            ))}
          </optgroup>
          <option value="Other">{t("courierOther")}</option>
        </select>
      </label>
      {/* Selected courier website link */}
      {courier && courier !== "Other" && (() => {
        const selected = courierOptions.find((c) => c.name === courier);
        if (!selected) return null;
        return (
          <a
            href={selected.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {selected.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.logoUrl} alt="" className="h-4 w-4 rounded object-contain" />
            )}
            <ExternalLink className="h-3 w-3" />
            {selected.name} — {selected.websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        );
      })()}

      {/* AWB */}
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {t("awbNumber")}
        <div className="relative mt-1">
          <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={awb}
            onChange={(e) => { setAwb(e.target.value); setSaved(false); }}
            placeholder={t("awbPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </label>

      {/* Tracking URL */}
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {t("trackingLink")}
        <div className="relative mt-1">
          <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="url"
            value={trackingUrl}
            onChange={(e) => { setTrackingUrl(e.target.value); setSaved(false); }}
            placeholder={t("trackingLinkPlaceholder")}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </label>

      {/* Cost + Paid by */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t("estimatedCost")}
          <input
            type="number"
            step="0.01"
            min="0"
            value={estimatedCost}
            onChange={(e) => { setEstimatedCost(e.target.value); setSaved(false); }}
            placeholder={t("estimatedCostPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t("paidByLabel")}
          <select
            value={paidBy}
            onChange={(e) => { setPaidBy(e.target.value as ShipmentPaidBy); setSaved(false); }}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {PAID_BY_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{t(o.labelKey as Parameters<typeof t>[0])}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t("saveShipment")}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <Check className="h-3.5 w-3.5" />
            {t("shipmentSaved")}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Delivery Timeline ── */

function DeliveryTimeline({ shipment }: { shipment: SwapShipment }) {
  const t = useTranslations("change");
  const currentIdx = STATUS_ORDER.indexOf(shipment.status);
  const isFailed = shipment.status === "failed";

  return (
    <div className="space-y-1">
      {STATUS_TIMELINE.map((step, idx) => {
        const isDone = !isFailed && idx <= currentIdx;
        const isCurrent = !isFailed && idx === currentIdx;
        let timestamp = "";
        if (step.status === "pending" && shipment.createdAt) timestamp = formatTimestamp(shipment.createdAt);
        if (step.status === "picked_up" && shipment.sentAt) timestamp = formatTimestamp(shipment.sentAt);
        if (step.status === "delivered" && shipment.deliveredAt) timestamp = formatTimestamp(shipment.deliveredAt);

        return (
          <div key={step.status} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isDone
                ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
            } ${isCurrent ? "ring-2 ring-green-400 ring-offset-1 dark:ring-offset-zinc-900" : ""}`}>
              {getStatusIcon(step.status)}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDone ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}`}>
                {t(step.labelKey as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {timestamp || (isDone ? "" : t("timelineWaiting"))}
              </p>
            </div>
            {isDone && <Check className="h-4 w-4 text-green-500" />}
          </div>
        );
      })}
      {isFailed && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 ring-2 ring-red-400 ring-offset-1 dark:bg-red-900/40 dark:text-red-400 dark:ring-offset-zinc-900">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">{t("timelineFailed")}</p>
        </div>
      )}
    </div>
  );
}

/* ── Main ShipmentModule ── */

export interface ShipmentModuleProps {
  swap: SwapIntent;
  currentUserId: string;
  isRequester: boolean;
  /** ISO country code of the current user (e.g. "RO") */
  userCountry?: string;
  /** ISO country code of the swap partner */
  partnerCountry?: string;
  /** Category of the swapped object (e.g. "electronics") for packaging tips */
  objectCategory?: string;
}

export function ShipmentModule({ swap, isRequester, userCountry, partnerCountry, objectCategory }: ShipmentModuleProps) {
  const t = useTranslations("change");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("face_to_face");
  const [shipments, setShipments] = useState<SwapShipment[]>([]);
  const [confirmingDirection, setConfirmingDirection] = useState<ShipmentDirection | null>(null);

  // Fetch dynamic courier list from DB based on user + partner countries
  const { couriers: fetchedCouriers } = useCouriers(userCountry, partnerCountry);
  const courierOptions = fetchedCouriers.length > 0 ? fetchedCouriers : FALLBACK_COURIERS;

  const isExperience = objectCategory === "experiences";
  const isCourierType = !isExperience && deliveryType !== "face_to_face";

  const handleSaveShipment = useCallback((data: Omit<SwapShipment, "id" | "createdAt">) => {
    setShipments((prev) => {
      const existing = prev.findIndex((s) => s.direction === data.direction);
      const shipment: SwapShipment = {
        ...data,
        id: existing >= 0 ? prev[existing].id : crypto.randomUUID(),
        createdAt: existing >= 0 ? prev[existing].createdAt : new Date().toISOString(),
        status: data.status ?? "pending",
      };
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = shipment;
        return next;
      }
      return [...prev, shipment];
    });
  }, []);

  const handleConfirmDelivery = useCallback((direction: ShipmentDirection) => {
    setConfirmingDirection(direction);
    setShipments((prev) =>
      prev.map((s) =>
        s.direction === direction
          ? { ...s, status: "delivered" as const, deliveredAt: new Date().toISOString() }
          : s,
      ),
    );
    setTimeout(() => setConfirmingDirection(null), 2000);
  }, []);

  const shipmentAtoB = shipments.find((s) => s.direction === "a_to_b");
  const shipmentBtoA = shipments.find((s) => s.direction === "b_to_a");
  const bothDelivered = shipmentAtoB?.status === "delivered" && shipmentBtoA?.status === "delivered";

  return (
    <SectionCard title={isExperience ? t("digitalTransferTitle") : t("shipmentSection")} description={isExperience ? t("digitalTransferDesc") : t("shipmentSectionDesc")}>
      {/* Digital transfer for experiences — replaces entire courier flow */}
      {isExperience ? (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/30">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-purple-500" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                {t("digitalTransferHow")}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-300">
                {t("digitalTransferSteps")}
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              <Mail className="h-4 w-4 text-blue-500" />
              <span className="text-zinc-700 dark:text-zinc-300">{t("digitalEmail")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-zinc-700 dark:text-zinc-300">{t("digitalPdf")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              <ExternalLink className="h-4 w-4 text-blue-500" />
              <span className="text-zinc-700 dark:text-zinc-300">{t("digitalBookingRef")}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delivery type selector — hidden for experiences */}
      {!isExperience ? <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("deliveryTypeLabel")}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DELIVERY_TYPES.map((dt) => {
            const Icon = dt.icon;
            const selected = deliveryType === dt.key;
            return (
              <button
                key={dt.key}
                type="button"
                onClick={() => setDeliveryType(dt.key)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-sm transition ${
                  selected
                    ? "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/30 dark:text-blue-300"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <Icon className={`h-5 w-5 ${selected ? "text-blue-500" : "text-zinc-400"}`} />
                <span className="font-medium">{t(dt.titleKey as Parameters<typeof t>[0])}</span>
              </button>
            );
          })}
        </div>
      </div> : null}

      {/* Courier forms — shown when courier type selected */}
      {isCourierType && (
        <div className="mt-4 space-y-4">
          <ShipmentForm
            direction="a_to_b"
            directionLabel={t("shipmentAtoB")}
            swapId={swap.id}
            onSave={handleSaveShipment}
            existing={shipmentAtoB}
            courierOptions={courierOptions}
          />
          <ShipmentForm
            direction="b_to_a"
            directionLabel={t("shipmentBtoA")}
            swapId={swap.id}
            onSave={handleSaveShipment}
            existing={shipmentBtoA}
            courierOptions={courierOptions}
          />
        </div>
      )}

      {/* Packaging materials — shown when courier type selected */}
      {isCourierType && (
        <PackagingSection userCountry={userCountry} objectCategory={objectCategory} />
      )}

      {/* Travel + Accommodation — shown when different countries */}
      {isCourierType && userCountry !== partnerCountry && (
        <TravelSection userCountry={userCountry} partnerCountry={partnerCountry} />
      )}

      {/* Delivery Timeline */}
      {shipments.length > 0 && (
        <div className="mt-4 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t("shipmentTimeline")}</h4>

          {shipmentAtoB && (
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t("shipmentAtoB")}</p>
                <Pill color={shipmentAtoB.status === "delivered" ? "green" : shipmentAtoB.status === "failed" ? "red" : "blue"}>
                  {t(`shipmentStatus${shipmentAtoB.status.charAt(0).toUpperCase() + shipmentAtoB.status.slice(1).replace(/_./g, (m) => m[1].toUpperCase())}` as Parameters<typeof t>[0])}
                </Pill>
              </div>
              {shipmentAtoB.courier && (
                <p className="text-xs text-zinc-500">{shipmentAtoB.courier} — AWB: {shipmentAtoB.awb || "—"}</p>
              )}
              <DeliveryTimeline shipment={shipmentAtoB} />
              {shipmentAtoB.trackingUrl && (
                <a
                  href={shipmentAtoB.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("openTracking")}
                </a>
              )}
              {/* Confirm received — shown to receiver (b) */}
              {shipmentAtoB.status !== "delivered" && !isRequester && (
                <button
                  type="button"
                  onClick={() => handleConfirmDelivery("a_to_b")}
                  className="mt-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  {t("confirmReceived")}
                </button>
              )}
              {confirmingDirection === "a_to_b" && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <Check className="h-3.5 w-3.5" /> {t("deliveryConfirmed")}
                </span>
              )}
            </div>
          )}

          {shipmentBtoA && (
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t("shipmentBtoA")}</p>
                <Pill color={shipmentBtoA.status === "delivered" ? "green" : shipmentBtoA.status === "failed" ? "red" : "blue"}>
                  {t(`shipmentStatus${shipmentBtoA.status.charAt(0).toUpperCase() + shipmentBtoA.status.slice(1).replace(/_./g, (m) => m[1].toUpperCase())}` as Parameters<typeof t>[0])}
                </Pill>
              </div>
              {shipmentBtoA.courier && (
                <p className="text-xs text-zinc-500">{shipmentBtoA.courier} — AWB: {shipmentBtoA.awb || "—"}</p>
              )}
              <DeliveryTimeline shipment={shipmentBtoA} />
              {shipmentBtoA.trackingUrl && (
                <a
                  href={shipmentBtoA.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("openTracking")}
                </a>
              )}
              {/* Confirm received — shown to receiver (a / requester) */}
              {shipmentBtoA.status !== "delivered" && isRequester && (
                <button
                  type="button"
                  onClick={() => handleConfirmDelivery("b_to_a")}
                  className="mt-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  {t("confirmReceived")}
                </button>
              )}
              {confirmingDirection === "b_to_a" && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <Check className="h-3.5 w-3.5" /> {t("deliveryConfirmed")}
                </span>
              )}
            </div>
          )}

          {/* Both delivered banner */}
          {bothDelivered && (
            <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950/30">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm font-semibold text-green-700 dark:text-green-300">
                {t("bothDelivered")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* No shipments hint */}
      {isCourierType && shipments.length === 0 && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">{t("noShipments")}</p>
      )}

      {/* Confirm receipt description */}
      {isCourierType && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{t("confirmReceivedDesc")}</p>
      )}
    </SectionCard>
  );
}
