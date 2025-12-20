"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    };

    signOut();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Signing out…</p>
    </div>
  );
}
