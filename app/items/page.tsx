'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import ItemCard from '@/components/items/ItemCard';
import { Item } from '@/lib/types/item';
import { useTranslation } from '@/components/LanguageProvider';
import { SwipeFeedItem } from '@/lib/types/swipe';

interface SwipeCardProps {
  item: SwipeFeedItem;
  positiveLabel: string;
  negativeLabel: string;
  onPositive: (id: string) => Promise<void>;
  onNegative: (id: string) => Promise<void>;
  busy: boolean;
}

function SwipeCard({
  item,
  positiveLabel,
  negativeLabel,
  onPositive,
  onNegative,
  busy,
}: SwipeCardProps) {
  const { t } = useTranslation();
  const title = item.title || t('items_swipe_unknown');
  const description = item.description || t('items_swipe_no_description');

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="relative h-52 w-full bg-slate-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200"
            aria-hidden
          />
        )}
      </div>

      <div className="flex flex-col gap-4 p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 mt-1 line-clamp-3">
              {description}
            </p>
          </div>
          {item.profileAvatarUrl && (
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-50">
              <Image
                src={item.profileAvatarUrl}
                alt={item.profileName || 'Avatar'}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {item.profileName && (
            <span className="px-3 py-1 bg-slate-100 rounded-full">
              {item.profileName}
            </span>
          )}
          {item.location && (
            <span className="px-3 py-1 bg-slate-100 rounded-full">
              {item.location}
            </span>
          )}
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          <button
            onClick={() => onNegative(item.sourceId)}
            disabled={busy}
            className="px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl transition-colors"
          >
            {negativeLabel}
          </button>
          <button
            onClick={() => onPositive(item.sourceId)}
            disabled={busy}
            className="px-4 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-colors"
          >
            {positiveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItemsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // vechiul grid cu „My items”
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // swipe metadata
  const [swiperId, setSwiperId] = useState<string | null>(null);

  // feed sus (Magazia – desired items)
  const [supplyItems, setSupplyItems] = useState<SwipeFeedItem[]>([]);
  const [supplyOffset, setSupplyOffset] = useState(0);
  const [supplyHasMore, setSupplyHasMore] = useState(true);
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [supplyActionId, setSupplyActionId] = useState<string | null>(null);

  // feed jos (Cutia cu surprize – offered items)
  const [demandItems, setDemandItems] = useState<SwipeFeedItem[]>([]);
  const [demandOffset, setDemandOffset] = useState(0);
  const [demandHasMore, setDemandHasMore] = useState(true);
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandActionId, setDemandActionId] = useState<string | null>(null);

  // erori generale
  const [error, setError] = useState<string | null>(null);

  const supplyEmpty = !supplyLoading && supplyItems.length === 0;
  const demandEmpty = !demandLoading && demandItems.length === 0;

  // 1) load user + profile + my items
  useEffect(() => {
    const init = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // profile (pentru swiperId)
        try {
          const res = await fetch('/api/profile');
          if (res.ok) {
            const data = await res.json();
            if (data?.profile?.user_id) {
              setSwiperId(data.profile.user_id);
            }
          }
        } catch {
          // nu blocăm pagina dacă profilul e stricat
        }

        // items vechi
        try {
          const response = await fetch('/api/items');
          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.error?.message || 'Failed to fetch items'
            );
          }

          setItems(data.items || []);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred'
          );
        } finally {
          setLoadingItems(false);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Authentication error'
        );
        setLoadingItems(false);
      }
    };

    init();
  }, [router]);

  // 2) fetch feed sus (Magazia – desired-items)
  const fetchSupply = useCallback(async () => {
    if (supplyLoading || !supplyHasMore) return;

    setSupplyLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/swipe/desired-items?offset=${supplyOffset}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error?.message || 'Unable to load supply feed.'
        );
      }

      const newItems: SwipeFeedItem[] = data.items || [];
      setSupplyItems((prev) => [...prev, ...newItems]);
      setSupplyOffset((prev) => prev + newItems.length);
      setSupplyHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('items_swipe_error')
      );
    } finally {
      setSupplyLoading(false);
    }
  }, [supplyHasMore, supplyLoading, supplyOffset, t]);

  // 3) fetch feed jos (Cutia cu surprize – offered-items)
  const fetchDemand = useCallback(async () => {
    if (demandLoading || !demandHasMore) return;

    setDemandLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/swipe/offered-items?offset=${demandOffset}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error?.message || 'Unable to load demand feed.'
        );
      }

      const newItems: SwipeFeedItem[] = data.items || [];
      setDemandItems((prev) => [...prev, ...newItems]);
      setDemandOffset((prev) => prev + newItems.length);
      setDemandHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('items_swipe_error')
      );
    } finally {
      setDemandLoading(false);
    }
  }, [demandHasMore, demandLoading, demandOffset, t]);

  // 4) inițial load pentru cele două feeduri
  useEffect(() => {
    fetchSupply();
    fetchDemand();
  }, [fetchSupply, fetchDemand]);

  // 5) helper pentru a verifica dacă avem swiperId
  const ensureSwiperId = useCallback((): boolean => {
    if (!swiperId) {
      setError(t('items_swipe_auth_error'));
      return false;
    }
    return true;
  }, [swiperId, t]);

  // 6) handler ștergere item (grid clasic)
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t('confirm_delete_item'))) {
        return;
      }

      setDeletingId(id);
      setError(null);

      try {
        const response = await fetch(`/api/items/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            data.error?.message || 'Failed to delete item'
          );
        }

        setItems((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to delete item'
        );
      } finally {
        setDeletingId(null);
      }
    },
    [t]
  );

  // 7) swipe acțiune sus: supply (răspund la cereri)
  const handleSupplyAction = useCallback(
    async (desiredItemId: string, canSupply: boolean) => {
      if (!ensureSwiperId()) return;

      setSupplyActionId(desiredItemId);
      setError(null);

      try {
        const res = await fetch('/api/swipe/supply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ swiperId, desiredItemId, canSupply }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(
            data?.error?.message || 'Unable to submit swipe.'
          );
        }

        setSupplyItems((prev) =>
          prev.filter((item) => item.sourceId !== desiredItemId)
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('items_swipe_error')
        );
      } finally {
        setSupplyActionId(null);
      }
    },
    [ensureSwiperId, swiperId, t]
  );

  // 8) swipe acțiune jos: demand (vreau / nu vreau oferta)
  const handleDemandAction = useCallback(
    async (offeredItemId: string, wantsItem: boolean) => {
      if (!ensureSwiperId()) return;

      setDemandActionId(offeredItemId);
      setError(null);

      try {
        const res = await fetch('/api/swipe/demand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ swiperId, offeredItemId, wantsItem }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(
            data?.error?.message || 'Unable to submit swipe.'
          );
        }

        setDemandItems((prev) =>
          prev.filter((item) => item.sourceId !== offeredItemId)
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('items_swipe_error')
        );
      } finally {
        setDemandActionId(null);
      }
    },
    [ensureSwiperId, swiperId, t]
  );

  const loadMoreSupplyLabel = useMemo(() => {
    if (!supplyHasMore && !supplyLoading) {
      return t('items_swipe_no_more_supply');
    }
    return t('load_more');
  }, [supplyHasMore, supplyLoading, t]);

  const loadMoreDemandLabel = useMemo(() => {
    if (!demandHasMore && !demandLoading) {
      return t('items_swipe_no_more_demand');
    }
    return t('load_more');
  }, [demandHasMore, demandLoading, t]);

  if (loadingItems) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-slate-600">{t('loading')}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            {t('items_swipe_page')}
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('items_swipe_title')}
          </h1>
          <p className="text-slate-600 max-w-3xl">
            {t('items_swipe_subtitle')}
          </p>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ZONA DE SUS – MAGAZIA */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                ↑
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">
                  {t('items_swipe_zone_supply_label')}
                </p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {t('items_swipe_zone_supply_title')}
                </h2>
              </div>
            </div>
            <p className="text-slate-600">
              {t('items_swipe_zone_supply_description')}
            </p>
          </div>

          {supplyEmpty ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-600">
              {t('items_swipe_empty_supply')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {supplyItems.map((item) => (
                <SwipeCard
                  key={item.id}
                  item={item}
                  positiveLabel={t('items_swipe_can_supply')}
                  negativeLabel={t('items_swipe_skip')}
                  onPositive={(id) => handleSupplyAction(id, true)}
                  onNegative={(id) => handleSupplyAction(id, false)}
                  busy={supplyActionId === item.sourceId}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={fetchSupply}
              disabled={supplyLoading || !supplyHasMore}
              className="px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
            >
              {supplyLoading ? t('loading') : loadMoreSupplyLabel}
            </button>
          </div>
        </section>

        {/* ZONA DE JOS – CUTIA CU SURPRIZE */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                ↓
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-600 font-semibold">
                  {t('items_swipe_zone_demand_label')}
                </p>
                <h2 className="text-2xl font-bold text-slate-900">
                  {t('items_swipe_zone_demand_title')}
                </h2>
              </div>
            </div>
            <p className="text-slate-600">
              {t('items_swipe_zone_demand_description')}
            </p>
          </div>

          {demandEmpty ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-600">
              {t('items_swipe_empty_demand')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {demandItems.map((item) => (
                <SwipeCard
                  key={item.id}
                  item={item}
                  positiveLabel={t('items_swipe_want')}
                  negativeLabel={t('items_swipe_skip')}
                  onPositive={(id) => handleDemandAction(id, true)}
                  onNegative={(id) => handleDemandAction(id, false)}
                  busy={demandActionId === item.sourceId}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={fetchDemand}
              disabled={demandLoading || !demandHasMore}
              className="px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-300 transition-colors"
            >
              {demandLoading ? t('loading') : loadMoreDemandLabel}
            </button>
          </div>
        </section>

        {/* Zona veche: My items grid */}
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {t('my_items')}
              </h2>
              <p className="text-sm text-slate-600">
                {t('items_page_subtitle')}
              </p>
            </div>
            <Link
              href="/items/add"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {t('add_item')}
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 bg-card border border-slate-200 rounded-2xl shadow-sm">
              <p className="text-slate-600 text-lg mb-4">
                {t('no_items')}
              </p>
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
        </section>
      </div>
    </main>
  );
}
