"use client";

import { useTransition } from "react";
import { updateProfileAction } from "@/features/profile/server/profile-actions";
import type { Profile } from "@/features/profile/types";
import { useProfileForm } from "@/features/profile/hooks/use-profile-form";

interface ProfileFormProps {
  profile: Profile;
}

/**
 * Formular complet pentru editarea profilului.
 * Folosește server actions + React Hook Form.
 */
export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState } = useProfileForm({
    defaultValues: {
      full_name: profile.full_name || "",
      avatar_url: profile.avatar_url || "",
      location: profile.location || "",
      bio: profile.bio || "",
    },
  });

  const onSubmit = (values: any) => {
    startTransition(async () => {
      await updateProfileAction(values);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Full name */}
      <div className="flex flex-col space-y-1">
        <label className="font-medium">Nume complet</label>
        <input
          {...register("full_name")}
          className="border rounded px-3 py-2"
          placeholder="Numele tău"
        />
        {formState.errors.full_name && (
          <p className="text-red-500 text-sm">
            {formState.errors.full_name.message}
          </p>
        )}
      </div>

      {/* Avatar URL */}
      <div className="flex flex-col space-y-1">
        <label className="font-medium">Avatar URL</label>
        <input
          {...register("avatar_url")}
          className="border rounded px-3 py-2"
          placeholder="https://..."
        />
        {formState.errors.avatar_url && (
          <p className="text-red-500 text-sm">
            {formState.errors.avatar_url.message}
          </p>
        )}
      </div>

      {/* Location */}
      <div className="flex flex-col space-y-1">
        <label className="font-medium">Locație</label>
        <input
          {...register("location")}
          className="border rounded px-3 py-2"
          placeholder="Oraș, țară"
        />
        {formState.errors.location && (
          <p className="text-red-500 text-sm">
            {formState.errors.location.message}
          </p>
        )}
      </div>

      {/* Bio */}
      <div className="flex flex-col space-y-1">
        <label className="font-medium">Bio</label>
        <textarea
          {...register("bio")}
          className="border rounded px-3 py-2 min-h-[100px]"
          placeholder="Scrie câteva cuvinte despre tine..."
        />
        {formState.errors.bio && (
          <p className="text-red-500 text-sm">
            {formState.errors.bio.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {isPending ? "Se salvează..." : "Salvează modificările"}
      </button>
    </form>
  );
}
