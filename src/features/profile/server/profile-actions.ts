"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Tipul unui rând din tabela public.profiles.
 * Păstrăm exact numele de coloane din Postgres.
 */
export interface Profile {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  rating: number | null;
  rating_count: number | null;
  onboarding_completed: boolean;
  preferences: any | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
  bio?: string;
  preferences?: any;
}

/**
 * Helper intern – se asigură că există un profil pentru user-ul dat.
 * Dacă nu există, îl creează cu un username derivat din email.
 */
async function ensureProfileForUser(userId: string, email: string | null): Promise<Profile> {
  const supabase = createServerSupabaseClient();

  // Încearcă să citești profilul existent
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("Failed to fetch profile:", selectError);
  }

  if (existing) {
    return existing as Profile;
  }

  // Creează un profil minim
  const fallbackUsername =
    email?.split("@")[0] ?? `user_${userId.replace(/-/g, "").slice(0, 8)}`;

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      username: fallbackUsername,
    })
    .select("*")
    .single();

  if (insertError || !created) {
    console.error("Failed to create default profile:", insertError);
    throw new Error("Unable to create default profile");
  }

  return created as Profile;
}

/**
 * Returnează profilul utilizatorului curent (autentificat).
 * Creează automat un profil minim dacă nu există încă.
 */
export async function getCurrentProfileAction(): Promise<Profile | null> {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Failed to get auth user:", authError);
    throw new Error("Failed to get authenticated user");
  }

  if (!user) {
    return null;
  }

  const profile = await ensureProfileForUser(user.id, user.email ?? null);
  return profile;
}

/**
 * Actualizează profilul utilizatorului curent și întoarce profilul rezultat.
 * Acceptă doar câmpurile de profil – user_id, created_at, updated_at sunt gestionate în DB.
 */
export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<Profile> {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Failed to get auth user:", authError);
    throw new Error("Failed to get authenticated user");
  }

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Ne asigurăm că profilul există înainte de update
  await ensureProfileForUser(user.id, user.email ?? null);

  const updatePayload: Record<string, any> = {};

  if (typeof input.username === "string") {
    updatePayload.username = input.username;
  }
  if (typeof input.full_name === "string") {
    updatePayload.full_name = input.full_name;
  }
  if (typeof input.avatar_url === "string") {
    updatePayload.avatar_url = input.avatar_url;
  }
  if (typeof input.location === "string") {
    updatePayload.location = input.location;
  }
  if (typeof input.bio === "string") {
    updatePayload.bio = input.bio;
  }
  if (typeof input.preferences !== "undefined") {
    updatePayload.preferences = input.preferences;
  }

  if (Object.keys(updatePayload).length === 0) {
    // Nimic de actualizat – întoarcem profilul curent
    const current = await ensureProfileForUser(user.id, user.email ?? null);
    return current;
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("Failed to update profile:", updateError);
    throw new Error("Failed to update profile");
  }

  return updated as Profile;
}
