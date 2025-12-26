import { MapPinOff } from "lucide-react";
import { useAppState } from "@/lib/state";

export function MapPreview() {
  const { featureToggles } = useAppState();

  if (!featureToggles.mapsEnabled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
        <MapPinOff className="h-5 w-5" />
        <div>
          <p className="font-semibold text-zinc-800 dark:text-zinc-100">Hartă indisponibilă</p>
          <p>Map provider dezactivat în acest mediu. Restul paginii rămâne utilizabil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-60 rounded-2xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-green-50 p-4 shadow-inner dark:border-zinc-800 dark:from-blue-950/40 dark:to-green-950/40">
      <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Utilizatori activi în apropiere</div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Pe hartă sunt evidențiați utilizatorii Premium și Platinum.
      </p>
      <div className="mt-4 grid h-32 grid-cols-3 gap-3">
        <div className="rounded-full bg-blue-400/80 blur-xl" />
        <div className="rounded-full bg-green-400/80 blur-xl" />
        <div className="rounded-full bg-amber-400/80 blur-xl" />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">Tipurile de pini reflectă nivelul badge-ului.</p>
    </div>
  );
}
