import { isAuthenticated } from "@/lib/supabase/auth";
import { MyObjectsGuestPreview } from "@/components/guest-previews/MyObjectsGuestPreview";
import { MyObjectsClient } from "./MyObjectsClient";

export default async function MyObjectsPage() {
  const authed = await isAuthenticated();
  if (!authed) return <MyObjectsGuestPreview />;
  return <MyObjectsClient />;
}
