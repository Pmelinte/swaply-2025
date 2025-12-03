import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const swiperId = body?.swiperId;
    const offeredItemId = body?.offeredItemId;
    const wantsItem = Boolean(body?.wantsItem);

    if (!swiperId || !offeredItemId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing swiperId or offeredItemId.' } },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('fake_swipes_demand')
      .insert({
        swiper_id: swiperId,
        offered_item_id: offeredItemId,
        wants_item: wantsItem,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'INSERT_FAILED', message: 'Unable to save swipe.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ swipe: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Unexpected error while saving swipe.' } },
      { status: 500 }
    );
  }
}
