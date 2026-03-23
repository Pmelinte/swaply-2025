import type { Metadata } from "next";
import { locales } from "@/i18n/config";

const BASE_URL = "https://www.swaply.world";

export const metadata: Metadata = {
  title: "Despre Swaply | Schimb de obiecte fără bani",
  description:
    "Povestea din spatele Swaply — platforma românească de schimb de obiecte fără bani.",
  alternates: {
    canonical: `${BASE_URL}/en/about`,
    languages: Object.fromEntries([
      ...locales.map((loc) => [loc, `${BASE_URL}/${loc}/about`]),
      ["x-default", `${BASE_URL}/en/about`],
    ]),
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
