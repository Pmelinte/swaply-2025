-- ============================================================
-- Weekly Themed Events System
-- ============================================================

-- 1) Create weekly_events table
CREATE TABLE IF NOT EXISTS public.weekly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  focus_categories TEXT[] NOT NULL,
  challenge_description TEXT NOT NULL,
  challenge_badge_name TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.weekly_events ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read events" ON public.weekly_events
  FOR SELECT USING (true);

-- Grants
GRANT SELECT ON public.weekly_events TO anon;
GRANT SELECT ON public.weekly_events TO authenticated;

-- Index for current event lookup
CREATE INDEX idx_weekly_events_dates ON public.weekly_events (starts_at, ends_at);
CREATE UNIQUE INDEX idx_weekly_events_week_year ON public.weekly_events (week_number, year);

-- ============================================================
-- 2) Seed first 5 events
-- ============================================================

INSERT INTO public.weekly_events (week_number, year, title, emoji, description, focus_categories,
  challenge_description, challenge_badge_name, hashtags, starts_at, ends_at) VALUES
(1, 2026, 'Săptămâna Wellness & Fitness', '💪',
 'Rezoluțiile de Anul Nou — toată lumea vrea să fie mai sănătoasă. Schimbă echipamentele fitness neutilizate!',
 ARRAY['sport', 'fitness', 'sanatate'],
 'Fă 1 schimb de echipament fitness neutilizat',
 'New Year New Swap',
 ARRAY['#SwaplyCuFitness', '#ResolutionSwap', '#NouAnNouSwap'],
 '2026-01-01 00:00:00+02', '2026-01-07 23:59:59+02'),

(2, 2026, 'Săptămâna Cărților & Cunoașterii', '📚',
 'Citești mult? Schimbă cărțile pe care le-ai terminat și descoperă titluri noi!',
 ARRAY['books', 'education', 'arts'],
 'Schimbă cel puțin 1 carte pe care ai citit-o',
 'Bookworm Swapper',
 ARRAY['#SwaplyBookClub', '#SchimbCarti', '#ReadAndSwap'],
 '2026-01-08 00:00:00+02', '2026-01-14 23:59:59+02'),

(3, 2026, 'Săptămâna Tech & Gadgets', '📱',
 'Ai gadgeturi vechi prin sertare? E momentul perfect să le dai o nouă viață prin swap!',
 ARRAY['electronics', 'tech', 'gadgets'],
 'Schimbă 1 gadget electronic nefolosit',
 'Tech Recycler',
 ARRAY['#SwaplyTech', '#GadgetSwap', '#TechRecycle'],
 '2026-01-15 00:00:00+02', '2026-01-21 23:59:59+02'),

(4, 2026, 'Săptămâna Casei & Decorului', '🏠',
 'Redecorează fără să cumperi! Schimbă decorațiuni, mobilier mic și obiecte de casă.',
 ARRAY['home', 'garden', 'furniture'],
 'Fă 1 schimb de obiect de decor sau casă',
 'Home Makeover',
 ARRAY['#SwaplyCasa', '#HomeSwap', '#DecorSwap'],
 '2026-01-22 00:00:00+02', '2026-01-28 23:59:59+02'),

(5, 2026, 'Săptămâna Modei Sustenabile', '👗',
 'Moda circulară la putere! Schimbă hainele pe care nu le mai porți cu piese noi pentru garderoba ta.',
 ARRAY['fashion', 'clothing', 'accessories'],
 'Schimbă 1 articol vestimentar',
 'Fashion Forward',
 ARRAY['#SwaplyFashion', '#ModaSustenabila', '#CircularFashion'],
 '2026-01-29 00:00:00+02', '2026-02-04 23:59:59+02');

-- ============================================================
-- 3) Function to get current active event
-- ============================================================

CREATE OR REPLACE FUNCTION get_current_event()
RETURNS SETOF public.weekly_events AS $$
  SELECT * FROM public.weekly_events
  WHERE starts_at <= NOW() AND ends_at >= NOW()
  ORDER BY starts_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- ============================================================
-- 4) Badge trigger on swap completion
-- ============================================================

-- Add event_badges column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'event_badges'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN event_badges TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- Function: award event badge when swap completed during active event
CREATE OR REPLACE FUNCTION award_event_badge()
RETURNS TRIGGER AS $$
DECLARE
  event_rec RECORD;
  item_category TEXT;
BEGIN
  -- Only trigger on status change to 'completed'
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get category of the requester's item
  SELECT category INTO item_category
  FROM public.items
  WHERE id = NEW.requester_item_id
  LIMIT 1;

  -- Check if there's an active event matching the item category
  SELECT id, challenge_badge_name INTO event_rec
  FROM public.weekly_events
  WHERE NOW() BETWEEN starts_at AND ends_at
    AND (focus_categories @> ARRAY[item_category] OR focus_categories = ARRAY['all'])
  LIMIT 1;

  IF FOUND THEN
    -- Award badge to both participants (only if they don't already have it)
    UPDATE public.profiles
    SET event_badges = array_append(event_badges, event_rec.challenge_badge_name)
    WHERE id IN (NEW.requester_id, NEW.responder_id)
      AND NOT (event_badges @> ARRAY[event_rec.challenge_badge_name]);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'award_event_badge error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on swap_intents (status changes happen here)
DROP TRIGGER IF EXISTS on_swap_completed_award_badge ON public.swap_intents;
CREATE TRIGGER on_swap_completed_award_badge
  AFTER UPDATE ON public.swap_intents
  FOR EACH ROW EXECUTE FUNCTION award_event_badge();
