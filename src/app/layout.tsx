import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swaply",
  description: "Swaply 2025 Next.js app bootstrap",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
