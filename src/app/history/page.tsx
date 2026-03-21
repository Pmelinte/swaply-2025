import dynamic from "next/dynamic";

const HistoryClient = dynamic(() => import("./HistoryClient"));

export default async function HistoryPage() {
  return <HistoryClient />;
}
