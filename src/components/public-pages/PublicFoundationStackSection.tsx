import { Link } from "@/i18n/navigation";
import {
  getPublicFoundationStackTracksForPage,
  type PublicFoundationStackTrack,
} from "@/lib/public-foundation-stack/publicFoundationStackContent";
import type { PublicExperiencePage } from "@/lib/public-pages/publicPageExperienceConfig";

interface PublicFoundationStackSectionProps {
  page: PublicExperiencePage;
  limit?: number;
  className?: string;
}

function FoundationStackCard({ track }: { track: PublicFoundationStackTrack }) {
  return (
    <article
      data-testid="foundation-stack-card"
      className="flex h-full flex-col rounded-xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
          {track.badge}
        </span>
        {track.requiresLoginForRealAction && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Real action after login
          </span>
        )}
      </div>

      <h3 className="mt-3 text-sm font-bold text-zinc-950 dark:text-zinc-50">{track.title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{track.summary}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{track.publicPromise}</p>

      <Link
        href={track.ctaHref}
        className="mt-4 inline-flex w-fit items-center justify-center rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
      >
        {track.ctaLabel}
      </Link>
    </article>
  );
}

export function PublicFoundationStackSection({
  page,
  limit = 4,
  className = "",
}: PublicFoundationStackSectionProps) {
  const tracks = getPublicFoundationStackTracksForPage(page, limit);

  if (tracks.length === 0) return null;

  return (
    <section
      data-testid="foundation-stack-section"
      className={`rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-950 dark:bg-blue-950/20 ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Foundation stack
          </p>
          <h2 className="mt-1 text-base font-bold text-zinc-950 dark:text-zinc-50">
            What Batch 8–17 already protects
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Public visitors can now see how AI, tokens, rank, language fallback and exchange safety work before they start a real action.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tracks.map((track) => (
          <FoundationStackCard key={track.id} track={track} />
        ))}
      </div>
    </section>
  );
}
