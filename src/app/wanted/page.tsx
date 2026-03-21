import dynamic from "next/dynamic";

const WantedClient = dynamic(() => import("./WantedClient"));

export default async function WantedPage() {
  return <WantedClient />;
}
