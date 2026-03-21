import dynamic from "next/dynamic";

const MatchClient = dynamic(() => import("./MatchClient").then((m) => m.MatchClient));

export default async function MatchPage() {
  return <MatchClient />;
}
