"use client";

import { useTranslations } from "next-intl";
import { EscrowService } from "./services/EscrowService";
import { PackagingService } from "./services/PackagingService";
import { TransportService } from "./services/TransportService";
import { AccommodationService } from "./services/AccommodationService";
import { RestaurantService } from "./services/RestaurantService";
import { InsuranceService } from "./services/InsuranceService";
import type { ServiceType } from "@/lib/exchange/exchangeServices";

interface Props {
  swapId: string;
  activeServices: ServiceType[];
  partnerCity?: string;
  agreedDate?: string;
  onSave: (type: ServiceType, details: Record<string, unknown>, cost?: number) => Promise<void>;
}

export function ExchangeServices({ swapId, activeServices, partnerCity, agreedDate, onSave }: Props) {
  const t = useTranslations("exchangePage");

  if (activeServices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
        {t("noServicesSelected")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeServices.map((type) => (
        <div key={type} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
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
        </div>
      ))}
    </div>
  );
}
