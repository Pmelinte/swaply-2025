"use client";

interface Option {
  emoji: string;
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string | null;
  onChange: (v: string | null) => void;
  columns?: 2 | 3 | 4;
}

export function CategoryL1Picker({ options, value, onChange, columns = 3 }: Props) {
  const cols = columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className={`grid ${cols} gap-2`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
            value === opt.value
              ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
              : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
          }`}
        >
          <span className="text-xl">{opt.emoji}</span>
          <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-50 leading-tight">
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
