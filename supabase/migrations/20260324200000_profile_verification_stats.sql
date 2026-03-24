-- Profile verification & stats columns

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_rate INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completion_rate INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dispute_rate INTEGER DEFAULT 0;

-- Index for fast badge lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification
  ON profiles (phone_verified, id_verified, selfie_verified);
