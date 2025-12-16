// src/features/profile/components/profile-form.tsx
"use client";

import { useState } from "react";
import type { Profile } from "../types";
import { updateProfileAction } from "../server/profile-actions";

type Props = {
  profile: Profile;
};

export default function ProfileForm({ profile }: Props) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfileAction({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim(),
      });

      setSuccess("Salvat ✅");
    } catch (e: any) {
      setError(e?.message ?? "Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium">Nume</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Avatar URL</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Se salvează…" : "Salvează"}
      </button>
    </div>
  );
}
