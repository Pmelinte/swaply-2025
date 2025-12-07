// src/app/(app)/exchanges/[id]/page.tsx

import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getExchangeAction } from "@/features/exchange/server/exchange-actions";
import type { Exchange } from "@/features/exchange/types";

import Timeline from "./timeline";
import Offers from "./offers";
import OfferForm from "./OfferForm";
import Actions from "./Actions";
import ShippingForm from "./ShippingForm";
import ReceiveConfirmation from "./ReceiveConfirmation";
import RateForm from "./RateForm";

interface ExchangePageProps {
  params: { id: string };
}

export default async function ExchangePage({ params }: ExchangePageProps) {
  const exchangeId = params.id;

  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const exchange: Exchange | null = await getExchangeAction(exchangeId);
  if (!exchange) notFound();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Schimb #{exchange.id}</h1>

      {/* Status */}
      <div className="p-4 border rounded-xl bg-gray-50">
        <p className="font-semibold text-lg">
          Status:{" "}
          <span className="capitalize text-blue-700">{exchange.status}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Creat la {exchange.createdAt.slice(0, 10)}
        </p>
      </div>

      <OfferForm exchangeId={exchange.id} />
      <Actions exchangeId={exchange.id} status={exchange.status} />
      <ShippingForm exchangeId={exchange.id} status={exchange.status} />
      <ReceiveConfirmation exchangeId={exchange.id} status={exchange.status} />

      {/* ⭐ Formular review (doar după completed) */}
      <RateForm
        exchangeId={exchange.id}
        viewerId={user.id}
        reviews={exchange.reviews ?? []}
        status={exchange.status}
      />

      <Offers exchange={exchange} currentUserId={user.id} />
      <Timeline updates={exchange.updates} />
    </div>
  );
}
