import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ItemForm } from '@/features/items/item-form';
import { ItemRecord } from '@/lib/types';
import { Section } from '@/components/section';

async function fetchItem(id: string): Promise<ItemRecord | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.from('items').select('*').eq('id', id).single();
    return (data as ItemRecord) ?? null;
  } catch (error) {
    console.warn('Failed to load item for edit', error);
    return null;
  }
}

interface Props {
  params: { id: string };
}

export default async function EditObjectPage({ params }: Props) {
  const item = await fetchItem(params.id);
  if (!item) return notFound();

  return (
    <Section subtitle="Editează obiectul. Owner poate gestiona obiectul propriu conform RLS." title="Editează obiect">
      <ItemForm existingItem={item} />
    </Section>
  );
}
