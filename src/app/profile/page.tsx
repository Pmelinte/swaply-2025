import { isAuthenticated } from "@/lib/supabase/auth";
import { ProfileGuestPreview } from "@/components/guest-previews/ProfileGuestPreview";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const authed = await isAuthenticated();
  if (!authed) return <ProfileGuestPreview />;
  return <ProfileClient />;
}
