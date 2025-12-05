"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProfileByUserId, updateProfile } from "./profile-repository";
import { updateProfileSchema } from "../validation";
import type { UpdateProfileInput } from "../types";

/**
 * Obține user-ul curent din Supabase Auth,
 * folosit în toate server actions.
 */
async function getCurrentUser() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error("Failed to retrieve authenticated user.");
  }
  return data.user ?? null;
}

/**
 * Server action:
 * Returnează profilul utilizatorului curent.
 */
export async function getCurrentProfileAction() {
  const user = await getCurrentUser();
  if (!user) return null;

  return await getProfileByUserId(user.id);
}

/**
 * Server action:
 * Update profilul utilizatorului curent.
 */
export async function updateProfileAction(input: UpdateProfileInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated.");
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join("; "));
  }

  const updated = await updateProfile(user.id, parsed.data);
  return updated;
}
