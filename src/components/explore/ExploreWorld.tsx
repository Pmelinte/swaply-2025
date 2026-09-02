"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  Camera,
  Check,
  Compass,
  Globe2,
  House,
  Lightbulb,
  ListFilter,
  Map,
  MapPin,
  Package,
  Plane,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Ticket,
  UserRound,
  Wifi,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { useDrawerStore } from "@/lib/state/drawerStore";
import { SafeImage } from "@/components/SafeImage";
import { MapEmbed } from "@/components/maps/MapEmbed";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { Item, WantedRequest } from "@/lib/types";
import {
  approximateLocation,
  filterDomainItems,
  getItemDomain,
  getItemFulfilment,
  getItemReach,
  itemFallbackDemand,
  normalizeDemandRequests,
  type DemandSignal,
  type ExploreDomain,
  type ExploreReach,
} from "@/lib/explore/exploreArchitecture";

const DOMAIN_META: Record<ExploreDomain, {
  icon: LucideIcon;
  href: string;
  addHref: string;
  ring: string;
  tint: string;
  ink: string;
  button: string;
}> = {
  objects: { icon: Package, href: "/objects", addHref: "/objects/new", ring: "border-sky-300", tint: "bg-sky-100/70", ink: "text-sky-800", button: "bg-sky-600 hover:bg-sky-700" },
  properties: { icon: House, href: "/properties", addHref: "/properties/new", ring: "border-violet-300", tint: "bg-violet-100/70", ink: "text-violet-800", button: "bg-violet-600 hover:bg-violet-700" },
  services: { icon: Wrench, href: "/services", addHref: "/services/new", ring: "border-teal-300", tint: "bg-teal-100/70", ink: "text-teal-800", button: "bg-teal-600 hover:bg-teal-700" },
  events: { icon: Ticket, href: "/events", addHref: "/events/new", ring: "border-yellow-300", tint: "bg-yellow-100/70", ink: "text-yellow-900", button: "bg-yellow-500 hover:bg-yellow-600" },
};

const DISCOVERY_MODES: Array<{ key: string; icon: LucideIcon }> = [
  { key: "exact", icon: Search },
  { key: "inspire", icon: Sparkles },
  { key: "reverse", icon: RotateCcw },
  { key: "photo", icon: Camera },
  { key: "map", icon: Map },
  { key: "opportunity", icon: Lightbulb },
];

const REACH_META: Record<ExploreReach, { icon: LucideIcon; key: string }> = {
  nearby: { icon: MapPin, key: "nearby" },
  country: { icon: Compass, key: "country" },
  world: { icon: Globe2, key: "world" },
  travel: { icon: Plane, key: "travel" },
  online: { icon: Wifi, key: "online" },
};

function itemHref(item: Item): string {
  const domain = getItemDomain(item);
  return `/${domain}/${item.id}`;
}

function domainFromFilter(domain: ExploreDomain | undefined, items: Item[], query: string): Item[] {
  if (domain) return filterDomainItems(items, domain, query);
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => {
    if (!item.isActive || item.status !== "active") return false;
    if (!normalized) return true;
    return [item.title, item.description, item.category, item.wishlist, item.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });
}

