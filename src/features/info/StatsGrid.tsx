import { InfoStats } from "@/lib/types";

export function StatsGrid({ stats }: { stats: InfoStats }) {
  const cards = [
    {
      label: "Schimburi globale",
      value: stats.globalSwaps.toLocaleString("ro-RO"),
      hint: "Swaply este activ în mai multe regiuni",
    },
    {
      label: "Utilizatori activi",
      value: stats.activeUsers.toLocaleString("ro-RO"),
      hint: "Filtrați pe hartă după badge",
    },
    {
      label: "% conturi Premium",
      value: `${Math.round(stats.premiumShare * 100)}%`,
      hint: "Badge-urile apar ca pini pe hartă",
    },
    {
      label: "Tokeni emisi",
      value: stats.tokensIssued.toLocaleString("ro-RO"),
      hint: "Ledger securizat, vizibil în profil",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <p className="text-xs uppercase text-zinc-500">{card.label}</p>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {card.value}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
