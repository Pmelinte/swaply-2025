import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

const navigation = createNavigation(routing);

export const { Link, redirect, usePathname, getPathname } = navigation;

type AppRouter = ReturnType<typeof navigation.useRouter>;
type PushHref = Parameters<AppRouter["push"]>[0];

function stripExplicitLocalePrefix(href: PushHref): PushHref {
  if (typeof href !== "string") return href;

  for (const locale of routing.locales) {
    const prefix = `/${locale}`;

    if (href === prefix) return "/" as PushHref;
    if (href.startsWith(`${prefix}/`)) {
      return href.slice(prefix.length) as PushHref;
    }
  }

  return href;
}

/**
 * next-intl's localized router expects locale-neutral internal paths.
 * Normalize legacy callers that still include an explicit locale so they
 * cannot produce duplicated routes such as /en/en/objects/:id.
 */
export function useRouter(): AppRouter {
  const router = navigation.useRouter();
  const push: AppRouter["push"] = (href, options) =>
    router.push(stripExplicitLocalePrefix(href), options);

  return { ...router, push };
}
