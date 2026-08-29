"use client";

import { Globe2, House, MapPin, Package, Plane, Rocket, Ticket, UsersRound, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const routes = [
  { id: "objects-out", path: "M115 172 Q248 54 392 145", color: "#2563eb", begin: "0s" },
  { id: "objects-back", path: "M392 145 Q248 54 115 172", color: "#2563eb", begin: "-3.4s" },
  { id: "properties-out", path: "M415 112 Q545 30 682 132", color: "#16a34a", begin: "-1.2s" },
  { id: "properties-back", path: "M682 132 Q545 30 415 112", color: "#16a34a", begin: "-4.7s" },
  { id: "services-out", path: "M510 224 Q654 157 796 232", color: "#9333ea", begin: "-2.1s" },
  { id: "services-back", path: "M796 232 Q654 157 510 224", color: "#9333ea", begin: "-5.4s" },
] as const;

function RocketMarker({ path, color, begin }: { path: string; color: string; begin: string }) {
  return (
    <g className="motion-reduce:hidden">
      <circle r="9" fill={color} opacity="0.18" />
      <circle r="5" fill={color} />
      <path d="M-2.5 -3.5 7 0-2.5 3.5 0 0Z" fill="white" />
      <animateMotion dur="7.6s" repeatCount="indefinite" path={path} begin={begin} rotate="auto" />
    </g>
  );
}

function StaticRouteIcon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} className="motion-safe:animate-pulse">
      <circle r="10" fill="white" opacity="0.92" />
      <circle r="5" fill={color} />
    </g>
  );
}

