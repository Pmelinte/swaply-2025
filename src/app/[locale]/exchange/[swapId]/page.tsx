export const revalidate = 0;
import dynamic from "next/dynamic";

const ExchangePage = dynamic(
  () => import("@/components/exchange/ExchangePage").then((m) => m.ExchangePage),
);

interface Props {
  params: Promise<{ swapId: string; locale: string }>;
}

export default async function ExchangeSwapPage({ params }: Props) {
  const { swapId } = await params;
  return <ExchangePage swapId={swapId} />;
}
