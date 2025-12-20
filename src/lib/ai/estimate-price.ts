const EUR_TO_RON = 4.95;

export type PriceEstimateInput = {
  title?: string | null;
  category?: string | null;
  condition?: string | null;
};

export type PriceEstimateResult = {
  eur: number;
  ron: number;
};

function estimateBasePrice(input: PriceEstimateInput): number {
  const text = `${input.title ?? ""} ${input.category ?? ""}`.toLowerCase();

  if (text.includes("phone") || text.includes("telefon")) return 250;
  if (text.includes("laptop") || text.includes("notebook")) return 450;
  if (text.includes("bicycle") || text.includes("biciclet")) return 180;
  if (text.includes("sofa") || text.includes("canapea")) return 120;

  return 60;
}

function conditionMultiplier(condition?: string | null): number {
  const c = (condition ?? "").toLowerCase();
  if (c.includes("new")) return 1.1;
  if (c.includes("like") || c.includes("excellent")) return 1.0;
  if (c.includes("good")) return 0.85;
  if (c.includes("fair")) return 0.7;
  return 0.6;
}

export function estimateItemPrice(input: PriceEstimateInput): PriceEstimateResult {
  const base = estimateBasePrice(input);
  const multiplier = conditionMultiplier(input.condition);
  const eur = Math.round(base * multiplier);
  const ron = Math.round(eur * EUR_TO_RON);

  return { eur, ron };
}
