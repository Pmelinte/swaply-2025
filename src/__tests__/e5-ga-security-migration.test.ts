import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260727163000_e5_ga_security_advisor_hardening.sql'),
  'utf8',
);

const protectedFunctions = [
  'public.accept_swap_revision(uuid, integer, jsonb)',
  'public.activate_atomic_exchange(uuid, integer)',
  'public.apply_swap_authority_action(uuid, integer, text, uuid, uuid, text, jsonb)',
  'public.confirm_swap_leg_progress(uuid, uuid, integer, text)',
  'public.is_swap_participant(uuid)',
  'public.revise_swap_agreement(uuid, integer, jsonb)',
];

describe('E5 GA security migration', () => {
  it('revokes PUBLIC and anon execution from every Train E SECURITY DEFINER RPC', () => {
    for (const signature of protectedFunctions) {
      expect(migration).toContain(`revoke all on function ${signature} from public, anon`);
    }
  });

  it('retains authenticated execution for participant-authorised RPCs', () => {
    for (const signature of protectedFunctions) {
      expect(migration).toContain(`grant execute on function ${signature} to authenticated`);
    }
  });

  it('pins the matching trigger helper search path', () => {
    expect(migration).toContain('alter function public.set_matching_session_updated_at()');
    expect(migration).toContain('set search_path = pg_catalog, public');
  });
});
