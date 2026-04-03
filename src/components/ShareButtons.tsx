"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2, Copy, Check } from "lucide-react";

export function ShareButtons({ title, itemId }: { title: string; itemId: string }) {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/objects/${itemId}` : `/objects/${itemId}`;
  const text = `Check out "${title}" on Swaply — want to swap?`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={shareNative}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? t("copied") : t("copyLink")}
      </button>
    </div>
  );
}
