export const revalidate = 0;
import dynamic from "next/dynamic";

const LeaderboardClient = dynamic(() => import("./LeaderboardClient"));

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
