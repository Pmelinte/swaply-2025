// src/app/(app)/matches/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { matchesRepository } from "@/features/matches/server/matches-repository";
import type { MatchPreview } from "@/features/chat/types";
import Image from "next/image";
import Link from "next/link";

export default async function MatchesPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // încărcăm match-urile userului
  const matches: MatchPreview[] = await matchesRepository.listUserMatches(
    user.id,
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Match-urile tale</h1>

      {matches.length === 0 && (
        <p className="text-gray-600 text-sm mt-4">
          Nu ai încă match-uri. Continuă să dai swipe ca să găsești oameni
          potriviți pentru schimburi.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {matches.map((m) => (
          <Link
            href={`/matches/${m.id}`}
            key={m.id}
            className="flex items-center gap-4 border rounded-xl p-4 hover:bg-gray-50 transition"
          >
            {/* Avatarul celuilalt user */}
            <div className="w-14 h-14 relative rounded-full overflow-hidden bg-gray-200 shrink-0">
              {m.otherUserAvatar ? (
                <Image
                  src={m.otherUserAvatar}
                  alt={m.otherUserName ?? "User"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  👤
                </div>
              )}
            </div>

            {/* Detalii match */}
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {m.otherUserName ?? "Utilizator"}
              </p>

              {m.lastMessage ? (
                <p className="text-sm text-gray-600 truncate max-w-xs">
                  {m.lastMessage.senderId === user.id ? "Tu: " : ""}
                  {m.lastMessage.content}
                </p>
              ) : (
                <p className="text-sm italic text-gray-500">
                  Nicio conversație încă
                </p>
              )}
            </div>

            <div className="text-gray-400 text-sm">›</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
