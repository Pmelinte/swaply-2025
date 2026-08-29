import { CalendarDays, Home, Package, Wrench } from "lucide-react";

const routes = [
  { id: "objects-a", d: "M168 108 C245 54 335 58 421 118", color: "#246BFD" },
  { id: "objects-b", d: "M421 118 C330 78 250 92 177 164", color: "#246BFD" },
  { id: "objects-c", d: "M184 164 C268 224 348 207 404 145", color: "#246BFD" },
  { id: "properties-a", d: "M420 124 C500 72 598 78 684 126", color: "#16A765" },
  { id: "properties-b", d: "M684 126 C595 96 515 101 446 150", color: "#16A765" },
  { id: "services-a", d: "M636 128 C742 112 822 156 854 244", color: "#8B3CF6" },
  { id: "services-b", d: "M657 151 C756 150 818 192 842 278", color: "#8B3CF6" },
  { id: "events-a", d: "M470 196 C590 185 708 221 826 302", color: "#F97316" },
  { id: "events-b", d: "M490 207 C568 249 649 271 735 292", color: "#F97316" },
] as const;

function Marker({ x, y, type }: { x: number; y: number; type: "object" | "property" | "service" | "event" }) {
  const Icon = type === "object" ? Package : type === "property" ? Home : type === "service" ? Wrench : CalendarDays;
  const cls = type === "object" ? "bg-blue-600" : type === "property" ? "bg-emerald-600" : type === "service" ? "bg-violet-600" : "bg-orange-500";
  return (
    <div className={`absolute z-30 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-white text-white shadow-lg ${cls}`} style={{ left: `${x}%`, top: `${y}%` }}>
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
  );
}

function Island({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div className="absolute z-30 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="relative mx-auto h-16 w-24">
        <div className="absolute bottom-2 left-2 right-2 h-5 rounded-[50%] bg-cyan-300/80" />
        <div className="absolute bottom-3 left-4 right-4 h-4 rounded-[50%] bg-amber-200" />
        <div className="absolute bottom-6 left-1/2 h-9 w-1.5 -translate-x-1/2 -rotate-6 rounded-full bg-amber-700" />
        <div className="absolute bottom-11 left-1/2 h-7 w-12 -translate-x-1/2 rounded-[50%] border-t-4 border-emerald-600" />
        <div className="absolute bottom-5 right-4 h-2.5 w-2.5 rounded-full bg-red-500" />
      </div>
      <div className="-mt-1 rounded-xl border border-pink-200 bg-pink-100/95 px-4 py-2 shadow-md">
        <div className="text-xs font-black text-pink-600">În vacanță</div>
        <div className="text-xs font-black text-slate-900">{label}</div>
        <div className="text-[10px] font-medium text-slate-600">Predare în călătorii</div>
      </div>
    </div>
  );
}

