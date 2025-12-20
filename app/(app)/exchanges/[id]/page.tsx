// src/app/(app)/exchanges/[id]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import Actions from "./Actions";
import ShippingForm from "./ShippingForm";
import ReceiveConfirmation from "./ReceiveConfirmation";
import RateForm from "./RateForm";

interface PageProps {
  params: { id: string };
}

export default async function ExchangePage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const exchangeId = params.id;

  const { data: exchange, error } = await supabase
    .from("exchanges")
    .select("*")
    .eq("id", exchangeId)
    .single();

  if (error || !exchange) redirect("/");

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <Actions exchangeId={exchange.id} status={exchange.status} />
      <ShippingForm exchangeId={exchange.id} status={exchange.status} />
      <ReceiveConfirmation exchangeId={exchange.id} status={exchange.status} />

      {/* ⭐ Formular review (doar după completed) */}
      <RateForm exchangeId={exchange.id} viewerId={user.id} status={exchange.status} />
    </div>
  );
}
