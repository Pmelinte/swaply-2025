import { CalendarDays, Home, Package, Wrench } from "lucide-react";

const routes = [
  { id: "objects-a", d: "M150 120 C235 62 330 72 420 138", color: "#246BFD" },
  { id: "objects-b", d: "M420 138 C338 98 254 100 182 172", color: "#246BFD" },
  { id: "objects-c", d: "M184 172 C265 225 344 212 405 154", color: "#246BFD" },
  { id: "properties-a", d: "M425 132 C515 80 605 86 690 136", color: "#16A765" },
  { id: "properties-b", d: "M690 136 C600 103 520 108 448 156", color: "#16A765" },
  { id: "services-a", d: "M648 138 C758 120 830 165 860 250", color: "#8B3CF6" },
  { id: "services-b", d: "M666 156 C760 154 824 198 849 285", color: "#8B3CF6" },
  { id: "events-a", d: "M486 205 C592 191 708 226 830 304", color: "#F97316" },
  { id: "events-b", d: "M502 214 C576 252 652 273 742 296", color: "#F97316" },
] as const;

const mapFragments = Array.from({ length: 9 }, (_, index) => `/world-map-fragments/${String(index + 1).padStart(2, "0")}.svg`);

type MarkerType = "object" | "property" | "service" | "event";

function Marker({ x, y, type }: { x: number; y: number; type: MarkerType }) {
  const Icon = type === "object" ? Package : type === "property" ? Home : type === "service" ? Wrench : CalendarDays;
  const cls = type === "object" ? "bg-blue-600" : type === "property" ? "bg-emerald-600" : type === "service" ? "bg-violet-600" : "bg-orange-500";

  return (
    <div
      className={`absolute z-30 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-white text-white shadow-lg ${cls}`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </div>
  );
}

function Island({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <div className="absolute z-30 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="relative mx-auto h-14 w-20">
        <div className="absolute bottom-2 left-1 right-1 h-4 rounded-[50%] bg-cyan-300/80" />
        <div className="absolute bottom-3 left-3 right-3 h-3.5 rounded-[50%] bg-amber-200" />
        <div className="absolute bottom-5 left-1/2 h-8 w-1.5 -translate-x-1/2 -rotate-6 rounded-full bg-amber-700" />
        <div className="absolute bottom-9 left-1/2 h-6 w-10 -translate-x-1/2 rounded-[50%] border-t-4 border-emerald-600" />
        <div className="absolute bottom-4 right-3 h-2.5 w-2.5 rounded-full bg-red-500" />
      </div>
      <div className="-mt-1 rounded-xl border border-pink-200 bg-pink-100/95 px-3 py-1.5 shadow-md">
        <div className="text-[11px] font-black text-pink-600">În vacanță</div>
        <div className="text-[11px] font-black text-slate-900">{label}</div>
        <div className="text-[9px] font-medium text-slate-600">Predare în călătorii</div>
      </div>
    </div>
  );
}

function StatBubble({ className, title, count, tone }: { className: string; title: string; count: string; tone: string }) {
  return (
    <div className={`absolute z-40 rounded-2xl px-3 py-2 shadow-md backdrop-blur ${tone} ${className}`}>
      <div className="text-xs font-black">{title}</div>
      <div className="text-[10px] font-semibold text-slate-700">{count}</div>
      <div className="text-[9px] text-slate-600">în curs</div>
    </div>
  );
}

export default function HomeGoldenMapOverlay() {
  return (
    <div
      className="pointer-events-none absolute right-[1.1%] top-[13%] z-40 hidden h-[69%] w-[70.5%] overflow-hidden rounded-[2.1rem] lg:block"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_48%_42%,#ecfcff_0%,#c7f3fb_23%,#91e1ef_58%,#68cede_100%)] shadow-[inset_0_0_55px_rgba(255,255,255,.55),0_18px_50px_rgba(33,151,175,.22)]" />
      <div className="absolute inset-[3.5%_2.5%_4%_2.5%] overflow-hidden rounded-[47%]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_18%,rgba(255,255,255,.78),transparent_20%),radial-gradient(circle_at_74%_20%,rgba(255,255,255,.5),transparent_17%)]" />
        {mapFragments.map((src) => (
          <div
            key={src}
            className="absolute inset-0 bg-contain bg-center bg-no-repeat drop-shadow-[0_7px_5px_rgba(49,132,94,.16)]"
            style={{ backgroundImage: `url('${src}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_43%,rgba(246,218,153,.26),transparent_18%),radial-gradient(ellipse_at_70%_28%,rgba(255,248,210,.18),transparent_16%)] mix-blend-multiply" />
      </div>

      <svg viewBox="0 0 920 390" className="absolute left-[2%] top-[7%] z-20 h-[76%] w-[96%] overflow-visible">
        <g fill="none" strokeLinecap="round" strokeWidth="2.5" strokeDasharray="6 6" opacity=".95">
          {routes.map((route) => (
            <path key={route.id} d={route.d} stroke={route.color} />
          ))}
        </g>
        {routes.map((route, index) => (
          <circle key={`${route.id}-dot`} r="4.5" fill={route.color} stroke="white" strokeWidth="2">
            <animateMotion path={route.d} dur={`${7.2 + (index % 3) * 0.8}s`} begin={`${-(index * 0.85)}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      <Marker x={20} y={27} type="object" />
      <Marker x={27} y={39} type="object" />
      <Marker x={35} y={53} type="object" />
      <Marker x={49} y={24} type="property" />
      <Marker x={57} y={36} type="property" />
      <Marker x={67} y={30} type="property" />
      <Marker x={75} y={31} type="service" />
      <Marker x={84} y={45} type="service" />
      <Marker x={88} y={58} type="service" />
      <Marker x={49} y={53} type="event" />
      <Marker x={65} y={64} type="event" />

      <Island x={32} y={73} label="Caraibe" />
      <Island x={67} y={74} label="Oceanul Indian" />

      <StatBubble className="left-[5%] top-[4%] text-blue-700" title="Obiecte" count="12,540 schimburi" tone="bg-blue-100/95" />
      <StatBubble className="left-[49%] top-[1%] text-emerald-700" title="Proprietăți" count="4,210 schimburi" tone="bg-emerald-100/95" />
      <StatBubble className="right-[4%] top-[10%] text-violet-700" title="Servicii" count="9,850 schimburi" tone="bg-violet-200/95" />
      <StatBubble className="bottom-[8%] right-[1%] text-orange-700" title="Evenimente" count="2,430 schimburi" tone="bg-orange-200/95" />

      <div className="absolute right-[1.2%] top-[35%] z-40 flex flex-col overflow-hidden rounded-xl border border-white bg-white/90 shadow-md">
        <span className="px-3 py-2 text-lg font-black text-slate-700">+</span>
        <span className="h-px bg-slate-200" />
        <span className="px-3 py-2 text-lg font-black text-slate-700">−</span>
        <span className="h-px bg-slate-200" />
        <span className="px-3 py-2 text-sm font-black text-slate-700">◎</span>
      </div>
    </div>
  );
}
