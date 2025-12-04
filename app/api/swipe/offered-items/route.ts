import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SwipeFeedItem } from '@/lib/types/swipe';

const PAGE_SIZE = 20;

function normalizeItem(item: Record<string, any>): SwipeFeedItem {
  const idValue = item.id ?? item.offered_item_id ?? item.source_id ?? item.uuid;
  const sourceId = idValue ?? crypto.randomUUID();
  const baseTitle =
    item.title || item.name || item.offer_name || item.item_title || 'Unknown item';

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
    console.log('[offered-items] GET start', {
      url: request.url,
    });

    const supabase = getSupabaseServerClient();
    console.log('[offered-items] Supabase client created');

    const { searchParams } = new URL(request.url);
    const offsetRaw = searchParams.get('offset') || '0';
    const offset = Number(offsetRaw);

    console.log('[offered-items] Parsed offset', {
      offsetRaw,
      offset,
      isNaN: Number.isNaN(offset),
    });

    const { data, error } = await supabase
      .from('fake_offered_items')
      .select('*')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    console.log('[offered-items] Supabase query result', {
      rowCount: data?.length,
      hasError: !!error,
    });

    if (error) {
      console.error('[offered-items] Supabase error', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: (error as any).code,
      });

      return NextResponse.json(
        {
          error: {
            code: 'FETCH_FAILED',
            message: 'Unable to load offered items.',
            debug: 'See server logs for details',
          },
        },
        { status: 500 }
      );
    }

    const normalized = (data || []).map((item) => normalizeItem(item));

    console.log('[offered-items] Normalization complete', {
      normalizedCount: normalized.length,
    });

    return NextResponse.json({
      items: normalized,
      nextOffset: offset + PAGE_SIZE,
    });
  } catch (err: any) {
    console.error('[offered-items] UNEXPECTED ERROR', {
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      {
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'Unexpected server error.',
          debug: err.message,
        },
      },
      { status: 500 }
    );
  }
}
