"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Compass, House, Lightbulb, Map, Package, Search, Sparkles, Ticket, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { MapEmbed } from "@/components/maps/MapEmbed";
import { GlobalExploreFeed } from "@/components/explore/GlobalExploreFeed";
import { EXPLORE_APPLY_EVENT, type ExploreFilters } from "@/components/drawer/variants/DrawerExplore";
import { filtersToSearchParams } from "@/lib/explore/exploreFilters";

const MODES = [
  { key: "search", icon: Search },
  { key: "discover", icon: Sparkles },
  { key: "offer", icon: Package },
  { key: "map", icon: Map },
] as const;

const DOMAINS = [
  { key: "objects", icon: Package, accent: "border-sky-200 text-sky-800 hover:border-sky-400 hover:bg-sky-50/70", tint: "bg-sky-50/70" },
  { key: "properties", icon: House, accent: "border-violet-200 text-violet-800 hover:border-violet-400 hover:bg-violet-50/70", tint: "bg-violet-50/70" },
  { key: "services", icon: Wrench, accent: "border-teal-200 text-teal-800 hover:border-teal-400 hover:bg-teal-50/70", tint: "bg-teal-50/70" },
  { key: "events", icon: Ticket, accent: "border-yellow-200 text-yellow-900 hover:border-yellow-400 hover:bg-yellow-50/70", tint: "bg-yellow-50/70" },
] as const;

type Mode = (typeof MODES)[number]["key"];

