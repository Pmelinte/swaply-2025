import { redirect } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ObjectWizardClient } from "./ObjectWizardClient";

export const metadata = {
  title: "Add New Object",
};

export default async function NewObjectPage() {
  // Check authentication server-side
  const supabase = getSupabaseClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return <ObjectWizardClient />;
}
