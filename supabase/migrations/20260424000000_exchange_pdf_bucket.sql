-- PR 8: Storage bucket for generated exchange PDFs
-- Created as public so the URL in swaps.pdf_url is directly accessible.
-- Upload is still restricted: the POST /api/exchange/[swapId]/pdf route
-- uploads with the service role key and only after verifying participant auth.

INSERT INTO storage.buckets (id, name, public)
VALUES ('exchange-pdfs', 'exchange-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: allow anyone to read (public bucket), no direct client writes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'exchange_pdfs_public_read'
  ) THEN
    CREATE POLICY exchange_pdfs_public_read ON storage.objects
      FOR SELECT USING (bucket_id = 'exchange-pdfs');
  END IF;
END $$;
