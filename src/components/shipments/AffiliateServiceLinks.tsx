"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Package, Train } from "lucide-react";

interface ServiceItem {
  name: string;
  websiteUrl: string;
  logoUrl?: string | null;
  isLocal?: boolean;
  isNational?: boolean;
  isRegional?: boolean;
}

/* ── Reusable service link card ── */
function ServiceCard({ service }: { service: ServiceItem }) {
  return (
    <a
      href={service.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition hover:border-blue-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-700"
    >
      {service.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={service.logoUrl} alt="" className="h-5 w-5 rounded object-contain" />
      ) : (
        <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" />
      )}
      <span className="flex-1 truncate font-medium text-zinc-700 dark:text-zinc-200">
        {service.name}
      </span>
      {(service.isLocal || service.isNational || service.isRegional) && (
        <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          Local
        </span>
      )}
      <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-400 dark:bg-zinc-700 dark:text-zinc-500">
        Affiliate
      </span>
    </a>
  );
}

/* ── Packaging Section ── */
export function PackagingSection({
  userCountry,
  objectCategory,
}: {
  userCountry?: string;
  objectCategory?: string;
}) {
  const t = useTranslations("change");
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (userCountry) params.set("country", userCountry);
    if (objectCategory) params.set("category", objectCategory);

    fetch(`/api/services/packaging?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.services) setServices(data.services);
        if (data?.recommendation) setRecommendation(data.recommendation);
      })
      .catch(() => {});
  }, [userCountry, objectCategory]);

  if (services.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        <Package className="h-4 w-4 text-amber-500" />
        {t("packagingTitle")}
      </h4>
      {recommendation && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {t(recommendation as Parameters<typeof t>[0])}
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {services.slice(0, 4).map((s) => (
          <ServiceCard key={s.name} service={s} />
        ))}
      </div>
    </div>
  );
}

/* ── Transport + Accommodation Section ── */
export function TravelSection({
  userCountry,
  partnerCountry,
}: {
  userCountry?: string;
  partnerCountry?: string;
}) {
  const t = useTranslations("change");
  const [transport, setTransport] = useState<ServiceItem[]>([]);
  const [accommodation, setAccommodation] = useState<ServiceItem[]>([]);

  useEffect(() => {
    const tParams = new URLSearchParams();
    if (userCountry) tParams.set("country", userCountry);
    if (partnerCountry) tParams.set("partnerCountry", partnerCountry);

    fetch(`/api/services/transport?${tParams}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.services) setTransport(data.services); })
      .catch(() => {});

    const aParams = new URLSearchParams();
    if (userCountry) aParams.set("country", userCountry);

    fetch(`/api/services/accommodation?${aParams}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.services) setAccommodation(data.services); })
      .catch(() => {});
  }, [userCountry, partnerCountry]);

  if (transport.length === 0 && accommodation.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        <Train className="h-4 w-4 text-emerald-500" />
        {t("travelTitle")}
      </h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("travelDesc")}</p>

      {transport.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("transportLabel")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {transport.slice(0, 4).map((s) => (
              <ServiceCard key={s.name} service={s} />
            ))}
          </div>
        </div>
      )}

      {accommodation.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("accommodationLabel")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {accommodation.slice(0, 4).map((s) => (
              <ServiceCard key={s.name} service={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
