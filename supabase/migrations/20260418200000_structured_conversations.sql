-- PR 7: Structured conversations for swap negotiation chat
-- Creates conversations table + extends messages with new columns.
-- Uses struct_conv_id to avoid conflict with existing TEXT conversation_id.

-- ── Structured conversations ──

CREATE TABLE IF NOT EXISTS public.conversations (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  swap_id               uuid REFERENCES public.swaps(id) ON DELETE SET NULL,
  participant_ids       uuid[] NOT NULL,
  item_ids              uuid[] NOT NULL DEFAULT '{}',
  status                text DEFAULT 'active'
                          CHECK (status IN ('active', 'agreed', 'cancelled', 'completed')),
  agenda_state          jsonb DEFAULT '{}',
  summary               jsonb,
  summary_approved_by   uuid[] DEFAULT '{}',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations USING gin(participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- ── Extend messages with structured conversation and media support ──

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS struct_conv_id    uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_type      text DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'audio', 'video', 'system', 'agenda_update', 'summary')),
  ADD COLUMN IF NOT EXISTS media_url         text,
  ADD COLUMN IF NOT EXISTS media_type        text,
  ADD COLUMN IF NOT EXISTS translation_cache jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS read_by           uuid[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_messages_struct_conv ON public.messages(struct_conv_id)
  WHERE struct_conv_id IS NOT NULL;

-- ── Row Level Security ──

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- conversations: participant can read/update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations'
    AND policyname = 'conv_participants_read'
  ) THEN
    CREATE POLICY conv_participants_read ON public.conversations
      FOR SELECT USING (auth.uid() = ANY(participant_ids));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations'
    AND policyname = 'conv_participants_update'
  ) THEN
    CREATE POLICY conv_participants_update ON public.conversations
      FOR UPDATE USING (auth.uid() = ANY(participant_ids));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations'
    AND policyname = 'conv_participants_insert'
  ) THEN
    CREATE POLICY conv_participants_insert ON public.conversations
      FOR INSERT WITH CHECK (auth.uid() = ANY(participant_ids));
  END IF;
END $$;

-- ── Auto-update updated_at ──

CREATE OR REPLACE FUNCTION public.set_conversation_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_conversation_updated_at ON public.conversations;
CREATE TRIGGER trg_conversation_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_conversation_updated_at();

-- ── Enable Realtime (safe: ignore if already in publication) ──

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
