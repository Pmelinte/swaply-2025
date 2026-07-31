"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { PublicPropertyDetail } from "@/lib/listings/publicListingDetails";
import {
  Bath,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Home,
  MapPin,
  ParkingCircle,
  PawPrint,
  Power,
  Ruler,
  ShieldCheck,
  Users,
  Wifi,
} from "lucide-react";

type PropertyResponse = {
  property?: PublicPropertyDetail;
  isOwner?: boolean;
  error?: string;
};

function formatDate(value: string | null): string {
  if (!value) return "Flexible";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

function yesNo(value: boolean | null): string {
  if (value === null) return "Not specified";
  return value ? "Yes" : "No";
}

export default function PropertyDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProperty() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/items/properties/${id}`, {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as
          | PropertyResponse
          | null;

        if (!response.ok) {
          throw new Error(body?.error ?? "Property unavailable");
        }
        if (!body?.property) {
          throw new Error("Property unavailable");
        }

        if (!cancelled) {
          setProperty(body.property);
          setIsOwner(Boolean(body.isOwner));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Property unavailable",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProperty();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const amenities = useMemo(() => {
    if (!property) return [];
    return [
      property.hasPool && "Swimming pool",
      property.hasHotTub && "Hot tub",
      property.hasSauna && "Sauna",
      property.hasGym && "Gym",
      property.hasTennisCourt && "Tennis court",
      property.hasBbq && "BBQ",
      property.hasFireplace && "Fireplace",
      property.hasEvCharger && "EV charger",
      property.wheelchairAccessible && "Wheelchair accessible",
      property.elevator && "Elevator",
    ].filter((value): value is string => Boolean(value));
  }, [property]);

  async function updateStatus(status: "paused" | "archived") {
    if (!property) return;
    setSavingStatus(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/${property.itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(body?.error ?? "Could not update property status");
      }
      router.push("/properties");
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Could not update property status",
      );
    } finally {
      setSavingStatus(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-zinc-500">
        Loading property…
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Property unavailable
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {error ?? "This property is unavailable or inactive."}
        </p>
        <Link
          href="/properties"
          className="mt-5 inline-flex rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          Back to properties
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Link
        href="/properties"
        className="inline-flex text-sm font-medium text-purple-700 hover:underline dark:text-purple-300"
      >
        ← Back to properties
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-5">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <SafeImage
              src={property.images[0] || NO_IMAGE_URL}
              alt={property.title}
              fill
              className="object-cover"
              unoptimized={!property.images[0]}
            />
          </div>

          {property.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {property.images.slice(1, 5).map((src) => (
                <div
                  key={src}
                  className="relative aspect-video overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                >
                  <SafeImage
                    src={src}
                    alt="Property photo"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                  <Home className="h-4 w-4" />
                  <span>{property.propertyType ?? "Property"}</span>
                  {property.propertyVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {property.title}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                  <MapPin className="h-4 w-4" />
                  {property.location || "Approximate location not specified"}
                </p>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() => void updateStatus("paused")}
                    className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    disabled={savingStatus}
                    onClick={() => void updateStatus("archived")}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    <Power className="h-3 w-3" /> Archive
                  </button>
                </div>
              )}
            </div>

            {property.description && (
              <p className="mt-5 whitespace-pre-line text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {property.description}
              </p>
            )}
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              icon={<BedDouble />}
              label="Bedrooms"
              value={property.bedrooms}
            />
            <Info
              icon={<Bath />}
              label="Bathrooms"
              value={property.bathrooms}
            />
            <Info
              icon={<Users />}
              label="Guests"
              value={property.sleepsMax}
            />
            <Info
              icon={<Ruler />}
              label="Surface"
              value={
                property.surfaceTotalSqm !== null
                  ? `${property.surfaceTotalSqm} m²`
                  : null
              }
            />
          </section>

          <Section title="Amenities">
            {amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            ) : (
              <p>No amenities listed.</p>
            )}
          </Section>

          <Section title="House rules">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoLine label="Smoking" value={yesNo(property.smokingAllowed)} />
              <InfoLine label="Parties" value={yesNo(property.partiesAllowed)} />
              <InfoLine label="Children" value={yesNo(property.childrenAllowed)} />
              <InfoLine label="Pets" value={yesNo(property.petsAllowed)} />
            </div>
            {property.additionalRules && (
              <p className="mt-3 whitespace-pre-line">{property.additionalRules}</p>
            )}
          </Section>
        </section>

        <aside className="space-y-4">
          <Section title="Availability">
            <div className="space-y-3">
              <InfoLine
                label="Available from"
                value={formatDate(property.availableFrom)}
              />
              <InfoLine
                label="Available until"
                value={formatDate(property.availableUntil)}
              />
              <InfoLine
                label="Minimum stay"
                value={
                  property.minStayDays !== null
                    ? `${property.minStayDays} days`
                    : "Flexible"
                }
              />
              <InfoLine
                label="Maximum stay"
                value={
                  property.maxStayDays !== null
                    ? `${property.maxStayDays} days`
                    : "Flexible"
                }
              />
              <InfoLine
                label="Check-in / Check-out"
                value={`${property.checkInTime ?? "Flexible"} / ${property.checkOutTime ?? "Flexible"}`}
              />
              <InfoLine
                label="Preferred seasons"
                value={property.preferredSeasons.join(", ") || "Any season"}
              />
            </div>
          </Section>

          <Section title="Exchange">
            <div className="space-y-3">
              <InfoLine
                label="Exchange type"
                value={property.exchangeType ?? "Flexible"}
              />
              <InfoLine
                label="Value tier"
                value={property.perceivedValueTier ?? "Not specified"}
              />
              <InfoLine
                label="Escrow required"
                value={yesNo(property.escrowRequired)}
              />
              {property.securityDepositEur !== null && (
                <InfoLine
                  label="Security deposit"
                  value={`€${property.securityDepositEur}`}
                />
              )}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm">
              {property.swapWantsDescription ?? "Open to fair exchanges."}
            </p>
          </Section>

          <Section title="Facilities">
            <div className="space-y-3">
              <InfoLine
                label="Parking"
                value={
                  property.parkingSpots !== null
                    ? `${property.parkingSpots} spaces`
                    : "Not specified"
                }
                icon={<ParkingCircle className="h-4 w-4" />}
              />
              <InfoLine
                label="Internet"
                value={
                  [
                    property.internetType,
                    property.internetSpeedMbps !== null
                      ? `${property.internetSpeedMbps} Mbps`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Not specified"
                }
                icon={<Wifi className="h-4 w-4" />}
              />
              <InfoLine
                label="Pets"
                value={yesNo(property.petsAllowed)}
                icon={<PawPrint className="h-4 w-4" />}
              />
            </div>
          </Section>

          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-100">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Temporary exchange only
            </div>
            <p className="mt-2 text-xs leading-5 text-purple-700 dark:text-purple-300">
              Property listings on Swaply are for temporary exchanges and stays,
              not property transfers or sales.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        <CalendarDays className="h-4 w-4 text-purple-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-purple-600">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {value ?? "—"}
      </p>
    </div>
  );
}

function InfoLine({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-2 last:border-0 last:pb-0 dark:border-zinc-800">
      <span className="flex items-center gap-1.5 text-zinc-500">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </span>
    </div>
  );
}
