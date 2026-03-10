"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Swaply Error Boundary]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center" role="alert">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/30">
        <h2 className="text-lg font-bold text-red-900 dark:text-red-100">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            Error ID: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
