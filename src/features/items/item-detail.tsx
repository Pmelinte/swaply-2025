import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { ItemRecord } from '@/lib/types';
import { EmptyState } from '@/components/empty-state';

async function fetchItem(id: string): Promise<ItemRecord | null> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
    if (error) {
      console.warn('Item detail error', error.message);
      return null;
    }
    return data as ItemRecord;
  } catch (error) {
    console.warn('Supabase unavailable for item detail', error);
    return null;
  }
}

export async function ItemDetail({ id }: { id: string }) {
  const item = await fetchItem(id);

  if (!item) {
    return <EmptyState description="Obiectul nu a fost găsit sau nu este accesibil." title="Obiect indisponibil" />;
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
          <p className="mt-2 text-sm text-gray-700">{item.description}</p>
        </div>
        <Link className="text-sm font-semibold text-primary" href={`/objects/${id}/edit`}>
          Editează
        </Link>
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase text-gray-500">Imagini (preview)</p>
        {item.images?.length ? (
          <div className="grid grid-cols-2 gap-2">
            {item.images.map((img) => (
              <img alt={item.title} className="h-32 w-full rounded-lg object-cover" key={img} src={img} />
            ))}
          </div>
        ) : (
          <EmptyState description="Adaugă o imagine prin Cloudinary." title="Fără imagini" />
        )}
      </div>
      <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Contract AI / hărți pentru acest obiect sunt TODO (NEDEFINIT ÎN DOCS). Pin-urile publice se activează doar pentru badge
        Premium/Platinum conform spec.
      </div>
    </div>
  );
}
