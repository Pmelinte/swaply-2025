import { notFound } from 'next/navigation';
import { ItemDetail } from '@/features/items/item-detail';

interface Props {
  params: { id: string };
}

export default function ObjectDetailPage({ params }: Props) {
  if (!params.id) return notFound();

  // @ts-expect-error Async Server Component
  return <ItemDetail id={params.id} />;
}
