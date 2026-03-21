import { ChangeClient } from "./ChangeClient";

export default async function ChangePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.swap;
  const swapFromQuery = Array.isArray(raw) ? raw[0] : raw ?? null;
  return <ChangeClient swapFromQuery={swapFromQuery} />;
}
