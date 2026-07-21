export const PASSWORD_MIN_LENGTH = 8;

export function validateRecoveryEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!email) return "Introduceți adresa de email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Adresa de email nu este validă.";
  return null;
}

export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Parola trebuie să aibă cel puțin ${PASSWORD_MIN_LENGTH} caractere.`;
  }
  if (password !== confirmation) return "Parolele nu coincid.";
  return null;
}

export function buildPasswordRecoveryRedirect(origin: string, locale: string): string {
  const safeLocale = /^[a-z]{2,3}$/i.test(locale) ? locale.toLowerCase() : "en";
  return `${origin}/${safeLocale}/reset-password`;
}
