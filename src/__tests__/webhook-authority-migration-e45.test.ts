import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260727112000_e4_5_webhook_authority_reconciliation.sql'),
  'utf8',
);

describe('E4.5 webhook authority migration', () => {
  it('keeps webhook and reconciliation writes server-side only', () => {
    expect(migration).toContain(
      'revoke all on table public.service_payment_reconciliation_runs from anon, authenticated',
    );
    expect(migration).toContain(
      'revoke all on table public.service_payment_reconciliation_items from anon, authenticated',
    );
  });

  it('adds retry, dead-letter and reconciliation evidence', () => {
    expect(migration).toContain("'retry-pending'");
    expect(migration).toContain("'dead-letter'");
    expect(migration).toContain('service_payment_reconciliation_runs');
    expect(migration).toContain('service_payment_reconciliation_items');
  });

  it('preserves provider event uniqueness from E4.4', () => {
    expect(migration).not.toContain('drop constraint service_payment_events_provider_id_provider_event_id_key');
  });
});
