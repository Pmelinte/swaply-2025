export const revalidate = 0;
import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const ExchangePage = dynamic(
  () => import("@/components/exchange/ExchangePage").then((m) => m.ExchangePage),
);

interface Props {
  params: Promise<{ swapId: string; locale: string }>;
}

export default async function ExchangeSwapPage({ params }: Props) {
  const { swapId, locale } = await params;

  const supabase = await getServerSupabase();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/${locale}/login?returnTo=/${locale}/exchange/${swapId}`);
    }
  }

  return <ExchangePage swapId={swapId} />;
}
