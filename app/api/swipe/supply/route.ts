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
    const desiredItemId = body?.desiredItemId;
    const canSupply = Boolean(body?.canSupply);

    if (!swiperId || !desiredItemId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing swiperId or desiredItemId.' } },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('fake_swipes_supply')
      .insert({
        swiper_id: swiperId,
        desired_item_id: desiredItemId,
        can_supply: canSupply,
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
