"use client";

import { HeartHandshake } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { ReceivedInterest } from "@/lib/matching/matchingStore";

interface Props {
  interests: ReceivedInterest[];
  loading: boolean;
}

function displayName(interest: ReceivedInterest): string {
  const profile = interest.fromProfile;
  return (
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
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

export default function MatchingReceivedInterests({ interests, loading }: Props) {
  return (
    <section
      data-testid="interests-received-section"
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Interests received
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            People interested in objects you own.
          </p>
        </div>
        <span
          data-testid="interests-received-count"
          className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
        >
          {interests.length}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading interests…</p>
      ) : interests.length === 0 ? (
        <p
          data-testid="interests-received-empty"
          className="text-sm text-zinc-500 dark:text-zinc-400"
        >
          No pending interests received.
        </p>
      ) : (
        <div className="space-y-3">
          {interests.map((interest) => {
            const name = displayName(interest);
            const date = formatDate(interest.createdAt);

            return (
              <article
                key={interest.interestId}
                data-testid={`received-interest-${interest.interestId}`}
                data-from-user-id={interest.fromUserId}
                data-target-item-id={interest.targetItem.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-700">
                  <SafeImage
                    src={interest.targetItem.photos?.[0] || NO_IMAGE_URL}
                    alt={interest.targetItem.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized={!interest.targetItem.photos?.[0]}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {name}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                      <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
                      Interested
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                    Interested in <strong>{interest.targetItem.title}</strong>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Offers: {interest.offeredItem.title}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{Math.round(interest.score)}% match</span>
                    {date ? <span>{date}</span> : null}
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
