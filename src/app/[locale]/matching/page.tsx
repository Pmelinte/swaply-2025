import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { MatchingPage } from "@/components/matching/MatchingPage";

export const revalidate = 0;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const supabase = await getServerSupabase();

  let userId: string | null = null;
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    redirect(`/${locale}/login?returnTo=/${locale}/matching`);
  }

  const sp = (await searchParams) ?? {};
  const raw1 = sp.slot1;
  const raw2 = sp.slot2;
  const s1 = Array.isArray(raw1) ? raw1[0] : (raw1 ?? null);
  const s2 = Array.isArray(raw2) ? raw2[0] : (raw2 ?? null);

  return <MatchingPage userId={userId!} initialSlotIds={[s1, s2]} />;
}
