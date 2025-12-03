"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSelector } from "./LanguageSelector";
import ProfileLink from "./ProfileLink";

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b bg-white/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-4">
        
        {/* Logo / Title */}
        <Link href="/" className="text-xl font-semibold text-slate-900">
          Welcome
        </Link>

        {/* Right section: LANGUAGE first, then PROFILE */}
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <ProfileLink />
        </div>
      </div>
    </header>
  );
}
