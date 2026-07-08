"use client";

import { usePathname } from "next/navigation";
import { useAppState } from "@/lib/state";
import { stripLocaleFromPathname } from "@/lib/drawer/routeToDrawerVariant";
import type { PublicExperiencePage } from "@/lib/public-pages/publicPageExperienceConfig";
import { GuestExperienceSection } from "./GuestExperienceSection";

const ROUTE_TO_GUEST_PAGE: Array<{
  match: (pathname: string) => boolean;
  page: PublicExperiencePage;
  title: string;
  subtitle: string;
  ctaHref: string;
  ctaLabel: string;
}> = [
  {
    match: (pathname) => pathname === "/objects",
    page: "objects",
    title: "Object swap previews",
    subtitle: "Browse example object exchanges before login. Adding an object, expressing interest and chat still require an account.",
    ctaHref: "/objects/new",
    ctaLabel: "Add an object",
  },
  {
    match: (pathname) => pathname === "/properties",
    page: "properties",
    title: "Property exchange previews",
    subtitle: "Understand property exchange logic without exposing an exact address. Publishing a property remains a real logged-in action.",
    ctaHref: "/properties/new",
    ctaLabel: "Add a property",
  },
  {
    match: (pathname) => pathname === "/services",
    page: "services",
    title: "Service swap previews",
    subtitle: "See how remote, local and hybrid services can be exchanged before creating an account.",
    ctaHref: "/services/new",
    ctaLabel: "Add a service",
  },
  {
    match: (pathname) => pathname === "/events",
    page: "events",
    title: "Event package previews",
    subtitle: "Preview event, ticket and travel-package exchange ideas. Real transfer details are handled after login and consent.",
    ctaHref: "/events/new",
    ctaLabel: "Add an event",
  },
];

export function PublicGuestExperienceSlot() {
  const pathname = usePathname();
  const { user } = useAppState();

  if (user) return null;

  const route = stripLocaleFromPathname(pathname ?? "/");
  const config = ROUTE_TO_GUEST_PAGE.find((entry) => entry.match(route));

  if (!config) return null;

  return (
    <GuestExperienceSection
      page={config.page}
      title={config.title}
      subtitle={config.subtitle}
      ctaHref={`/register?returnTo=${encodeURIComponent(config.ctaHref)}`}
      ctaLabel={config.ctaLabel}
      className="mb-6"
    />
  );
}
