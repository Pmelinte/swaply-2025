export const PUBLIC_FOUNDATION_STACK_FALLBACK_LOCALE = "en";

export type PublicFoundationStackCopyValue = Record<string, string>;
export type PublicFoundationStackLocalizedCopy<TCopy extends PublicFoundationStackCopyValue> = Partial<TCopy>;

export function normalizePublicFoundationStackLocale(locale?: string | null): string {
  const normalized = locale?.trim().toLowerCase().split("-")[0];

  return normalized || PUBLIC_FOUNDATION_STACK_FALLBACK_LOCALE;
}

export function resolvePublicFoundationStackCopyFallback<TCopy extends PublicFoundationStackCopyValue>(
  defaultCopy: TCopy,
  localizedCopy?: PublicFoundationStackLocalizedCopy<TCopy> | null,
): TCopy {
  return {
    ...defaultCopy,
    ...localizedCopy,
  };
}
