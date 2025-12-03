'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import ItemCard from '@/components/items/ItemCard';
import { Item } from '@/lib/types/item';
import { useTranslation } from '@/components/LanguageProvider';

export default function ItemsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchItems = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/items');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to fetch items');
        }

        setItems(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchItems();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirm_delete_item'))) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete item');
      }

      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-slate-600">{t('loading')}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t('my_items')}</h1>
            <p className="text-sm text-slate-600">{t('items_page_subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium rounded-lg transition-colors shadow-sm"
            >
              {t('dashboard')}
            </Link>
            <Link
              href="/items/add"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {t('add_item')}
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 bg-card border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-slate-600 text-lg mb-4">{t('no_items')}</p>
            <Link
              href="/items/add"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {t('create_first_item')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                isDeleting={deletingId === item.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
