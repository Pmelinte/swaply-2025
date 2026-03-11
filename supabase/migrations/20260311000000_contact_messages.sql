-- Contact form messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL CHECK (subject IN ('technical', 'suggestion', 'partnership', 'other')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: only service role can insert/read (API route uses service key)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
