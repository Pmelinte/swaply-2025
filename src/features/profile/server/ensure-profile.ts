import type { Profile } from "../types";
import { getProfileByUserId, createProfile } from "./profile-repository";

interface EnsureProfileOptions {
  /**
   * Username sugerat (ex: derivat din email).
   * Dacă lipsește, va fi generat automat din user_id.
   */
  suggestedUsername?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  location?: string | null;
}

/**
 * Creează un profil de bază pentru user dacă nu există deja.
 *
 * De apelat tipic imediat după autentificare (primul login),
 * de ex. din fluxul de auth:
 *
 *   await ensureProfileForUser(user.id, {
 *     suggestedUsername: user.email?.split("@")[0],
 *     full_name: user.user_metadata?.full_name,
 *     avatar_url: user.user_metadata?.avatar_url,
 *   });
 */
export async function ensureProfileForUser(
  userId: string,
  options: EnsureProfileOptions = {}
): Promise<Profile> {
  // 1) Verifică dacă există deja profil
  const existing = await getProfileByUserId(userId);
  if (existing) {
    return existing;
  }

  // 2) Generează un username sigur, unic, determinist
  const baseFromSuggestion =
    options.suggestedUsername?.trim().toLowerCase() || null;

  const sanitizedBase = baseFromSuggestion
    ? baseFromSuggestion.replace(/[^a-z0-9_]/g, "_")
    : null;

  // Folosim user_id ca fallback garantat unic
  const fallbackUsername = `user_${userId.replace(/[^a-z0-9]/gi, "")}`;

  const username = sanitizedBase || fallbackUsername;

  // 3) Creează profilul cu valori de bază
  const profile = await createProfile({
    user_id: userId,
    username,
    full_name: options.full_name ?? null,
    avatar_url: options.avatar_url ?? null,
    location: options.location ?? null,
    bio: null,
  });

  return profile;
}
