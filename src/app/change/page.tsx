import { isAuthenticated } from "@/lib/supabase/auth";
import { ChangeGuestPreview } from "@/components/guest-previews/ChangeGuestPreview";
import { ChangeClient } from "./ChangeClient";

export default async function ChangePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const authed = await isAuthenticated();
  if (!authed) return <ChangeGuestPreview />;

  const raw = searchParams?.swap;
  const swapFromQuery = Array.isArray(raw) ? raw[0] : raw ?? null;
  return <ChangeClient swapFromQuery={swapFromQuery} />;
}
