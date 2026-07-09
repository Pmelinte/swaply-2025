import type { Metadata } from "next";
import { locales } from "@/i18n/config";
import type { PublicRouteAuditId } from "./publicRouteAudit";
import {
  buildPublicHreflangLanguages,
  toSwaplyLocalizedPublicUrl,
} from "@/lib/public-site";

export interface PublicPageMetadataEntry {
  id: PublicRouteAuditId;
  path: string;
  title: string;
  description: string;
}

export const PUBLIC_PAGE_METADATA = [
  {
    id: "home",
    path: "/",
    title: "Swaply — Swap objects without money",
    description:
      "Swaply connects people who want to swap objects, properties, services and events without money. AI matching, secure chat and complete exchange flows.",
  },
  {
    id: "objects",
    path: "/objects",
    title: "Swap Objects | Swaply",
    description:
      "Browse and swap useful objects with people nearby or internationally. Find matches by category, value, trust and availability.",
  },
  {
    id: "properties",
    path: "/properties",
    title: "Swap Properties | Swaply",
    description:
      "Explore property and home exchange opportunities on Swaply, from vacation stays to temporary home swaps and trusted property exchanges.",
  },
  {
    id: "services",
    path: "/services",
    title: "Swap Services | Swaply",
    description:
      "Exchange services directly with other people and professionals. Offer what you can do and find what you need without cash payments.",
  },
  {
    id: "events",
    path: "/events",
    title: "Swap Events | Swaply",
    description:
      "Discover event-related exchanges, tickets, reservations and travel plans that can be transferred or swapped through trusted flows.",
  },
  {
    id: "explore",
    path: "/explore",
    title: "Explore Swap Opportunities | Swaply",
    description:
      "Explore public swap opportunities across objects, properties, services and events with filters for location, category, trust and relevance.",
  },
  {
    id: "matching",
    path: "/matching",
    title: "AI Matching | Swaply",
    description:
      "Use Swaply matching to compare what people offer with what they want and identify balanced exchange opportunities.",
  },
  {
    id: "messages",
    path: "/messages",
    title: "Messages and Swap Chat | Swaply",
    description:
      "Coordinate swap discussions with moderated messaging, translation-ready conversations and clear exchange context.",
  },
  {
    id: "exchange",
    path: "/exchange",
    title: "Exchange Logistics | Swaply",
    description:
      "Plan the practical side of a swap: local handover, courier delivery, travel exchange, confirmation, packaging and feedback.",
  },
  {
    id: "blog",
    path: "/blog",
    title: "Swaply Blog | Swaply",
    description:
      "Read Swaply stories, product updates, swap guides and trust-focused articles about exchanging without money.",
  },
  {
    id: "about",
    path: "/about",
    title: "About Swaply | Swaply",
    description:
      "Learn about Swaply, the global barter platform built to help people exchange useful things, services and opportunities without money.",
  },
  {
    id: "pricing",
    path: "/pricing",
    title: "Pricing and Plans | Swaply",
    description:
      "Compare Swaply plans, tokens and premium features for safer, faster and more visible exchanges.",
  },
  {
    id: "info",
    path: "/info",
    title: "Swaply Information Center | Swaply",
    description:
      "Find Swaply information about tokens, ranks, trust, statistics, rules and platform guidance.",
  },
  {
    id: "contact",
    path: "/contact",
    title: "Contact Swaply | Swaply",
    description:
      "Contact Swaply for support, safety, privacy, legal or partnership questions.",
  },
  {
    id: "terms",
    path: "/terms",
    title: "Terms and Conditions | Swaply",
    description:
      "Read the Swaply Terms and Conditions for account rules, swap rules, moderation, prohibited content and platform responsibilities.",
  },
  {
    id: "privacy",
    path: "/privacy",
    title: "Privacy Policy | Swaply",
    description:
      "Read the Swaply Privacy Policy, including GDPR rights, data collection, retention, sharing, cookies and privacy contacts.",
  },
  {
    id: "cookies",
    path: "/cookies",
    title: "Cookie Policy | Swaply",
    description:
      "Read the Swaply Cookie Policy for essential cookies, analytics preferences, third-party cookies and cookie management.",
  },
  {
    id: "safety",
    path: "/safety",
    title: "Safety Guide | Swaply",
    description:
      "Read the Swaply Safety Guide for safe meetings, shipping, scam prevention, reporting and urgent safety recommendations.",
  },
  {
    id: "dmca",
    path: "/dmca",
    title: "DMCA Policy | Swaply",
    description:
      "Read the Swaply DMCA Policy and copyright takedown procedure for reporting infringing content and submitting counter notices.",
  },
  {
    id: "copyright",
    path: "/copyright",
    title: "Copyright Policy | Swaply",
    description:
      "Read the Swaply Copyright Policy for ownership, prohibited copying, user responsibilities, platform rights and trademark rules.",
  },
] as const satisfies readonly PublicPageMetadataEntry[];

export type PublicPageMetadataId = (typeof PUBLIC_PAGE_METADATA)[number]["id"];

export function getPublicPageMetadataEntry(id: PublicPageMetadataId) {
  const entry = PUBLIC_PAGE_METADATA.find((metadata) => metadata.id === id);

  if (!entry) {
    throw new Error(`Missing public page metadata for ${id}`);
  }

  return entry;
}

export function buildPublicPageMetadata(locale: string, id: PublicPageMetadataId): Metadata {
  const entry = getPublicPageMetadataEntry(id);

  return {
    title: { absolute: entry.title },
    description: entry.description,
    openGraph: {
      title: entry.title,
      description: entry.description,
      type: "website",
      url: toSwaplyLocalizedPublicUrl(locale, entry.path),
    },
    twitter: {
      card: "summary",
      title: entry.title,
      description: entry.description,
    },
    alternates: {
      canonical: toSwaplyLocalizedPublicUrl(locale, entry.path),
      languages: buildPublicHreflangLanguages(locales, entry.path),
    },
  };
}
