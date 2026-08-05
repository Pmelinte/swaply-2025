import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reviewAuthority = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260715165000_batch_62_3_review_conflict_status.sql",
  ),
  "utf8",
);

const trustAuthority = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805103000_v1_07_7_feedback_trust_authority.sql",
  ),
  "utf8",
);

describe("V1-07.7 feedback and trust authority", () => {
  it("keeps review submission restricted to completed-swap participants", () => {
    expect(reviewAuthority).toContain("Reviews require a completed swap");
    expect(reviewAuthority).toContain("Actor is not a swap participant");
    expect(reviewAuthority).toContain(
      "swap_id = p_swap_id and reviewer_id = v_actor_id",
    );
  });

  it("keeps review retries idempotent and conflicting payloads fail closed", () => {
    expect(reviewAuthority).toContain("Idempotency key conflict");
    expect(reviewAuthority).toContain(
      "Review already submitted with different content",
    );
    expect(reviewAuthority).toContain("'replayed', true");
  });

  it("attaches trust recalculation to real swap status transitions", () => {
    expect(trustAuthority).toContain(
      "drop trigger if exists swaps_trust_score_trigger on public.swaps",
    );
    expect(trustAuthority).toContain(
      "create trigger swaps_trust_score_trigger",
    );
    expect(trustAuthority).toContain(
      "after update of status on public.swaps",
    );
    expect(trustAuthority).toContain(
      "when (old.status is distinct from new.status)",
    );
    expect(trustAuthority).toContain(
      "execute function public.trigger_trust_score_on_swap()",
    );
  });

  it("recalculates persisted trust after every authoritative swap outcome", () => {
    for (const status of ["completed", "cancelled", "disputed"]) {
      expect(trustAuthority).toContain(`new.status = '${status}'`);
    }

    expect(
      trustAuthority.match(
        /perform public\.calculate_trust_score\(new\.requester_id\);/g,
      ),
    ).toHaveLength(3);
    expect(
      trustAuthority.match(
        /perform public\.calculate_trust_score\(new\.responder_id\);/g,
      ),
    ).toHaveLength(3);
  });

  it("updates counters null-safely and only on a real status transition", () => {
    expect(trustAuthority).toContain(
      "old.status is distinct from 'completed'",
    );
    expect(trustAuthority).toContain(
      "old.status is distinct from 'cancelled'",
    );
    expect(trustAuthority).toContain(
      "old.status is distinct from 'disputed'",
    );
    expect(trustAuthority).toContain("coalesce(swaps_completed, 0) + 1");
    expect(trustAuthority).toContain("coalesce(swaps_cancelled, 0) + 1");
    expect(trustAuthority).toContain("coalesce(swaps_disputed, 0) + 1");
  });

  it("keeps the trigger function non-callable by application roles", () => {
    for (const role of ["public", "anon", "authenticated", "service_role"]) {
      expect(trustAuthority).toContain(
        `revoke all on function public.trigger_trust_score_on_swap() from ${role}`,
      );
    }
  });

  it("does not mix trust with Swapleni or purchasable rank", () => {
    expect(trustAuthority).not.toContain("swapleni");
    expect(trustAuthority).not.toContain("payment");
    expect(trustAuthority).not.toContain("purchase");
  });
});
