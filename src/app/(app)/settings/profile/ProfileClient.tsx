// src/app/(app)/settings/profile/ProfileClient.tsx
"use client";

import React from "react";

/**
 * Minimal “bridge” component.
 * Motiv: build-ul pică fiindcă `./ProfileClient` nu există în folder.
 *
 * Îl facem tolerant la orice props ca să nu mai ai erori în cascadă
 * (page.tsx poate să-i dea ce vrea: profile, ratingSummary, etc).
 *
 * După ce build-ul e verde, îl rafinăm frumos (form, avatar, etc).
 */
export default function ProfileClient(props: any) {
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>

      <div className="rounded-md border p-4">
        <p className="text-sm text-muted-foreground">
          ProfileClient is now present ✅ (so imports resolve on Vercel).
        </p>

        {/* Debug-friendly output; safe to delete later */}
        <pre className="mt-3 overflow-auto rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(props ?? {}, null, 2)}
        </pre>
      </div>
    </div>
  );
}
