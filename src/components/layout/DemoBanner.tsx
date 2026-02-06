"use client";

import { useAppState } from "@/lib/state";

export function DemoBanner() {
  const { user, dataSource, logout } = useAppState();
  if (dataSource !== "mock" || !user) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm dark:border-amber-800 dark:bg-amber-950/60">
      <span className="font-semibold text-amber-800 dark:text-amber-200">
        Mod demo activ
      </span>
      <span className="mx-2 text-amber-700 dark:text-amber-300">
        — datele nu sunt reale și nu se salvează.
      </span>
      <button
        type="button"
        onClick={logout}
        className="rounded-full bg-amber-200 px-3 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
      >
        Ieși din demo
      </button>
    </div>
  );
}
