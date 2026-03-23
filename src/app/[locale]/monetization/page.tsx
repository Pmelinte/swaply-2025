"use client";

import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { SectionCard } from "@/components/ui";
import { MonetizationHub } from "@/features/monetization/MonetizationHub";
import { Crown, Zap, Star } from "lucide-react";

export default function MonetizationPage() {
  const { user } = useAppState();

  if (!user) {
    return (
      <div className="space-y-6">
        <SectionCard title="Planuri și abonamente" description="Alege planul potrivit pentru tine">
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              Swaply este gratuit pentru schimburi de bază. Planurile premium deblochează funcționalități avansate care te ajută să faci schimburi mai rapide și mai sigure.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800">
                <Zap className="mb-2 h-6 w-6 text-zinc-400" />
                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">Gratuit</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Până la 10 obiecte listate, potriviri AI de bază, chat nelimitat.</p>
                <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">0 lei<span className="text-xs font-normal text-zinc-400">/lună</span></p>
              </div>
              <div className="rounded-xl border-2 border-blue-500 bg-blue-50/50 p-5 dark:bg-blue-900/20">
                <Crown className="mb-2 h-6 w-6 text-blue-500" />
                <h4 className="font-bold text-blue-700 dark:text-blue-300">Premium</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Obiecte nelimitate, potriviri AI avansate, promovare prioritară, badge verificat.</p>
                <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">19.99 lei<span className="text-xs font-normal text-zinc-400">/lună</span></p>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-5 dark:border-amber-700 dark:bg-amber-900/20">
                <Star className="mb-2 h-6 w-6 text-amber-500" />
                <h4 className="font-bold text-amber-700 dark:text-amber-300">Platinum</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Totul din Premium plus asigurare schimb, asistență prioritară și analize detaliate.</p>
                <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">39.99 lei<span className="text-xs font-normal text-zinc-400">/lună</span></p>
              </div>
            </div>
          </div>
        </SectionCard>
        <LoggedOutGate returnTo="/monetization" />
      </div>
    );
  }

  return <MonetizationHub />;
}
