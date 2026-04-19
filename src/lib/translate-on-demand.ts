import "server-only";

// DISABLED 2026-04-19 — investigating runaway API consumption
// (21M tokens / ~$76 spike Apr 8-11). Re-enable only after RCA.
// Original implementation (with Claude Haiku translation + Supabase
// cache) preserved in git history — revert this commit to restore.

export async function translateOnDemand(
  text: string,
  targetLang: string,
  sourceLang = "ro",
): Promise<string> {
  // Short-circuits that never hit the API are preserved.
  if (!text.trim()) return text;
  if (targetLang === sourceLang) return text;
  console.warn("[translate-on-demand] disabled");
  return text;
}

export async function translateFields<T extends Record<string, string>>(
  fields: T,
  targetLang: string,
  sourceLang = "ro",
): Promise<T> {
  if (targetLang === sourceLang) return fields;
  const keys = Object.keys(fields) as (keyof T)[];
  const values = await Promise.all(
    keys.map((key) => translateOnDemand(fields[key] as string, targetLang, sourceLang)),
  );
  const result = { ...fields };
  keys.forEach((key, i) => {
    (result as Record<string, string>)[key as string] = values[i];
  });
  return result;
}
