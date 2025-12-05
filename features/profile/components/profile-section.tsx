import type { ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Secțiune generică pentru paginile de profil.
 * Doar un wrapper cu titlu, descriere și conținut (children).
 */
export function ProfileSection({
  title,
  description,
  children,
}: ProfileSectionProps) {
  return (
    <section className="rounded-xl border bg-white/60 p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        ) : null}
      </header>

      <div className="space-y-4">{children}</div>
    </section>
  );
}