function useDemandSignals(items: Item[]) {
  const [requests, setRequests] = useState<DemandSignal[]>(() => itemFallbackDemand(items));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fallback = itemFallbackDemand(items);
    setRequests((current) => (current.length ? current : fallback));

    async function load() {
      try {
        const response = await fetch("/api/wanted", { cache: "no-store" });
        if (!response.ok) throw new Error("wanted_unavailable");
        const body = (await response.json()) as { requests?: WantedRequest[] };
        if (!cancelled) {
          const normalized = normalizeDemandRequests(body.requests ?? []);
          setRequests(normalized.length ? normalized : fallback);
        }
      } catch {
        if (!cancelled) setRequests(fallback);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [items]);

  return { requests, loading };
}

export function ExploreHubIntro({ query, onQueryChange }: { query: string; onQueryChange: (value: string) => void }) {
  const t = useTranslations("explore.architecture");
  const tb = useTranslations("branches");
  const [mode, setMode] = useState("exact");

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/70 bg-gradient-to-b from-sky-200/90 via-cyan-50/90 to-emerald-100/85 p-5 shadow-[0_24px_80px_-42px_rgba(8,47,73,.55)] sm:p-8" aria-labelledby="explore-hub-title">
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/60 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/80 bg-white/55 px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-sky-900 backdrop-blur-xl">
          <Compass className="h-4 w-4" aria-hidden="true" /> {t("hubEyebrow")}
        </span>
        <h1 id="explore-hub-title" className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{t("hubTitle")}</h1>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700 sm:text-base">{t("hubDescription")}</p>

        <label className="mt-6 flex max-w-3xl items-center gap-3 rounded-2xl border border-sky-300/80 bg-white/65 px-4 py-3 shadow-sm backdrop-blur-xl focus-within:ring-2 focus-within:ring-sky-500">
          <Search className="h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" />
          <span className="sr-only">{t("searchLabel")}</span>
          <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-500" />
          <span className="hidden items-center gap-1 rounded-full border border-sky-200 bg-sky-50/80 px-2.5 py-1 text-[10px] font-black text-sky-800 sm:inline-flex"><Bot className="h-3 w-3" />{t("aiOptional")}</span>
        </label>
        <p className="mt-2 text-xs text-slate-600">{t("searchFallback")}</p>

        <div className="mt-7">
          <h2 className="text-sm font-black uppercase tracking-[.12em] text-slate-700">{t("discoverWorlds")}</h2>
          <p className="mt-1 text-xs text-slate-600">{t("worldsDescription")}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {(Object.keys(DOMAIN_META) as ExploreDomain[]).map((domain) => {
              const meta = DOMAIN_META[domain];
              const Icon = meta.icon;
              return <Link key={domain} href={meta.href} className={`group rounded-2xl border ${meta.ring} ${meta.tint} p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md motion-reduce:transform-none`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${meta.ring} bg-white/65 ${meta.ink}`}><Icon className="h-4 w-4" /></div>
                <h3 className={`mt-3 text-sm font-black ${meta.ink}`}>{tb(domain)}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{tb(`${domain}Desc`)}</p>
              </Link>;
            })}
          </div>
        </div>

        <div className="mt-7">
          <h2 className="text-sm font-black uppercase tracking-[.12em] text-slate-700">{t("modeTitle")}</h2>
          <p className="mt-1 text-xs text-slate-600">{t("modeDescription")}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DISCOVERY_MODES.map(({ key, icon: Icon }) => {
              const active = key === mode;
              return <button key={key} type="button" aria-pressed={active} onClick={() => setMode(key)} className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${active ? "border-sky-400 bg-white/80 shadow-sm" : "border-white/70 bg-white/40 hover:bg-white/65"}`}>
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-sky-700" : "text-slate-500"}`} />
                <span><span className="block text-xs font-black text-slate-900">{t(`mode${key[0].toUpperCase()}${key.slice(1)}`)}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-600">{t(`mode${key[0].toUpperCase()}${key.slice(1)}Desc`)}</span></span>
              </button>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExploreOpportunityRadar({ items, demands }: { items: Item[]; demands: DemandSignal[] }) {
  const t = useTranslations("explore.architecture");
  const { user } = useAppState();
  const mine = user ? items.filter((item) => item.ownerId === user.id && item.isActive) : [];
  const wantedCategories = new Set(demands.map((request) => request.category?.toLowerCase()).filter(Boolean));
  const wantedMine = mine.filter((item) => wantedCategories.has(item.category.toLowerCase())).length;
  const near = items.filter((item) => getItemReach(item).includes("nearby")).length;
  const cross = items.filter((item) => /anything|service|property|event/i.test(item.wishlist)).length;
  const values = [user ? wantedMine : demands.length, items.length, near, cross];
  const keys = ["peopleWantYourItems", "newForWants", "nearbyOpportunities", "crossDomain"] as const;

  return <section className="rounded-3xl border border-cyan-200/80 bg-white/65 p-5 shadow-sm backdrop-blur-xl" aria-labelledby="opportunity-radar-title">
    <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800"><Lightbulb className="h-5 w-5" /></div><div><h2 id="opportunity-radar-title" className="font-black text-slate-950">{t("opportunityRadar")}</h2><p className="text-xs text-slate-600">{user ? t("profileMode") : t("guestPersonalization")}</p></div></div>
    <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">{keys.map((key, index) => <div key={key} className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3"><strong className="block text-2xl font-black text-cyan-900">{values[index]}</strong><span className="text-xs font-semibold leading-4 text-slate-600">{t(key)}</span></div>)}</div>
  </section>;
}

export function DomainDiscoveryWorld({ domain, query = "", onQueryChange }: { domain?: ExploreDomain; query?: string; onQueryChange?: (value: string) => void }) {
  const t = useTranslations("explore.architecture");
  const tb = useTranslations("branches");
  const { user, items, loading } = useAppState();
  const drawer = useDrawerStore();
  const { requests, loading: demandLoading } = useDemandSignals(items);
  const [mapMode, setMapMode] = useState<"wants" | "both" | "offers">("both");
  const [reach, setReach] = useState<ExploreReach>("nearby");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  const visibleItems = useMemo(() => domainFromFilter(domain, items, query), [domain, items, query]);
  const visibleDemands = useMemo(() => requests.filter((request) => (!domain || request.domain === domain) && !dismissed.includes(request.id)), [domain, dismissed, requests]);
  const explicitWants = user ? visibleDemands.filter((request) => request.userId === user.id) : visibleDemands;
  const discoveryItems = user ? visibleItems.filter((item) => item.ownerId !== user.id) : visibleItems;
  const myOffers = user ? visibleItems.filter((item) => item.ownerId === user.id) : [];
  const meta = domain ? DOMAIN_META[domain] : null;
  const DomainIcon = meta?.icon ?? Compass;
  const addHref = meta?.addHref ?? "/explore";
  const title = domain ? tb(domain) : t("allWorlds");

  function toggleSaved(id: string) {
    setSaved((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  return <section className="overflow-hidden rounded-[2.25rem] border border-white/70 bg-gradient-to-b from-sky-200/80 via-sky-50/95 via-45% to-emerald-200/80 shadow-[0_28px_90px_-52px_rgba(6,78,59,.65)]" data-testid={`explore-world-${domain ?? "all"}`}>
    <div className="relative px-4 pb-10 pt-6 sm:px-7 sm:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/35 to-transparent" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white/55 backdrop-blur-xl ${meta?.ring ?? "border-cyan-300"} ${meta?.ink ?? "text-cyan-900"}`}><DomainIcon className="h-5 w-5" /></div><div><span className="text-[10px] font-black uppercase tracking-[.16em] text-sky-800">{t("skyEyebrow")}</span><h2 className="text-2xl font-black text-slate-950">{t("skyTitle", { domain: title })}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">{t("skyDescription")}</p></div></div>
        <button type="button" onClick={() => drawer.openWith({ type: "explore" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-sky-300 bg-white/55 px-4 text-sm font-black text-sky-900 backdrop-blur-xl hover:bg-white/80"><ListFilter className="h-4 w-4" />{t("openFilters")}</button>
      </div>

      {onQueryChange && <label className="mt-5 flex items-center gap-2 rounded-2xl border border-sky-200 bg-white/55 px-3 py-2.5 backdrop-blur"><Search className="h-4 w-4 text-sky-700" /><span className="sr-only">{t("searchLabel")}</span><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("filterSearch", { domain: title })} className="w-full bg-transparent text-sm font-semibold outline-none" /></label>}

      <div className="mt-6 grid gap-4 lg:grid-cols-[.9fr_1.35fr]">
        <WorldPanel icon={UserRound} title={t("explicitWants")} description={user ? t("explicitWantsDesc") : t("explicitWantsGuestDesc")}>
          {(loading.items || demandLoading) ? <SkeletonRows /> : explicitWants.length ? <div className="space-y-2">{explicitWants.slice(0, 3).map((request) => <DemandCard key={request.id} request={request} saved={saved.includes(request.id)} onSave={() => toggleSaved(request.id)} />)}</div> : <EmptyState text={user ? t("emptyWantsUser") : t("emptyWantsGuest")} href={user ? "/wanted" : "/register?returnTo=/wanted"} />}
        </WorldPanel>
        <WorldPanel icon={Sparkles} title={t("discoveryTitle")} description={t("discoveryDesc")}>
          {loading.items ? <SkeletonRows /> : discoveryItems.length ? <div className="grid gap-2 sm:grid-cols-2">{discoveryItems.slice(0, 4).map((item) => <OfferCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => toggleSaved(item.id)} />)}</div> : <EmptyState text={t("noDiscoveryResults")} />}
          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-sky-800"><Bot className="h-3.5 w-3.5" />{t("whySeeing")}</p>
        </WorldPanel>
      </div>
    </div>

    <div className="relative border-y border-white/80 bg-white/52 px-4 py-5 backdrop-blur-xl sm:px-7" aria-labelledby={`horizon-${domain ?? "all"}`}>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-cyan-500/25" aria-hidden="true" />
      <div className="relative rounded-[1.75rem] border border-cyan-200/80 bg-white/82 p-4 shadow-lg shadow-cyan-900/5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><span className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-800">{t("horizonEyebrow")}</span><h2 id={`horizon-${domain ?? "all"}`} className="text-xl font-black text-slate-950">{t("horizonTitle")}</h2><p className="mt-1 text-xs text-slate-600">{t("horizonDesc")}</p></div><div className="inline-flex self-start rounded-full border border-slate-200 bg-slate-50 p-1">{(["wants", "both", "offers"] as const).map((value) => <button key={value} type="button" onClick={() => setMapMode(value)} aria-pressed={mapMode === value} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${mapMode === value ? value === "offers" ? "bg-emerald-600 text-white" : value === "wants" ? "bg-sky-600 text-white" : "bg-slate-800 text-white" : "text-slate-600 hover:bg-white"}`}>{t(`map${value[0].toUpperCase()}${value.slice(1)}`)}</button>)}</div></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_230px]"><MapEmbed center={user?.location?.country || "Romania"} zoom={reach === "nearby" ? 8 : reach === "country" ? 6 : 3} height={250} /><div className="rounded-2xl border border-cyan-100 bg-cyan-50/65 p-3"><h3 className="text-xs font-black uppercase tracking-[.1em] text-cyan-900">{t("reachTitle")}</h3><div className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-1">{(Object.keys(REACH_META) as ExploreReach[]).map((value) => { const ReachIcon = REACH_META[value].icon; return <button key={value} type="button" onClick={() => setReach(value)} aria-pressed={reach === value} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-bold ${reach === value ? "border-cyan-400 bg-white text-cyan-950" : "border-transparent text-slate-600 hover:bg-white/65"}`}><ReachIcon className="h-3.5 w-3.5" />{t(`reach${REACH_META[value].key[0].toUpperCase()}${REACH_META[value].key.slice(1)}`)}</button>; })}</div></div></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600"><span>{t("privacyMap")}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 font-black text-slate-700">{t("mapResultCount", { count: mapMode === "wants" ? visibleDemands.length : mapMode === "offers" ? visibleItems.length : visibleDemands.length + visibleItems.length })}</span></div>
      </div>
    </div>

    <div className="px-4 pb-7 pt-10 sm:px-7 sm:pb-9">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><span className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-900">{t("fieldEyebrow")}</span><h2 className="text-2xl font-black text-slate-950">{t("fieldTitle", { domain: title })}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700">{t("fieldDescription")}</p></div><Link href={user ? addHref : `/register?returnTo=${addHref}`} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white shadow-sm ${meta?.button ?? "bg-emerald-700 hover:bg-emerald-800"}`}><Plus className="h-4 w-4" />{t("addOffer")}</Link></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[.9fr_1.35fr]">
        <WorldPanel icon={Package} title={t("explicitOffers")} description={t("explicitOffersDesc")} tone="field">{user ? myOffers.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{myOffers.slice(0, 3).map((item) => <OfferCard key={item.id} item={item} saved={saved.includes(item.id)} onSave={() => toggleSaved(item.id)} />)}</div> : <EmptyState text={t("emptyOffersUser")} href={addHref} /> : <EmptyState text={t("emptyOffersGuest")} href={`/register?returnTo=${addHref}`} />}</WorldPanel>
        <WorldPanel icon={Lightbulb} title={t("demandDiscovery")} description={t("demandDiscoveryDesc")} tone="field">{visibleDemands.length ? <div className="grid gap-2 sm:grid-cols-2">{visibleDemands.slice(0, 4).map((request) => <DemandCard key={request.id} request={request} saved={saved.includes(request.id)} onSave={() => toggleSaved(request.id)} onDismiss={() => setDismissed((current) => [...current, request.id])} />)}</div> : <EmptyState text={t("noDemandResults")} />}</WorldPanel>
      </div>
    </div>
  </section>;
}

function WorldPanel({ icon: Icon, title, description, tone = "sky", children }: { icon: LucideIcon; title: string; description: string; tone?: "sky" | "field"; children: React.ReactNode }) {
  return <article className={`rounded-[1.75rem] border p-4 shadow-sm backdrop-blur-xl ${tone === "sky" ? "border-sky-200/80 bg-white/58" : "border-emerald-200/80 bg-white/58"}`}><div className="flex items-start gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone === "sky" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}><Icon className="h-4 w-4" /></div><div><h3 className="text-sm font-black text-slate-950">{title}</h3><p className="mt-0.5 text-xs leading-5 text-slate-600">{description}</p></div></div><div className="mt-4">{children}</div></article>;
}

function DemandCard({ request, saved, onSave, onDismiss }: { request: DemandSignal; saved: boolean; onSave: () => void; onDismiss?: () => void }) {
  const t = useTranslations("explore.architecture");
  const tb = useTranslations("branches");
  const meta = DOMAIN_META[request.domain];
  const Icon = meta.icon;
  return <article className={`rounded-2xl border ${meta.ring} ${meta.tint} p-3`}><div className="flex items-start gap-2"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border bg-white/65 ${meta.ring} ${meta.ink}`}><Icon className="h-3.5 w-3.5" /></div><div className="min-w-0 flex-1"><span className={`text-[10px] font-black uppercase tracking-wide ${meta.ink}`}>{tb(request.domain)}</span><h4 className="line-clamp-2 text-xs font-black text-slate-900">{request.title}</h4></div></div>{request.city && <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-slate-600"><MapPin className="h-3 w-3" />{request.city}</p>}{request.offerDescription && <p className="mt-2 line-clamp-1 text-[10px] text-slate-600">{t("canOffer")}: {request.offerDescription}</p>}<div className="mt-3 flex gap-1.5"><button type="button" onClick={onSave} className={`inline-flex flex-1 items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-black ${saved ? "bg-emerald-700 text-white" : "bg-white/70 text-slate-700 hover:bg-white"}`}>{saved && <Check className="h-3 w-3" />}{saved ? t("saved") : t("haveThis")}</button>{onDismiss && <button type="button" onClick={onDismiss} className="rounded-xl bg-white/55 px-2 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-white">{t("dismiss")}</button>}</div></article>;
}

function OfferCard({ item, saved, onSave }: { item: Item; saved: boolean; onSave: () => void }) {
  const t = useTranslations("explore.architecture");
  const tb = useTranslations("branches");
  const domain = getItemDomain(item);
  const meta = DOMAIN_META[domain];
  const reach = getItemReach(item).slice(0, 2);
  const fulfilment = getItemFulfilment(item)[0];
  return <article className={`overflow-hidden rounded-2xl border ${meta.ring} bg-white/72`}><div className="flex gap-3 p-2.5"><div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ${meta.tint}`}><SafeImage src={item.photos?.[0] || NO_IMAGE_URL} alt={item.title} fill className="object-cover" sizes="64px" unoptimized={!item.photos?.[0]} /></div><div className="min-w-0 flex-1"><span className={`text-[9px] font-black uppercase tracking-wide ${meta.ink}`}>{tb(domain)}</span><h4 className="line-clamp-2 text-xs font-black text-slate-900">{item.title}</h4>{item.location && <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-slate-500"><MapPin className="h-3 w-3" />{approximateLocation(item.location)}</p>}</div></div><div className="flex flex-wrap gap-1 px-2.5 pb-2">{reach.map((value) => <span key={value} className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">{t(`reach${REACH_META[value].key[0].toUpperCase()}${REACH_META[value].key.slice(1)}`)}</span>)}<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">{t(`fulfilment${fulfilment.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join("")}`)}</span></div><div className="flex gap-1.5 border-t border-slate-100 p-2"><Link href={itemHref(item)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-900 px-2 py-1.5 text-[10px] font-black text-white hover:bg-slate-700">{t("viewDetails")}<ArrowRight className="h-3 w-3" /></Link><button type="button" onClick={onSave} aria-pressed={saved} className={`rounded-xl px-2.5 py-1.5 text-[10px] font-black ${saved ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{saved ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}<span className="sr-only">{saved ? t("saved") : t("saveInterest")}</span></button></div></article>;
}

function EmptyState({ text, href }: { text: string; href?: string }) {
  const t = useTranslations("explore.architecture");
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white/35 p-4 text-center"><p className="text-xs leading-5 text-slate-600">{text}</p>{href && <Link href={href} className="mt-2 inline-flex items-center gap-1 text-xs font-black text-slate-800 hover:text-sky-800">{t("nextStep")}<ArrowRight className="h-3 w-3" /></Link>}</div>;
}

function SkeletonRows() {
  return <div className="space-y-2" aria-hidden="true">{[0, 1].map((value) => <div key={value} className="h-20 animate-pulse rounded-2xl bg-white/55" />)}</div>;
}