export default function HomeWorldExperience() {
  const tBenefits = useTranslations("benefits");
  const tBranch = useTranslations("branches");
  const tNav = useTranslations("nav");

  const domains = [
    { label: tBranch("objects"), href: "/objects", icon: Package, tone: "border-blue-300 bg-blue-200/75 text-blue-950 hover:bg-blue-300/80" },
    { label: tBranch("properties"), href: "/properties", icon: House, tone: "border-emerald-300 bg-emerald-200/75 text-emerald-950 hover:bg-emerald-300/80" },
    { label: tBranch("services"), href: "/services", icon: Wrench, tone: "border-violet-300 bg-violet-200/75 text-violet-950 hover:bg-violet-300/80" },
    { label: tBranch("events"), href: "/events", icon: Ticket, tone: "border-orange-300 bg-orange-200/75 text-orange-950 hover:bg-orange-300/80" },
  ] as const;

  return (
    <section
      className="relative isolate overflow-hidden rounded-[2.25rem] border border-sky-200/80 bg-gradient-to-b from-sky-300 via-sky-100 to-lime-100 p-5 text-slate-950 shadow-xl sm:p-7 lg:p-9"
      aria-labelledby="swaply-world-experience-title"
      data-home-world-experience
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-green-300/55 via-lime-200/25 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-white/35 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-10 top-6 h-40 w-40 rounded-full bg-cyan-200/50 blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-7 xl:grid-cols-[0.62fr_1.38fr] xl:items-center">
        <div className="z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-100/85 px-3 py-1.5 text-xs font-black text-sky-950 shadow-sm backdrop-blur">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            Swaply · Global
          </span>
          <h2 id="swaply-world-experience-title" className="mt-4 max-w-lg text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {tBenefits("globalCommunity")}
          </h2>
          <p className="mt-4 max-w-lg text-sm font-medium leading-6 text-slate-700 sm:text-base">
            {tBenefits("directSwap")} · {tBenefits("aiMatching")} · {tBenefits("logistics")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {domains.map(({ label, href, icon: Icon, tone }) => (
              <Link
                key={href}
                href={href}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${tone}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/explore" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-cyan-700">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              {tNav("explore")}
            </Link>
            <Link href="/matching" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cyan-500 bg-cyan-100/80 px-5 py-2.5 text-sm font-black text-cyan-950 transition hover:bg-cyan-200">
              <Rocket className="h-4 w-4" aria-hidden="true" />
              {tNav("matching")}
            </Link>
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/70 bg-sky-200/45 shadow-inner backdrop-blur-sm sm:min-h-[430px]">
          <svg viewBox="0 0 900 430" className="absolute inset-0 h-full w-full" role="img" aria-label="Animated illustration of global Swaply exchanges">
            <defs>
              <linearGradient id="swaply-map-land" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#bbf7d0" />
                <stop offset="0.55" stopColor="#86efac" />
                <stop offset="1" stopColor="#65a30d" />
              </linearGradient>
              <filter id="swaply-map-glow">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <rect width="900" height="430" fill="#bae6fd" opacity="0.34" />
            <g fill="url(#swaply-map-land)" opacity="0.78" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.3">
              <path d="M70 128 117 82l76-20 65 17 50 43-21 43-46 12-28 46-53 2-25-37-38-15Z" />
              <path d="m249 228 39 18 27 49-8 58-26 50-24-12-11-58-25-45Z" />
              <path d="m392 95 60-35 89 5 38 31-29 30-61 7-32 30-46-17Z" />
              <path d="m429 168 77-24 70 21 40 54-22 52-44 16-25 72-49-25-23-75-40-34Z" />
              <path d="m558 91 83-30 101 22 82 52-29 42-80-14-58 29-48-23-60-31Z" />
              <path d="m701 287 62-26 59 31-8 51-53 29-57-28Z" />
              <path d="m817 189 26 4 18 24-11 22-30-10Z" />
            </g>

            <g fill="none" strokeWidth="2.4" strokeDasharray="7 7" opacity="0.78">
              {routes.map((route) => <path key={route.id} d={route.path} stroke={route.color} />)}
              <path d="M310 306 Q392 238 472 302 Q558 364 628 287 Q706 220 768 294" stroke="#f97316" />
              <path d="M768 294 Q706 220 628 287 Q558 364 472 302 Q392 238 310 306" stroke="#f97316" />
              <path d="M472 302 Q378 372 310 306" stroke="#f97316" />
              <path d="M690 112 Q616 212 542 286" stroke="#ec4899" />
              <path d="M790 128 Q672 214 542 286" stroke="#ec4899" />
            </g>

            {routes.map((route) => <RocketMarker key={route.id} path={route.path} color={route.color} begin={route.begin} />)}
            <RocketMarker path="M310 306 Q392 238 472 302 Q558 364 628 287 Q706 220 768 294" color="#f97316" begin="0s" />
            <RocketMarker path="M768 294 Q706 220 628 287 Q558 364 472 302 Q392 238 310 306" color="#f97316" begin="-2.6s" />
            <RocketMarker path="M472 302 Q378 372 310 306" color="#f97316" begin="-5.2s" />
            <RocketMarker path="M690 112 Q616 212 542 286" color="#ec4899" begin="-1.8s" />
            <RocketMarker path="M790 128 Q672 214 542 286" color="#ec4899" begin="-4.7s" />

            <StaticRouteIcon x={115} y={172} color="#2563eb" />
            <StaticRouteIcon x={392} y={145} color="#2563eb" />
            <StaticRouteIcon x={415} y={112} color="#16a34a" />
            <StaticRouteIcon x={682} y={132} color="#16a34a" />
            <StaticRouteIcon x={510} y={224} color="#9333ea" />
            <StaticRouteIcon x={796} y={232} color="#9333ea" />
            <g filter="url(#swaply-map-glow)"><circle cx="542" cy="286" r="12" fill="white" /><circle cx="542" cy="286" r="5" fill="#ec4899" /></g>
          </svg>

          <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/70 bg-white/75 p-2.5 text-[11px] font-black text-slate-700 shadow-md backdrop-blur sm:grid-cols-5">
            <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/65 px-2 py-2"><UsersRound className="h-3.5 w-3.5" />Direct</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-100/80 px-2 py-2"><MapPin className="h-3.5 w-3.5 text-blue-600" />Local</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-100/80 px-2 py-2"><Rocket className="h-3.5 w-3.5 text-violet-600" />International</span>
            <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-100/80 px-2 py-2"><UsersRound className="h-3.5 w-3.5 text-orange-600" />In 3</span>
            <span className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-pink-100/80 px-2 py-2 sm:col-span-1"><Plane className="h-3.5 w-3.5 text-pink-600" />Vacation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
