-- ============================================================
-- User Tokens System — internal platform currency
-- Tokens are earned through activity, never purchased directly.
-- ============================================================

-- 1. Table: user_tokens (ledger of all token transactions)
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,            -- positive = earned, negative = spent
  reason TEXT NOT NULL,               -- e.g. 'welcome_bonus', 'add_item', 'complete_swap', 'review', 'daily_login', 'boost_item'
  reference_id UUID,                  -- optional: ID of the item/swap that generated tokens
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tokens" ON public.user_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Index for fast balance lookups
CREATE INDEX idx_user_tokens_user_id ON public.user_tokens(user_id);

-- 2. Function: award_tokens (insert ledger row + update cached total in profiles.stats)
CREATE OR REPLACE FUNCTION award_tokens(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.user_tokens (user_id, amount, reason, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id);

  UPDATE public.profiles
  SET stats = jsonb_set(
    COALESCE(stats, '{}'::jsonb),
    '{tokens}',
    to_jsonb(COALESCE((stats->>'tokens')::integer, 0) + p_amount)
  )
  WHERE user_id = p_user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3a. Trigger: +10 tokens on new item (skip demo items)
CREATE OR REPLACE FUNCTION award_tokens_for_new_item()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.is_demo, false) = false THEN
    PERFORM award_tokens(NEW.owner_id::uuid, 10, 'add_item', NEW.id::uuid);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_item_created_award_tokens ON public.items;
CREATE TRIGGER on_item_created_award_tokens
  AFTER INSERT ON public.items
  FOR EACH ROW EXECUTE FUNCTION award_tokens_for_new_item();

-- 3b. Extend handle_swap_status_change to award +30 tokens on completion
CREATE OR REPLACE FUNCTION handle_swap_status_change()
RETURNS TRIGGER AS $$
DECLARE
  edge_url_base text := 'https://keaejxlwqtjjglijiplh.supabase.co/functions/v1';
  service_key text;
BEGIN
  -- Read service_role_key from Vault
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF service_key IS NULL OR service_key = '' THEN
    RAISE LOG 'swap_status_change: service_role_key not found in vault, skipping';
  END IF;

  -- Send accepted email
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    IF service_key IS NOT NULL AND service_key <> '' THEN
      PERFORM net.http_post(
        url := edge_url_base || '/send-swap-accepted-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_key
        ),
        body := jsonb_build_object(
          'swap_id', NEW.id::text,
          'requester_id', NEW.requester_id::text,
          'responder_id', NEW.responder_id::text,
          'offered_item_id', NEW.offered_item_id::text,
          'requested_item_id', NEW.requested_item_id::text
        )
      );
    END IF;
  END IF;

  -- Award +30 tokens to both participants on swap completion
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    PERFORM award_tokens(NEW.requester_id::uuid, 30, 'complete_swap', NEW.id::uuid);
    PERFORM award_tokens(NEW.responder_id::uuid, 30, 'complete_swap', NEW.id::uuid);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'swap_status_change trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
