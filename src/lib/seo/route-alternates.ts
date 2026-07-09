import { locales } from "@/i18n/config";

const BASE_URL = "https://www.swaply.world";

function normalizeRoutePath(routePath: string) {
  if (!routePath || routePath === "/") return "";
  return routePath.startsWith("/") ? routePath : `/${routePath}`;
}

export function buildRouteAlternates(locale: string, routePath: string) {
  const normalizedPath = normalizeRoutePath(routePath);

  return {
    canonical: `${BASE_URL}/${locale}${normalizedPath}`,
    languages: Object.fromEntries([
      ...locales.map((loc) => [loc, `${BASE_URL}/${loc}${normalizedPath}`]),
      ["x-default", `${BASE_URL}/en${normalizedPath}`],
    ]),
  };
}
