"use client";

import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { PropertyWizard } from "@/components/wizard/property/PropertyWizard";

export default function NewPropertyPage() {
  const { user, loading } = useAppState();

  if (loading.auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <LoggedOutGate returnTo="/properties/new" />;
  }

  return <PropertyWizard />;
}
