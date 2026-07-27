import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260727123000_e4_7_campaigns_controlled_promotion.sql'),
  'utf8',
);

describe('E4.7 campaign migration', () => {
  it('keeps impression evidence server-side only', () => {
    expect(migration).toContain(
      'revoke all on table public.promotion_impressions from anon, authenticated',
    );
  });

  it('requires sponsored disclosure, moderation and kill-switch evidence', () => {
    expect(migration).toContain("check (disclosure_label = 'sponsored')");
    expect(migration).toContain('moderation_approved_at');
    expect(migration).toContain('kill_switch_activated_at');
  });

  it('does not alter trust or ranking tables', () => {
    expect(migration).not.toContain('trust_level');
    expect(migration).not.toContain('reputation');
    expect(migration).not.toContain('update public.items');
  });
});
