"use client";

import Link from "next/link";
import Image from "next/image";

type Rating = {
  average: number;
  total: number;
};

interface MatchCardProps {
  match: {
    id: string;
    otherUser: {
      id: string;
      name: string | null;
      avatar_url: string | null;
      rating?: Rating; // ✅ optional ca să nu crape dacă nu vine din repo
    };
  };
}

export default function MatchCard({ match }: MatchCardProps) {
  const user = match.otherUser;

  const average = user.rating?.average ?? 0;
  const total = user.rating?.total ?? 0;
  const isTrusted = average >= 4.5 && total >= 5;

  return (
    <div className="border p-4 rounded-xl bg-white shadow-sm flex gap-4 items-center">
      {/* Avatar */}
      <div className="shrink-0">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.name ?? "User"}
            width={64}
            height={64}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            👤
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-lg truncate">
            {user.name ?? "Utilizator"}
          </p>

          {isTrusted && (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg">
              ⭐ Trusted
            </span>
          )}

          {user.rating && (
            <span className="text-xs text-gray-500">
              ({average.toFixed(1)} / 5 · {total})
            </span>
          )}
        </div>

        {/* Butoane */}
        <div className="flex gap-3 mt-3 flex-wrap">
          <Link
            href={`/profile/${user.id}`}
            className="px-3 py-1 bg-gray-100 text-sm rounded-lg"
          >
            Vezi profil
          </Link>

          {/* ✅ asta e ruta realistă pe care o vom face imediat după: /matches/[id] */}
          <Link
            href={`/matches/${match.id}`}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg"
          >
            Deschide chat
          </Link>
        </div>
      </div>
    </div>
  );
}