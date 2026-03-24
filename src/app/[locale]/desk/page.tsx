import dynamic from "next/dynamic";

const DeskClient = dynamic(() => import("./DeskClient").then((m) => m.DeskClient));

export default async function DeskPage() {
  return <DeskClient />;
}
