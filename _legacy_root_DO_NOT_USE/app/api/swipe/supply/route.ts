import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

console.log('=== SUPPLY ENDPOINT MODULE LOADED ===');

export async function POST(request: NextRequest) {
  console.log('[/api/swipe/supply] POST request received');

  try {
    const supabase = getSupabaseServerClient();
    console.log('[/api/swipe/supply] Supabase server client created');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData?.user) {
      console.error('[/api/swipe/supply] Auth error or missing user', {
        authErrorMessage: authError?.message,
      });

      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required.',
          },
        },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    console.log('[/api/swipe/supply] Authenticated user', { userId });

    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[/api/swipe/supply] Failed to parse JSON body', { parseError });
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid JSON body.',
          },
        },
        { status: 400 }
      );
    }

    const desiredItemId = body?.desiredItemId;
    const canSupply = Boolean(body?.canSupply);

    console.log('[/api/swipe/supply] Parsed body', {
      desiredItemId,
      canSupply,
      rawBody: body,
    });

    if (!desiredItemId) {
      console.error('[/api/swipe/supply] Missing desiredItemId in request body');

      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing desiredItemId.',
          },
        },
        { status: 400 }
      );
    }

    console.log('[/api/swipe/supply] Inserting swipe into fake_swipes_supply', {
      swiper_id: userId,
      desired_item_id: desiredItemId,
      can_supply: canSupply,
    });

    const { data, error } = await supabase
      .from('fake_swipes_supply')
      .insert({
        swiper_id: userId,          // IMPORTANT: folosim user autentificat, nu body.swiperId
        desired_item_id: desiredItemId,
        can_supply: canSupply,
      })
      .select()
      .single();

    if (error) {
      console.error('[/api/swipe/supply] Supabase insert error', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: (error as any).code,
      });

      return NextResponse.json(
        {
          error: {
            code: 'INSERT_FAILED',
            message: 'Unable to save swipe.',
          },
        },
        { status: 500 }
      );
    }

    console.log('[/api/swipe/supply] Swipe saved successfully', {
      swipeId: data?.id,
    });

    return NextResponse.json({ swipe: data }, { status: 201 });
  } catch (err: any) {
    console.error('[/api/swipe/supply] UNEXPECTED ERROR', {
      message: err?.message,
      stack: err?.stack,
    });

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unexpected error while saving swipe.',
        },
      },
      { status: 500 }
    );
  }
}
