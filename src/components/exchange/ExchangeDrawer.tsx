"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { SERVICE_DEFS } from "@/lib/exchange/exchangeServices";
import type { ServiceType } from "@/lib/exchange/exchangeServices";

interface Props {
  activeServices: ServiceType[];
  agreedBilateral: ServiceType[];
  onToggle: (key: ServiceType) => void | Promise<void>;
  onClose?: () => void;
}

const GROUPS: Array<{ key: "bilateral" | "individual" | "additional"; labelKey: string }> = [
  { key: "bilateral",  labelKey: "bilateral" },
  { key: "individual", labelKey: "individual" },
  { key: "additional", labelKey: "additional" },
];

export function ExchangeDrawer({
  activeServices,
  agreedBilateral,
  onToggle,
  onClose,
}: Props) {
  const t = useTranslations("exchange.drawer");
  const tServices = useTranslations("exchange.services");

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          ⚙️ {t("title")}
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Service groups */}
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {GROUPS.map((group) => {
          const items = SERVICE_DEFS.filter((s) => s.group === group.key);
          return (
            <div key={group.key}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                {t(group.labelKey)}
              </p>
              <div className="space-y-1.5">
                {items.map((svc) => {
                  const isAgreedBilateral = agreedBilateral.includes(svc.key);
                  const isChecked = activeServices.includes(svc.key) || isAgreedBilateral;
                  return (
                    <button
                      key={svc.key}
                      type="button"
                      onClick={() => void onToggle(svc.key)}
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
                      {isAgreedBilateral && (
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
    </div>
  );
}
