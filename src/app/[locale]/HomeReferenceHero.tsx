"use client";

import { CalendarDays, Globe2, House, MapPin, Package, Plane, UsersRound, Wrench } from "lucide-react";
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
  { id: "obj-1", path: "M150 172 C255 78 346 76 452 146", color: "#1671f8", kind: "object", begin: "0s" },
  { id: "obj-2", path: "M452 146 C346 76 255 78 150 172", color: "#1671f8", kind: "object", begin: "-3.8s" },
  { id: "prop-1", path: "M474 132 C570 72 684 76 770 150", color: "#16a765", kind: "property", begin: "-1.3s" },
  { id: "prop-2", path: "M770 150 C684 76 570 72 474 132", color: "#16a765", kind: "property", begin: "-4.8s" },
  { id: "service-1", path: "M690 166 C805 144 858 205 875 293", color: "#9333ea", kind: "service", begin: "-2.5s" },
  { id: "event-1", path: "M508 235 C630 215 742 267 850 326", color: "#f97316", kind: "event", begin: "-3.1s" },
  { id: "event-2", path: "M850 326 C742 267 630 215 508 235", color: "#f97316", kind: "event", begin: "-6.1s" },
];

function Glyph({ kind }: { kind: Kind }) {
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
    <g className="motion-reduce:hidden" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <circle r="13" fill="white" stroke="none" opacity="0.96" />
      <circle r="10" fill={route.color} stroke="none" />
      <Glyph kind={route.kind} />
      <animateMotion
        dur={route.duration ?? "8s"}
        repeatCount="indefinite"
        path={route.path}
        begin={route.begin}
      />
    </g>
  );
}

function PalmIsland({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="11" rx="33" ry="9" fill="#43cfe0" opacity="0.72" />
      <path d="M-29 7Q-10-7 8 2T30 8Q11 18-10 16T-29 7Z" fill="#f3d266" />
      <path d="M0 5Q4-14 11-31M9-27Q24-30 29-18M9-27Q1-38-7-37M1-3Q-4-20-16-28M-14-25Q-27-25-31-15" fill="none" stroke="#238b45" strokeLinecap="round" strokeWidth="3.5" />
      <circle cx="24" cy="9" r="4" fill="#ef4444" />
    </g>
  );
}

