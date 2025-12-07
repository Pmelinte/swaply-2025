// src/app/(app)/exchanges/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { exchangeRepository } from "@/features/exchange/server/exchange-repository";

export default async function MyExchangesPage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const exchanges = await exchangeRepository.listExchangesForUser(user.id);

  const active = exchanges.filter((e: any) =>
    ["pending", "negotiating", "accepted", "shipping"].includes(e.status)
  );

  const completed = exchanges.filter((e: any) => e.status === "completed");
  const cancelled = exchanges.filter((e: any) => e.status === "cancelled");

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Schimburile mele</h1>

      {/* ACTIVE */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Active</h2>
        {active.length === 0 ? (
          <p className="text-gray-600 text-sm">Nu ai schimburi active.</p>
        ) : (
          <div className="space-y-3">
            {active.map((ex: any) => (
              <ExchangeRow key={ex.id} exchange={ex} />
            ))}
          </div>
        )}
      </section>

      {/* COMPLETED */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Finalizate</h2>
        {completed.length === 0 ? (
          <p className="text-gray-600 text-sm">Nu ai schimburi finalizate.</p>
        ) : (
          <div className="space-y-3">
            {completed.map((ex: any) => (
              <ExchangeRow key={ex.id} exchange={ex} />
            ))}
          </div>
        )}
      </section>

      {/* CANCELLED */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Anulate</h2>
        {cancelled.length === 0 ? (
          <p className="text-gray-600 text-sm">Nu ai schimburi anulate.</p>
        ) : (
          <div className="space-y-3">
            {cancelled.map((ex: any) => (
              <ExchangeRow key={ex.id} exchange={ex} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ExchangeRow({ exchange }: { exchange: any }) {
  return (
    <a
      href={`/exchanges/${exchange.id}`}
      className="block p-4 border rounded-xl bg-gray-50 hover:bg-gray-100 transition"
    >
      <p className="font-semibold">Schimb #{exchange.id}</p>
      <p className="text-sm text-gray-600">
        Status: {formatStatus(exchange.status)}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Creat la {exchange.created_at?.slice(0, 10)}
      </p>
    </a>
  );
}

function formatStatus(status: string) {
  switch (status) {
    case "pending":
      return "În așteptare";
    case "negotiating":
      return "În negociere";
    case "accepted":
      return "Acceptat";
    case "shipping":
      return "În livrare";
    case "completed":
      return "Finalizat";
    case "cancelled":
      return "Anulat";
    default:
      return status;
  }
}
