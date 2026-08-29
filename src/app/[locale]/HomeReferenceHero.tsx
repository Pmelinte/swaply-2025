"use client";

import { CalendarDays, Globe2, House, MapPin, Package, Plane, UsersRound, Wrench } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const REFERENCE_MAP_URL =
  "https://res.cloudinary.com/dvcyauy0y/image/upload/v1787998563/swaply/home/reference-map-exact-v1.webp";

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
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black shadow-sm ${tone}`}
          >
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
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-6 py-3 text-sm font-black text-white shadow-lg"
            >
              {ro ? "Începe acum" : "Start now"}
            </Link>
            <Link
              href="/explore"
              className="rounded-xl border border-white bg-white/85 px-6 py-3 text-sm font-black shadow-md"
            >
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

        <div
          className="relative aspect-[157/90] w-full bg-contain bg-center bg-no-repeat"
          role="img"
          aria-label={ro ? "Harta globală Swaply" : "Swaply global map"}
          style={{ backgroundImage: `url(${REFERENCE_MAP_URL})` }}
        />
      </div>

      <div className="relative mx-auto mt-2 grid max-w-5xl grid-cols-2 gap-2 rounded-2xl border border-white bg-white/75 p-2.5 text-[11px] font-black shadow-md backdrop-blur sm:grid-cols-5">
        <span className="flex items-center justify-center gap-1">
          <UsersRound className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Direct
        </span>
        <span className="flex items-center justify-center gap-1">
          <MapPin className="h-4 w-4 text-blue-600" aria-hidden="true" />
          Local
        </span>
        <span className="flex items-center justify-center gap-1">
          <Globe2 className="h-4 w-4 text-violet-600" aria-hidden="true" />
          International
        </span>
        <span className="flex items-center justify-center gap-1">
          <UsersRound className="h-4 w-4 text-orange-600" aria-hidden="true" />
          În 3
        </span>
        <span className="col-span-2 flex items-center justify-center gap-1 sm:col-span-1">
          <Plane className="h-4 w-4 text-pink-600" aria-hidden="true" />
          În vacanță
        </span>
      </div>
    </section>
  );
}
