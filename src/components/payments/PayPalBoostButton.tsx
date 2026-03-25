"use client";

import { PayPalButtons } from "@paypal/react-paypal-js";
import { useTranslations } from "next-intl";

interface PayPalBoostButtonProps {
  itemId: string;
  userId: string;
  duration: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PayPalBoostButton({ itemId, userId, duration, onSuccess, onError }: PayPalBoostButtonProps) {
  const t = useTranslations("payments");

  return (
    <PayPalButtons
      style={{ layout: "horizontal", height: 40, tagline: false }}
      createOrder={async () => {
        try {
          const res = await fetch("/api/payments/paypal/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              packageId: `boost_${duration}`,
              userId,
              itemId,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.orderId) {
            onError(data.error ?? t("paypalError"));
            return "";
          }
          return data.orderId;
        } catch {
          onError(t("paypalError"));
          return "";
        }
      }}
      onApprove={async (data) => {
        try {
          const res = await fetch("/api/payments/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const result = await res.json();
          if (result.success) {
            onSuccess();
          } else {
            onError(result.error ?? t("paypalCaptureFailed"));
          }
        } catch {
          onError(t("paypalError"));
        }
      }}
      onError={() => {
        onError(t("paypalError"));
      }}
    />
  );
}
