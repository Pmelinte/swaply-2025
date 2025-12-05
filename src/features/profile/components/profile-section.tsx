import React from "react";

interface ProfileSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Wrapper UI pentru secțiuni din pagina de profil.
 * Folosit pentru consistență vizuală.
 */
export function ProfileSection({
  title,
  description,
  children,
}: ProfileSectionProps) {
  return (
    <section className="space-y-4 p-6 border rounded-lg bg-white shadow-sm">
      <header>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>

      <div>{children}</div>
    </section>
  );
}
