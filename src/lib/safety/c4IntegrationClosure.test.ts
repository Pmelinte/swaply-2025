import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

function migrationEndingWith(suffix: string) {
  const file = readdirSync(migrationDirectory)
    .filter((name) => name.endsWith(suffix))
    .sort()
    .at(-1);

  expect(file).toBeDefined();
  return readFileSync(join(migrationDirectory, file!), "utf8").replace(/\s+/g, " ");
}

function migrationsContaining(fragment: string) {
  const files = readdirSync(migrationDirectory)
    .filter((name) => name.includes(fragment))
    .sort();

  expect(files.length).toBeGreaterThan(0);
  return files
    .map((file) => readFileSync(join(migrationDirectory, file), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ");
}

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

function functionBody(sql: string, startMarker: string, endMarker: string) {
  const start = sql.indexOf(startMarker);
  const end = sql.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end);
}

describe("Batch 63.4 C4 integration closure", () => {
  const cancelSql = migrationEndingWith("_batch_63_1_cancel_authority.sql");
  const disputeSql = migrationsContaining("_batch_63_2_dispute_");
  const reportBlockSql = migrationsContaining("_batch_63_3_");

  it("keeps cancel and dispute as mutually exclusive CAS-protected terminal branches", () => {
    expect(cancelSql).toContain("function public.cancel_swap_v1");
    expect(cancelSql).toContain("for update");
    expect(cancelSql).toContain("Stale swap status: expected %, current %");
    expect(cancelSql).toContain("status = 'cancelled'");

    expect(disputeSql).toContain("function public.open_swap_dispute_v1");
    expect(disputeSql).toContain("for update");
    expect(disputeSql).toContain("Stale swap status: expected %, current %");
    expect(disputeSql).toContain("'disputed', v_actor_id, 'dispute_authority'");
    expect(disputeSql).toContain("'dispute_resolved', 'disputed', 'disputed'");
    expect(disputeSql).not.toContain("set status = 'resolved'");
  });

  it("keeps branch-specific cleanup boundaries exact", () => {
    expect(cancelSql).toContain("status = 'reserved' and lock_reason = 'swap_active'");
    expect(cancelSql).toContain("status = 'active'");
    expect(cancelSql).toContain("delete from public.swap_completion_confirmations");
    expect(cancelSql).toContain("status in ('active', 'agreed')");

    expect(disputeSql).toContain("requester_confirmed = false");
    expect(disputeSql).toContain("delete from public.swap_completion_confirmations");
    expect(disputeSql).toContain("Dispute resolution requires a disputed Swap");
    expect(disputeSql).toContain("status = 'reserved' and lock_reason = 'swap_active'");
    expect(disputeSql).toContain("set status = 'cancelled'");
  });

  it("uses block only as a future-contact barrier and preserves existing lifecycle evidence", () => {
    expect(reportBlockSql).toContain("enforce_unblocked_matching_interest_v1");
    expect(reportBlockSql).toContain("enforce_unblocked_conversation_v1");
    expect(reportBlockSql).toContain("enforce_unblocked_message_v1");
    expect(reportBlockSql).toContain("enforce_unblocked_swap_v1");
    expect(reportBlockSql).not.toContain("delete from public.messages");
    expect(reportBlockSql).not.toContain("delete from public.conversations");

    expect(cancelSql).not.toContain("blocked_users");
    expect(disputeSql).not.toContain("blocked_users");
  });

  it("keeps raw report submission independent from Swap state and sanctions", () => {
    const reportAuthority = migrationEndingWith("_batch_63_3_report_authority.sql");
    const submitBody = functionBody(
      reportAuthority,
      "create or replace function public.submit_safety_report_v1",
      "create or replace function public.resolve_safety_report_v1",
    );

    expect(submitBody).toContain("insert into public.reports");
    expect(submitBody).toContain("'safety.report_submitted'");
    expect(submitBody).not.toContain("update public.swaps");
    expect(submitBody).not.toContain("update public.profiles");
    expect(submitBody).not.toContain("insert into public.notifications");
    expect(submitBody).not.toContain("insert into public.user_tokens");
    expect(submitBody).not.toContain("insert into public.reviews");
    expect(submitBody).not.toContain("calculate_trust_score(");
  });

  it("keeps every C4 command browser-authenticated and excludes service-role execution", () => {
    expect(cancelSql).toContain(
      "grant execute on function public.cancel_swap_v1(uuid, text, text, text) to authenticated",
    );
    expect(cancelSql).toContain("from public, anon, service_role");

    expect(disputeSql).toContain("grant execute on function public.open_swap_dispute_v1");
    expect(disputeSql).toContain("grant execute on function public.add_swap_dispute_evidence_v1");
    expect(disputeSql).toContain("grant execute on function public.resolve_swap_dispute_v1");
    expect(disputeSql).toContain("from public, anon, service_role");

    expect(reportBlockSql).toContain("grant execute on function public.submit_safety_report_v1");
    expect(reportBlockSql).toContain("grant execute on function public.resolve_safety_report_v1");
    expect(reportBlockSql).toContain("grant execute on function public.set_user_block_v1");
    expect(reportBlockSql).toContain("from public, anon, service_role");
  });

  it("keeps executable application paths on the canonical report and block adapters", () => {
    const service = source("src/lib/safety/reportBlockService.ts");
    const state = source("src/lib/state/useSafetyActions.ts");
    const adminPage = source("src/app/[locale]/admin/reports/page.tsx");
    const adminActions = source("src/features/admin/useAdminActions.ts");

    expect(service).toContain('client.rpc("submit_safety_report_v1"');
    expect(service).toContain('client.rpc("set_user_block_v1"');
    expect(service).toContain('client.rpc("resolve_safety_report_v1"');
    expect(state).not.toContain('.from("reports").insert');
    expect(state).not.toContain('.from("blocked_users").insert');
    expect(state).not.toContain('.from("blocked_users").delete');
    expect(adminPage).not.toContain("abuse_reports");
    expect(adminActions).not.toContain("abuse_reports");
    expect(adminActions).not.toContain('.from("moderation_actions").insert');
  });
});
