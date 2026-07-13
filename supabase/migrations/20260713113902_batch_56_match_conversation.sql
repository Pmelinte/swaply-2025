-- Batch 56: Match Conversation Bootstrap
-- Extends the existing conversations/messages model so an accepted match can
-- open exactly one private text conversation before any Exchange exists.
-- Translation, AI moderation, attachments, read receipts, notifications,
-- Exchange creation, and tokens remain outside this migration.

BEGIN;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS match_id uuid;

DO $$
BEGIN
  ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_match_id_fkey
    FOREIGN KEY (match_id)
    REFERENCES public.matches(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_match_id_key UNIQUE (match_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.messages
  ALTER COLUMN swap_id DROP NOT NULL;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS match_id uuid;

DO $$
BEGIN
  ALTER TABLE public.messages
    ADD CONSTRAINT messages_match_id_fkey
    FOREIGN KEY (match_id)
    REFERENCES public.matches(id)
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_context_check;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_context_check
  CHECK (
    (swap_id IS NOT NULL AND match_id IS NULL)
    OR
    (swap_id IS NULL AND match_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_messages_match_id
  ON public.messages(match_id);

DROP POLICY IF EXISTS conversations_insert ON public.conversations;
CREATE POLICY conversations_insert
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = ANY (participant_ids)
    AND cardinality(participant_ids) = 2
    AND (
      match_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.matches AS match_row
        WHERE match_row.id = conversations.match_id
          AND match_row.status = 'accepted'
          AND match_row.initiator_id = ANY (conversations.participant_ids)
          AND match_row.target_user_id = ANY (conversations.participant_ids)
          AND match_row.target_item_id = ANY (conversations.item_ids)
          AND (
            match_row.initiator_item_id IS NULL
            OR match_row.initiator_item_id = ANY (conversations.item_ids)
          )
      )
    )
  );

DROP POLICY IF EXISTS conversations_update ON public.conversations;
CREATE POLICY conversations_update
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY (participant_ids))
  WITH CHECK (
    auth.uid() = ANY (participant_ids)
    AND cardinality(participant_ids) = 2
    AND (
      match_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.matches AS match_row
        WHERE match_row.id = conversations.match_id
          AND match_row.status = 'accepted'
          AND match_row.initiator_id = ANY (conversations.participant_ids)
          AND match_row.target_user_id = ANY (conversations.participant_ids)
          AND match_row.target_item_id = ANY (conversations.item_ids)
          AND (
            match_row.initiator_item_id IS NULL
            OR match_row.initiator_item_id = ANY (conversations.item_ids)
          )
      )
    )
  );

DROP POLICY IF EXISTS insert_own_messages ON public.messages;
CREATE POLICY insert_own_messages
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> auth.uid()
    AND length(btrim(content)) BETWEEN 1 AND 4000
    AND (
      (
        match_id IS NOT NULL
        AND swap_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.conversations AS conversation_row
          JOIN public.matches AS match_row
            ON match_row.id = conversation_row.match_id
          WHERE conversation_row.id::text = messages.conversation_id
            AND conversation_row.match_id = messages.match_id
            AND match_row.status = 'accepted'
            AND auth.uid() = ANY (conversation_row.participant_ids)
            AND messages.recipient_id = ANY (conversation_row.participant_ids)
            AND cardinality(conversation_row.participant_ids) = 2
        )
      )
      OR
      (
        swap_id IS NOT NULL
        AND match_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.conversations AS conversation_row
          WHERE conversation_row.id::text = messages.conversation_id
            AND conversation_row.swap_id = messages.swap_id
            AND auth.uid() = ANY (conversation_row.participant_ids)
            AND messages.recipient_id = ANY (conversation_row.participant_ids)
            AND cardinality(conversation_row.participant_ids) = 2
        )
      )
    )
  );

DROP FUNCTION IF EXISTS public.accept_matching_interest(uuid);

CREATE FUNCTION public.accept_matching_interest(p_interest_id uuid)
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
  ON CONFLICT (match_id)
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

COMMENT ON COLUMN public.conversations.match_id IS
  'Batch 56 accepted match linked to exactly one private conversation.';

COMMENT ON COLUMN public.messages.match_id IS
  'Batch 56 pre-Exchange message context. Exactly one of match_id or swap_id is present.';

COMMENT ON FUNCTION public.accept_matching_interest(uuid) IS
  'Batch 56 atomic transition: accepted interest + accepted match + one idempotent private conversation. No Exchange, AI, attachments, or token side effects.';

COMMIT;
