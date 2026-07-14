import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "supabase", "migrations");

function completionMigration() {
  const file = readdirSync(directory)
    .filter((name) => name.endsWith("_batch_61_3_bilateral_completion.sql"))
    .sort()
    .at(-1);
  expect(file).toBeDefined();
  return readFileSync(join(directory, file!), "utf8");
}

describe("Batch 61.3 bilateral completion migration", () => {
  it("creates private per-participant confirmation and effect registries", () => {
    const sql = completionMigration();
    expect(sql).toContain("create table if not exists public.swap_completion_confirmations");
    expect(sql).toContain("primary key (swap_id, actor_id)");
    expect(sql).toContain("create table if not exists public.swap_completion_effects");
    expect(sql).toContain("swap_id uuid primary key");
    expect(sql).toContain("enable row level security");
  });

  it("serializes confirmation on the Swap row and derives actor identity from auth", () => {
    const sql = completionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("function public.confirm_swap_completion_v1");
    expect(sql).toContain("v_actor_id uuid := auth.uid()");
    expect(sql).toContain("where id = p_swap_id for update");
    expect(sql).toContain("v_actor_id <> v_swap.requester_id");
    expect(sql).toContain("v_actor_id <> v_swap.responder_id");
  });

  it("requires both confirmations and blocks generic completed transitions", () => {
    const sql = completionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("if p_to_status = 'completed' then");
    expect(sql).toContain("p_source <> 'bilateral_completion'");
    expect(sql).toContain("Both participants must confirm before completion");
    expect(sql).toContain("v_requester_confirmed and v_responder_confirmed");
  });

  it("applies completion effects once in the transition transaction", () => {
    const sql = completionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("function public.apply_swap_completion_effects_v1");
    expect(sql).toContain("on conflict (swap_id) do nothing");
    expect(sql).toContain("set status = 'traded'");
    expect(sql).toContain("set status = 'completed'");
    expect(sql).toContain("swaps_completed = coalesce(swaps_completed, 0) + 1");
    expect(sql).toContain("perform public.award_tokens(");
    expect(sql).toContain("'feedback_requested'");
    expect(sql).toContain("'completion_effects_applied'");
  });

  it("blocks direct confirmation-field writes and removes duplicate historical effects", () => {
    const sql = completionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("create trigger aaa_require_swap_completion_authority");
    expect(sql).toContain("Direct completion confirmation updates are forbidden");
    expect(sql).toContain("drop trigger if exists swaps_trust_score_trigger");
    expect(sql).toContain("drop trigger if exists on_swap_complete_advance_onboarding");
  });
});
