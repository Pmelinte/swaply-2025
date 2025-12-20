"use client";

import { useEffect, useState } from "react";
import { sendOfferAction } from "@/features/exchange/server/exchange-actions";
import type { ExchangeOfferItem } from "@/features/exchange/types";
import Image from "next/image";

interface OfferFormProps {
  exchangeId: string;
}

interface UserItem {
  id: string;
  title: string;
  images: { url: string; isPrimary?: boolean }[];
}

export default function OfferForm({ exchangeId }: OfferFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [myItems, setMyItems] = useState<UserItem[]>([]);
  const [otherItems, setOtherItems] = useState<UserItem[]>([]);

  const [selectedOffered, setSelectedOffered] = useState<string[]>([]);
  const [selectedRequested, setSelectedRequested] = useState<string[]>([]);

  // 1) Încarcă obiectele needed pentru ofertă
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/exchange/${exchangeId}/items`);
      const data = await res.json();

      if (data.ok) {
        setMyItems(data.myItems);
        setOtherItems(data.otherItems);
      }
    })();
  }, [exchangeId]);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const sendOffer = async () => {
    setLoading(true);

    const offered: ExchangeOfferItem[] = myItems
      .filter((i) => selectedOffered.includes(i.id))
      .map((i) => ({
        itemId: i.id,
        title: i.title,
        imageUrl: i.images?.[0]?.url,
      }));

    const requested: ExchangeOfferItem[] = otherItems
      .filter((i) => selectedRequested.includes(i.id))
      .map((i) => ({
        itemId: i.id,
        title: i.title,
        imageUrl: i.images?.[0]?.url,
      }));

    await sendOfferAction(exchangeId, offered, requested);

    window.location.reload();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
      >
        Trimite ofertă
      </button>
    );
  }

  return (
    <div className="border rounded-xl p-4 bg-gray-50 space-y-4">
      <p className="font-semibold text-lg">Creează o ofertă</p>

      {/* Select obiecte oferite */}
      <div>
        <p className="font-medium mb-2">Alege ce oferi</p>
        <ItemGrid
          items={myItems}
          selected={selectedOffered}
          onToggle={(id) => setSelectedOffered(toggle(selectedOffered, id))}
        />
      </div>

      {/* Select obiecte cerute */}
      <div>
        <p className="font-medium mb-2">Alege ce vrei în schimb</p>
        <ItemGrid
          items={otherItems}
          selected={selectedRequested}
          onToggle={(id) =>
            setSelectedRequested(toggle(selectedRequested, id))
          }
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={sendOffer}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
        >
          {loading ? "Se trimite..." : "Trimite oferta"}
        </button>

        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 bg-gray-300 text-black rounded-lg text-sm"
        >
          Anulează
        </button>
      </div>
    </div>
  );
}

function ItemGrid({
  items,
  selected,
  onToggle,
}: {
  items: UserItem[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nu există obiecte disponibile.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((item) => {
        const checked = selected.includes(item.id);
        const img = item.images?.find((i) => i.isPrimary) ?? item.images?.[0];

        return (
          <div
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`cursor-pointer border rounded-lg p-2 flex flex-col gap-2 ${
              checked ? "ring-2 ring-blue-600" : ""
            }`}
          >
            <div className="relative w-full h-28 rounded overflow-hidden bg-gray-200">
              {img ? (
                <Image
                  src={img.url}
                  fill
                  alt={item.title}
                  className="object-cover"
                />
              ) : null}
            </div>
            <p className="text-sm font-medium">{item.title}</p>
          </div>
        );
      })}
    </div>
  );
}
