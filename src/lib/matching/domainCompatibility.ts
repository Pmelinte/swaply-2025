export const MATCHING_DOMAINS = [
  "object",
  "property",
  "service",
  "event",
] as const;

export type MatchingDomain = (typeof MATCHING_DOMAINS)[number];

export type MatchingCompatibilityItem = {
  item_type?: unknown;
  swap_open_to?: unknown;
  swap_wants_type?: unknown;
};

export function normalizeMatchingDomain(value: unknown): MatchingDomain | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return MATCHING_DOMAINS.includes(normalized as MatchingDomain)
    ? (normalized as MatchingDomain)
    : null;
}

export function normalizeMatchingDomainList(value: unknown): MatchingDomain[] {
  if (!Array.isArray(value)) return [];

  const domains = new Set<MatchingDomain>();
  for (const entry of value) {
    const normalized = normalizeMatchingDomain(entry);
    if (normalized) domains.add(normalized);
  }
  return [...domains];
}

export function domainListAllows(
  value: unknown,
  otherDomain: MatchingDomain,
): boolean {
  if (!Array.isArray(value) || value.length === 0) return true;

  return value.some((entry) => {
    if (typeof entry !== "string") return false;
    const normalized = entry.trim().toLowerCase();
    return normalized === otherDomain || normalized === "anything" || normalized === "all";
  });
}

export function isMatchingPairCompatible(
  source: MatchingCompatibilityItem,
  target: MatchingCompatibilityItem,
): boolean {
  const sourceDomain = normalizeMatchingDomain(source.item_type);
  const targetDomain = normalizeMatchingDomain(target.item_type);
  if (!sourceDomain || !targetDomain) return false;

  return (
    domainListAllows(source.swap_open_to, targetDomain) &&
    domainListAllows(source.swap_wants_type, targetDomain) &&
    domainListAllows(target.swap_open_to, sourceDomain) &&
    domainListAllows(target.swap_wants_type, sourceDomain)
  );
}

export function compatibleSourceIds<T extends MatchingCompatibilityItem & { id: string }>(
  sources: T[],
  target: MatchingCompatibilityItem,
): string[] {
  return sources
    .filter((source) => isMatchingPairCompatible(source, target))
    .map((source) => source.id);
}
