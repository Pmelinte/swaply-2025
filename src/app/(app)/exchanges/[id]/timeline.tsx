// src/app/(app)/exchanges/[id]/timeline.tsx

import type { ExchangeUpdate } from "@/features/exchange/types";

interface TimelineProps {
  updates: ExchangeUpdate[];
}

export default function Timeline({ updates }: TimelineProps) {
  if (!updates || updates.length === 0) {
    return (
      <div className="p-4 border rounded-xl">
        <p className="font-semibold mb-1">Timeline schimb</p>
        <p className="text-sm text-gray-500">
          Încă nu există evenimente înregistrate pentru acest schimb.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-xl">
      <p className="font-semibold mb-3">Timeline schimb</p>

      <ol className="relative border-l border-gray-300 ml-3 space-y-4">
        {updates.map((u) => (
          <li key={u.id} className="ml-3">
            <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full bg-blue-600" />
            <div className="bg-gray-50 rounded-lg px-3 py-2 shadow-sm">
              <p className="text-sm font-medium capitalize">
                {formatUpdateType(u.type)}
              </p>
              <p className="text-sm text-gray-700 mt-1">{u.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {u.createdAt}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatUpdateType(type: ExchangeUpdate["type"]): string {
  switch (type) {
    case "offer_sent":
      return "Ofertă trimisă";
    case "offer_accepted":
      return "Ofertă acceptată";
    case "offer_declined":
      return "Ofertă refuzată";
    case "shipping_started":
      return "Livrare începută";
    case "shipping_received":
      return "Livrare finalizată";
    case "meeting_scheduled":
      return "Întâlnire programată";
    case "completed":
      return "Schimb finalizat";
    case "cancelled":
      return "Schimb anulat";
    default:
      return type;
  }
}
