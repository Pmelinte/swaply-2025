import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string, locale = "en") {
  const date = new Date(value);
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function formatScore(score: number) {
  return `${score}%`;
}
