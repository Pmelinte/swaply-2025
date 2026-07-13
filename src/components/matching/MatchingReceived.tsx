"use client";

import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { MatchingItemRow, MatchingProfileRow } from "@/lib/matching/matchQueries";

export type ReceivedInterestView = {
  id: string;
  fromItem: MatchingItemRow;
  toItem: MatchingItemRow;
  profile: MatchingProfileRow | null;
  score: number;
  createdAt: string | null;
};

interface Props {
  interests: ReceivedInterestView[];
}

function profileLabel(profile: MatchingProfileRow | null): string {
  return profile?.display_name || profile?.username || "Swaply member";
}

export default function MatchingReceived({ interests }: Props) {
  return (
    <section
      data-testid="interests-received"
      className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Interests received ({interests.length})
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        People who expressed interest in your active objects.
      </p>

      {interests.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          No pending interests received.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {interests.map((interest) => (
            <article
              key={interest.id}
              data-testid={`received-interest-${interest.id}`}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60"
            >
              <div className="flex items-center gap-3">
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
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {profileLabel(interest.profile)} is interested in {interest.toItem.title}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    Offers: {interest.fromItem.title}
                  </p>
                </div>

                <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                  {interest.score}%
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
