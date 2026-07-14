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

describe("Batch 61.2 authoritative transition migration", () => {
  const sql = readFileSync(migrationPath, "utf8");
  const compact = normalized(sql);

  it("creates an internal idempotency ledger with one key per actor and swap", () => {
    expect(compact).toContain(
      "create table if not exists public.swap_transition_requests",
    );
    expect(compact).toContain(
      "unique (swap_id, actor_id, idempotency_key)",
    );
    expect(compact).toContain("replay_count integer not null default 0");
    expect(compact).toContain(
      "alter table public.swap_transition_requests enable row level security",
    );
  });

  it("keeps the ledger and authority RPC unavailable to browser roles", () => {
    expect(compact).toContain(
      "revoke all on table public.swap_transition_requests from public, anon, authenticated",
    );
    expect(compact).toContain(
      "grant all on table public.swap_transition_requests to service_role",
    );
    expect(compact).toContain(
      "revoke execute on function public.transition_swap_status_authoritative",
    );
    expect(compact).toContain(
      ") from public, anon, authenticated",
    );
    expect(compact).toContain(") to service_role");
  });

  it("rejects direct status writes and forces new swaps to start pending", () => {
    expect(compact).toContain(
      "create trigger aaa_require_swap_transition_authority before update of status on public.swaps",
    );
    expect(compact).toContain("direct swap status updates are forbidden");
    expect(compact).toContain(
      "requester_id = (select auth.uid()) and status = 'pending'",
    );
  });

  it("performs participant-role resolution and expected-state CAS under a row lock", () => {
    expect(compact).toContain(
      "from public.swaps as swap where swap.id = p_swap_id for update",
    );
    expect(compact).toContain("if v_swap.requester_id = p_actor_id then");
    expect(compact).toContain("v_actor_role := 'requester'");
    expect(compact).toContain("v_actor_role := 'responder'");
    expect(compact).toContain("if v_swap.status <> p_expected_status then");
    expect(compact).toContain(
      "where id = p_swap_id and status = p_expected_status returning * into v_swap",
    );
  });

  it("sets the authority guard and records one transition result atomically", () => {
    expect(compact).toContain(
      "perform set_config('swaply.swap_transition_authority', 'on', true)",
    );
    expect(compact).toContain("'authorityversion', 'batch-61.2'");
    expect(compact).toContain("insert into public.swap_transition_requests");
    expect(compact).toContain(
      "return v_existing.result || jsonb_build_object",
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

  it("rewrites any remaining legacy browser status PATCH before it reaches PostgREST", () => {
    const client = read("src/lib/supabase/client.ts");
    expect(client).toContain("isSwapsStatusPatchRequest");
    expect(client).toContain("routeLegacySwapStatusPatch");
    expect(client).toContain('globalThis.fetch("/api/swaps/transition"');
    expect(client).toContain("expectedStatus: currentStatus");
    expect(client).toContain("toStatus: body.status");
  });
});
