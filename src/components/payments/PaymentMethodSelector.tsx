"use client";

import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

export type PaymentMethod = "card" | "paypal";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({ selected, onChange, disabled }: PaymentMethodSelectorProps) {
  const t = useTranslations("payments");

  const methods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    {
      id: "card",
      label: t("cardStripe"),
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      id: "paypal",
      label: "PayPal",
      icon: (
        <span className="text-sm font-bold text-[#003087]">P</span>
      ),
    },
  ];

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
        {t("paymentMethod")}
      </p>
      <div className="flex gap-2">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(method.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
              selected === method.id
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/30 dark:text-blue-300"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
            } disabled:opacity-50`}
          >
            {method.icon}
            {method.label}
          </button>
        ))}
      </div>
    </div>
  );
}
