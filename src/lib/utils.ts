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
