import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationsDirectory = path.join(process.cwd(), 'supabase', 'migrations');
const e3MigrationFiles = fs
  .readdirSync(migrationsDirectory)
  .filter((file) => /e3_[1-5]_/.test(file))
  .sort();
const e3Sql = e3MigrationFiles
  .map((file) => fs.readFileSync(path.join(migrationsDirectory, file), 'utf8'))
  .join('\n');

describe('E3.6 multi-user migration-chain closure', () => {
  it('contains the five ordered E3 migration batches', () => {
    expect(e3MigrationFiles.some((file) => file.includes('e3_1_'))).toBe(true);
    expect(e3MigrationFiles.some((file) => file.includes('e3_2_'))).toBe(true);
    expect(e3MigrationFiles.some((file) => file.includes('e3_3_'))).toBe(true);
    expect(e3MigrationFiles.some((file) => file.includes('e3_4_'))).toBe(true);
    expect(e3MigrationFiles.some((file) => file.includes('e3_5_'))).toBe(true);
  });

  it('preserves participant-only authority and server-side mutation boundaries', () => {
    expect(e3Sql).toContain('security definer');
    expect(e3Sql).toContain('auth.uid()');
    expect(e3Sql).toContain('is_swap_participant');
    expect(e3Sql).toContain('grant execute');
    expect(e3Sql).toContain('to authenticated');
  });

  it('contains revision, idempotency, atomicity and lifecycle protection', () => {
    expect(e3Sql).toContain('agreement_revision');
    expect(e3Sql).toContain('Stale agreement revision');
    expect(e3Sql).toContain('for update');
    expect(e3Sql).toContain('on conflict do nothing');
    expect(e3Sql).toContain("status = 'completed'");
    expect(e3Sql).toContain("status = 'disputed'");
    expect(e3Sql).toContain("state = 'released'");
  });

  it('keeps consumed evidence immutable during cancellation cleanup', () => {
    expect(e3Sql).toContain("and state = 'active'");
    expect(e3Sql).toContain("set state = 'consumed'");
    expect(e3Sql).not.toMatch(/set state = 'released'[\s\S]{0,180}state = 'consumed'/);
  });
});
