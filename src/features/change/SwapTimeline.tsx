import { formatDate } from "@/lib/utils";
import { SwapIntent } from "@/lib/types";
import { Pill } from "@/components/ui";

const statusLabels: Record<SwapIntent["status"], string> = {
  proposed: "Propus",
  scheduled: "Programat",
  in_progress: "În desfășurare",
  completed: "Finalizat",
  cancelled: "Anulat",
};

export function SwapTimeline({
  swap,
  requesterLabel,
  responderLabel,
}: {
  swap: SwapIntent;
  requesterLabel?: string;
  responderLabel?: string;
}) {
  const steps: Array<{ title: string; description: string; done: boolean }> = [
    {
      title: "Propunere inițială",
      description: "Swap propus între cele două obiecte selectate.",
      done: true,
    },
    {
      title: "Programare întâlnire / curier",
      description:
        swap.logistics.locationType === "courier"
          ? "Coordonează AWB și tracking pentru trimiterea în siguranță."
          : "Selectează un punct public și confirmă disponibilitatea.",
      done: ["scheduled", "in_progress", "completed"].includes(swap.status),
    },
    {
      title: "Schimb în curs",
      description: "Participanții confirmă livrarea sau întâlnirea.",
      done: ["in_progress", "completed"].includes(swap.status),
    },
    {
      title: "Feedback & reputație",
      description: "Oferă rating și comentariu pentru a crește încrederea.",
      done: swap.status === "completed",
    },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-zinc-500">Schimb</p>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {requesterLabel ?? swap.requesterItemId} ↔ {responderLabel ?? swap.responderItemId}
          </h3>
        </div>
        <Pill color="blue">Status: {statusLabels[swap.status]}</Pill>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
          >
            <div
              className={`mt-1 h-3 w-3 rounded-full ${step.done ? "bg-green-500" : "bg-zinc-400"}`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {index + 1}. {step.title}
                </h4>
                {step.done ? <Pill color="green">Finalizat</Pill> : null}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
        Notificări automate: {swap.notifications.join(" · ")}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        Ultima actualizare: {formatDate(new Date().toISOString())}
      </div>
    </div>
  );
}
