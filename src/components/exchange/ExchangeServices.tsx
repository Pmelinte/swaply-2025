"use client";

import { useTranslations } from "next-intl";
import { EscrowService } from "./services/EscrowService";
import { PackagingService } from "./services/PackagingService";
import { TransportService } from "./services/TransportService";
import { AccommodationService } from "./services/AccommodationService";
import { RestaurantService } from "./services/RestaurantService";
import { InsuranceService } from "./services/InsuranceService";
import { CommercialServiceBoundary } from "./CommercialServiceBoundary";
import type { CommercialServiceOffer } from "@/lib/commerce/commercial-ui-contract";
import type { ServiceType, SupportService } from "@/lib/exchange/exchangeServices";

interface Props {
  swapId: string;
  activeServices: ServiceType[];
  services?: SupportService[];
  partnerCity?: string;
  agreedDate?: string;
  onSave: (type: ServiceType, details: Record<string, unknown>, cost?: number) => Promise<void>;
}

function toCommercialOffer(type: ServiceType, service?: SupportService): CommercialServiceOffer | null {
  if (!service || service.costEur === null || service.costEur === undefined) return null;

  const subtotalMinor = Math.max(0, Math.round(service.costEur * 100));
  return {
    id: service.id,
    providerId: service.provider?.trim() || "external provider",
    serviceType: type,
    title: type.replaceAll("_", " "),
    disclosure: "third-party",
    currency: "EUR",
    subtotalMinor,
    commissionMinor: 0,
    totalMinor: subtotalMinor,
    optional: true,
    providerUnavailable: service.status === "cancelled",
  };
}

export function ExchangeServices({
  swapId,
  activeServices,
  services = [],
  partnerCity,
  agreedDate,
  onSave,
}: Props) {
  const t = useTranslations("exchange.services");

  if (activeServices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
        {t("noServicesSelected")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeServices.map((type) => {
        const service = services.find((candidate) => candidate.serviceType === type);
        const offer = toCommercialOffer(type, service);
        const content = (
          <>
            {type === "escrow" && (
              <EscrowService
                swapId={swapId}
                onSave={(d, c) => onSave("escrow", d, c)}
              />
            )}
            {type === "packaging" && (
              <PackagingService onSave={(d) => onSave("packaging", d)} />
            )}
            {type === "transport" && (
              <TransportService onSave={(d, c) => onSave("transport", d, c)} />
            )}
            {type === "accommodation" && (
              <AccommodationService partnerCity={partnerCity} agreedDate={agreedDate} />
            )}
            {type === "restaurant" && (
              <RestaurantService partnerCity={partnerCity} agreedDate={agreedDate} />
            )}
            {type === "insurance" && (
              <InsuranceService onSave={(d, c) => onSave("insurance", d, c)} />
            )}
            {(type === "legal" || type === "ai_valuation") && (
              <div className="py-2 text-center text-sm text-zinc-400">
                {t("comingSoon")}
              </div>
            )}
          </>
        );

        return (
          <div key={type} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
            {offer ? <CommercialServiceBoundary offer={offer}>{content}</CommercialServiceBoundary> : content}
          </div>
        );
      })}
    </div>
  );
}
