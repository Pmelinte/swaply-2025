import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

console.log('=== DEMAND ENDPOINT LOADED ===');

export async function GET(request: NextRequest) {
  console.log('[/api/swipe/demand] Request received');

  const { searchParams } = new URL(request.url);
  const offsetRaw = searchParams.get('offset') || '0';
  const offset = Number(offsetRaw);

  if (Number.isNaN(offset) || offset < 0) {
    console.error('[/api/swipe/demand] Invalid offset value', { offsetRaw });
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid offset parameter.' } },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseServerClient();
    console.log('[/api/swipe/demand] Fetching items', {
      offset,
    });

    const { data, error } = await supabase
      .from('fake_demand_items')
      .select('*')
      .order('id', { ascending: true })
      .range(offset, offset + 19);

    if (error) {
      console.error('[/api/swipe/demand] Supabase error', error);
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Unable to load demand items.' } },
        { status: 500 }
      );
    }

    console.log('[/api/swipe/demand] Success', {
      rawCount: data?.length ?? 0,
      hasMore: (data?.length || 0) === 20,
    });

    return NextResponse.json({
      items: data || [],
      hasMore: (data?.length || 0) === 20,
    });

  } catch (err) {
    console.error('[/api/swipe/demand] Unexpected error', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error while loading demand feed.' } },
      { status: 500 }
    );
  }
}
