import { DomainListingEditPage } from "@/components/listings/DomainListingEditPage";

export default async function EventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DomainListingEditPage domain="event" itemId={id} />;
}
