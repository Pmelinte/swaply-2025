"use client";

/**
 * TrustBadge — displays a user's trust level as a compact badge.
 * Used in match cards, chat headers, profile views.
 */

import { useAppState } from "@/lib/state";
import { Shield, ShieldCheck, ShieldAlert, Star, Crown } from "lucide-react";
import type { TrustLevel } from "@/lib/trust";

const ICONS: Record<TrustLevel, React.ReactNode> = {
  new: <ShieldAlert className="h-3.5 w-3.5" />,
  basic: <Shield className="h-3.5 w-3.5" />,
  trusted: <ShieldCheck className="h-3.5 w-3.5" />,
  verified: <Star className="h-3.5 w-3.5" />,
  ambassador: <Crown className="h-3.5 w-3.5" />,
};

export function TrustBadge({ level, score, compact }: {
  level?: TrustLevel;
  score?: number;
  compact?: boolean;
}) {
  const { trustScore, trustLevelConfig } = useAppState();
  const displayLevel = level ?? trustScore.level;
  const displayScore = score ?? trustScore.score;
  const config = trustLevelConfig[displayLevel];

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color} ${config.bgColor}`}
        title={`${config.label} (${displayScore}/100) — ${config.description}`}
      >
        {ICONS[displayLevel]}
        {config.label}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${config.bgColor}`}>
      <span className={config.color}>{ICONS[displayLevel]}</span>
      <div>
        <div className={`text-sm font-semibold ${config.color}`}>
          {config.label} — {displayScore}/100
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{config.description}</div>
      </div>
    </div>
  );
}
