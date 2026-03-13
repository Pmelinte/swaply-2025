import dynamic from "next/dynamic";
import { isAuthenticated } from "@/lib/supabase/auth";
import { MatchGuestPreview } from "@/components/guest-previews/MatchGuestPreview";

const MatchClient = dynamic(() => import("./MatchClient").then((m) => m.MatchClient));

export default async function MatchPage() {
  const authed = await isAuthenticated();
  if (!authed) return <MatchGuestPreview />;
  return <MatchClient />;
}
