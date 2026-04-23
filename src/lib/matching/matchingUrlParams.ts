/**
 * Syncs active slot item IDs in the URL search params.
 * Pattern: /matching?slot1=<itemId>&slot2=<itemId>
 * Allows deep-linking into a matching session.
 */

export const SLOT_PARAMS = ["slot1", "slot2"] as const;

export function slotsToParams(
  slotIds: [string | null, string | null],
): URLSearchParams {
  const params = new URLSearchParams();
  if (slotIds[0]) params.set("slot1", slotIds[0]);
  if (slotIds[1]) params.set("slot2", slotIds[1]);
  return params;
}

export function paramsToSlotIds(
  params: URLSearchParams,
): [string | null, string | null] {
  return [params.get("slot1"), params.get("slot2")];
}

export function buildMatchingUrl(
  locale: string,
  slotIds: [string | null, string | null],
): string {
  const params = slotsToParams(slotIds);
  const qs = params.toString();
  return `/${locale}/matching${qs ? `?${qs}` : ""}`;
}
