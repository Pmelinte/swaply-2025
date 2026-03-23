import dynamic from "next/dynamic";

const EcoClient = dynamic(() => import("./EcoClient"));

export default async function EcoPage() {
  return <EcoClient />;
}
