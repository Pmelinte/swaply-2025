// src/features/matches/components/MatchCard.tsx

import Link from "next/link";
import Image from "next/image";
import UserRatingBadge from "@/features/reviews/components/UserRatingBadge";

interface MatchCardProps {
  match: {
    id: string;
    otherUser: {
      id: string;
      name: string | null;
      avatar_url: string | null;
      rating: {
        average: number;
        total: number;
      };
    };
  };
}

export default function MatchCard({ match }: MatchCardProps) {
  const user = match.otherUser;
  const { average, total } = user.rating;

  const isTrusted = average >= 4.5 && total >= 5;

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
        <div className="flex items-center gap-2">
          <p className="font-semibold text-lg">{user.name ?? "Utilizator"}</p>

          {isTrusted && (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg">
              ⭐ Trusted
            </span>
          )}
        </div>

        {/* Rating Badge */}
        <UserRatingBadge average={average} total={total} />

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
