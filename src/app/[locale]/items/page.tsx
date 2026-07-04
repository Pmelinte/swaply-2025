import { redirect } from "next/navigation";

export default async function ItemsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/objects`);
}
