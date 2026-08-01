import { DomainListingEditPage } from "@/components/listings/DomainListingEditPage";

export default async function ServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DomainListingEditPage domain="service" itemId={id} />;
}
