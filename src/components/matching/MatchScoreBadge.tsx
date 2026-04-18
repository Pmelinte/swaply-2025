import type { ReactNode } from "react";

interface Props {
  score: number;
  size?: "sm" | "md";
  icon?: ReactNode;
}

/**
 * Shared match score badge used across MatchingItemCard and
 * MatchingProfileCard so browsing and selected-profile surfaces render
 * scores identically.
 *
 * Tier thresholds (aligned with the audit's recommended breakpoints):
 *   score ≥ 70 → green (strong match)
 *   score ≥ 40 → yellow (moderate)
 *   score <  40 → gray (weak)
 */
export function MatchScoreBadge({ score, size = "sm", icon = "⭐" }: Props) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : score >= 40
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";

  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClass} ${color}`}
      aria-label={`Match score ${score} percent`}
    >
      <span aria-hidden="true">{icon}</span>
      {Math.round(score)}%
    </span>
  );
}

export default MatchScoreBadge;
