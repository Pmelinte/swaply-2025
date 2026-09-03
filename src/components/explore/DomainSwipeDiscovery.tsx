"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type PointerEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Check, Heart, ImageOff, Info, RotateCcw, Sparkles, Undo2, X } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { ExploreDomain } from "@/lib/explore/exploreArchitecture";
import { normalizeSwipeRows, swipeReducer, type SwipeChoice, type SwipeField } from "@/lib/explore/swipeDiscovery";

const accents: Record<ExploreDomain, string> = {
  objects: "border-sky-300 text-sky-800",
  properties: "border-violet-300 text-violet-800",
  services: "border-teal-300 text-teal-800",
  events: "border-yellow-300 text-yellow-900",
};
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2";
const choices = [
  { choice: "dismissed", Icon: X },
  { choice: "interested", Icon: Heart },
  { choice: "strong_interest", Icon: Sparkles },
] as const;

export type DomainSwipeProps = {
  domain: ExploreDomain;
  rows: readonly unknown[];
  query?: string;
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
  viewerId?: string;
  viewerCity?: string;
};

/** Deliberately page-local: no profile, Matching, storage or mutation API calls. */
export function DomainSwipeDiscovery({ domain, rows, query = "", loading, failed, onRetry, viewerId, viewerCity }: DomainSwipeProps) {
  const t = useTranslations("explore.swipe");
  const tb = useTranslations("branches");
  const tc = useTranslations("common");
  const format = useFormatter();
  const candidates = useMemo(() => normalizeSwipeRows(rows, domain, viewerId, query), [rows, domain, viewerId, query]);
  const [history, dispatch] = useReducer(swipeReducer, []);
  const decided = useMemo(() => new Set(history.map((entry) => entry.id)), [history]);
  const remaining = candidates.filter((candidate) => !decided.has(candidate.id));
  const current = remaining[0];
  const next = remaining[1];
  const last = history.at(-1);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [failedImage, setFailedImage] = useState<string>();
  const cardRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const focusEnd = useRef(false);
  const drag = useRef<{ pointerId: number; x: number; y: number; id: string; threshold: number } | null>(null);
  const activeId = useRef<string | undefined>(undefined);
  const titleId = `swipe-title-${domain}`;
  const helpId = `swipe-help-${domain}`;

  useEffect(() => {
    if (!current && focusEnd.current) {
      endRef.current?.focus({ preventScroll: true });
      focusEnd.current = false;
    }
  }, [current]);

  function resetDrag() {
    drag.current = null;
    setDragging(false);
    setOffset(0);
  }

  function choose(choice: SwipeChoice, expectedId = current?.id) {
    if (!current || current.id !== expectedId || activeId.current === current.id) return;
    activeId.current = current.id; // Blocks a duplicate pointer/button event before React commits.
    focusEnd.current = document.activeElement === cardRef.current;
    dispatch({ type: "choose", decision: { id: current.id, title: current.title, choice } });
    resetDrag();
  }

  function pointerDown(event: PointerEvent<HTMLElement>) {
    if (!current || !event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest("a,button,input,summary")) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, id: current.id, threshold: Math.min(110, Math.max(64, event.currentTarget.clientWidth * .24)) };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    setDragging(true);
  }

  function pointerMove(event: PointerEvent<HTMLElement>) {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dy) > 16 && Math.abs(dy) > Math.abs(dx) * 1.2) { resetDrag(); return; }
    setOffset(Math.max(-180, Math.min(180, dx)));
  }

  function pointerUp(event: PointerEvent<HTMLElement>) {
    const start = drag.current;
    resetDrag();
    if (!start || start.pointerId !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= start.threshold && Math.abs(dx) > Math.abs(dy) * 1.2) choose(dx > 0 ? "interested" : "dismissed", start.id);
  }

  function undo() {
    activeId.current = undefined;
    resetDrag();
    dispatch({ type: "undo" });
  }

  function fieldValue(field: SwipeField) {
    if (field.kind === "date") return format.dateTime(new Date(field.value), { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
    if (field.kind === "weekdays") {
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      return format.list(field.value.split(", ").map((day) => {
        const index = days.findIndex((name) => name === day.toLowerCase() || name.slice(0, 3) === day.toLowerCase());
        return index < 0 ? day : format.dateTime(new Date(Date.UTC(2024, 0, 1 + index)), { weekday: "long", timeZone: "UTC" });
      }));
    }
    if (field.kind === "enum") return t.has(`values.${field.value}`) ? t(`values.${field.value}`) : field.value.replaceAll("_", " ");
    return field.value;
  }

  const sameCity = current?.city && viewerCity && current.city.localeCompare(viewerCity.trim(), undefined, { sensitivity: "accent" }) === 0;
  return (
    <section aria-labelledby={titleId} data-testid={`swipe-${domain}`} className="min-w-0 rounded-[1.75rem] border border-sky-200/80 bg-white/50 p-3 shadow-sm backdrop-blur-xl sm:p-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-white/70 ${accents[domain]}`}><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
        <div><h3 id={titleId} className="text-lg font-black text-slate-950">{t("title")}</h3><p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">{t("description")}</p></div>
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50/80 p-3 text-xs leading-5 text-slate-600"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{t("localOnly")}</span></p>

      <div className="mx-auto mt-4 max-w-xl">
        <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-600">{!loading && !failed && t("remaining", { count: remaining.length })}</p>
          <button type="button" onClick={undo} disabled={!last || loading || failed} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-sky-200 bg-white/70 px-3 text-xs font-bold text-sky-900 disabled:opacity-40 ${focus}`}><Undo2 className="h-4 w-4" aria-hidden="true" />{t("undo")}</button>
        </div>

        {loading ? <div role="status" className="flex min-h-72 items-center justify-center rounded-3xl bg-white/60 text-sm text-slate-600">{t("loading")}</div>
          : failed ? <div role="status" className="rounded-3xl border border-slate-200 bg-white/70 p-8 text-center"><p className="text-sm text-slate-700">{t("loadError")}</p>{onRetry && <button type="button" onClick={onRetry} className={`mt-4 min-h-11 rounded-xl border border-sky-300 px-4 font-bold text-sky-900 ${focus}`}>{t("retry")}</button>}</div>
          : current ? (
            <div className="relative isolate overflow-hidden px-1 pb-2 pt-7 sm:px-4">
              {next && <div aria-hidden="true" data-testid="swipe-stack" className={`pointer-events-none absolute inset-x-5 top-0 h-44 overflow-hidden rounded-3xl border bg-white/75 px-4 pt-2 ${accents[domain]}`}><p className="truncate text-center text-xs font-semibold">{t("next")}: {next.title}</p></div>}
              <article ref={cardRef} tabIndex={0} aria-label={t("cardLabel", { title: current.title })} aria-describedby={helpId} data-testid="swipe-card" data-item-id={current.id}
                onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={resetDrag} onLostPointerCapture={resetDrag}
                onDragStart={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
                  const choice = event.key === "ArrowLeft" ? "dismissed" : event.key === "ArrowRight" ? "interested" : event.key === "ArrowUp" ? "strong_interest" : undefined;
                  if (choice) { event.preventDefault(); choose(choice); }
                }}
                style={{ touchAction: "pan-y pinch-zoom", transform: `translateX(${offset}px) rotate(${offset / 24}deg)` }}
                className={`relative select-none overflow-hidden rounded-3xl border bg-white shadow-lg shadow-sky-950/10 motion-reduce:!transform-none motion-reduce:transition-none ${dragging ? "cursor-grabbing" : "cursor-grab transition-transform duration-200"} ${accents[domain]} ${focus}`}>
                <div className="relative h-44 bg-sky-50 sm:h-60">
                  {current.image && current.image !== failedImage ? <SafeImage src={current.image} alt={current.title} fill sizes="(max-width: 640px) 90vw, 560px" className="pointer-events-none object-cover" onError={() => setFailedImage(current.image)} /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400"><ImageOff className="h-12 w-12" aria-hidden="true" /><span className="text-xs">{tc("noImage")}</span></div>}
                  <span className={`absolute left-3 top-3 rounded-full border bg-white/90 px-3 py-1 text-xs font-bold ${accents[domain]}`}>{tb(domain)}</span>
                  {current.isDemo && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-700">{t("demo")}</span>}
                  {Math.abs(offset) > 28 && <span aria-hidden="true" className="absolute inset-x-3 bottom-3 rounded-2xl border border-sky-300 bg-white/95 p-3 text-center text-sm font-black text-sky-900">{t(offset > 0 ? "interested" : "dismissed")}</span>}
                </div>
                <div className="p-4 sm:p-5">
                  <h4 className="break-words text-xl font-black leading-tight text-slate-950">{current.title}</h4>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                    {current.fields.map((field) => <div key={field.label} className={field.label === "ownerWants" || field.label === "accepts" ? "col-span-2 min-w-0" : "min-w-0"}><dt className="text-[11px] font-semibold text-slate-500">{t(`fields.${field.label}`)}</dt><dd className="mt-0.5 break-words text-xs font-semibold leading-5 text-slate-800">{fieldValue(field)}</dd></div>)}
                  </dl>
                  <details className="mt-4 border-t border-sky-100 pt-3 text-xs text-slate-600" onPointerDown={(event) => event.stopPropagation()}>
                    <summary className={`min-h-8 cursor-pointer rounded-lg font-bold text-sky-900 ${focus}`}>{t("whyTitle")}</summary>
                    <p className="mt-1 leading-5">{sameCity ? t("whyCity", { city: current.city! }) : t("whyNeutral", { domain: tb(domain) })}</p>
                  </details>
                </div>
              </article>
            </div>
          ) : <div ref={endRef} tabIndex={-1} role="status" data-testid="swipe-end" className={`rounded-3xl border border-sky-200 bg-white/75 px-5 py-10 text-center ${focus}`}><Check className="mx-auto h-8 w-8 text-sky-700" aria-hidden="true" /><h4 className="mt-3 text-lg font-black text-slate-950">{t(candidates.length ? "endTitle" : "emptyTitle")}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{t(candidates.length ? "endDescription" : "emptyDescription")}</p>{history.length > 0 && <button type="button" onClick={() => { activeId.current = undefined; dispatch({ type: "restart" }); }} className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-300 bg-white/80 px-4 text-sm font-bold text-sky-900 ${focus}`}><RotateCcw className="h-4 w-4" aria-hidden="true" />{t("restart")}</button>}</div>}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {choices.map(({ choice, Icon }) => <button key={choice} type="button" data-testid={`swipe-${choice}`} disabled={!current || loading || failed} onClick={() => choose(choice)} className={`flex min-h-14 min-w-0 items-center justify-center gap-2 rounded-2xl border bg-white/75 px-3 py-3 text-xs font-bold backdrop-blur-xl hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 ${choice === "strong_interest" ? "col-span-2 sm:col-span-1" : ""} ${choice === "dismissed" ? "border-slate-200 text-slate-700" : "border-sky-300 text-sky-900"} ${focus}`}><Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span>{t(choice)}</span></button>)}
        </div>
        <p id={helpId} className="mt-3 text-center text-[11px] leading-5 text-slate-500">{t("instructions")}</p>
        <p role="status" aria-live="polite" aria-atomic="true" className="mt-2 min-h-5 break-words text-center text-xs font-semibold text-sky-900">{last ? t("lastChoice", { choice: t(last.choice), title: last.title }) : ""}</p>
      </div>
    </section>
  );
}
