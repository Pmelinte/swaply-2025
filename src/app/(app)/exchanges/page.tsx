// src/app/(app)/exchanges/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { exchangeRepository } from "@/features/exchange/server/exchange-repository";
import type { Exchange } from "@/features/exchange/types";
import Link from "next/link";

export default async function ExchangesPage() {
  const supabase = createServerClient();

  // verificăm user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // încărcăm schimburile userului
  const { data: exchangeRows, error } = await supabase
    .from("exchanges")
    .select("*")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("ExchangesPage error:", error);
  }

  // map simple (ofertele si updates sunt in detaliu)
  const exchanges: Exchange[] = (exchangeRows ?? []).map((row: any) => ({
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    status: row.status,
    offers: [],
    updates: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Schimburile tale</h1>

      {exchanges.length === 0 && (
        <p className="text-gray-600 text-sm">
          Nu ai început niciun schimb. Poți porni unul dintr-un match activ.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {exchanges.map((ex) => (
          <Link
            href={`/exchanges/${ex.id}`}
            key={ex.id}
            className="border rounded-xl p-4 hover:bg-gray-50 transition flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">Schimb #{ex.id}</p>
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span className="font-medium capitalize">{ex.status}</span>
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Ultima actualizare: {ex.updatedAt.slice(0, 10)}
              </p>
            </div>

            <div className="text-gray-400 text-xl">›</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
