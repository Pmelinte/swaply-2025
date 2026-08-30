"use client";

import {
  CalendarDays,
  ChevronDown,
  Globe2,
  Home,
  MapPin,
  Package,
  Plane,
  RefreshCcw,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Kind = "object" | "property" | "service" | "event";

type Route = {
  id: string;
  path: string;
  color: string;
  kind: Kind;
  begin: string;
  duration?: string;
};

const ROUTES: Route[] = [
  { id: "obj-a", path: "M250 205 C315 120 390 118 475 155", color: "#246BFD", kind: "object", begin: "0s" },
  { id: "obj-b", path: "M475 155 C395 105 320 118 250 205", color: "#246BFD", kind: "object", begin: "-4s" },
  { id: "obj-c", path: "M262 215 C340 285 420 255 450 196", color: "#246BFD", kind: "object", begin: "-2.2s" },
  { id: "prop-a", path: "M480 160 C560 115 645 125 710 175", color: "#16A765", kind: "property", begin: "-1.2s" },
  { id: "prop-b", path: "M710 175 C640 120 560 118 480 160", color: "#16A765", kind: "property", begin: "-5.2s" },
  { id: "service-a", path: "M650 170 C770 150 835 215 850 300", color: "#8B3CF6", kind: "service", begin: "-2.6s" },
  { id: "service-b", path: "M850 300 C820 220 750 160 650 170", color: "#8B3CF6", kind: "service", begin: "-6.1s" },
  { id: "event-a", path: "M505 248 C615 220 720 265 842 330", color: "#F97316", kind: "event", begin: "-3.4s" },
  { id: "event-b", path: "M842 330 C728 266 618 220 505 248", color: "#F97316", kind: "event", begin: "-7s" },
];

function RouteGlyph({ kind }: { kind: Kind }) {
  if (kind === "object") {
    return (
      <>
        <path d="M-6-4 0-7 6-4 0-1Z" />
        <path d="M-6-4v8L0 7l6-3v-8M0-1v8" />
      </>
    );
  }
  if (kind === "property") {
    return (
      <>
        <path d="m-7 0 7-6 7 6M-5-1v7h10v-7" />
        <path d="M-1 6V2h3v4" />
      </>
    );
  }
  if (kind === "service") {
    return <path d="M-6 6 3-3M1-5a4 4 0 0 0 5 5L2 4-2 0a4 4 0 0 0-5-5l3 3" />;
  }
  return (
    <>
      <rect x="-7" y="-6" width="14" height="13" rx="2" />
      <path d="M-7-2H7M-3-8v4M3-8v4M-3 1h2M2 1h2M-3 4h2M2 4h2" />
    </>
  );
}

function MovingMarker({ route }: { route: Route }) {
  return (
    <g
      className="motion-reduce:hidden"
      fill="none"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <circle r="14" fill="white" stroke="none" opacity="0.98" />
      <circle r="11" fill={route.color} stroke="none" />
      <RouteGlyph kind={route.kind} />
      <animateMotion dur={route.duration ?? "8s"} repeatCount="indefinite" path={route.path} begin={route.begin} />
    </g>
  );
}

function PalmIsland({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="14" rx="42" ry="11" fill="#33C6DC" opacity="0.55" />
      <path d="M-37 9Q-14-10 9 1T37 10Q13 23-12 19T-37 9Z" fill="#F4D36C" />
      <path
        d="M0 6Q4-15 12-34M10-29Q28-34 34-21M10-29Q1-42-9-40M2-3Q-5-22-20-31M-17-28Q-33-27-37-17"
        fill="none"
        stroke="#238B45"
        strokeLinecap="round"
        strokeWidth="4.2"
      />
      <circle cx="30" cy="11" r="4.5" fill="#EF4444" />
    </g>
  );
}

function WorldMap({ ro }: { ro: boolean }) {
  return (
    <div className="relative h-[420px] w-full lg:h-[520px]">
      <svg
        viewBox="0 0 920 440"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={ro ? "Harta globală Swaply cu schimburi animate" : "Swaply world map with animated exchanges"}
      >
        <defs>
          <radialGradient id="ocean" cx="50%" cy="42%" r="72%">
            <stop offset="0" stopColor="#E9FCFF" />
            <stop offset="0.45" stopColor="#AEE8F7" />
            <stop offset="1" stopColor="#72D2E8" />
          </radialGradient>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#EDF8C4" />
            <stop offset="0.42" stopColor="#B9DF7A" />
            <stop offset="1" stopColor="#71BB6C" />
          </linearGradient>
          <linearGradient id="desert" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6E8B0" />
            <stop offset="1" stopColor="#D7C17A" />
          </linearGradient>
          <filter id="landShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#2A8E96" floodOpacity="0.22" />
          </filter>
        </defs>

        <ellipse cx="470" cy="220" rx="438" ry="195" fill="url(#ocean)" />
        <ellipse cx="450" cy="124" rx="330" ry="86" fill="white" opacity="0.2" />

        <g fill="url(#land)" stroke="#F7FFE9" strokeWidth="2.4" filter="url(#landShadow)">
          <path d="M50 142 86 98 135 71 196 56 255 70 309 106 300 143 271 164 249 202 210 226 178 212 151 181 110 177 73 161Z" />
          <path d="M207 217 245 232 272 265 278 312 260 362 227 406 204 379 198 336 180 299 184 255Z" />
          <path d="M357 113 399 85 452 77 505 84 547 102 576 125 550 145 510 144 483 165 445 161 408 147 378 137Z" />
          <path d="M446 166 505 142 575 157 621 210 608 261 574 290 555 348 516 379 486 345 470 294 440 265 424 224Z" />
          <path d="M545 111 625 76 728 87 823 137 842 177 798 214 722 196 661 226 602 206 544 158Z" />
          <path d="M720 286 775 272 831 298 830 346 785 376 727 350 706 311Z" />
          <path d="M836 203 861 208 878 231 868 251 839 247 827 222Z" />
        </g>

        <path d="M446 166 505 142 575 157 621 210 606 236 548 227 501 242 455 219Z" fill="url(#desert)" opacity="0.8" />
        <path d="M615 117 653 99 695 105 681 121 641 131Z" fill="#F9F4DD" opacity="0.95" />
        <path d="M489 286 513 269 545 276 542 294 514 306Z" fill="#7FC56B" opacity="0.85" />

        <g fill="none" strokeLinecap="round" strokeWidth="2.7" strokeDasharray="7 7" opacity="0.92">
          {ROUTES.map((route) => (
            <path key={route.id} d={route.path} stroke={route.color} />
          ))}
        </g>

        {ROUTES.map((route) => (
          <MovingMarker key={route.id} route={route} />
        ))}

        <PalmIsland x={330} y={310} />
        <PalmIsland x={650} y={317} />

        <g transform="translate(330 355)">
          <rect x="-65" y="-24" width="130" height="58" rx="13" fill="#FFF0F7" stroke="#FBCFE8" />
          <text x="0" y="-2" textAnchor="middle" fill="#DB2777" fontSize="13" fontWeight="800">
            {ro ? "În vacanță" : "Vacation"}
          </text>
          <text x="0" y="17" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="700">
            {ro ? "Caraibe" : "Caribbean"}
          </text>
        </g>

        <g transform="translate(650 362)">
          <rect x="-72" y="-24" width="144" height="58" rx="13" fill="#FFF0F7" stroke="#FBCFE8" />
          <text x="0" y="-2" textAnchor="middle" fill="#DB2777" fontSize="13" fontWeight="800">
            {ro ? "În vacanță" : "Vacation"}
          </text>
          <text x="0" y="17" textAnchor="middle" fill="#0F172A" fontSize="12" fontWeight="700">
            {ro ? "Oceanul Indian" : "Indian Ocean"}
          </text>
        </g>
      </svg>

      <div className="absolute left-[12%] top-[10%] rounded-2xl bg-blue-100/90 px-4 py-3 shadow-sm backdrop-blur">
        <div className="text-sm font-black text-blue-700">{ro ? "Obiecte" : "Objects"}</div>
        <div className="text-xs font-semibold text-slate-700">12,540 {ro ? "schimburi" : "swaps"}</div>
        <div className="text-xs text-slate-500">{ro ? "în curs" : "active"}</div>
      </div>

      <div className="absolute left-[51%] top-[3%] rounded-2xl bg-emerald-100/90 px-4 py-3 shadow-sm backdrop-blur">
        <div className="text-sm font-black text-emerald-700">{ro ? "Proprietăți" : "Properties"}</div>
        <div className="text-xs font-semibold text-slate-700">4,210 {ro ? "schimburi" : "swaps"}</div>
        <div className="text-xs text-slate-500">{ro ? "în curs" : "active"}</div>
      </div>

      <div className="absolute right-[8%] top-[17%] rounded-2xl bg-violet-200/90 px-4 py-3 shadow-sm backdrop-blur">
        <div className="text-sm font-black text-violet-700">{ro ? "Servicii" : "Services"}</div>
        <div className="text-xs font-semibold text-slate-700">9,850 {ro ? "schimburi" : "swaps"}</div>
        <div className="text-xs text-slate-500">{ro ? "în curs" : "active"}</div>
      </div>

      <div className="absolute bottom-[8%] right-[3%] rounded-2xl bg-orange-200/90 px-4 py-3 shadow-sm backdrop-blur">
        <div className="text-sm font-black text-orange-700">{ro ? "Evenimente" : "Events"}</div>
        <div className="text-xs font-semibold text-slate-700">2,430 {ro ? "schimburi" : "swaps"}</div>
        <div className="text-xs text-slate-500">{ro ? "în curs" : "active"}</div>
      </div>

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-white/90 bg-white/80 shadow-md backdrop-blur">
        <button type="button" className="px-3 py-2 text-xl font-black text-slate-700" aria-label="Zoom in">+</button>
        <div className="h-px bg-slate-200" />
        <button type="button" className="px-3 py-2 text-xl font-black text-slate-700" aria-label="Zoom out">−</button>
        <div className="h-px bg-slate-200" />
        <button type="button" className="px-3 py-2 text-sm font-black text-slate-700" aria-label="Center map">◎</button>
      </div>
    </div>
  );
}

export default function HomeReferenceHero() {
  const locale = useLocale();
  const t = useTranslations("branches");
  const nav = useTranslations("nav");
  const ro = locale === "ro";

  const domains = [
    { label: t("objects"), href: "/objects", Icon: Package, tone: "text-blue-700 bg-blue-100/95" },
    { label: t("properties"), href: "/properties", Icon: Home, tone: "text-emerald-700 bg-emerald-100/95" },
    { label: t("services"), href: "/services", Icon: Wrench, tone: "text-violet-700 bg-violet-100/95" },
    { label: t("events"), href: "/events", Icon: CalendarDays, tone: "text-orange-700 bg-orange-100/95" },
  ] as const;

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-b from-[#9CE0FF] via-[#DFF8FF] to-[#DFFFC6] px-5 pb-5 pt-4 text-[#07143D] shadow-[0_22px_70px_rgba(41,152,174,.2)] sm:px-7 lg:px-9 lg:pb-7 lg:pt-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(255,255,255,.82),transparent_18%),radial-gradient(circle_at_73%_10%,rgba(255,255,255,.85),transparent_17%),linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,0)_55%)]" aria-hidden="true" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-500 text-white shadow-sm">
            <RefreshCcw className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-950">swaply.</span>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {domains.map(({ label, href, Icon, tone }) => (
            <Link key={href} href={href} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black shadow-sm ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="hidden items-center gap-2 rounded-xl border border-white/70 bg-white/65 px-3 py-2 text-sm font-bold shadow-sm backdrop-blur sm:inline-flex">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            {ro ? "RO" : "EN"}
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          <Link href="/login" className="rounded-xl border border-white/80 bg-white/80 px-4 py-2 text-sm font-black shadow-sm">
            Log in
          </Link>
          <Link href="/register" className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-4 py-2 text-sm font-black text-white shadow-md">
            {ro ? "Înscrie-te" : "Sign up"}
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-3 grid items-center gap-4 lg:grid-cols-[0.42fr_1.58fr]">
        <div className="py-8 lg:py-10">
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
            {ro ? (
              <>
                Schimbă. Conectează.
                <br />
                <span className="text-emerald-500">Transformă</span>{" "}
                <span className="text-blue-500">lumea.</span>
              </>
            ) : (
              <>
                Swap. Connect.
                <br />
                <span className="text-emerald-500">Transform</span>{" "}
                <span className="text-blue-500">the world.</span>
              </>
            )}
          </h1>

          <p className="mt-6 max-w-md text-base font-medium leading-7 text-slate-700">
            {ro
              ? "Schimbă obiecte, proprietăți, servicii și experiențe. Local. Global. Cu sens."
              : "Exchange objects, properties, services and experiences. Local. Global. Meaningful."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-6 py-3.5 text-sm font-black text-white shadow-lg">
              {ro ? "Începe acum" : "Start now"}
            </Link>
            <Link href="/explore" className="rounded-xl border border-white bg-white/85 px-6 py-3.5 text-sm font-black shadow-md">
              {ro ? "Explorează" : nav("explore")}
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-3">
            {[
              { value: "156K+", label: ro ? "Utilizatori" : "Users", Icon: UsersRound },
              { value: "87K+", label: ro ? "Obiecte" : "Objects", Icon: ShieldCheck },
              { value: "34K+", label: ro ? "Schimburi" : "Swaps", Icon: RefreshCcw },
              { value: "152", label: ro ? "Țări" : "Countries", Icon: Globe2 },
            ].map(({ value, label, Icon }) => (
              <div key={label} className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <b className="text-base sm:text-lg">{value}</b>
                </div>
                <p className="mt-1 truncate text-[10px] font-medium text-slate-600 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/75 px-4 py-2.5 text-xs font-bold shadow-sm backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <strong className="text-emerald-600">LIVE</strong>
            <span>{ro ? "1,243 schimburi active acum în lume" : "1,243 active exchanges worldwide"}</span>
          </div>
        </div>

        <WorldMap ro={ro} />
      </div>

      <div className="relative z-20 mx-auto -mt-3 grid max-w-5xl grid-cols-2 gap-2 rounded-2xl border border-white/90 bg-white/82 p-2.5 shadow-lg backdrop-blur sm:grid-cols-5">
        {[
          { title: "Direct", subtitle: ro ? "față în față" : "face to face", Icon: UsersRound, color: "text-emerald-600" },
          { title: "Local", subtitle: ro ? "în oraș/regiune" : "city/region", Icon: MapPin, color: "text-blue-600" },
          { title: "International", subtitle: ro ? "oriunde în lume" : "worldwide", Icon: Globe2, color: "text-violet-600" },
          { title: ro ? "În 3" : "3-way", subtitle: ro ? "schimb de grup" : "group exchange", Icon: UsersRound, color: "text-orange-600" },
          { title: ro ? "În vacanță" : "Vacation", subtitle: ro ? "predare în călătorii" : "travel handoff", Icon: Plane, color: "text-pink-600" },
        ].map(({ title, subtitle, Icon, color }) => (
          <div key={title} className="flex items-center justify-center gap-2 rounded-xl px-2 py-2 text-left">
            <Icon className={`h-6 w-6 shrink-0 ${color}`} aria-hidden="true" />
            <div>
              <div className="text-xs font-black sm:text-sm">{title}</div>
              <div className="text-[10px] font-medium text-slate-500 sm:text-xs">{subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute -bottom-4 left-0 right-0 h-24 opacity-90" aria-hidden="true">
        <svg viewBox="0 0 1200 110" className="h-full w-full" preserveAspectRatio="none">
          <path d="M0 110V78c35-18 59-4 83 7 25 11 50 18 77 4 31-16 61-16 91 2 34 20 67 16 101-2 32-17 65-14 94 5 33 21 66 19 98 2 31-16 63-12 93 7 34 22 67 20 99 3 33-18 67-17 100 3 33 19 67 17 100-2 31-18 65-17 99 1 31 16 63 17 95 1 29-15 58-18 90-1v11Z" fill="#9FDB66" opacity=".34" />
          <path d="M0 110V92c45-7 70-2 95 9 31 14 62 8 92-2 33-12 65-12 98 2 33 13 66 12 98-1 32-12 64-11 96 2 34 14 68 12 102-1 32-12 64-9 96 4 34 14 68 9 102-2 33-11 65-8 97 3 30 11 61 11 92 1 29-10 58-11 87-2 25 8 49 10 73 5v5Z" fill="#6FCB4C" opacity=".3" />
        </svg>
      </div>
    </section>
  );
}
