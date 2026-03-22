import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Despre Swaply | Schimb de obiecte fără bani",
  description:
    "Povestea din spatele Swaply — platforma românească de schimb de obiecte fără bani.",
  alternates: { canonical: "https://swaply.world/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
