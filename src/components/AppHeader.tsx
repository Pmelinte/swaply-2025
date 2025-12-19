"use client";

import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="w-full border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Swaply
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/items" className="hover:underline">
            Items
          </Link>
          <Link href="/profile" className="hover:underline">
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
