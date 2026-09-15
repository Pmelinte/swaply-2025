"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Box, Globe2, House, Minus, Plus, RotateCcw, Ticket, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import type { Domain, WorldController } from "./homeWorld";
import styles from "./HomeWorldHero.module.css";

const DOMAINS = [
  { id: "objects", description: "objectsDesc", Icon: Box, href: "/objects" },
  { id: "properties", description: "propertiesDesc", Icon: House, href: "/properties" },
  { id: "services", description: "servicesDesc", Icon: Wrench, href: "/services" },
  { id: "events", description: "eventsDesc", Icon: Ticket, href: "/events" },
] as const;

/** All account data and navigation stay in React; the canvas only draws a world. */
export default function HomeWorldHero() {
  const tHero = useTranslations("hero");
  const tHome = useTranslations("home");
  const tBranch = useTranslations("branches");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tGuest = useTranslations("guest");
  const { user, items, swaps, conversations } = useAppState();
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<WorldController | null>(null);
  const [selected, setSelected] = useState<Domain | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    if (!enabled || !canvas.current) return;
    const element = canvas.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let instance: WorldController | null = null;
    const onPreference = () => instance?.setMotion(!media.matches);
    media.addEventListener("change", onPreference);
    // Code splitting: WebGL never runs during SSR and does not block the dashboard.
    void import("./homeWorld").then(({ createHomeWorld }) => {
      if (cancelled) return;
      instance = createHomeWorld(element, {
        reducedMotion: media.matches,
        onSelect: setSelected,
        onUnavailable: () => { if (!cancelled) setStatus("unavailable"); },
      });
      controller.current = instance;
      setStatus("ready");
    }).catch(() => {
      instance?.dispose();
      controller.current = null;
      if (!cancelled) setStatus("unavailable");
    });
    return () => {
      cancelled = true;
      media.removeEventListener("change", onPreference);
      instance?.dispose();
      if (controller.current === instance) controller.current = null;
    };
  }, [attempt, enabled]);

  const activeItems = user ? items.filter(item => item.ownerId === user.id && item.isActive && item.status === "active").length : 0;
  const activeSwaps = user ? swaps.filter(swap =>
    (swap.requesterId === user.id || swap.responderId === user.id) &&
    !["completed", "cancelled", "rejected", "expired", "resolved"].includes(swap.status),
  ).length : 0;
  const unread = user ? conversations.filter(conversation => conversation.messages.some(message => message.senderId !== user.id && !message.isRead)).length : 0;
  const current = DOMAINS.find(domain => domain.id === selected);
  const primaryHref = current?.href ?? (user ? activeSwaps ? "/desk" : activeItems ? "/matching" : "/objects/new" : "/explore");
  const primaryText = current ? `${tNav("explore")} · ${tBranch(current.id)}` : user ? activeSwaps ? tCommon("myDesk") : activeItems ? tNav("matching") : tNav("addObject") : tNav("explore");
  const sceneVisible = enabled && status !== "unavailable";

  function toggle3D() {
    setEnabled(value => !value);
    setSelected(null);
    if (!enabled) { setStatus("loading"); setAttempt(value => value + 1); }
  }

  return (
    <section className={styles.hero} data-home-world-hero data-scene-state={enabled ? status : "disabled"} data-selected-domain={selected ?? "all"} aria-labelledby="home-world-heading">
      <div className={styles.sky} aria-hidden="true" />
      {sceneVisible && <canvas key={attempt} ref={canvas} className={styles.canvas} aria-hidden="true" />}
      {!sceneVisible && <div className={styles.fallback} aria-hidden="true">
        {DOMAINS.map(({ id, Icon }) => <div key={id} className={styles.fallbackIsland} data-domain-tone={id}><Icon /><span /></div>)}
      </div>}
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.copy}>
        <span className={styles.eyebrow}><Globe2 aria-hidden="true" size={16} /> Swaply</span>
        <h2 id="home-world-heading">{current ? tBranch(current.id) : tHero("tagline")}</h2>
        <p className={styles.description}>{current ? tBranch(current.description) : tHome("heroSubtitle")}</p>
        {user && <div className={styles.account}>
          <strong>{tHome("greeting", { name: user.firstName || user.displayName })}</strong>
          <span>{tNav("objects")}: {activeItems} · {tNav("messages")}: {unread}</span>
          {activeSwaps > 0 && <span>{tHome("activeSwaps", { count: activeSwaps })}</span>}
        </div>}
        <Link href={primaryHref} className={styles.primary} data-analytics-event="hero_cta_primary">{primaryText}<ArrowRight size={18} aria-hidden="true" /></Link>
        {!user && <Link href="/register" className={styles.secondary} data-analytics-event="hero_cta_secondary">{tGuest("bannerCta")} <ArrowRight size={15} aria-hidden="true" /></Link>}
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={toggle3D} aria-pressed={enabled} aria-label={`${tCommon("view")} 3D`} className={styles.mode}>3D</button>
        {enabled && status === "ready" && <>
          <button type="button" onClick={() => controller.current?.zoom(-.2)} aria-label="3D −"><Minus size={16} aria-hidden="true" /></button>
          <button type="button" onClick={() => controller.current?.zoom(.2)} aria-label="3D +"><Plus size={16} aria-hidden="true" /></button>
          <button type="button" onClick={() => controller.current?.reset()} aria-label={`${tCommon("reset")} 3D`}><RotateCcw size={16} aria-hidden="true" /></button>
        </>}
      </div>
      {enabled && status !== "ready" && <div className={styles.status} role="status">
        <span>3D · {tCommon(status === "loading" ? "loading" : "error")}</span>
        {status === "unavailable" && <button type="button" onClick={() => { setStatus("loading"); setAttempt(value => value + 1); }}>{tCommon("retry")}</button>}
      </div>}

      <div className={styles.domains} aria-label={tNav("quickNav")}>
        {DOMAINS.map(({ id, description, Icon, href }) => <div key={id} className={styles.domain} data-domain-tone={id} data-active={selected === id}>
          <button type="button" className={styles.domainView} disabled={!enabled || status !== "ready"} onClick={() => controller.current?.select(selected === id ? null : id)} aria-pressed={selected === id} aria-label={`${tCommon("view")} ${tBranch(id)} · 3D`} data-world-select={id}>
            <Icon size={18} aria-hidden="true" /><span>{tBranch(id)}</span><span className={styles.badge}>3D</span>
          </button>
          <Link href={href} className={styles.domainLink} data-analytics-event="explore_handoff" data-world-link={id}>
            <span>{tBranch(description)}</span><ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>)}
      </div>
      <span className={styles.srOnly} aria-live="polite">{current ? tBranch(current.id) : ""}</span>
    </section>
  );
}
