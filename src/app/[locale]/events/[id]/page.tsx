"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/SafeImage";
import { DomainListingOwnerActions } from "@/components/listings/DomainListingOwnerActions";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { PublicEventDetail } from "@/lib/listings/publicListingDetails";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Globe2,
  MapPin,
  Route,
  ShieldAlert,
  Star,
  Ticket,
  Users,
} from "lucide-react";

type LifecycleStatus = "active" | "paused" | "archived";

type EventResponse = {
  event?: PublicEventDetail;
  isOwner?: boolean;
  status?: LifecycleStatus;
  revision?: number;
  error?: string;
};

function formatDate(value: string | null): string {
  if (!value) return "Not specified";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not specified";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function yesNo(value: boolean | null): string {
  if (value === null) return "Not specified";
  return value ? "Yes" : "No";
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<PublicEventDetail | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState<LifecycleStatus>("active");
  const [revision, setRevision] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/items/events/${id}`, {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as
          | EventResponse
          | null;
        if (!response.ok) {
          throw new Error(body?.error ?? "Event unavailable");
        }
        if (!body?.event) {
          throw new Error("Event unavailable");
        }

        if (!cancelled) {
          setEvent(body.event);
          setIsOwner(Boolean(body.isOwner));
          if (body.status) setStatus(body.status);
          if (
            typeof body.revision === "number" &&
            Number.isInteger(body.revision) &&
            body.revision >= 1
          ) {
            setRevision(body.revision);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Event unavailable",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEvent();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const included = useMemo(() => {
    if (!event) return [];
    return [
      event.includesTransport && "Transport",
      event.includesAccommodation && "Accommodation",
      event.includesMeals && "Meals",
      event.includesEquipment && "Equipment",
      event.includesGuide && "Guide",
      ...event.extras,
    ].filter((value): value is string => Boolean(value));
  }, [event]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Loading event…</div>;
  }

  if (error || !event) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Event unavailable
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {error ?? "This event is unavailable or inactive."}
        </p>
        <Link
          href="/events"
          className="mt-5 inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
        >
          Back to events
        </Link>
      </main>
    );
  }

  const proposalAllowed = event.isTransferable !== false && !isOwner;
  const ageLabel =
    event.ageMin !== null || event.ageMax !== null
      ? `${event.ageMin ?? 0}${event.ageMax !== null ? `–${event.ageMax}` : "+"}`
      : "No stated restriction";

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Link
        href="/events"
        className="inline-flex text-sm font-medium text-amber-700 hover:underline dark:text-amber-300"
      >
        ← Back to events
      </Link>

      {isOwner && (
        <DomainListingOwnerActions
          domain="event"
          itemId={event.itemId}
          initialStatus={status}
          initialRevision={revision}
        />
      )}

      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <SafeImage
          src={event.images[0] || NO_IMAGE_URL}
          alt={event.title}
          fill
          className="object-cover"
          unoptimized={!event.images[0]}
        />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-300">
              <Ticket className="h-4 w-4" />
              {event.eventGroup ?? "Event"}
              {event.eventCategory ? ` · ${event.eventCategory}` : ""}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {event.title}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
              {event.locationType === "online" ? (
                <Globe2 className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {event.location || "Approximate location not specified"}
            </p>
          </div>

          {isOwner && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Your listing
            </span>
          )}
        </div>

        {event.description && (
          <p className="mt-5 whitespace-pre-line text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {event.description}
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info
          icon={<CalendarDays />}
          label="Start"
          value={`${formatDate(event.startDate)}${event.startTime ? ` · ${event.startTime}` : ""}`}
        />
        <Info
          icon={<Clock />}
          label="End"
          value={`${formatDate(event.endDate)}${event.endTime ? ` · ${event.endTime}` : ""}`}
        />
        <Info
          icon={<Users />}
          label="Availability"
          value={
            event.capacityAvailable !== null
              ? `${event.capacityAvailable}/${event.capacityTotal ?? "—"} places`
              : event.capacityTotal !== null
                ? `${event.capacityTotal} total places`
                : "Not specified"
          }
        />
        <Info
          icon={<Star />}
          label="Rating"
          value={
            event.averageRating !== null
              ? `${event.averageRating.toFixed(1)} (${event.reviewCount ?? 0})`
              : "New listing"
          }
        />
      </section>

      {event.isTransferable === false && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" /> Transfer is not currently allowed
          </div>
          <p className="mt-2 text-xs leading-5 text-red-700 dark:text-red-300">
            The listing is marked as non-transferable. A proposal cannot be
            started until the owner confirms that the issuer or venue permits
            transfer.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Schedule and participation">
          <div className="space-y-3">
            <InfoLine label="Timezone" value={event.timezone ?? "Not specified"} />
            <InfoLine
              label="Recurring"
              value={
                event.isRecurring
                  ? event.recurrencePattern ?? "Yes"
                  : event.isRecurring === false
                    ? "No"
                    : "Not specified"
              }
            />
            <InfoLine label="Age" value={ageLabel} />
            <InfoLine
              label="Suitable for"
              value={event.suitableFor.join(", ") || "Not specified"}
            />
            <InfoLine
              label="Minimum participants"
              value={
                event.minParticipants !== null
                  ? String(event.minParticipants)
                  : "Not specified"
              }
            />
            <InfoLine
              label="Maximum participants"
              value={
                event.maxParticipants !== null
                  ? String(event.maxParticipants)
                  : "Not specified"
              }
            />
          </div>
        </Section>

        <Section title="Transfer and access">
          <div className="space-y-3">
            <InfoLine
              label="Transferable"
              value={yesNo(event.isTransferable)}
            />
            <InfoLine
              label="Face value"
              value={
                event.faceValueEur !== null
                  ? `€${event.faceValueEur}`
                  : "Not specified"
              }
            />
            <InfoLine
              label="Hospitality"
              value={yesNo(event.hasHospitality)}
            />
            <InfoLine
              label="Section / Block / Row"
              value={
                [event.venueSection, event.venueBlock, event.venueRow]
                  .filter(Boolean)
                  .join(" / ") || "Shared after match if needed"
              }
            />
          </div>
          {event.hospitalityDetails && (
            <p className="mt-4 whitespace-pre-line text-sm">
              {event.hospitalityDetails}
            </p>
          )}
        </Section>

        {(event.route || event.transportMode || event.departureDatetime) && (
          <Section title="Transport and route">
            <div className="space-y-3">
              <InfoLine
                label="Route"
                value={event.route || "Not specified"}
                icon={<Route className="h-4 w-4" />}
              />
              <InfoLine
                label="Distance"
                value={
                  event.routeTotalKm !== null
                    ? `${event.routeTotalKm} km`
                    : "Not specified"
                }
              />
              <InfoLine
                label="Transport"
                value={
                  [
                    event.transportMode,
                    event.transportCarrier,
                    event.transportClass,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Not specified"
                }
              />
              <InfoLine
                label="Departure"
                value={formatDateTime(event.departureDatetime)}
              />
              <InfoLine
                label="Arrival"
                value={formatDateTime(event.arrivalDatetime)}
              />
            </div>
          </Section>
        )}

        {(event.includesAccommodation || event.accommodationType) && (
          <Section title="Accommodation">
            <div className="space-y-3">
              <InfoLine
                label="Type"
                value={event.accommodationType ?? "Included"}
              />
              <InfoLine
                label="Room"
                value={event.accommodationRoomType ?? "Not specified"}
              />
              <InfoLine
                label="Board"
                value={event.accommodationBoard ?? "Not specified"}
              />
              <InfoLine
                label="Check-in"
                value={formatDate(event.checkInDate)}
              />
              <InfoLine
                label="Check-out"
                value={formatDate(event.checkOutDate)}
              />
              <InfoLine
                label="Nights"
                value={
                  event.nightsCount !== null
                    ? String(event.nightsCount)
                    : "Not specified"
                }
              />
            </div>
          </Section>
        )}

        <Section title="What is included">
          {included.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {included.map((entry) => (
                <span
                  key={entry}
                  className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  {entry}
                </span>
              ))}
            </div>
          ) : (
            <p>No additional package is specified.</p>
          )}
        </Section>

        <Section title="Exchange terms">
          <div className="space-y-3">
            <InfoLine
              label="Open to"
              value={event.swapOpenTo.join(", ") || "Fair exchanges"}
            />
            <InfoLine
              label="Value tier"
              value={event.swapWantsValueTier ?? "Not specified"}
            />
            <InfoLine
              label="Partial swap"
              value={yesNo(event.partialSwapAllowed)}
            />
            <InfoLine
              label="Escrow accepted"
              value={yesNo(event.escrowAccepted)}
            />
          </div>
          <p className="mt-4 whitespace-pre-line text-sm">
            {event.swapWantsDescription ??
              event.exchangeValueDescription ??
              "Open to fair exchanges."}
          </p>
        </Section>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {proposalAllowed ? (
          <Link
            href={`/matching?target=${event.itemId}`}
            className="rounded-2xl bg-amber-500 px-5 py-4 text-center text-sm font-bold text-white shadow-sm hover:bg-amber-600"
          >
            Propose ticket or reservation swap
          </Link>
        ) : (
          <div className="rounded-2xl bg-zinc-200 px-5 py-4 text-center text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {isOwner ? "This is your event listing" : "Transfer unavailable"}
          </div>
        )}
        <Link
          href="/exchange"
          className="rounded-2xl border border-zinc-200 px-5 py-4 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Continue in chat and Exchange after a match
        </Link>
      </section>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4" /> Verify issuer rules before exchange
        </div>
        <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
          Booking references, exact seats, access links and private transfer
          instructions are not exposed publicly. Share them only after a match
          and agreement.
        </p>
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
        <CalendarDays className="h-4 w-4 text-amber-600" />
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
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-amber-600">
        <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
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
