// src/app/(app)/chat/[id]/layout.tsx

import type { ReactNode } from "react";

export default function ChatThreadLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="w-full h-screen overflow-hidden bg-white">
      {/* 
        Layout dedicat pentru thread-ul de chat.
        - h-screen: ocupă toată înălțimea viewport-ului
        - overflow-hidden: scroll-ul e gestionat în page.tsx
        - fără logică: doar cadru stabil
      */}
      {children}
    </div>
  );
}