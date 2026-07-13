"use client";

import { useMemo, useState } from "react";
import { HeartHandshake, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import { getSupabaseClient } from "@/lib/supabase/client";
import { acceptReceivedInterest } from "@/lib/matching/interestPersistence";
import type { MatchingItemRow, MatchingProfileRow } from "@/lib/matching/matchQueries";

export type ReceivedInterestView = {
  id: string;
  fromUserId: string;
  fromItem: MatchingItemRow;
  toItem: MatchingItemRow;
  profile: MatchingProfileRow | null;
  score: number;
  createdAt: string | null;
};

interface Props {
  interests: ReceivedInterestView[];
  loading: boolean;
}

function profileLabel(interest: ReceivedInterestView): string {
  return (
    interest.profile?.display_name?.trim() ||
    interest.profile?.username?.trim() ||
    `User ${interest.fromUserId.slice(0, 8)}`
  );
}

function formatDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export default function MatchingReceived({ interests, loading }: Props) {
  const tCommon = useTranslations("common");
  const tMatch = useTranslations("match");
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  const visibleInterests = useMemo(
    () => interests.filter((interest) => !acceptedIds.has(interest.id)),
    [acceptedIds, interests],
  );

  async function acceptInterest(interestId: string) {
    if (acceptingIds.has(interestId) || acceptedIds.has(interestId)) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setAcceptingIds((previous) => new Set(previous).add(interestId));

    const accepted = await acceptReceivedInterest(supabase, interestId);
    if (accepted) {
      setAcceptedIds((previous) => new Set(previous).add(interestId));
    }

    setAcceptingIds((previous) => {
      const next = new Set(previous);
      next.delete(interestId);
      return next;
    });
  }

  return (
    <section
      data-testid="interests-received"
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Interests received
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            People who expressed interest in your active objects.
          </p>
        </div>
        <span
          data-testid="interests-received-count"
          className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
        >
          {visibleInterests.length}
        </span>
      </div>

      {loading ? (
        <p
          data-testid="interests-received-loading"
          className="mt-4 text-sm text-zinc-500 dark:text-zinc-400"
        >
          Loading interests…
        </p>
      ) : visibleInterests.length === 0 ? (
        <p
          data-testid="interests-received-empty"
          className="mt-4 text-sm text-zinc-500 dark:text-zinc-400"
        >
          No pending interests received.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {visibleInterests.map((interest) => {
            const date = formatDate(interest.createdAt);
            const isAccepting = acceptingIds.has(interest.id);
            const acceptLabel = tMatch("guestBtnAccept");

            return (
              <article
                key={interest.id}
                data-testid={`received-interest-${interest.id}`}
                data-from-user-id={interest.fromUserId}
                data-target-item-id={interest.toItem.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
                    <SafeImage
                      src={interest.toItem.photos?.[0] || NO_IMAGE_URL}
                      alt={interest.toItem.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized={!interest.toItem.photos?.[0]}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {profileLabel(interest)}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                        <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
                        Interested
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                      Interested in <strong>{interest.toItem.title}</strong>
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      Offers: {interest.fromItem.title}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{Math.round(interest.score)}% match</span>
                      {date ? <span>{date}</span> : null}
                    </div>

                    <button
                      type="button"
                      data-testid={`accept-interest-${interest.id}`}
                      onClick={() => void acceptInterest(interest.id)}
                      disabled={isAccepting}
                      aria-label={acceptLabel}
                      className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isAccepting ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                      )}
                      {isAccepting ? tCommon("loading") : acceptLabel}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
