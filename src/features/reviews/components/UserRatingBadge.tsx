// src/features/reviews/components/UserRatingBadge.tsx

interface UserRatingBadgeProps {
  average: number;
  total: number;
}

export default function UserRatingBadge({ average, total }: UserRatingBadgeProps) {
  // dacă userul nu are rating, arătăm ceva neutru
  if (total === 0) {
    return (
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <span className="text-gray-400">☆ ☆ ☆ ☆ ☆</span>
        <span>fără recenzii</span>
      </div>
    );
  }

  const rounded = Math.round(average);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-yellow-500 text-base">
        {"★".repeat(rounded)}
        {"☆".repeat(5 - rounded)}
      </span>
      <span className="text-gray-700">{average.toFixed(1)}</span>
      <span className="text-gray-500 text-xs">({total})</span>
    </div>
  );
}
