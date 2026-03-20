-- Trigger: send swap proposal email when a new swap with status 'pending' is created
CREATE OR REPLACE FUNCTION handle_new_swap_notification()
RETURNS TRIGGER AS $$
DECLARE
  edge_url text := 'https://keaejxlwqtjjglijiplh.supabase.co/functions/v1/send-swap-proposal-email';
  service_key text;
BEGIN
  IF NEW.status = 'pending' THEN
    -- Read service_role_key from Vault
    SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;

    IF service_key IS NULL OR service_key = '' THEN
      RAISE LOG 'swap_notification: service_role_key not found in vault, skipping';
      RETURN NEW;
    END IF;

    PERFORM net.http_post(
      url := edge_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'swap_id', NEW.id::text,
        'requester_id', NEW.requester_id::text,
        'responder_id', NEW.responder_id::text,
        'offered_item_id', NEW.offered_item_id::text,
        'requested_item_id', NEW.requested_item_id::text,
        'message_initial', COALESCE(NEW.message_initial, '')
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'swap_notification trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on swaps table
DROP TRIGGER IF EXISTS on_swap_created_notify ON public.swaps;
CREATE TRIGGER on_swap_created_notify
  AFTER INSERT ON public.swaps
  FOR EACH ROW EXECUTE FUNCTION handle_new_swap_notification();
