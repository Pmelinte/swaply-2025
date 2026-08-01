"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/SafeImage";
import { DomainListingOwnerActions } from "@/components/listings/DomainListingOwnerActions";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { PublicServiceDetail } from "@/lib/listings/publicListingDetails";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Globe2,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";

type LifecycleStatus = "active" | "paused" | "archived";

type ServiceResponse = {
  service?: PublicServiceDetail;
  isOwner?: boolean;
  status?: LifecycleStatus;
  revision?: number;
  error?: string;
};

type InterestStatus = "idle" | "sending" | "sent" | "error";

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

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<PublicServiceDetail | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState<LifecycleStatus>("active");
  const [revision, setRevision] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestStatus, setInterestStatus] = useState<InterestStatus>("idle");
  const [interestMessage, setInterestMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadService() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/items/services/${id}`, {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as
          | ServiceResponse
          | null;
        if (!response.ok) {
          throw new Error(body?.error ?? "Service unavailable");
        }
        if (!body?.service) {
          throw new Error("Service unavailable");
        }

        if (!cancelled) {
          setService(body.service);
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
            loadError instanceof Error
              ? loadError.message
              : "Service unavailable",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadService();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const serviceArea = useMemo(() => {
    if (!service) return "Not specified";
    const places = [
      ...service.serviceAreaCities,
      ...service.serviceAreaCountries,
    ];
    if (places.length > 0) return places.join(", ");
    if (service.serviceAreaRadiusKm !== null) {
      return `Within ${service.serviceAreaRadiusKm} km`;
    }
    return service.deliveryMode === "remote" ? "Remote" : "Not specified";
  }, [service]);

  async function proposeServiceExchange() {
    if (!service) return;
    setInterestStatus("sending");
    setInterestMessage("");

    const response = await fetch(
      `/api/items/services/${service.itemId}/interest`,
      { method: "POST" },
    );
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (response.ok) {
      setInterestStatus("sent");
      setInterestMessage(
        "Service exchange proposal sent. The owner can review it from matching interests.",
      );
      return;
    }

    setInterestStatus("error");
    setInterestMessage(
      body?.error ?? "Could not send the service exchange proposal.",
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400">Loading service…</div>
    );
  }

  if (error || !service) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Service unavailable
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {error ?? "This service is unavailable or inactive."}
        </p>
        <Link
          href="/services"
          className="mt-5 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Back to services
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <Link
        href="/services"
        className="inline-flex text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
      >
        ← Back to services
      </Link>

      {isOwner && (
        <DomainListingOwnerActions
          domain="service"
          itemId={service.itemId}
          initialStatus={status}
          initialRevision={revision}
        />
      )}

      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <SafeImage
          src={service.images[0] || NO_IMAGE_URL}
          alt={service.title}
          fill
          className="object-cover"
          unoptimized={!service.images[0]}
        />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
              <Wrench className="h-4 w-4" />
              {service.categoryL1 ?? "Service"}
              {service.categoryL2 ? ` · ${service.categoryL2}` : ""}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {service.title}
            </h1>
            {service.serviceNameLocal &&
              service.serviceNameLocal !== service.title && (
                <p className="mt-1 text-sm text-zinc-500">
                  {service.serviceNameLocal}
                </p>
              )}
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                Your listing
              </span>
            )}
            {service.isLicensed && <TrustBadge label="Licensed" />}
            {service.isInsured && <TrustBadge label="Insured" />}
            {service.isCertified && <TrustBadge label="Certified" />}
          </div>
        </div>

        {service.description && (
          <p className="mt-5 whitespace-pre-line text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {service.description}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {!isOwner && (
            <button
              type="button"
              onClick={() => void proposeServiceExchange()}
              disabled={
                interestStatus === "sending" || interestStatus === "sent"
              }
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {interestStatus === "sending"
                ? "Sending proposal…"
                : interestStatus === "sent"
                  ? "Proposal sent"
                  : "Propose service exchange"}
            </button>
          )}
          <a
            href="#availability"
            className="rounded-full border border-zinc-300 px-5 py-2 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Check availability
          </a>
        </div>

        {interestMessage && (
          <p
            className={`mt-3 text-sm ${
              interestStatus === "error" ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {interestMessage}
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info
          icon={<Globe2 />}
          label="Delivery"
          value={service.deliveryMode ?? "Flexible"}
        />
        <Info
          icon={<MapPin />}
          label="Service area"
          value={serviceArea}
        />
        <Info
          icon={<Award />}
          label="Experience"
          value={
            service.experienceYears !== null
              ? `${service.experienceYears} years`
              : service.skillLevel ?? "Not specified"
          }
        />
        <Info
          icon={<Star />}
          label="Rating"
          value={
            service.averageRating !== null
              ? `${service.averageRating.toFixed(1)} (${service.reviewCount ?? 0})`
              : "New listing"
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Availability" id="availability">
          <div className="space-y-3">
            <InfoLine
              label="Days"
              value={service.availableDays.join(", ") || "Flexible"}
            />
            <InfoLine
              label="Hours"
              value={`${service.availableFromTime ?? "Flexible"} – ${service.availableUntilTime ?? "Flexible"}`}
            />
            <InfoLine
              label="Available from"
              value={formatDate(service.availableDateFrom)}
            />
            <InfoLine
              label="Available until"
              value={formatDate(service.availableDateUntil)}
            />
            <InfoLine
              label="Advance notice"
              value={
                service.leadTimeDays !== null
                  ? `${service.leadTimeDays} days`
                  : "Coordinate in chat"
              }
            />
            <InfoLine
              label="Concurrent jobs"
              value={
                service.maxConcurrentJobs !== null
                  ? String(service.maxConcurrentJobs)
                  : "Not specified"
              }
            />
          </div>
        </Section>

        <Section title="Scope and delivery">
          <div className="space-y-3">
            <InfoLine
              label="Typical duration"
              value={
                service.estimatedHours !== null
                  ? `${service.estimatedHours} hours`
                  : service.estimatedDays !== null
                    ? `${service.estimatedDays} days`
                    : "To be agreed"
              }
            />
            <InfoLine
              label="Travel included"
              value={yesNo(service.travelIncluded)}
            />
            <InfoLine
              label="Languages"
              value={service.serviceLanguages.join(", ") || "Not specified"}
              icon={<Languages className="h-4 w-4" />}
            />
          </div>
          {service.scopeDescription && (
            <p className="mt-4 whitespace-pre-line text-sm">
              {service.scopeDescription}
            </p>
          )}
          {service.deliverables.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Deliverables
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {service.deliverables.map((deliverable) => (
                  <li key={deliverable} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Exchange terms">
          <div className="space-y-3">
            <InfoLine
              label="Open to"
              value={service.swapOpenTo.join(", ") || "Fair exchanges"}
            />
            <InfoLine
              label="Value tier"
              value={service.swapWantsValueTier ?? "Not specified"}
            />
            <InfoLine
              label="Partial swap"
              value={yesNo(service.partialSwapAllowed)}
            />
            <InfoLine
              label="Escrow accepted"
              value={yesNo(service.escrowAccepted)}
            />
          </div>
          <p className="mt-4 whitespace-pre-line text-sm">
            {service.swapWantsDescription ?? "Open to fair exchanges."}
          </p>
        </Section>

        {(service.certifications.length > 0 || service.portfolioUrl) && (
          <Section title="Portfolio and certifications">
            {service.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.certifications.map((certification) => (
                  <span
                    key={certification}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    {certification}
                  </span>
                ))}
              </div>
            )}
            {service.portfolioUrl && (
              <a
                href={service.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Open portfolio
              </a>
            )}
          </Section>
        )}
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4" /> Agree on scope before exchange
        </div>
        <p className="mt-2 text-xs leading-5 text-emerald-700 dark:text-emerald-300">
          Confirm availability, deliverables, timing and any professional
          authorization in Swaply chat before creating the Exchange.
        </p>
      </div>
    </main>
  );
}

function TrustBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      <ShieldCheck className="h-3 w-3" /> {label}
    </span>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
    >
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        <CalendarDays className="h-4 w-4 text-emerald-600" />
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
      <div className="flex items-center gap-2 text-emerald-600">
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