export default function HomeGoldenMapOverlay() {
  return (
    <div className="pointer-events-none absolute right-[2.2%] top-[14.5%] z-20 hidden h-[67%] w-[69%] overflow-visible lg:block" aria-hidden="true">
      <div className="absolute inset-[2%_1%_3%_1%] rounded-[48%] bg-[radial-gradient(circle_at_45%_34%,#f7ffff_0%,#d9f8ff_23%,#9de9f5_59%,#73d7e7_100%)] shadow-[0_18px_55px_rgba(33,151,175,.24)]" />
      <div className="absolute inset-[3%_2%_4%_2%] rounded-[48%] bg-[radial-gradient(circle_at_22%_16%,rgba(255,255,255,.9),transparent_18%),radial-gradient(circle_at_68%_12%,rgba(255,255,255,.72),transparent_18%)]" />

      <div
        className="absolute left-[4%] top-[7%] h-[70%] w-[91%] bg-[linear-gradient(155deg,#edf7bd_4%,#cfe98d_28%,#85ca72_55%,#66b96a_77%,#9bd77d_100%)] drop-shadow-[0_7px_8px_rgba(45,125,83,.18)]"
        style={{
          WebkitMaskImage: "url('/world-map.svg')",
          maskImage: "url('/world-map.svg')",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          transform: "perspective(900px) rotateX(7deg) scaleY(.91)",
          transformOrigin: "50% 45%",
        }}
      />

      <div
        className="absolute left-[4%] top-[7%] h-[70%] w-[91%] opacity-55 mix-blend-multiply"
        style={{
          background: "radial-gradient(ellipse at 52% 48%, rgba(230,200,126,.9) 0 12%, transparent 30%), radial-gradient(ellipse at 70% 27%, rgba(255,248,210,.9) 0 8%, transparent 22%), radial-gradient(ellipse at 30% 33%, rgba(255,255,225,.7) 0 6%, transparent 19%)",
          WebkitMaskImage: "url('/world-map.svg')",
          maskImage: "url('/world-map.svg')",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          transform: "perspective(900px) rotateX(7deg) scaleY(.91)",
          transformOrigin: "50% 45%",
        }}
      />

      <svg viewBox="0 0 920 390" className="absolute inset-[2%_0_0_0] h-[82%] w-full overflow-visible">
        <g fill="none" strokeLinecap="round" strokeWidth="2.5" strokeDasharray="6 6" opacity=".95">
          {routes.map((route) => <path key={route.id} d={route.d} stroke={route.color} />)}
        </g>
        {routes.map((route, index) => (
          <circle key={`${route.id}-dot`} r="4.5" fill={route.color} stroke="white" strokeWidth="2">
            <animateMotion path={route.d} dur={`${7.4 + (index % 3) * .7}s`} begin={`${-(index * .9)}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      <Marker x={20} y={24} type="object" />
      <Marker x={27} y={37} type="object" />
      <Marker x={35} y={54} type="object" />
      <Marker x={49} y={22} type="property" />
      <Marker x={56} y={37} type="property" />
      <Marker x={67} y={28} type="property" />
      <Marker x={75} y={30} type="service" />
      <Marker x={84} y={45} type="service" />
      <Marker x={88} y={59} type="service" />
      <Marker x={48} y={54} type="event" />
      <Marker x={64} y={66} type="event" />

      <Island x={34} y={75} label="Caraibe" />
      <Island x={68} y={76} label="Oceanul Indian" />

      <div className="absolute left-[8%] top-[3%] rounded-2xl bg-blue-100/95 px-4 py-3 shadow-md">
        <div className="text-sm font-black text-blue-700">Obiecte</div><div className="text-xs font-semibold">12,540 schimburi</div><div className="text-xs text-slate-600">în curs</div>
      </div>
      <div className="absolute left-[50%] top-[-1%] rounded-2xl bg-emerald-100/95 px-4 py-3 shadow-md">
        <div className="text-sm font-black text-emerald-700">Proprietăți</div><div className="text-xs font-semibold">4,210 schimburi</div><div className="text-xs text-slate-600">în curs</div>
      </div>
      <div className="absolute right-[5%] top-[10%] rounded-2xl bg-violet-200/95 px-4 py-3 shadow-md">
        <div className="text-sm font-black text-violet-700">Servicii</div><div className="text-xs font-semibold">9,850 schimburi</div><div className="text-xs text-slate-600">în curs</div>
      </div>
      <div className="absolute bottom-[9%] right-[-1%] rounded-2xl bg-orange-200/95 px-4 py-3 shadow-md">
        <div className="text-sm font-black text-orange-700">Evenimente</div><div className="text-xs font-semibold">2,430 schimburi</div><div className="text-xs text-slate-600">în curs</div>
      </div>

      <div className="absolute right-[.5%] top-[35%] flex flex-col overflow-hidden rounded-xl border border-white bg-white/90 shadow-md">
        <span className="px-3 py-2 text-lg font-black text-slate-700">+</span><span className="h-px bg-slate-200"/><span className="px-3 py-2 text-lg font-black text-slate-700">−</span><span className="h-px bg-slate-200"/><span className="px-3 py-2 text-sm font-black text-slate-700">◎</span>
      </div>
    </div>
  );
}
