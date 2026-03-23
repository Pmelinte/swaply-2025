"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const FOOTER_CITIES = [
  { slug: "bucuresti", name: "București" },
  { slug: "cluj-napoca", name: "Cluj" },
  { slug: "timisoara", name: "Timișoara" },
  { slug: "iasi", name: "Iași" },
  { slug: "constanta", name: "Constanța" },
  { slug: "brasov", name: "Brașov" },
  { slug: "craiova", name: "Craiova" },
  { slug: "sibiu", name: "Sibiu" },
  { slug: "oradea", name: "Oradea" },
];

export function LegalFooter() {
  const t = useTranslations("legal");

  const tFooter = useTranslations("footer");

  const links = [
    { href: "/about", label: tFooter("about") },
    { href: "/pricing", label: tFooter("pricing") },
    { href: "/blog", label: "Blog" },
    { href: "/terms", label: t("termsTitle") },
    { href: "/privacy", label: t("privacyTitle") },
    { href: "/cookies", label: t("cookiesTitle") },
    { href: "/safety", label: t("safetyTitle") },
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white/60 px-4 py-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mx-auto max-w-6xl space-y-3">
        {/* Legal links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {links.map((link, i) => (
            <span key={link.href} className="inline-flex items-center gap-4">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className="text-zinc-300 dark:text-zinc-600"
                >
                  ·
                </span>
              )}
              <Link
                href={link.href}
                className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
              >
                {link.label}
              </Link>
            </span>
          ))}
          <span
            aria-hidden="true"
            className="text-zinc-300 dark:text-zinc-600"
          >
            ·
          </span>
          <span>© {new Date().getFullYear()} Swaply</span>
        </div>

        {/* Active cities */}
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          <span className="mr-1 font-medium">{tFooter("activeCities")}</span>
          {FOOTER_CITIES.map((city, i) => (
            <span key={city.slug} className="inline-flex items-center">
              {i > 0 && <span className="mx-1">|</span>}
              <Link
                href={`/objects/city/${city.slug}`}
                className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
              >
                {city.name}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
