"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function LegalFooter() {
  const t = useTranslations("legal");

  const links = [
    { href: "/blog", label: "Blog" },
    { href: "/terms", label: t("termsTitle") },
    { href: "/privacy", label: t("privacyTitle") },
    { href: "/cookies", label: t("cookiesTitle") },
    { href: "/safety", label: t("safetyTitle") },
  ];

  return (
    <footer className="border-t border-zinc-200 bg-white/60 px-4 py-4 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        {links.map((link, i) => (
          <span key={link.href} className="inline-flex items-center gap-4">
            {i > 0 && <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">·</span>}
            <Link href={link.href} className="hover:text-blue-600 hover:underline dark:hover:text-blue-400">
              {link.label}
            </Link>
          </span>
        ))}
        <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">·</span>
        <span>© {new Date().getFullYear()} Swaply</span>
      </div>
    </footer>
  );
}
