import dynamic from "next/dynamic";

const AnalyticsClient = dynamic(() => import("./AnalyticsClient"));

export default async function AnalyticsPage() {
  return <AnalyticsClient />;
}
