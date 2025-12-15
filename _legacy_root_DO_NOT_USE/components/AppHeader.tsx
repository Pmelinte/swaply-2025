"use client";

import Link from "next/link";
import LanguageSelector from "./LanguageSelector";
import HeaderMenu from "./HeaderMenu";

export default function AppHeader() {
  return (
    <header className="w-full border-b bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* STÂNGA: titlu + selector de limbă */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-semibold text-slate-900">
            Welcome
          </Link>
          <LanguageSelector />
        </div>

        {/* DREAPTA: doar meniul de profil (avatar) */}
        <HeaderMenu />
      </div>
    </header>
  );
}
