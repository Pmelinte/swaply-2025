"use client";

import { useState } from "react";
import { Archive, Loader2, Pause, Pencil, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import type { DomainListingType } from "@/lib/listings/domainListingPayload";
import { setDomainListingStatus } from "@/lib/listings/domainListingMutationSubmit";

type LifecycleStatus = "active" | "paused" | "archived";

type StatusTranslationKey =
  | "status_active"
  | "status_paused"
  | "status_archived";

function detailSegment(domain: DomainListingType): string {
  return domain === "property" ? "properties" : `${domain}s`;
}

function statusTranslationKey(status: LifecycleStatus): StatusTranslationKey {
  return `status_${status}` as StatusTranslationKey;
}

export function DomainListingOwnerActions({
  domain,
  itemId,
  initialStatus,
  initialRevision,
}: {
  domain: DomainListingType;
  itemId: string;
  initialStatus: LifecycleStatus;
  initialRevision: number;
}) {
  const tc = useTranslations("common");
  const tm = useTranslations("myObjects");
  const to = useTranslations("objects");
  const ta = useTranslations("admin");
  const [status, setStatus] = useState<LifecycleStatus>(initialStatus);
  const [revision, setRevision] = useState(initialRevision);
  const [pending, setPending] = useState<LifecycleStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(nextStatus: LifecycleStatus) {
    if (nextStatus === "archived") {
      const confirmed = window.confirm(ta("archiveConfirm"));
      if (!confirmed) return;
    }

    setPending(nextStatus);
    setError(null);
    try {
      const result = await setDomainListingStatus({
        domain,
        itemId,
        status: nextStatus,
        expectedRevision: revision,
      });
      setStatus(result.status);
      setRevision(result.revision);
    } catch {
      setError(tc("errorOccurred"));
    } finally {
      setPending(null);
    }
  }

  const segment = detailSegment(domain);

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-900 dark:bg-zinc-900 dark:text-blue-100">
          {to(statusTranslationKey(status))} · #{revision}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${segment}/${itemId}/edit`}
            className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <Pencil className="h-4 w-4" /> {tc("edit")}
          </Link>

          {status === "active" ? (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void changeStatus("paused")}
              className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-zinc-900 dark:text-blue-100"
            >
              {pending === "paused" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              {tm("pause")}
            </button>
          ) : status === "paused" ? (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void changeStatus("active")}
              className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50 dark:border-green-900 dark:bg-zinc-900 dark:text-green-200"
            >
              {pending === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {tm("resume")}
            </button>
          ) : null}

          {status !== "archived" && (
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => void changeStatus("archived")}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {pending === "archived" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              {tm("archive")}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}
    </section>
  );
}
