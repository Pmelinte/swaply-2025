-- ============================================================
-- Onboarding Checklist: add step_verified column + completion trigger
-- ============================================================

-- 1. Add step_verified column if missing
ALTER TABLE public.onboarding_progress
  ADD COLUMN IF NOT EXISTS step_verified BOOLEAN DEFAULT false;

-- 2. Trigger function: when all steps are true, mark onboarding as complete
--    and award +50 bonus tokens.
CREATE OR REPLACE FUNCTION check_onboarding_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.step_profile
     AND NEW.step_first_item
     AND NEW.step_first_match
     AND NEW.step_first_swap
     AND NEW.step_verified
     AND NEW.completed_at IS NULL
  THEN
    -- Mark completed_at on onboarding_progress
    UPDATE public.onboarding_progress
    SET completed_at = now()
    WHERE user_id = NEW.user_id;

    -- Mark profiles.onboarding_completed = true
    UPDATE public.profiles
    SET onboarding_completed = true
    WHERE user_id = NEW.user_id::text;

    -- Award +50 bonus tokens
    PERFORM award_tokens(NEW.user_id, 50, 'onboarding_complete');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_onboarding_step_updated ON public.onboarding_progress;
CREATE TRIGGER on_onboarding_step_updated
  AFTER UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION check_onboarding_complete();

-- 4. Award +10 tokens per step via trigger
CREATE OR REPLACE FUNCTION award_tokens_for_onboarding_step()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 10 tokens for each step that just became true
  IF NEW.step_profile AND (OLD.step_profile IS DISTINCT FROM true) THEN
    PERFORM award_tokens(NEW.user_id, 10, 'onboarding_step_profile');
  END IF;
  IF NEW.step_first_item AND (OLD.step_first_item IS DISTINCT FROM true) THEN
    PERFORM award_tokens(NEW.user_id, 10, 'onboarding_step_first_item');
  END IF;
  IF NEW.step_first_match AND (OLD.step_first_match IS DISTINCT FROM true) THEN
    PERFORM award_tokens(NEW.user_id, 10, 'onboarding_step_first_match');
  END IF;
  IF NEW.step_first_swap AND (OLD.step_first_swap IS DISTINCT FROM true) THEN
    PERFORM award_tokens(NEW.user_id, 10, 'onboarding_step_first_swap');
  END IF;
  IF NEW.step_verified AND (OLD.step_verified IS DISTINCT FROM true) THEN
    PERFORM award_tokens(NEW.user_id, 10, 'onboarding_step_verified');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_onboarding_step_award_tokens ON public.onboarding_progress;
CREATE TRIGGER on_onboarding_step_award_tokens
  AFTER UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION award_tokens_for_onboarding_step();

-- 5. Enable realtime for onboarding_progress (needed by useOnboarding hook)
ALTER PUBLICATION supabase_realtime ADD TABLE public.onboarding_progress;
