-- Service & Event Wizards: add service_data and event_data JSONB columns to items
-- Safe on any env (IF NOT EXISTS).

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS service_data JSONB,
  ADD COLUMN IF NOT EXISTS event_data   JSONB;

CREATE INDEX IF NOT EXISTS idx_items_service_data ON public.items USING gin(service_data)
  WHERE item_type = 'service';
CREATE INDEX IF NOT EXISTS idx_items_event_data ON public.items USING gin(event_data)
  WHERE item_type = 'event';
