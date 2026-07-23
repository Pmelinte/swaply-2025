-- Prompts 56-60: canonical server-side interest creation and stricter match identity.

BEGIN;

CREATE OR REPLACE FUNCTION public.express_matching_interest(
  p_from_item_id uuid,
  p_to_item_id uuid,
  p_match_score numeric DEFAULT NULL,
  p_source text DEFAULT 'browsing'
)
RETURNS TABLE (
  id uuid,
  to_user_id uuid,
  to_item_id uuid,
  match_score numeric,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_actor_id uuid := auth.uid();
  v_from_owner uuid;
  v_to_owner uuid;
  v_source text := coalesce(p_source, 'browsing');
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  IF v_source NOT IN ('browsing', 'map', 'ai') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INTEREST_SOURCE';
  END IF;

  SELECT item.owner_id
    INTO v_from_owner
  FROM public.items AS item
  WHERE item.id = p_from_item_id
    AND item.owner_id = v_actor_id
    AND item.is_active = true
    AND item.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'SOURCE_ITEM_OWNER_REQUIRED';
  END IF;

  SELECT item.owner_id
    INTO v_to_owner
  FROM public.items AS item
  WHERE item.id = p_to_item_id
    AND item.is_active = true
    AND item.status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'TARGET_ITEM_UNAVAILABLE';
  END IF;

  IF v_to_owner = v_actor_id THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'SELF_INTEREST_NOT_ALLOWED';
  END IF;

  INSERT INTO public.matching_sessions (user_id, slot_1_item_id, filters)
  VALUES (
    v_actor_id,
    p_from_item_id,
    jsonb_build_object('source', 'express_interest')
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    slot_1_item_id = EXCLUDED.slot_1_item_id,
    updated_at = now();

  RETURN QUERY
  INSERT INTO public.matching_interests (
    from_user_id,
    to_user_id,
    from_item_id,
    to_item_id,
    match_score,
    source,
    status
  )
  VALUES (
    v_actor_id,
    v_to_owner,
    p_from_item_id,
    p_to_item_id,
    least(100, greatest(0, coalesce(p_match_score, 0))),
    v_source,
    'pending'
  )
  ON CONFLICT (from_user_id, from_item_id, to_user_id, to_item_id)
  WHERE status IN ('pending', 'accepted')
  DO UPDATE SET
    match_score = EXCLUDED.match_score,
    source = EXCLUDED.source
  RETURNING
    matching_interests.id,
    matching_interests.to_user_id,
    matching_interests.to_item_id,
    matching_interests.match_score,
    matching_interests.status;
END;
$$;

REVOKE ALL ON FUNCTION public.express_matching_interest(uuid, uuid, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.express_matching_interest(uuid, uuid, numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.express_matching_interest(uuid, uuid, numeric, text) TO authenticated;

COMMENT ON FUNCTION public.express_matching_interest(uuid, uuid, numeric, text) IS
  'Canonical participant-only, idempotent interest creation. Actor and source owner are derived server-side from auth.uid(); target owner/status are verified server-side.';

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
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  SELECT interest.* INTO v_interest
  FROM public.matching_interests AS interest
  WHERE interest.id = p_interest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'INTEREST_NOT_FOUND';
  END IF;

  IF v_interest.to_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'INTEREST_RECIPIENT_REQUIRED';
  END IF;

  IF v_interest.from_user_id IS NULL OR v_interest.to_user_id IS NULL OR v_interest.from_item_id IS NULL OR v_interest.to_item_id IS NULL OR v_interest.from_user_id = v_interest.to_user_id THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'INVALID_INTEREST_PARTICIPANTS';
  END IF;

  IF v_interest.status IS NULL OR v_interest.status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'INTEREST_NOT_PENDING';
  END IF;

  PERFORM 1 FROM public.items AS offered_item
  WHERE offered_item.id = v_interest.from_item_id AND offered_item.owner_id = v_interest.from_user_id AND offered_item.is_active = true AND offered_item.status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'OFFERED_ITEM_UNAVAILABLE';
  END IF;

  PERFORM 1 FROM public.items AS target_item
  WHERE target_item.id = v_interest.to_item_id AND target_item.owner_id = v_interest.to_user_id AND target_item.is_active = true AND target_item.status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'TARGET_ITEM_UNAVAILABLE';
  END IF;

  INSERT INTO public.matching_sessions (user_id, slot_1_item_id, filters)
  VALUES (v_interest.from_user_id, v_interest.from_item_id, jsonb_build_object('source', 'accepted_interest', 'interest_id', v_interest.id))
  ON CONFLICT (user_id) DO UPDATE SET slot_1_item_id = EXCLUDED.slot_1_item_id, updated_at = now()
  RETURNING id INTO v_matching_session_id;

  v_match_type := CASE WHEN v_interest.source = 'ai' THEN 'ai' ELSE 'manual' END;

  SELECT match_row.id, match_row.status, match_row.converted_swap_id
  INTO v_match_id, v_existing_match_status, v_existing_converted_swap_id
  FROM public.matches AS match_row
  WHERE match_row.initiator_id = v_interest.from_user_id
    AND match_row.target_user_id = v_interest.to_user_id
    AND match_row.initiator_item_id = v_interest.from_item_id
    AND match_row.target_item_id = v_interest.to_item_id
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing_match_status = 'converted_to_swap' OR v_existing_converted_swap_id IS NOT NULL THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'MATCH_ALREADY_CONVERTED';
    END IF;
    UPDATE public.matches SET match_type = v_match_type, status = 'accepted', ai_score = v_interest.match_score, ai_reasoning = NULL, slot_position = 1, dismissed_by = NULL, dismissed_at = NULL, dismiss_reason = NULL, expires_at = now() + interval '30 days', updated_at = now() WHERE id = v_match_id;
  ELSE
    INSERT INTO public.matches (initiator_id, target_user_id, initiator_item_id, target_item_id, match_type, status, ai_score, slot_position)
    VALUES (v_interest.from_user_id, v_interest.to_user_id, v_interest.from_item_id, v_interest.to_item_id, v_match_type, 'accepted', v_interest.match_score, 1)
    RETURNING id INTO v_match_id;
  END IF;

  INSERT INTO public.conversations (match_id, participant_ids, item_ids, status, agenda_state)
  VALUES (v_match_id, ARRAY[v_interest.from_user_id, v_interest.to_user_id]::uuid[], ARRAY[v_interest.from_item_id, v_interest.to_item_id]::uuid[], 'active', '{}'::jsonb)
  ON CONFLICT ON CONSTRAINT conversations_match_id_key
  DO UPDATE SET participant_ids = EXCLUDED.participant_ids, item_ids = EXCLUDED.item_ids, updated_at = now()
  RETURNING id INTO v_conversation_id;

  IF v_interest.status = 'pending' THEN
    UPDATE public.matching_interests SET status = 'accepted' WHERE id = v_interest.id;
  END IF;

  RETURN QUERY SELECT v_interest.id, v_matching_session_id, v_match_id, v_conversation_id, 'accepted'::text, 'accepted'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_matching_interest(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_matching_interest(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_matching_interest(uuid) TO authenticated;

COMMIT;
