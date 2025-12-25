import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ItemRecord } from '@/lib/types';
import { EmptyState } from '@/components/empty-state';

async function fetchItems(): Promise<ItemRecord[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Item fetch error', error.message);
      return [];
    }
    return (data as ItemRecord[]) ?? [];
  } catch (error) {
    console.warn('Supabase unavailable, falling back to empty feed', error);
    return [];
  }
}

export async function ItemList() {
  const items = await fetchItems();

  if (!items.length) {
    return (
      <EmptyState
        action={
          <Link className="rounded-lg bg-primary px-4 py-2 text-white" href="/objects/new">
            Adaugă un obiect
          </Link>
        }
        description="Nu există obiecte active. Adaugă primul obiect pentru a porni recomandările."
        title="Nicio listare"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Link
          className="rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          href={`/objects/${item.id}`}
          key={item.id}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="line-clamp-2 text-sm text-gray-700">{item.description ?? 'Fără descriere'}</p>
            </div>
            {item.is_active ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Activ</span>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Inactiv</span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString() : 'nou'}</p>
        </Link>
      ))}
    </div>
  );
}
