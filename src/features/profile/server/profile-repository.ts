import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, UpdateProfileInput } from "../types";

const PROFILES_TABLE = "profiles";

function mapProfileRow(row: any): Profile {
  return {
    user_id: row.user_id,
    username: row.username,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    location: row.location,
    bio: row.bio,
    rating: row.rating ?? 0,
    rating_count: row.rating_count ?? 0,
    onboarding_completed: row.onboarding_completed ?? false,
    preferences: row.preferences ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getProfileByUserId(
  userId: string
): Promise<Profile | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProfileRow(data);
}

interface CreateProfileInput {
  user_id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  bio?: string | null;
}

export async function createProfile(
  input: CreateProfileInput
): Promise<Profile> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .insert({
      user_id: input.user_id,
      username: input.username,
      full_name: input.full_name ?? null,
      avatar_url: input.avatar_url ?? null,
      location: input.location ?? null,
      bio: input.bio ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return mapProfileRow(data);
}

export async function updateProfile(
  userId: string,
  values: UpdateProfileInput
): Promise<Profile> {
  const supabase = createServerSupabaseClient();

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if ("full_name" in values) payload.full_name = values.full_name ?? null;
  if ("avatar_url" in values) payload.avatar_url = values.avatar_url ?? null;
  if ("location" in values) payload.location = values.location ?? null;
  if ("bio" in values) payload.bio = values.bio ?? null;

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .update(payload)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return mapProfileRow(data);
}
