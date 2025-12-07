// src/features/matches/components/MatchCard.tsx

import Link from "next/link";
import Image from "next/image";
import UserRatingBadge from "@/features/reviews/components/UserRatingBadge";
import { getUserRatingSummaryAction } from "@/features/reviews/server/reviews-actions";

interface MatchCardProps {
  match: {
    id: string;
    otherUser: {
      id: string;
      name: string | null;
      avatar_url: string | null;
    };
  };
}

/**
 * Server component — poate apela direct acțiunile server-side
 */
export default async function MatchCard({ match }: MatchCardProps) {
  const user = match.otherUser;

  // Luăm rating summary
  const rating = await getUserRatingSummaryAction(user.id);

  return (
    <div className="border p-4 rounded-xl bg-white shadow-sm flex gap-4 items-center">
      {/* Avatar */}
      <div>
        <Image
          src={user.avatar_url ?? "/placeholder-avatar.png"}
          alt={user.name ?? "User"}
          width={64}
          height={64}
          className="rounded-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1">
        <p className="font-semibold text-lg">{user.name ?? "Utilizator"}</p>

        {/* Rating Badge */}
        <UserRatingBadge
          average={rating.averageStars}
          total={rating.totalReviews}
        />

        {/* Butoane */}
        <div className="flex gap-3 mt-3">
          <Link
            href={`/profile/${user.id}`}
            className="px-3 py-1 bg-gray-100 text-sm rounded-lg"
          >
            Vezi profil
          </Link>

          <Link
            href={`/matches/start/${match.id}`}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg"
          >
            Începe schimb
          </Link>
        </div>
      </div>
    </div>
  );
}
