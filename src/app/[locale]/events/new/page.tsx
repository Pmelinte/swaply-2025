"use client";

import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { EventWizard } from "@/components/wizard/event/EventWizard";

export default function NewEventPage() {
  const { user, loading } = useAppState();

  if (loading.auth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <LoggedOutGate returnTo="/events/new" />;
  }

  return <EventWizard />;
}
