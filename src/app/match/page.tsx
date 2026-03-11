import { isAuthenticated } from "@/lib/supabase/auth";
import { MatchGuestPreview } from "@/components/guest-previews/MatchGuestPreview";
import { MatchClient } from "./MatchClient";

export default async function MatchPage() {
  const authed = await isAuthenticated();
  if (!authed) return <MatchGuestPreview />;
  return <MatchClient />;
}
