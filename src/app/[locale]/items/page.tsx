import { redirect } from "next/navigation";

/**
 * Legacy /items route. Redirects to /objects to preserve older bookmarks,
 * historical links and product terminology before Objects became canonical.
 */
export default async function ItemsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/objects`);
}
