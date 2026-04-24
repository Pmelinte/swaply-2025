"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface Props {
  partnerCity?: string;
  agreedDate?: string;
}

export function RestaurantService({ partnerCity = "", agreedDate = "" }: Props) {
  const t = useTranslations("exchange.restaurant");
  const [date, setDate] = useState(agreedDate ? agreedDate.slice(0, 10) : "");
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState("2");

  const theForkUrl = `https://www.thefork.com/restaurant/${encodeURIComponent(partnerCity)}`;
  const opentableUrl = `https://www.opentable.com/s?query=${encodeURIComponent(partnerCity)}`;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        🍽️ {t("title")} {partnerCity && <span className="text-blue-600">{partnerCity}</span>}
      </h3>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t("date")}</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t("time")}</p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">{t("guests")}</p>
          <input
            type="number"
            min="1"
            max="20"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <a
          href={theForkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300"
        >
          🍴 TheFork — {t("searchRestaurants")}
        </a>
        <a
          href={opentableUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          🍽️ OpenTable — {t("searchRestaurants")}
        </a>
      </div>
    </div>
  );
}
