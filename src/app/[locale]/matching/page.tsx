import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import MatchingPage from "@/components/matching/MatchingPage";

export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await getServerSupabase();
  const locale = await getLocale();

  let userId: string | null = null;
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    redirect(`/${locale}/login?returnTo=/${locale}/matching`);
  }

  const sp = (await searchParams) ?? {};
  const raw1 = sp.slot1;
  const raw2 = sp.slot2;
  const slot1 = Array.isArray(raw1) ? (raw1[0] ?? null) : (raw1 ?? null);
  const slot2 = Array.isArray(raw2) ? (raw2[0] ?? null) : (raw2 ?? null);

  return (
    <MatchingPage
      userId={userId}
      initialSlot1={slot1}
      initialSlot2={slot2}
    />
  );
}
