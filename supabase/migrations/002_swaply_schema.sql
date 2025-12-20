-- Swaply full schema + RLS (Etapă de testare)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------
-- Profiles
-- -------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  full_name text,
  avatar_url text,
  location text,
  preferred_language text DEFAULT 'ro',
  trust_score integer DEFAULT 50,
  account_type text DEFAULT 'standard',
  bio text,
  rating numeric,
  rating_count integer DEFAULT 0,
  onboarding_completed boolean DEFAULT false,
  preferences jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS trust_score integer,
  ADD COLUMN IF NOT EXISTS account_type text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS rating numeric,
  ADD COLUMN IF NOT EXISTS rating_count integer,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean,
  ADD COLUMN IF NOT EXISTS preferences jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.sync_profile_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.id := NEW.user_id;
  ELSIF NEW.user_id IS NULL AND NEW.id IS NOT NULL THEN
    NEW.user_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_sync_ids ON public.profiles;
CREATE TRIGGER profiles_sync_ids
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_ids();

-- -------------------------
-- Items
-- -------------------------
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  description text,
  category text,
  subcategory text,
  condition text,
  price_estimate_eur numeric,
  price_estimate_ron numeric,
  approximate_value numeric,
  currency text,
  location text,
  location_city text,
  location_country text,
  tags text[] DEFAULT '{}',
  status text,
  is_active boolean DEFAULT true,
  images jsonb,
  ai_metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS price_estimate_eur numeric,
  ADD COLUMN IF NOT EXISTS price_estimate_ron numeric,
  ADD COLUMN IF NOT EXISTS approximate_value numeric,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS is_active boolean,
  ADD COLUMN IF NOT EXISTS images jsonb,
  ADD COLUMN IF NOT EXISTS ai_metadata jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- -------------------------
-- Item images
-- -------------------------
CREATE TABLE IF NOT EXISTS public.item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  image_url text,
  sort_order integer DEFAULT 1,
  is_primary boolean DEFAULT false
);

ALTER TABLE public.item_images
  ADD COLUMN IF NOT EXISTS item_id uuid,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS sort_order integer,
  ADD COLUMN IF NOT EXISTS is_primary boolean;

-- -------------------------
-- Wishlist
-- -------------------------
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  category text,
  subcategory text,
  brand text,
  condition text,
  price_min numeric,
  price_max numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.wishlist
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS price_min numeric,
  ADD COLUMN IF NOT EXISTS price_max numeric,
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- -------------------------
-- Swaps
-- -------------------------
CREATE TABLE IF NOT EXISTS public.swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid REFERENCES public.profiles(id),
  to_user uuid REFERENCES public.profiles(id),
  from_item uuid REFERENCES public.items(id),
  to_item uuid REFERENCES public.items(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.swaps
  ADD COLUMN IF NOT EXISTS from_user uuid,
  ADD COLUMN IF NOT EXISTS to_user uuid,
  ADD COLUMN IF NOT EXISTS from_item uuid,
  ADD COLUMN IF NOT EXISTS to_item uuid,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- -------------------------
-- Swap messages
-- -------------------------
CREATE TABLE IF NOT EXISTS public.swap_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id uuid REFERENCES public.swaps(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id),
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.swap_messages
  ADD COLUMN IF NOT EXISTS swap_id uuid,
  ADD COLUMN IF NOT EXISTS sender_id uuid,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- -------------------------
-- Payments
-- -------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  stripe_customer_id text,
  stripe_session_id text,
  amount numeric,
  currency text,
  type text,
  status text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- -------------------------
-- API clients + usage
-- -------------------------
CREATE TABLE IF NOT EXISTS public.api_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text,
  api_key text UNIQUE,
  plan text,
  monthly_limit integer,
  requests_this_month integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.api_clients
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS plan text,
  ADD COLUMN IF NOT EXISTS monthly_limit integer,
  ADD COLUMN IF NOT EXISTS requests_this_month integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key text REFERENCES public.api_clients(api_key),
  endpoint text,
  status text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.api_usage_logs
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS endpoint text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- -------------------------
-- Updated_at triggers
-- -------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_updated_at ON public.items;
CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS swaps_updated_at ON public.swaps;
CREATE TRIGGER swaps_updated_at
  BEFORE UPDATE ON public.swaps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------
-- RLS
-- -------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- profiles: user can read/update own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- items: owner CRUD, public read active
DROP POLICY IF EXISTS "items_select_public" ON public.items;
CREATE POLICY "items_select_public"
ON public.items FOR SELECT
USING (is_active = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "items_insert_owner" ON public.items;
CREATE POLICY "items_insert_owner"
ON public.items FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "items_update_owner" ON public.items;
CREATE POLICY "items_update_owner"
ON public.items FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "items_delete_owner" ON public.items;
CREATE POLICY "items_delete_owner"
ON public.items FOR DELETE
USING (auth.uid() = user_id);

-- item_images: public if item active, owner if owns item
DROP POLICY IF EXISTS "item_images_select" ON public.item_images;
CREATE POLICY "item_images_select"
ON public.item_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = item_images.item_id
      AND (items.is_active = true OR items.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "item_images_owner" ON public.item_images;
CREATE POLICY "item_images_owner"
ON public.item_images FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = item_images.item_id
      AND items.user_id = auth.uid()
  )
);

-- wishlist: owner only
DROP POLICY IF EXISTS "wishlist_owner" ON public.wishlist;
CREATE POLICY "wishlist_owner"
ON public.wishlist FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- swaps: participants only
DROP POLICY IF EXISTS "swaps_participants" ON public.swaps;
CREATE POLICY "swaps_participants"
ON public.swaps FOR ALL
USING (auth.uid() = from_user OR auth.uid() = to_user)
WITH CHECK (auth.uid() = from_user OR auth.uid() = to_user);

-- swap_messages: participants only
DROP POLICY IF EXISTS "swap_messages_participants" ON public.swap_messages;
CREATE POLICY "swap_messages_participants"
ON public.swap_messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.swaps
    WHERE swaps.id = swap_messages.swap_id
      AND (swaps.from_user = auth.uid() OR swaps.to_user = auth.uid())
  )
);

-- payments: owner only
DROP POLICY IF EXISTS "payments_owner" ON public.payments;
CREATE POLICY "payments_owner"
ON public.payments FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- api_clients + logs: open access for API gateway (MVP)
DROP POLICY IF EXISTS "api_clients_open" ON public.api_clients;
CREATE POLICY "api_clients_open"
ON public.api_clients FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "api_usage_logs_open" ON public.api_usage_logs;
CREATE POLICY "api_usage_logs_open"
ON public.api_usage_logs FOR ALL
USING (true)
WITH CHECK (true);
