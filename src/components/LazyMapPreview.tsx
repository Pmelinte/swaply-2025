"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Lazy-loaded MapPreview — only loads the Google Maps iframe
 * when it scrolls into the viewport (IntersectionObserver).
 * This prevents the map from blocking LCP on initial render.
 */
export function LazyMapPreview() {
  const t = useTranslations("map");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return (
      <div
        ref={ref}
        className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
        style={{ height: 240 }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  // Dynamically import the real MapPreview only when visible
  const MapPreviewLazy = require("@/components/MapPreview").MapPreview;
  return <MapPreviewLazy />;
}
