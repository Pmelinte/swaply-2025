'use client';

import * as React from 'react';

type Option = { value: string; label: string };

type CategorySelectProps = {
  value?: string;
  onChange?: (value: string) => void;

  // compat: unii îi zic "options", alții "categories"
  options?: Option[];
  categories?: Option[];

  // compat: unii dau array de string-uri direct
  items?: string[];

  placeholder?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
};

export default function CategorySelect(props: CategorySelectProps) {
  const {
    value = '',
    onChange,
    options,
    categories,
    items,
    placeholder = 'Selectează categoria',
    className,
    disabled,
    name,
    id,
  } = props;

  const normalized: Option[] =
    (options?.length ? options : undefined) ??
    (categories?.length ? categories : undefined) ??
    (items?.length ? items.map((x) => ({ value: x, label: x })) : []) ??
    [];

  return (
    <select
      id={id}
      name={name}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={
        className ??
        'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400'
      }
    >
      <option value="" disabled>
        {placeholder}
      </option>

      {normalized.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
