// src/app/(app)/exchanges/[id]/offers.tsx

import type { Exchange, ExchangeOfferItem } from "@/features/exchange/types";
import Image from "next/image";

interface OffersProps {
  exchange: Exchange;
  currentUserId: string;
}

export default function Offers({ exchange, currentUserId }: OffersProps) {
  const { offers } = exchange;

  if (!offers || offers.length === 0) {
    return (
      <div className="p-4 border rounded-xl">
        <p className="font-semibold mb-1">Oferte de schimb</p>
        <p className="text-sm text-gray-500">
          Nu există încă nicio ofertă în acest schimb.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          UI pentru trimiterea unei oferte va fi adăugat ulterior, când legăm
          obiectele tale (My Items) direct în fluxul de negociere.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-xl space-y-4">
      <p className="font-semibold mb-2">Oferte de schimb</p>

      {offers.map((offer, idx) => {
        const isMine = offer.fromUserId === currentUserId;
        return (
          <div
            key={`${offer.fromUserId}-${offer.createdAt}-${idx}`}
            className="border rounded-lg p-3 bg-gray-50 space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {isMine ? "Oferta ta" : "Oferta primită"}
              </span>
              <span className="text-gray-500 text-xs">
                {offer.createdAt}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              <OfferColumn
                title={isMine ? "Tu oferi" : "Ce îți oferă celălalt"}
                items={offer.itemsOffered}
              />
              <OfferColumn
                title={isMine ? "Ceri în schimb" : "Ce îți cere în schimb"}
                items={offer.itemsRequested}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface OfferColumnProps {
  title: string;
  items: ExchangeOfferItem[];
}

function OfferColumn({ title, items }: OfferColumnProps) {
  return (
    <div>
      <p className="text-sm font-semibold mb-1">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">Nimic specificat.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.itemId}
              className="flex items-center gap-2 text-sm"
            >
              {item.imageUrl && (
                <div className="w-10 h-10 relative rounded-md overflow-hidden bg-gray-200 shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
