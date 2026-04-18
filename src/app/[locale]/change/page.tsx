import { redirect } from "next/navigation";

/**
 * Legacy /change route. Permanently redirects to /exchange (PR8).
 * Preserves ?swap=<id> query by redirecting to /exchange/<id> directly.
 */
export default async function ChangeRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  const raw = sp.swap;
  const swapId = Array.isArray(raw) ? raw[0] : raw;
  redirect(swapId ? `/${locale}/exchange/${swapId}` : `/${locale}/exchange`);
}
