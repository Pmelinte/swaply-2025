import { ReactNode } from 'react';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  id?: string;
}

export function Section({ title, subtitle, children, id }: SectionProps) {
  return (
    <section className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm" id={id}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