export function ExploreClient() {
  const t = useTranslations("explore.hub");
  const tb = useTranslations("branches");
  const { user } = useAppState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [submittedQuery, setSubmittedQuery] = useState(urlQuery);
  const [mode, setMode] = useState<Mode | null>(null);
  const [recentCount, setRecentCount] = useState<number | null>(null);
  const [radarLoading, setRadarLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const domainsRef = useRef<HTMLHeadingElement>(null);
  const mapRef = useRef<HTMLElement>(null);

  // Navigation/back/forward hydrate the search without rewriting the URL on every keystroke.
  useEffect(() => {
    setQuery(urlQuery);
    setSubmittedQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadPublicActivity() {
      try {
        // Existing endpoint: active, public, non-demo listings, newest eight only.
        const response = await fetch("/api/items/recent", { signal: controller.signal });
        if (!response.ok) throw new Error("public_activity_unavailable");
        const rows: unknown = await response.json();
        if (!Array.isArray(rows)) throw new Error("invalid_public_activity");
        const ids = new Set(rows.filter((row) => row && typeof row.id === "string").map((row) => row.id));
        if (!controller.signal.aborted) setRecentCount(ids.size > 0 ? ids.size : null);
      } catch {
        if (!controller.signal.aborted) setRecentCount(null);
      } finally {
        if (!controller.signal.aborted) setRadarLoading(false);
      }
    }
    void loadPublicActivity();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const params = filtersToSearchParams((event as CustomEvent<ExploreFilters>).detail);
      if (submittedQuery) params.set("q", submittedQuery);
      router.replace(`/explore?${params.toString()}`, { scroll: false });
    };
    window.addEventListener(EXPLORE_APPLY_EVENT, handler);
    return () => window.removeEventListener(EXPLORE_APPLY_EVENT, handler);
  }, [router, submittedQuery]);

  function selectMode(next: Mode) {
    setMode(next);
    // Move keyboard focus to the actual destination, including the newly revealed map.
    requestAnimationFrame(() => {
      if (next === "search") searchRef.current?.focus();
      else if (next === "map") mapRef.current?.focus();
      else domainsRef.current?.focus();
    });
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim();
    setSubmittedQuery(normalized);
    const params = new URLSearchParams(searchParams.toString());
    if (normalized) params.set("q", normalized);
    else params.delete("q");
    router.replace(params.size ? `/explore?${params.toString()}` : "/explore", { scroll: false });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8 pt-2 text-slate-900 sm:space-y-10" data-testid="explore-hub">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-sky-200/85 via-cyan-50/80 to-emerald-50/80 px-5 py-8 sm:px-9 sm:py-10" aria-labelledby="explore-title">
        <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-sky-900"><Compass className="h-4 w-4" aria-hidden="true" />{t("eyebrow")}</span>
        <h1 id="explore-title" className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">{t("description")}</p>
        <form onSubmit={submitSearch} className="mt-6 max-w-3xl" role="search" aria-label={t("searchLabel")}>
          <label htmlFor="explore-search" className="mb-2 block text-xs font-bold text-slate-700">{t("searchPrompt")}</label>
          <div className="flex min-w-0 flex-wrap gap-2 rounded-2xl border border-sky-200 bg-white/70 p-2 shadow-sm backdrop-blur-xl focus-within:ring-2 focus-within:ring-sky-600">
            <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
              <Search className="h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" />
              <input ref={searchRef} id="explore-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchPlaceholder")} className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none" />
            </div>
            <button type="submit" className="min-h-11 rounded-xl bg-sky-800 px-4 text-sm font-bold text-white hover:bg-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-800">{t("searchAction")}</button>
          </div>
        </form>
      </section>

      {submittedQuery ? <section aria-label={t("searchResults")} data-testid="explore-search-results"><GlobalExploreFeed query={submittedQuery} onQueryChange={setQuery} /></section> : null}

      <section aria-labelledby="explore-modes-title">
        <h2 id="explore-modes-title" className="text-xl font-black sm:text-2xl">{t("modesTitle")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="explore-modes">
          {MODES.map(({ key, icon: Icon }) => <button key={key} type="button" onClick={() => selectMode(key)} aria-controls={key === "search" ? "explore-search" : key === "map" ? "explore-map" : "explore-domains"} className="group flex min-h-36 items-start gap-3 rounded-2xl border border-slate-200 bg-white/75 p-4 text-left shadow-sm backdrop-blur-sm transition hover:border-sky-400 hover:bg-sky-50/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 sm:min-h-44 sm:flex-col">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800"><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <span className="flex min-w-0 flex-1 flex-col"><span className="font-black">{t(`${key}Title`)}</span><span className="mt-1 text-sm leading-5 text-slate-600">{t(`${key}Description`)}</span><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-sky-800">{t(`${key}Action`)}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span></span>
          </button>)}
        </div>
      </section>

      <section aria-labelledby="explore-domains">
        <h2 ref={domainsRef} tabIndex={-1} id="explore-domains" className="scroll-mt-32 text-xl font-black outline-none sm:text-2xl">{t("domainsTitle")}</h2>
        <p className="mt-2 text-sm text-slate-600">{t("domainsDescription")}</p>
        {mode === "discover" || mode === "offer" ? <p role="status" className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">{t(mode === "discover" ? "discoverAvailable" : "offerAvailable")}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {DOMAINS.map(({ key, icon: Icon, accent, tint }) => <Link key={key} href={`/${key}`} className={`group rounded-2xl border bg-white/75 p-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 ${accent}`}>
            <span className={`inline-flex rounded-xl p-2.5 ${tint}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <h3 className="mt-3 font-black">{tb(key)}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">{t(`${key}Description`)}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">{t("openDomain")}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
          </Link>)}
        </div>
      </section>

      {mode === "map" ? <section ref={mapRef} tabIndex={-1} id="explore-map" aria-labelledby="explore-map-title" className="scroll-mt-32 space-y-3 rounded-2xl border border-slate-200 bg-white/65 p-5 outline-none">
        <h2 id="explore-map-title" className="text-xl font-black">{t("mapTitle")}</h2>
        <p className="text-sm leading-6 text-slate-600">{t("mapAvailable")}</p>
        <MapEmbed center={user?.location?.country || "20,0"} zoom={3} height={250} />
      </section> : null}

      <section aria-labelledby="explore-model-title" className="rounded-3xl border border-slate-200/80 bg-gradient-to-b from-sky-50/80 via-white/80 to-emerald-50/80 p-5 sm:p-7">
        <h2 id="explore-model-title" className="text-lg font-black">{t("modelTitle")}</h2>
        <p className="mt-1 text-sm text-slate-600">{t("modelDescription")}</p>
        <ol className="mt-5 space-y-3">
          {(["sky", "horizon", "field"] as const).map((layer, index) => <li key={layer}>
            {index > 0 ? <ArrowDown className="mb-3 ml-4 h-4 w-4 text-slate-400" aria-hidden="true" /> : null}
            <div className="flex items-center gap-4"><span className={`h-10 w-1 shrink-0 rounded-full ${layer === "sky" ? "bg-sky-500" : layer === "field" ? "bg-emerald-500" : "bg-slate-300"}`} aria-hidden="true" /><div><h3 className={`text-sm font-black ${layer === "sky" ? "text-sky-800" : layer === "field" ? "text-emerald-800" : "text-slate-700"}`}>{t(`${layer}Title`)}</h3><p className="mt-0.5 text-sm text-slate-600">{t(`${layer}Description`)}</p></div></div>
          </li>)}
        </ol>
      </section>

      <aside aria-labelledby="explore-radar-title" className="border-t border-slate-200 px-1 pt-5">
        <details>
          <summary className="cursor-pointer rounded-lg py-2 text-sm font-bold text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"><span id="explore-radar-title" className="ml-2 inline-flex items-center gap-2"><Lightbulb className="h-4 w-4" aria-hidden="true" />{t("radarTitle")}</span></summary>
          <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600" data-testid="explore-radar">
            <p>{user ? t("radarMember") : t("radarGuest")}</p>
            <p role="status">{radarLoading ? t("radarLoading") : recentCount === null ? t("radarUnavailable") : t("radarRecent", { count: recentCount })}</p>
            <p className="text-xs">{t("radarScope")}</p>
          </div>
        </details>
      </aside>
    </div>
  );
}

export default ExploreClient;
