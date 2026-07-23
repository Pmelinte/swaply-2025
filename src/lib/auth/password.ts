import type { SupabaseClient } from "@supabase/supabase-js";

export type PasswordMutationResult = Promise<{ error?: string }>;

export function validatePasswordRecoveryEmail(email: string): string | null {
  return email.trim() ? null : "Introduceți adresa de email.";
}

export function validateNewPassword(password: string, confirmation?: string): string | null {
  if (password.length < 6) return "Parola trebuie să aibă cel puțin 6 caractere.";
  if (confirmation !== undefined && password !== confirmation) return "Parolele nu se potrivesc.";
  return null;
}

export async function requestPasswordRecovery(
  supabase: SupabaseClient | null,
  email: string,
  redirectTo: string,
): PasswordMutationResult {
  const validationError = validatePasswordRecoveryEmail(email);
  if (validationError) return { error: validationError };
  if (!supabase) return {};

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  return error ? { error: error.message } : {};
}

export async function updateRecoveredPassword(
  supabase: SupabaseClient | null,
  password: string,
  confirmation?: string,
): PasswordMutationResult {
  const validationError = validateNewPassword(password, confirmation);
  if (validationError) return { error: validationError };
  if (!supabase) return {};

  const { error } = await supabase.auth.updateUser({ password });
  return error ? { error: error.message } : {};
}
