import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationPath = join(
  root,
  "supabase",
  "migrations",
  "20260714223000_batch_61_2_swap_transition_authority.sql",
);

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function normalized(value: string) {
  return value.replace(/\s+/g, " ").toLowerCase();
}

describe("Batch 61.2 consolidated transition authority", () => {
  const sql = readFileSync(migrationPath, "utf8");
  const compact = normalized(sql);

  it("keeps one service-only idempotency ledger", () => {
    expect(compact).toContain(
      "create table if not exists public.swap_transition_requests",
    );
    expect(compact).toContain("unique (actor_id, idempotency_key)");
    expect(compact).toContain(
      "check (char_length(idempotency_key) between 8 and 200)",
    );
    expect(compact).toContain(
      "alter table public.swap_transition_requests enable row level security",
    );
    expect(compact).toContain(
      "revoke all on table public.swap_transition_requests from public, anon, authenticated",
    );
  });

  it("installs staged enforcement disabled before merge", () => {
    expect(compact).toContain(
      "create table if not exists public.swap_transition_authority_config",
    );
    expect(compact).toContain("enforced boolean not null default false");
    expect(compact).toContain("values (true, false)");
    expect(compact).toContain(
      "create trigger aaa_require_swap_transition_authority before update of status on public.swaps",
    );
    expect(compact).toContain("direct swap status updates are forbidden");
  });

  it("freezes participant and item identity and restricts inserts to pending", () => {
    expect(compact).toContain(
      "create trigger aab_require_swap_identity_immutable before update of requester_id, responder_id, offered_item_id, requested_item_id on public.swaps",
    );
    expect(compact).toContain(
      "swap participant and item identity is immutable",
    );
    expect(compact).toContain(
      "requester_id = (select auth.uid()) and status = 'pending'",
    );
  });

  it("defines apply_swap_transition_v1 as the sole status writer", () => {
    expect(compact).toContain(
      "create or replace function public.apply_swap_transition_v1",
    );
    expect(compact).toContain(
      "update public.swaps set status = p_to_status",
    );
    expect(compact).toContain(
      "where id = p_swap_id and status = p_expected_status",
    );

    const statusWrites = compact.match(
      /update public\.swaps set status = p_to_status/g,
    );
    expect(statusWrites).toHaveLength(1);
  });

  it("preserves role-specific and system-only transition rules", () => {
    expect(compact).toContain(
      "only the responder may accept or reject a pending swap",
    );
    expect(compact).toContain(
      "only the requester may cancel a pending swap",
    );
    expect(compact).toContain("expiry is a system transition");
    expect(compact).toContain("p_source <> 'system_expiry'");
    expect(compact).toContain("v_actor_role := 'system'");
  });

  it("sets both guard contexts and records one transition event", () => {
    expect(compact).toContain(
      "'swaply.transition_authority', 'apply_swap_transition_v1'",
    );
    expect(compact).toContain(
      "'swaply.swap_transition_authority', 'on'",
    );
    expect(compact).toContain("'authorityversion', 'batch-61.2'");
    expect(compact).toContain("'actorrole', v_actor_role");
  });

  it("makes every entrypoint delegate to the sole writer", () => {
    expect(compact).toContain(
      "v_response := public.apply_swap_transition_v1",
    );
    expect(compact).toContain(
      "return public.transition_swap_status_authoritative",
    );
    expect(compact).toContain(
      "perform public.apply_swap_transition_v1( v_swap.id, 'pending', 'expired'",
    );
  });

  it("serializes retries and returns stored replays", () => {
    expect(compact).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(compact).toContain("for update");
    expect(compact).toContain(
      "return v_existing.response || jsonb_build_object( 'outcome', 'replayed'",
    );
    expect(compact).toContain("'outcome', 'idempotency_conflict'");
    expect(compact).toContain("'outcome', 'stale_state'");
  });

  it("keeps authenticated direct-update compatibility behind the same authority", () => {
    expect(compact).toContain(
      "create or replace function public.validate_swap_status_transition",
    );
    expect(compact).toContain("v_result := public.transition_swap_status_authoritative");
    expect(compact).toContain("return null");
    expect(compact).toContain(
      "direct privileged swap status updates are forbidden",
    );
  });
});

describe("Batch 61.2 application write boundary", () => {
  const canonicalWriters = [
    "src/app/api/swaps/transition/route.ts",
    "src/lib/swaps/swapActions.ts",
    "src/lib/swaps/swapCompletion.ts",
    "src/lib/state/useSwapActions.ts",
    "src/lib/exchange/exchangeServices.ts",
  ];

  it.each(canonicalWriters)(
    "contains no direct swaps.status update in %s",
    (path) => {
      const source = read(path);
      expect(source).not.toMatch(
        /\.from\(["']swaps["']\)[\s\S]{0,180}?\.update\(\{[\s\S]{0,120}?status\s*:/,
      );
    },
  );

  it("requires expected state and an idempotency key at the canonical route", () => {
    const route = read("src/app/api/swaps/transition/route.ts");
    expect(route).toContain("expectedStatus");
    expect(route).toContain("idempotency-key");
    expect(route).toContain("transitionSwapStatusAuthoritatively");
    expect(route).toContain('case "not_authorized"');
    expect(route).not.toContain('.from("swaps")');
  });

  it("uses the canonical client helper in browser state and exchange services", () => {
    expect(read("src/lib/state/useSwapActions.ts")).toContain(
      "transitionSwapFromClient",
    );
    expect(read("src/lib/exchange/exchangeServices.ts")).toContain(
      "transitionSwapFromClient",
    );
  });

  it("rewrites remaining legacy browser status PATCH requests", () => {
    const client = read("src/lib/supabase/client.ts");
    expect(client).toContain("isSwapsStatusPatchRequest");
    expect(client).toContain("routeLegacySwapStatusPatch");
    expect(client).toContain('globalThis.fetch("/api/swaps/transition"');
    expect(client).toContain("expectedStatus: currentStatus");
    expect(client).toContain("toStatus: body.status");
  });
});
