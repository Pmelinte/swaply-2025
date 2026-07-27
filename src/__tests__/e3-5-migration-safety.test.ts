import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260727084000_e3_5_cancel_withdraw_dispute_authority.sql',
  ),
  'utf8',
);

describe('E3.5 migration safety', () => {
  it('uses a security definer RPC with a restricted search path', () => {
    expect(migration).toContain('security definer');
    expect(migration).toContain('set search_path = pg_catalog, public');
    expect(migration).toContain(
      'revoke all on function public.apply_swap_authority_action',
    );
    expect(migration).toContain(
      'grant execute on function public.apply_swap_authority_action',
    );
  });

  it('keeps authority participant-only and revision-safe', () => {
    expect(migration).toContain("actor_id uuid := auth.uid()");
    expect(migration).toContain('Only an active participant can use exchange authority');
    expect(migration).toContain('Stale agreement revision');
    expect(migration).toContain("participant.role <> 'observer'");
  });

  it('releases only active reservations and never consumed evidence', () => {
    expect(migration).toContain("and state = 'active'");
    expect(migration).toContain("set state = 'released'");
    expect(migration).not.toContain("set state = 'released'\n    where state = 'consumed'");
  });

  it('makes withdrawal self-only and invalidates current consent', () => {
    expect(migration).toContain('Participants may only withdraw themselves');
    expect(migration).toContain('Withdrawal is closed after atomic activation');
    expect(migration).toContain('delete from public.swap_revision_acceptances');
    expect(migration).toContain('agreement_revision = agreement_revision + 1');
  });

  it('freezes disputed legs and records immutable audit evidence', () => {
    expect(migration).toContain("set state = 'disputed'");
    expect(migration).toContain("next_status := 'disputed'");
    expect(migration).toContain('create table if not exists public.swap_authority_events');
    expect(migration).toContain('swap_authority_events_idempotency_idx');
  });

  it('does not transfer ownership, reward users or write stories', () => {
    expect(migration).not.toMatch(/update\s+public\.items\s+set\s+owner_id/i);
    expect(migration).not.toMatch(/token|reputation|story/i);
  });
});
