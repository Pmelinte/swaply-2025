"use client";

import {
  CalendarDays,
  Globe2,
  House,
  MapPin,
  Package,
  Plane,
  UsersRound,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type DomainKind = "object" | "property" | "service" | "event";

type Route = {
  id: string;
  path: string;
  color: string;
  kind: DomainKind;
  begin: string;
  duration?: string;
};

const routes: Route[] = [
  {
    id: "objects-atlantic-out",
    path: "M160 183 Q300 72 438 151",
    color: "#2563eb",
    kind: "object",
    begin: "0s",
  },
  {
    id: "objects-atlantic-back",
    path: "M438 151 Q300 72 160 183",
    color: "#2563eb",
    kind: "object",
    begin: "-3.4s",
  },
  {
    id: "properties-europe-asia-out",
    path: "M472 126 Q585 68 715 151",
    color: "#16a34a",
    kind: "property",
    begin: "-1.1s",
  },
  {
    id: "properties-europe-asia-back",
    path: "M715 151 Q585 68 472 126",
    color: "#16a34a",
    kind: "property",
    begin: "-4.4s",
  },
  {
    id: "services-asia-oceania-out",
    path: "M635 176 Q770 154 846 260",
    color: "#9333ea",
    kind: "service",
    begin: "-2.2s",
  },
  {
    id: "services-asia-oceania-back",
    path: "M846 260 Q770 154 635 176",
    color: "#9333ea",
    kind: "service",
    begin: "-5.4s",
  },
  {
    id: "events-three-a",
    path: "M486 238 Q575 213 662 272 Q725 320 817 319",
    color: "#f97316",
    kind: "event",
    begin: "0s",
    duration: "9s",
  },
  {
    id: "events-three-b",
    path: "M817 319 Q725 320 662 272 Q575 213 486 238",
    color: "#f97316",
    kind: "event",
    begin: "-3s",
    duration: "9s",
  },
  {
    id: "events-three-c",
    path: "M662 272 Q565 338 486 238",
    color: "#f97316",
    kind: "event",
    begin: "-6s",
    duration: "9s",
  },
  {
    id: "vacation-caribbean",
    path: "M435 158 Q355 166 302 218",
    color: "#ec4899",
    kind: "property",
    begin: "-1.8s",
    duration: "8.4s",
  },
  {
    id: "vacation-indian",
    path: "M560 162 Q612 199 651 252",
    color: "#ec4899",
    kind: "property",
    begin: "-4.5s",
    duration: "8.4s",
  },
];

function DomainGlyph({ kind }: { kind: DomainKind }) {
  if (kind === "object") {
    return (
      <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        <path d="M-6 -4 0-7 6-4 0-1Z" />
        <path d="M-6 -4v8L0 7l6-3v-8" />
        <path d="M0-1v8" />
      </g>
    );
  }

  if (kind === "property") {
    return (
      <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9">
        <path d="m-7 0 7-6 7 6" />
        <path d="M-5-1v7h10v-7" />
        <path d="M-1 6V2h3v4" />
      </g>
    );
  }

  if (kind === "service") {
    return (
      <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9">
        <path d="M-6 6 3-3" />
        <path d="M1-5a4 4 0 0 0 5 5L2 4-2 0a4 4 0 0 0-5-5l3 3" />
        <circle cx="-5" cy="5" r="1.2" />
      </g>
    );
  }

  return (
    <g fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <rect x="-7" y="-6" width="14" height="13" rx="2" />
      <path d="M-7-2H7M-3-8v4M3-8v4M-3 1h2M2 1h2M-3 4h2M2 4h2" />
    </g>
  );
}

function MovingDomainMarker({ route }: { route: Route }) {
  return (
    <g className="motion-reduce:hidden">
      <circle r="12" fill="white" opacity="0.92" />
      <circle r="9" fill={route.color} />
      <DomainGlyph kind={route.kind} />
      <animateMotion
        dur={route.duration ?? "7.6s"}
        repeatCount="indefinite"
        path={route.path}
        begin={route.begin}
        rotate="0"
      />
    </g>
  );
}

function StaticDomainMarker({ x, y, color, kind }: { x: number; y: number; color: string; kind: DomainKind }) {
  return (
    <g transform={`translate(${x} ${y})`} className="motion-safe:animate-pulse">
      <circle r="12" fill="white" opacity="0.94" />
      <circle r="9" fill={color} />
      <DomainGlyph kind={kind} />
    </g>
  );
}

function VacationDestination({ x, y, title }: { x: number; y: number; title: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="18" fill="#ffffff" opacity="0.86" />
      <circle r="13" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <path d="M0-6c-4 0-7 3-7 6h5c0-2 1-4 2-6Zm0 0c4 0 7 3 7 6H2c0-2-1-4-2-6ZM0 0v8M-4 8h8" fill="none" stroke="#ec4899" strokeLinecap="round" strokeWidth="1.8" />
      <text x="0" y="31" textAnchor="middle" fill="#9d174d" fontSize="11" fontWeight="800">{title}</text>
    </g>
  );
}

export default function HomeWorldExperience() {
  const tBenefits = useTranslations("benefits");
  const tBranch = useTranslations("branches");
  const tNav = useTranslations("nav");

  const domains = [
    {
      label: tBranch("objects"),
      href: "/objects",
      icon: Package,
      tone: "border-blue-300/80 bg-blue-100/80 text-blue-950 hover:bg-blue-200",
    },
    {
      label: tBranch("properties"),
      href: "/properties",
      icon: House,
      tone: "border-emerald-300/80 bg-emerald-100/80 text-emerald-950 hover:bg-emerald-200",
    },
    {
      label: tBranch("services"),
      href: "/services",
      icon: Wrench,
      tone: "border-violet-300/80 bg-violet-100/80 text-violet-950 hover:bg-violet-200",
    },
    {
      label: tBranch("events"),
      href: "/events",
      icon: CalendarDays,
      tone: "border-orange-300/80 bg-orange-100/80 text-orange-950 hover:bg-orange-200",
    },
  ] as const;

  return (
    <section
      className="relative isolate overflow-hidden rounded-[2.25rem] border border-sky-200/80 bg-gradient-to-b from-sky-300 via-sky-100 to-lime-100 px-5 pb-6 pt-5 text-slate-950 shadow-xl sm:px-7 sm:pb-7 lg:px-9 lg:pt-8"
      aria-labelledby="swaply-world-experience-title"
      data-home-world-experience
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-green-300/55 via-lime-200/25 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-white/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-10 top-4 h-48 w-48 rounded-full bg-cyan-200/55 blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-5 xl:grid-cols-[0.56fr_1.44fr] xl:items-center">
        <div className="z-10 xl:pb-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/80 bg-white/60 px-3 py-1.5 text-xs font-black text-sky-950 shadow-sm backdrop-blur">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            Swaply · Global
          </span>

          <h2 id="swaply-world-experience-title" className="mt-4 max-w-lg text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {tBenefits("globalCommunity")}
          </h2>
          <p className="mt-4 max-w-lg text-sm font-medium leading-6 text-slate-700 sm:text-base">
            {tBenefits("directSwap")} · {tBenefits("aiMatching")} · {tBenefits("logistics")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {domains.map(({ label, href, icon: Icon, tone }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-black shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${tone}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/explore" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              {tNav("explore")}
            </Link>
            <Link href="/matching" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-300 bg-white/65 px-5 py-2.5 text-sm font-black text-cyan-950 shadow-sm backdrop-blur transition hover:bg-white/85">
              <UsersRound className="h-4 w-4" aria-hidden="true" />
              {tNav("matching")}
            </Link>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/60 px-3 py-2 text-xs font-bold text-emerald-900 shadow-sm backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Global exchange activity
          </div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] border border-white/75 bg-white/28 shadow-inner backdrop-blur-[2px] sm:min-h-[455px]">
          <svg viewBox="0 0 900 430" className="absolute inset-0 h-full w-full" role="img" aria-label="Animated world map showing Swaply exchange routes by category">
            <defs>
              <linearGradient id="swaply-map-sea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#e0f7ff" />
                <stop offset="0.5" stopColor="#b8eff8" />
                <stop offset="1" stopColor="#c9f4df" />
              </linearGradient>
              <linearGradient id="swaply-map-land" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#e8f7c8" />
                <stop offset="0.48" stopColor="#a7db8f" />
                <stop offset="1" stopColor="#79bb74" />
              </linearGradient>
              <filter id="swaply-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0f766e" floodOpacity="0.15" />
              </filter>
              <filter id="swaply-map-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="900" height="430" rx="28" fill="url(#swaply-map-sea)" />
            <ellipse cx="455" cy="225" rx="402" ry="177" fill="#ffffff" opacity="0.16" />

            <g fill="url(#swaply-map-land)" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.3" filter="url(#swaply-map-shadow)">
              <path d="M66 141 101 101l68-31 71 8 66 41 3 41-40 26-31 47-53 11-33-30-50-11-33-33Z" />
              <path d="M247 226 286 246l24 44-8 63-27 52-25-17-7-58-28-45 15-37Z" />
              <path d="M389 115 439 83l81-8 54 22 25 30-41 18-55-1-34 27-44-9Z" />
              <path d="M446 166 501 143l69 17 48 58-17 57-44 28-23 72-48-31-20-75-38-39Z" />
              <path d="M548 112 625 79l99 10 93 49 17 39-42 36-74-17-58 27-56-18-57-48Z" />
              <path d="M720 288 773 274l55 24-1 48-44 28-57-24-19-38Z" />
              <path d="M835 206 24 4 17 22-10 22-30-8Z" />
            </g>

            <g fill="none" strokeWidth="2.2" strokeDasharray="6 7" opacity="0.82">
              {routes.map((route) => (
                <path key={route.id} d={route.path} stroke={route.color} />
              ))}
            </g>

            {routes.map((route) => (
              <MovingDomainMarker key={route.id} route={route} />
            ))}

            <StaticDomainMarker x={160} y={183} color="#2563eb" kind="object" />
            <StaticDomainMarker x={438} y={151} color="#2563eb" kind="object" />
            <StaticDomainMarker x={472} y={126} color="#16a34a" kind="property" />
            <StaticDomainMarker x={715} y={151} color="#16a34a" kind="property" />
            <StaticDomainMarker x={635} y={176} color="#9333ea" kind="service" />
            <StaticDomainMarker x={846} y={260} color="#9333ea" kind="service" />
            <StaticDomainMarker x={486} y={238} color="#f97316" kind="event" />
            <StaticDomainMarker x={817} y={319} color="#f97316" kind="event" />

            <VacationDestination x={302} y={218} title="Caribbean" />
            <VacationDestination x={651} y={252} title="Indian Ocean" />

            <g filter="url(#swaply-map-glow)">
              <circle cx="302" cy="218" r="4" fill="#ec4899" />
              <circle cx="651" cy="252" r="4" fill="#ec4899" />
            </g>
          </svg>

          <div className="absolute left-3 top-3 rounded-2xl border border-blue-200/80 bg-blue-100/85 px-3 py-2 text-xs font-black text-blue-900 shadow-sm backdrop-blur">
            <span className="flex items-center gap-2"><Package className="h-4 w-4" />{tBranch("objects")}</span>
          </div>
          <div className="absolute left-[43%] top-3 rounded-2xl border border-emerald-200/80 bg-emerald-100/85 px-3 py-2 text-xs font-black text-emerald-900 shadow-sm backdrop-blur">
            <span className="flex items-center gap-2"><House className="h-4 w-4" />{tBranch("properties")}</span>
          </div>
          <div className="absolute right-3 top-[17%] rounded-2xl border border-violet-200/80 bg-violet-100/85 px-3 py-2 text-xs font-black text-violet-900 shadow-sm backdrop-blur">
            <span className="flex items-center gap-2"><Wrench className="h-4 w-4" />{tBranch("services")}</span>
          </div>
          <div className="absolute bottom-[20%] right-3 rounded-2xl border border-orange-200/80 bg-orange-100/90 px-3 py-2 text-xs font-black text-orange-900 shadow-sm backdrop-blur">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{tBranch("events")}</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-2 rounded-2xl border border-white/75 bg-white/72 p-2.5 text-[11px] font-black text-slate-700 shadow-md backdrop-blur sm:grid-cols-5">
        <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/65 px-2 py-2"><UsersRound className="h-3.5 w-3.5 text-emerald-600" />Direct</span>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-100/80 px-2 py-2"><MapPin className="h-3.5 w-3.5 text-blue-600" />Local</span>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-100/80 px-2 py-2"><Globe2 className="h-3.5 w-3.5 text-violet-600" />International</span>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-100/80 px-2 py-2"><UsersRound className="h-3.5 w-3.5 text-orange-600" />In 3</span>
        <span className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-pink-100/80 px-2 py-2 sm:col-span-1"><Plane className="h-3.5 w-3.5 text-pink-600" />Vacation</span>
      </div>
    </section>
  );
}
