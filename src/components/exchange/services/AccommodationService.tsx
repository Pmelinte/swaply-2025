"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Props {
  partnerCity?: string;
  agreedDate?: string;
}

export function AccommodationService({ partnerCity = "", agreedDate = "" }: Props) {
  const t = useTranslations("exchangePage");

  const checkIn = agreedDate ? agreedDate.slice(0, 10) : "";
  const checkOut = agreedDate
    ? new Date(new Date(agreedDate).getTime() + 86400000).toISOString().slice(0, 10)
    : "";

  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(partnerCity)}&checkin=${checkIn}&checkout=${checkOut}`;
  const airbnbUrl = `https://www.airbnb.com/s/${encodeURIComponent(partnerCity)}/homes?checkin=${checkIn}&checkout=${checkOut}`;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
        🏨 {t("accommodationTitle")}
      </h3>

      <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
        <p className="text-zinc-600 dark:text-zinc-400">
          {partnerCity ? `📍 ${partnerCity}` : t("destinationPlaceholder")}
        </p>
        {checkIn && (
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            📅 {t("checkIn")}: {checkIn} — {t("checkOut")}: {checkOut}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
        >
          🏨 {t("searchBooking")}
        </a>
        <a
          href={airbnbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
        >
          🏠 {t("searchAirbnb")}
        </a>
      </div>
    </div>
  );
}
