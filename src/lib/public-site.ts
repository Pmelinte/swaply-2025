export const SWAPLY_PUBLIC_DOMAIN = "www.swaply.world";
export const SWAPLY_PUBLIC_BASE_URL = `https://${SWAPLY_PUBLIC_DOMAIN}`;

export function normalizePublicPath(path = "") {
  if (path === "" || path === "/") return path === "/" ? "/" : "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function toSwaplyPublicUrl(path = "") {
  const normalizedPath = normalizePublicPath(path);
  return `${SWAPLY_PUBLIC_BASE_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
}

export function toSwaplyLocalizedPublicUrl(locale: string, path = "") {
  const normalizedPath = normalizePublicPath(path);
  const localizedPath = normalizedPath === "/" ? "" : normalizedPath;
  return `${SWAPLY_PUBLIC_BASE_URL}/${locale}${localizedPath}`;
}

export function buildPublicHreflangLanguages(locales: readonly string[], path = "") {
  const normalizedPath = normalizePublicPath(path);
  const localizedPath = normalizedPath === "/" ? "" : normalizedPath;

  return Object.fromEntries([
    ...locales.map((locale) => [locale, toSwaplyLocalizedPublicUrl(locale, localizedPath)]),
    ["x-default", toSwaplyLocalizedPublicUrl("en", localizedPath)],
  ]);
}
