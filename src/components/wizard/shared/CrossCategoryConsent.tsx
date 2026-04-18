"use client";

interface Props {
  crossCategorySwap: boolean;
  chainSwapAllowed: boolean;
  onCrossCategoryChange: (value: boolean) => void;
  onChainSwapChange: (value: boolean) => void;
  crossCategoryLabel: string;
  chainSwapLabel: string;
}

export function CrossCategoryConsent({
  crossCategorySwap,
  chainSwapAllowed,
  onCrossCategoryChange,
  onChainSwapChange,
  crossCategoryLabel,
  chainSwapLabel,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={crossCategorySwap}
          onChange={(e) => onCrossCategoryChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-zinc-900 dark:text-zinc-50">{crossCategoryLabel}</span>
      </label>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={chainSwapAllowed}
          onChange={(e) => onChainSwapChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-zinc-900 dark:text-zinc-50">{chainSwapLabel}</span>
      </label>
    </div>
  );
}