function VectorWorldMap({ ro }: { ro: boolean }) {
  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] sm:min-h-[500px]">
      <svg
        viewBox="0 0 920 440"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={ro ? "Harta globală animată Swaply" : "Animated Swaply global map"}
      >
        <defs>
          <radialGradient id="swaply-ocean" cx="50%" cy="38%" r="72%">
            <stop offset="0" stopColor="#f8ffff" />
            <stop offset="0.42" stopColor="#c5f2ff" />
            <stop offset="1" stopColor="#8fdbe9" />
          </radialGradient>
          <linearGradient id="swaply-land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#eff8c9" />
            <stop offset="0.45" stopColor="#a8d87a" />
            <stop offset="1" stopColor="#66b66b" />
          </linearGradient>
          <linearGradient id="swaply-desert" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f8e8b2" />
            <stop offset="1" stopColor="#d9bd78" />
          </linearGradient>
          <filter id="swaply-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#207b7b" floodOpacity="0.18" />
          </filter>
        </defs>

        <ellipse cx="470" cy="220" rx="438" ry="198" fill="url(#swaply-ocean)" />
        <ellipse cx="460" cy="132" rx="340" ry="92" fill="#ffffff" opacity="0.22" />

        <g fill="url(#swaply-land)" stroke="#f6ffe8" strokeWidth="2.2" filter="url(#swaply-map-shadow)">
          <path d="M52 142 88 96 138 69 202 55 260 70 311 107 301 145 270 166 248 203 209 226 176 212 151 180 108 177 72 161Z" />
          <path d="M207 217 245 231 271 264 277 310 258 360 226 405 204 378 199 335 181 299 184 255Z" />
          <path d="M358 113 399 86 453 77 505 85 548 102 575 125 549 145 510 144 483 164 445 161 409 147 378 137Z" />
          <path d="M447 166 505 142 574 157 620 209 608 260 574 289 554 347 516 378 486 345 470 294 440 265 424 224Z" />
          <path d="M546 111 626 76 727 87 821 137 840 177 796 214 721 196 661 225 603 206 545 158Z" />
          <path d="M720 286 774 272 831 297 830 346 785 375 727 350 706 311Z" />
          <path d="M836 203 861 208 877 231 867 251 839 247 827 222Z" />
        </g>

        <path d="M446 166 505 142 574 157 620 209 606 236 549 227 500 242 455 219Z" fill="url(#swaply-desert)" opacity="0.78" />
        <path d="M548 110 625 76 702 83 673 102 622 114 584 132Z" fill="#e7f5c5" opacity="0.85" />
        <path d="M674 126 711 110 748 119 728 135 697 143Z" fill="#f8f2db" opacity="0.9" />

        <g fill="none" strokeLinecap="round" strokeWidth="2.5" strokeDasharray="7 7" opacity="0.9">
          {ROUTES.map((route) => (
            <path key={route.id} d={route.path} stroke={route.color} />
          ))}
        </g>
        {ROUTES.map((route) => (
          <MovingMarker key={route.id} route={route} />
        ))}

        <PalmIsland x={332} y={287} />
        <PalmIsland x={650} y={304} />

        <g transform="translate(330 325)">
          <rect x="-58" y="-18" width="116" height="48" rx="11" fill="#fff0f7" stroke="#fbcfe8" />
          <text x="0" y="0" textAnchor="middle" fill="#db2777" fontSize="12" fontWeight="800">{ro ? "În vacanță" : "Vacation"}</text>
          <text x="0" y="17" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">{ro ? "Caraibe" : "Caribbean"}</text>
        </g>
        <g transform="translate(651 345)">
          <rect x="-64" y="-18" width="128" height="48" rx="11" fill="#fff0f7" stroke="#fbcfe8" />
          <text x="0" y="0" textAnchor="middle" fill="#db2777" fontSize="12" fontWeight="800">{ro ? "În vacanță" : "Vacation"}</text>
          <text x="0" y="17" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">{ro ? "Oceanul Indian" : "Indian Ocean"}</text>
        </g>
      </svg>

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-white/90 bg-white/80 shadow-md backdrop-blur">
        <button type="button" className="px-3 py-2 text-lg font-black text-slate-700" aria-label="Zoom in">+</button>
        <div className="h-px bg-slate-200" />
        <button type="button" className="px-3 py-2 text-lg font-black text-slate-700" aria-label="Zoom out">−</button>
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
    { label: t("objects"), href: "/objects", Icon: Package, tone: "text-blue-600 bg-blue-100/90" },
    { label: t("properties"), href: "/properties", Icon: House, tone: "text-emerald-600 bg-emerald-100/90" },
    { label: t("services"), href: "/services", Icon: Wrench, tone: "text-violet-600 bg-violet-100/90" },
    { label: t("events"), href: "/events", Icon: CalendarDays, tone: "text-orange-600 bg-orange-100/90" },
  ] as const;

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#8bdcff] via-[#d9f8ff] to-[#dfffc7] px-5 pb-5 pt-4 text-[#07143d] shadow-[0_18px_55px_rgba(45,154,183,.18)] sm:px-8 lg:px-10">
      <div className="relative mb-3 hidden items-center justify-center gap-3 lg:flex">
        {domains.map(({ label, href, Icon, tone }) => (
          <Link key={href} href={href} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black shadow-sm ${tone}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>

      <div className="relative grid gap-3 lg:grid-cols-[.43fr_1.57fr] lg:items-center">
        <div className="z-10 py-5">
          <h1 className="text-3xl font-black leading-[1.08] sm:text-4xl xl:text-5xl">
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

          <p className="mt-5 max-w-sm text-sm font-medium leading-6 text-slate-700">
            {ro
              ? "Schimbă obiecte, proprietăți, servicii și experiențe. Local. Global. Cu sens."
              : "Exchange objects, properties, services and experiences. Local. Global. Meaningful."}
          </p>

          <div className="mt-6 flex gap-3">
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-6 py-3 text-sm font-black text-white shadow-lg">
              {ro ? "Începe acum" : "Start now"}
            </Link>
            <Link href="/explore" className="rounded-xl border border-white bg-white/85 px-6 py-3 text-sm font-black shadow-md">
              {nav("explore")}
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-4 gap-2">
            {["156K+", "87K+", "34K+", "152"].map((value, index) => (
              <div key={value}>
                <b className="text-lg">{value}</b>
                <p className="text-[10px] text-slate-600">
                  {[ro ? "Utilizatori" : "Users", ro ? "Obiecte" : "Objects", ro ? "Schimburi" : "Swaps", ro ? "Țări" : "Countries"][index]}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/70 px-4 py-2.5 text-xs font-bold shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <strong className="text-emerald-600">LIVE</strong>
            {ro ? "schimburi active în lume" : "active exchanges worldwide"}
          </div>
        </div>

        <VectorWorldMap ro={ro} />
      </div>

      <div className="relative mx-auto mt-2 grid max-w-5xl grid-cols-2 gap-2 rounded-2xl border border-white bg-white/75 p-2.5 text-[11px] font-black shadow-md backdrop-blur sm:grid-cols-5">
        <span className="flex items-center justify-center gap-1"><UsersRound className="h-4 w-4 text-emerald-600" aria-hidden="true" />Direct</span>
        <span className="flex items-center justify-center gap-1"><MapPin className="h-4 w-4 text-blue-600" aria-hidden="true" />Local</span>
        <span className="flex items-center justify-center gap-1"><Globe2 className="h-4 w-4 text-violet-600" aria-hidden="true" />International</span>
        <span className="flex items-center justify-center gap-1"><UsersRound className="h-4 w-4 text-orange-600" aria-hidden="true" />În 3</span>
        <span className="col-span-2 flex items-center justify-center gap-1 sm:col-span-1"><Plane className="h-4 w-4 text-pink-600" aria-hidden="true" />În vacanță</span>
      </div>
    </section>
  );
}
