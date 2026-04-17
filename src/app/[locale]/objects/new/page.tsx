"use client";

import { useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { ObjectWizardClient } from "./ObjectWizardClient";
import { LoggedOutGate } from "@/components/gated";

export default function NewObjectPage() {
  const { user, loading } = useAppState();
  const router = useRouter();

  // Show loading state while checking auth
  if (loading.auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <LoggedOutGate returnTo="/objects/new" />;
  }

  return <ObjectWizardClient />;
}
