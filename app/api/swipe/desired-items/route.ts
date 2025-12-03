import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SwipeFeedItem } from '@/lib/types/swipe';

const PAGE_SIZE = 20;

function normalizeItem(item: Record<string, any>): SwipeFeedItem {
  const idValue = item.id ?? item.desired_item_id ?? item.source_id ?? item.uuid;
  const sourceId = idValue ?? crypto.randomUUID();
  const baseTitle =
    item.title || item.name || item.desired_name || item.item_title || 'Obiect necunoscut';

  return {
    id: String(sourceId),
    sourceId: String(sourceId),
    title: String(baseTitle),
    description: item.description || item.details || item.notes || null,
    imageUrl: item.image_url || item.photo_url || item.image || null,
    profileName: item.profile_name || item.owner_name || item.username || null,
    profileAvatarUrl: item.profile_avatar_url || item.avatar_url || null,
    location: item.location || item.city || item.country || null,
    tags: item.tags || item.labels || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const offset = Number(searchParams.get('offset') || '0');

    const { data, error } = await supabase
      .from('fake_desired_items')
      .select('*')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Unable to load desired items.' } },
        { status: 500 }
      );
    }

    const normalized = (data || []).map(normalizeItem);
    const hasMore = (data?.length || 0) === PAGE_SIZE;

    return NextResponse.json({ items: normalized, hasMore });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error while loading feed.' } },
      { status: 500 }
    );
  }
}
