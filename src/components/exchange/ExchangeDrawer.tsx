"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { SERVICE_DEFS } from "@/lib/exchange/exchangeServices";
import type { ServiceType } from "@/lib/exchange/exchangeServices";

interface Props {
  open: boolean;
  onClose: () => void;
  activeServices: ServiceType[];
  bilateralActive: ServiceType[];
  onToggle: (key: ServiceType) => void;
}

export function ExchangeDrawer({ open, onClose, activeServices, bilateralActive, onToggle }: Props) {
  const t = useTranslations("exchangePage");

  if (!open) return null;

  const groups = [
    { key: "bilateral" as const,   label: t("bilateral") },
    { key: "individual" as const,  label: t("individual") },
    { key: "additional" as const,  label: t("additional") },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-full flex-col bg-white shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">⚙️ {t("servicesTitle")}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

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
                        onClick={() => onToggle(svc.key)}
                        className="flex w-full items-center gap-2 rounded-xl border border-zinc-100 px-3 py-2 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
                      >
                        <span className={`text-base ${isChecked ? "opacity-100" : "opacity-40"}`}>
                          {isChecked ? "☑" : "☐"}
                        </span>
                        <span className="text-sm">{svc.icon}</span>
                        <span className={`text-sm ${isChecked ? "font-medium text-zinc-900 dark:text-zinc-50" : "text-zinc-500"}`}>
                          {t(svc.labelKey as Parameters<typeof t>[0])}
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
      </div>
    </>
  );
}
