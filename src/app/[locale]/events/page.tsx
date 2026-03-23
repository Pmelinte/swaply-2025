import dynamic from "next/dynamic";

const EventsClient = dynamic(() => import("./EventsClient"));

export default function EventsPage() {
  return <EventsClient />;
}
