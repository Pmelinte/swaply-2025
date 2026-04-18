import { redirect } from "next/navigation";

/**
 * Legacy /match route. Permanently redirects to /matching (PR6).
 * Kept to preserve external bookmarks and historical share links.
 */
export default async function MatchRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/matching`);
}
