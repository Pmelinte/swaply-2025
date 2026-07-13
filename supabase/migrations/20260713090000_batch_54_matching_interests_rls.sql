-- Batch 54: strict RLS contract for Express Interest.
--
-- Contract:
--   * the initiator and recipient may read the interest;
--   * only the initiator may create, update, withdraw, or delete it;
--   * the offered item must belong to the initiator;
--   * the target item must belong to the declared recipient;
--   * unrelated users cannot read or mutate the row.

ALTER TABLE public.matching_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS matching_interests_participants ON public.matching_interests;
DROP POLICY IF EXISTS matching_interests_select_participants ON public.matching_interests;
DROP POLICY IF EXISTS matching_interests_insert_initiator ON public.matching_interests;
DROP POLICY IF EXISTS matching_interests_update_initiator ON public.matching_interests;
DROP POLICY IF EXISTS matching_interests_delete_initiator ON public.matching_interests;

CREATE POLICY matching_interests_select_participants
ON public.matching_interests
FOR SELECT
TO authenticated
USING (
  auth.uid() = from_user_id
  OR auth.uid() = to_user_id
);

CREATE POLICY matching_interests_insert_initiator
ON public.matching_interests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = from_user_id
  AND from_user_id <> to_user_id
  AND EXISTS (
    SELECT 1
    FROM public.items AS offered_item
    WHERE offered_item.id = from_item_id
      AND offered_item.owner_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.items AS target_item
    WHERE target_item.id = to_item_id
      AND target_item.owner_id = to_user_id
      AND target_item.owner_id <> auth.uid()
  )
);

CREATE POLICY matching_interests_update_initiator
ON public.matching_interests
FOR UPDATE
TO authenticated
USING (auth.uid() = from_user_id)
WITH CHECK (
  auth.uid() = from_user_id
  AND from_user_id <> to_user_id
  AND EXISTS (
    SELECT 1
    FROM public.items AS offered_item
    WHERE offered_item.id = from_item_id
      AND offered_item.owner_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.items AS target_item
    WHERE target_item.id = to_item_id
      AND target_item.owner_id = to_user_id
      AND target_item.owner_id <> auth.uid()
  )
);

CREATE POLICY matching_interests_delete_initiator
ON public.matching_interests
FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id);
