import { DomainListingEditPage } from "@/components/listings/DomainListingEditPage";

export default async function PropertyEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DomainListingEditPage domain="property" itemId={id} />;
}
