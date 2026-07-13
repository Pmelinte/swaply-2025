-- Batch 56 fix: qualify the conversation uniqueness target inside the RPC.
-- The RETURNS TABLE output column `match_id` is also a PL/pgSQL variable,
-- so `ON CONFLICT (match_id)` is ambiguous at runtime.

BEGIN;

CREATE OR REPLACE FUNCTION public.accept_matching_interest(p_interest_id uuid)
RETURNS TABLE (
  interest_id uuid,
  matching_session_id uuid,
  match_id uuid,
  conversation_id uuid,
  interest_status text,
  match_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_interest public.matching_interests%ROWTYPE;
  v_matching_session_id uuid;
  v_match_id uuid;
  v_conversation_id uuid;
  v_existing_match_status text;
  v_existing_converted_swap_id uuid;
  v_match_type text;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'AUTH_REQUIRED';
  END IF;

  SELECT interest.*
  INTO v_interest
  FROM public.matching_interests AS interest
  WHERE interest.id = p_interest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'INTEREST_NOT_FOUND';
  END IF;

  IF v_interest.to_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'INTEREST_RECIPIENT_REQUIRED';
  END IF;

  IF v_interest.from_user_id IS NULL
     OR v_interest.to_user_id IS NULL
     OR v_interest.from_item_id IS NULL
     OR v_interest.to_item_id IS NULL
     OR v_interest.from_user_id = v_interest.to_user_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'INVALID_INTEREST_PARTICIPANTS';
  END IF;

  IF v_interest.status IS NULL OR v_interest.status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'INTEREST_NOT_PENDING';
  END IF;

  PERFORM 1
  FROM public.items AS offered_item
  WHERE offered_item.id = v_interest.from_item_id
    AND offered_item.owner_id = v_interest.from_user_id
    AND offered_item.is_active = true
    AND offered_item.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'OFFERED_ITEM_UNAVAILABLE';
  END IF;

  PERFORM 1
  FROM public.items AS target_item
  WHERE target_item.id = v_interest.to_item_id
    AND target_item.owner_id = v_interest.to_user_id
    AND target_item.is_active = true
    AND target_item.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'TARGET_ITEM_UNAVAILABLE';
  END IF;

  INSERT INTO public.matching_sessions (
    user_id,
    slot_1_item_id,
    filters
  )
  VALUES (
    v_interest.from_user_id,
    v_interest.from_item_id,
    jsonb_build_object(
      'source', 'accepted_interest',
      'interest_id', v_interest.id
    )
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    slot_1_item_id = EXCLUDED.slot_1_item_id,
    updated_at = now()
  RETURNING id INTO v_matching_session_id;

  v_match_type := CASE
    WHEN v_interest.source = 'ai' THEN 'ai'
    ELSE 'manual'
  END;

  SELECT match_row.id, match_row.status, match_row.converted_swap_id
  INTO v_match_id, v_existing_match_status, v_existing_converted_swap_id
  FROM public.matches AS match_row
  WHERE match_row.initiator_id = v_interest.from_user_id
    AND match_row.target_item_id = v_interest.to_item_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing_match_status = 'converted_to_swap'
       OR v_existing_converted_swap_id IS NOT NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'MATCH_ALREADY_CONVERTED';
    END IF;

    UPDATE public.matches
    SET
      target_user_id = v_interest.to_user_id,
      initiator_item_id = v_interest.from_item_id,
      match_type = v_match_type,
      status = 'accepted',
      ai_score = v_interest.match_score,
      ai_reasoning = NULL,
      slot_position = 1,
      dismissed_by = NULL,
      dismissed_at = NULL,
      dismiss_reason = NULL,
      expires_at = now() + interval '30 days',
      updated_at = now()
    WHERE id = v_match_id;
  ELSE
    INSERT INTO public.matches (
      initiator_id,
      target_user_id,
      initiator_item_id,
      target_item_id,
      match_type,
      status,
      ai_score,
      slot_position
    )
    VALUES (
      v_interest.from_user_id,
      v_interest.to_user_id,
      v_interest.from_item_id,
      v_interest.to_item_id,
      v_match_type,
      'accepted',
      v_interest.match_score,
      1
    )
    RETURNING id INTO v_match_id;
  END IF;

  INSERT INTO public.conversations (
    match_id,
    participant_ids,
    item_ids,
    status,
    agenda_state
  )
  VALUES (
    v_match_id,
    ARRAY[v_interest.from_user_id, v_interest.to_user_id]::uuid[],
    ARRAY[v_interest.from_item_id, v_interest.to_item_id]::uuid[],
    'active',
    '{}'::jsonb
  )
  ON CONFLICT ON CONSTRAINT conversations_match_id_key
  DO UPDATE SET
    participant_ids = EXCLUDED.participant_ids,
    item_ids = EXCLUDED.item_ids,
    updated_at = now()
  RETURNING id INTO v_conversation_id;

  IF v_interest.status = 'pending' THEN
    UPDATE public.matching_interests
    SET status = 'accepted'
    WHERE id = v_interest.id;
  END IF;

  RETURN QUERY
  SELECT
    v_interest.id,
    v_matching_session_id,
    v_match_id,
    v_conversation_id,
    'accepted'::text,
    'accepted'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_matching_interest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_matching_interest(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_matching_interest(uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_matching_interest(uuid) IS
  'Batch 56 atomic transition: accepted interest + accepted match + one idempotent private conversation. Conflict target is qualified by constraint to avoid PL/pgSQL output-column ambiguity. No Exchange, AI, attachments, or token side effects.';

COMMIT;
