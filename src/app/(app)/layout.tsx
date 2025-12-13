// src/app/(app)/layout.tsx

import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}