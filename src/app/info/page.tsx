"use client";

import Link from "next/link";
import { StatsGrid } from "@/features/info/StatsGrid";
import { useAppState } from "@/lib/state";
import { NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";

export default function InfoPage() {
  const { infoStats } = useAppState();

  return (
    <div className="space-y-4">
      <div id="stats">
        <SectionCard
          title="Statistici Swaply"
          description="Stats globale + stats user + rang + tokeni + curs + help/legal"
        >
          <StatsGrid stats={infoStats} />
        </SectionCard>
      </div>

      <div id="map">
        <SectionCard
          title="Hartă & confidențialitate"
          description="Provider hărți activ doar dacă există cheie; altfel placeholder conform schemă."
        >
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
            <li>Pini publici doar pentru badge Premium/Platinum.</li>
            <li>Locația este aproximativă (oraș / rază), fără geocodare inversă.</li>
            <li>Fallback: afișăm mesaj „Hartă indisponibilă” fără a bloca restul paginii.</li>
          </ul>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Reguli aliniate cu Excalidraw: vizibilitate controlată de setările de profil și cost-control pentru provider.
          </div>
        </SectionCard>
      </div>

      <div id="legal">
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
      </div>

      <div id="monetizare">
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
      </div>

      <div id="ai-contract">
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

      <NextStepRecommendation
        steps={[
          { label: "Începe cu obiectele", href: "/objects", description: "Listează sau caută obiecte de schimb" },
          { label: "Descoperă match-uri", href: "/match", description: "Lasă AI-ul să găsească potriviri" },
          { label: "Autentificare", href: "/login", description: "Creează cont sau conectează-te" },
        ]}
      />

      <StateShowcase
        title="Stări INFO"
        states={[
          {
            key: "loading",
            title: "Statistici în încărcare",
            description: "Skeleton pe grila de statistici + badge pentru legal până sosesc datele.",
          },
          {
            key: "empty",
            title: "Nicio metadată disponibilă",
            description: "Afișăm text fallback și link direct către secțiunea legal; nu returnăm 404.",
          },
          {
            key: "error",
            title: "Eroare la hărți/contract AI",
            description: "Mesaj clar despre provider indisponibil + fallback manual explicit pe pagină.",
          },
        ]}
      />
    </div>
  );
}
