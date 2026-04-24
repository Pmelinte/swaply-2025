"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useAppState } from "@/lib/state";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { getSupabaseClient } from "@/lib/supabase/client";
import { SERVICE_DEFS, upsertService, removeService } from "@/lib/exchange/exchangeServices";
import type { ServiceType } from "@/lib/exchange/exchangeServices";

interface Props {
  swapId: string;
}

export default function DrawerExchange({ swapId }: Props) {
  const t = useTranslations("exchange.drawer");
  const tServices = useTranslations("exchange.services");
  const close = useDrawerStore((s) => s.close);
  const { user } = useAppState();

  const [activeServices, setActiveServices] = useState<ServiceType[]>([]);
  const [bilateralActive, setBilateralActive] = useState<ServiceType[]>([]);

  // Load active services for this swap on mount / swapId change
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !swapId || !user?.id) return;

    void supabase
      .from("swap_support_services")
      .select("service_type, is_bilateral, user_id")
      .eq("swap_id", swapId)
      .eq("status", "active")
      .then(({ data }) => {
        if (!data) return;

        const rows = data as Array<{
          service_type: ServiceType;
          is_bilateral: boolean;
          user_id: string;
        }>;

        const myRows = rows.filter((r) => r.user_id === user.id);
        const myTypes = myRows.map((r) => r.service_type);

        const partnerTypes = new Set(
          rows.filter((r) => r.user_id !== user.id).map((r) => r.service_type),
        );
        const bilateral = myRows
          .filter((r) => r.is_bilateral && partnerTypes.has(r.service_type))
          .map((r) => r.service_type);

        setActiveServices(myTypes);
        setBilateralActive(bilateral);
      });
  }, [swapId, user?.id]);

  const handleToggle = useCallback(
    async (key: ServiceType) => {
      if (!user?.id) return;

      if (activeServices.includes(key)) {
        await removeService(swapId, user.id, key);
        setActiveServices((prev) => prev.filter((s) => s !== key));
        setBilateralActive((prev) => prev.filter((s) => s !== key));
      } else {
        const def = SERVICE_DEFS.find((s) => s.key === key);
        await upsertService(swapId, user.id, key, {}, def?.bilateral ?? false);
        setActiveServices((prev) => [...prev, key]);
      }
    },
    [swapId, user?.id, activeServices],
  );

  const groups = [
    { key: "bilateral" as const,  label: t("bilateral") },
    { key: "individual" as const, label: t("individual") },
    { key: "additional" as const, label: t("additional") },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">⚙️ {t("title")}</h2>
        <button
          type="button"
          onClick={close}
          className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5 text-zinc-500" />
        </button>
      </div>

      {/* Service groups */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {groups.map((group) => {
          const items = SERVICE_DEFS.filter((s) => s.group === group.key);
          return (
            <div key={group.key}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {items.map((svc) => {
                  const isBilateralOn = bilateralActive.includes(svc.key);
                  const isChecked = activeServices.includes(svc.key) || isBilateralOn;
                  return (
                    <button
                      key={svc.key}
                      type="button"
                      onClick={() => void handleToggle(svc.key)}
                      className="flex w-full items-center gap-2 rounded-xl border border-zinc-100 px-3 py-2 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    >
                      <span className={`text-base ${isChecked ? "opacity-100" : "opacity-40"}`}>
                        {isChecked ? "☑" : "☐"}
                      </span>
                      <span className="text-sm">{svc.icon}</span>
                      <span
                        className={`text-sm ${
                          isChecked
                            ? "font-medium text-zinc-900 dark:text-zinc-50"
                            : "text-zinc-500"
                        }`}
                      >
                        {tServices(svc.labelKey)}
                      </span>
                      {isBilateralOn && (
                        <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          ✅
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
