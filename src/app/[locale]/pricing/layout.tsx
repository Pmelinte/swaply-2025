import type { Metadata } from "next";
import { locales } from "@/i18n/config";

const BASE_URL = "https://www.swaply.world";

export const metadata: Metadata = {
  title: "Prețuri Swaply | Gratuit, Premium, Platinum",
  description:
    "Compară planurile Swaply: Gratuit, Premium și Platinum. Schimbul e mereu gratuit, fără comisioane.",
  alternates: {
    canonical: `${BASE_URL}/en/pricing`,
    languages: Object.fromEntries([
      ...locales.map((loc) => [loc, `${BASE_URL}/${loc}/pricing`]),
      ["x-default", `${BASE_URL}/en/pricing`],
    ]),
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
