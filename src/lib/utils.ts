export function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("ro-RO", {
    month: "short",
    day: "numeric",
  });
}

export function formatScore(score: number) {
  return `${score}%`;
}
