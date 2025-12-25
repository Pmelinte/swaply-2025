import React from 'react';

interface FeaturePlaceholderProps {
  title: string;
  description?: string;
  id?: string;
  disabledText?: string;
}

export function FeaturePlaceholder({ title, description, id, disabledText }: FeaturePlaceholderProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {id ? <span className="text-xs uppercase tracking-wide text-gray-500">{id}</span> : null}
      </div>
      {description ? <p className="mt-2 text-sm text-gray-700">{description}</p> : null}
      <p className="mt-3 text-xs font-semibold text-red-600">{disabledText ?? 'TODO (NEDEFINIT ÎN DOCS) – dezactivat elegant'}</p>
    </div>
  );
}
