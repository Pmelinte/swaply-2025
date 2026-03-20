-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;

-- Trigger: handle swap status changes (accepted, completed)
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
    RETURN NEW;
  END IF;

  -- Send accepted email when status changes from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
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

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'swap_status_change trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on swaps table for UPDATE
DROP TRIGGER IF EXISTS on_swap_status_changed ON public.swaps;
CREATE TRIGGER on_swap_status_changed
  AFTER UPDATE ON public.swaps
  FOR EACH ROW EXECUTE FUNCTION handle_swap_status_change();

-- Cron job: send reactivation emails daily at 10:00 UTC
SELECT cron.schedule(
  'reactivation-emails-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://keaejxlwqtjjglijiplh.supabase.co/functions/v1/reactivation-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);