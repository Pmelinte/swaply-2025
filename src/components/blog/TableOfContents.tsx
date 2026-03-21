"use client";

interface Heading {
  level: 2 | 3;
  text: string;
  id: string;
}

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;

  return (
    <nav className="rounded-2xl border border-zinc-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-800/80">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Cuprins
      </p>
      <ul className="space-y-1.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block text-sm transition hover:text-blue-600 dark:hover:text-blue-400 ${
                h.level === 3
                  ? "pl-4 text-zinc-500 dark:text-zinc-400"
                  : "font-medium text-zinc-700 dark:text-zinc-200"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
