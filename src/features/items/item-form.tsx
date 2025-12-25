'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { ItemRecord } from '@/lib/types';

const itemSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1),
  is_active: z.boolean(),
  images: z.array(z.string()).optional()
});

interface ItemFormProps {
  existingItem?: ItemRecord;
}

export function ItemForm({ existingItem }: ItemFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: existingItem?.title ?? '',
    description: existingItem?.description ?? '',
    is_active: existingItem?.is_active ?? true,
    images: existingItem?.images ?? []
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    setError('');

    const parsed = itemSchema.safeParse(form);
    if (!parsed.success) {
      setStatus('error');
      setError('Date invalide');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setStatus('error');
      setError('Autentificarea este necesară.');
      return;
    }

    const payload = {
      ...parsed.data,
      owner_id: user.id,
      is_demo: false,
      category_id: existingItem?.category_id ?? null
    };

    const { error: mutationError } = existingItem
      ? await supabase.from('items').update(payload).eq('id', existingItem.id)
      : await supabase.from('items').insert(payload).select().single();

    if (mutationError) {
      setStatus('error');
      setError(mutationError.message);
      return;
    }

    router.replace('/objects');
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800" htmlFor="title">
          Titlu
        </label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          id="title"
          maxLength={120}
          name="title"
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          value={form.title}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-800" htmlFor="description">
          Descriere
        </label>
        <textarea
          className="min-h-[120px] w-full rounded-lg border px-3 py-2"
          id="description"
          name="description"
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          value={form.description}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          checked={form.is_active}
          id="is_active"
          onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
          type="checkbox"
        />
        <label className="text-sm font-semibold text-gray-800" htmlFor="is_active">
          Activ pentru feed public
        </label>
      </div>
      <div className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-semibold text-gray-800">Imagini (Cloudinary)</p>
        <p className="text-xs text-amber-700">
          Upload securizat prin Cloudinary este obligatoriu. Funcționalitatea de upload completă este TODO (NEDEFINIT ÎN DOCS)
          și momentan acceptă doar URL-uri manuale.
        </p>
        <div className="space-y-2">
          {(form.images ?? []).map((img, index) => (
            <div className="flex items-center gap-2" key={img + index}>
              <input
                className="flex-1 rounded-lg border px-3 py-2"
                value={img}
                onChange={(e) => {
                  const next = [...(form.images ?? [])];
                  next[index] = e.target.value;
                  setForm((prev) => ({ ...prev, images: next }));
                }}
              />
              <button
                className="text-xs font-semibold text-red-600"
                onClick={(e) => {
                  e.preventDefault();
                  const next = [...(form.images ?? [])];
                  next.splice(index, 1);
                  setForm((prev) => ({ ...prev, images: next }));
                }}
              >
                Șterge
              </button>
            </div>
          ))}
          <button
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            onClick={(e) => {
              e.preventDefault();
              setForm((prev) => ({ ...prev, images: [...(prev.images ?? []), ''] }));
            }}
          >
            Adaugă URL imagine
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        className="w-full rounded-lg bg-primary px-4 py-2 text-white"
        disabled={status === 'saving'}
        type="submit"
      >
        {existingItem ? 'Salvează modificările' : 'Publică obiectul'}
      </button>
    </form>
  );
}
