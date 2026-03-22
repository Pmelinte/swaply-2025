import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prețuri Swaply | Gratuit, Premium, Platinum",
  description:
    "Compară planurile Swaply: Gratuit, Premium și Platinum. Schimbul e mereu gratuit, fără comisioane.",
  alternates: { canonical: "https://swaply.world/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
