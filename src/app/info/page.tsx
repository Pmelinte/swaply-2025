"use client";

import Link from "next/link";
import { StatsGrid } from "@/features/info/StatsGrid";
import { useAppState } from "@/lib/state";
import { Pill, SectionCard } from "@/components/ui";

export default function InfoPage() {
  const { infoStats } = useAppState();

  return (
    <div className="space-y-4">
      <SectionCard
        title="Statistici Swaply"
        description="Stats globale + stats user + rang + tokeni + curs + help/legal"
      >
        <StatsGrid stats={infoStats} />
      </SectionCard>

      <SectionCard title="Help & legal" description="Termeni, GDPR, cookies, suport">
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Termeni & Condiții + Politica de confidențialitate (link permanent)</li>
          <li>Manage cookies: accept / manage / reject</li>
          <li>FAQ: cum funcționează swap-ul fără bani</li>
        </ul>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link className="rounded-full bg-blue-600 px-3 py-1 text-white" href="#">
            Termeni
          </Link>
          <Link className="rounded-full bg-zinc-900 px-3 py-1 text-white" href="#">
            GDPR
          </Link>
          <Link className="rounded-full bg-emerald-600 px-3 py-1 text-white" href="#">
            Ajutor
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Monetizare & tokeni" description="Ranguri, badge-uri, apariție pe hartă">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/70 p-3 shadow-sm dark:bg-zinc-800/60">
            <h4 className="text-sm font-semibold">Free</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Badge simplu, vizibilitatea pe hartă este limitată.</p>
          </div>
          <div className="rounded-xl bg-white/70 p-3 shadow-sm dark:bg-zinc-800/60">
            <h4 className="text-sm font-semibold">Premium</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Badge evidențiat, apare pe hartă ca pin public.</p>
          </div>
          <div className="rounded-xl bg-white/70 p-3 shadow-sm dark:bg-zinc-800/60">
            <h4 className="text-sm font-semibold">Platinum</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Badge special, pin distinct, prioritizare în match.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <Pill color="blue">Token ledger</Pill>
          <Pill color="green">Beneficii cont</Pill>
          <Pill color="amber">Promoții limitate (dezactivate în beta)</Pill>
        </div>
      </SectionCard>

      <SectionCard title="Contract AI" description="Moderare, explainability, fallback" >
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Calls doar server-side, cu timeout și retry.</li>
          <li>Moderare pentru text + imagini + atașamente.</li>
          <li>Output AI salvat ca metadata versionată: provider/model_version/trace_id.</li>
          <li>Separăm <code>ai_suggested_*</code> de <code>user_final_*</code>.</li>
          <li>Fallback manual dacă AI e down, fără a bloca fluxurile critice.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
