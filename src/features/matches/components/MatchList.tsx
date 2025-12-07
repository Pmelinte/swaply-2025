// src/features/matches/components/MatchList.tsx

import MatchCard from "./MatchCard";

interface MatchListProps {
  matches: Array<{
    id: string;
    otherUser: {
      id: string;
      name: string | null;
      avatar_url: string | null;
    };
  }>;
}

export default function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <p className="text-gray-600 text-sm">
        Nu ai încă match-uri. Continuă să oferi și să ceri obiecte!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
