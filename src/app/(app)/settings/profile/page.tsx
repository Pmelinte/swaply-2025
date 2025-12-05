import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfileAction } from "@/features/profile/server/profile-actions";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  // Obține user-ul curent
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return redirect("/sign-in");
  }

  // Obține profilul asociat userului
  const profile = await getCurrentProfileAction();

  if (!profile) {
    // În caz extrem (nu ar trebui, dacă ensure-profile este folosit),
    // facem fallback la redirect sau un empty state.
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Profilul nu există.</h1>
        <p>Te rugăm să reîncerci autentificarea.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Profilul meu</h1>

      <ProfileClient profile={profile} />
    </div>
  );
}
