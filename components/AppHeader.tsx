"use client";

import Link from "next/link";
import LanguageSelector from "./LanguageSelector";
import HeaderMenu from "./HeaderMenu";

export default function AppHeader() {
  return (
    <header className="w-full border-b bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:flex-nowrap md:gap-8">
        {/* STÂNGA: titlu + selector de limbă */}
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/" className="text-xl font-semibold text-slate-900">
            Welcome
          </Link>
          <LanguageSelector />
        </div>

        {/* DREAPTA: doar profilul */}
        <div className="ml-auto flex items-center">
          <HeaderMenu />
        </div>
      </div>
    </header>
  );
}
