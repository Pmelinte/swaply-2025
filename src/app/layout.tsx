import type { Viewport } from "next";
import "./globals.css";
import "./accessibility-contrast.css";
import "./objects-cls-stability.css";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
