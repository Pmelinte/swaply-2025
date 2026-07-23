/**
 * E2E-style auth tests: proves that unauthenticated (guest) callers receive
 * HTTP 401 from every route handler that mutates or reads protected data.
 *
 * Strategy: mock `getServerSupabase` to return a Supabase-like client whose
 * `auth.getUser()` resolves with `{ data: { user: null }, error: null }` —
 * exactly what Supabase returns for an expired or absent session cookie.
 *
 * Note: vitest.config has mockReset:true, so mock implementations must be
 * re-applied inside each beforeEach.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as supabaseServer from "@/lib/supabase/server";

// ── Supabase mock ─────────────────────────────────────────────────────────
vi.mock("@/lib/supabase/server");

// next/headers is imported transitively; stub it so it doesn't throw in vitest
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

type ServerSupabaseClient = Awaited<
  ReturnType<typeof supabaseServer.getServerSupabase>
>;

/** A minimal Supabase client stub that reports no authenticated user. */
function guestSupabase(): ServerSupabaseClient {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  } as unknown as ServerSupabaseClient;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function jsonRequest(url: string, body: object): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Guest auth: /api/chat/moderate", () => {
  beforeEach(() => {
    vi.mocked(supabaseServer.getServerSupabase).mockResolvedValue(
      guestSupabase(),
    );
  });

  it("returns 401 when no session is present", async () => {
    const { POST } = await import("@/app/api/chat/moderate/route");
    const res = await POST(
      jsonRequest("http://localhost/api/chat/moderate", { text: "hello" }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });
});

describe("Guest auth: /api/chat/summary", () => {
  beforeEach(() => {
    vi.mocked(supabaseServer.getServerSupabase).mockResolvedValue(
      guestSupabase(),
    );
  });

  it("returns 401 when no session is present", async () => {
    const { POST } = await import("@/app/api/chat/summary/route");
    const res = await POST(
      jsonRequest("http://localhost/api/chat/summary", {
        itemATitle: "Laptop",
        itemBTitle: "Phone",
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });
});

describe("Guest auth: /api/matching/ai", () => {
  beforeEach(() => {
    vi.mocked(supabaseServer.getServerSupabase).mockResolvedValue(
      guestSupabase(),
    );
  });

  it("returns 401 when no session is present", async () => {
    const { POST } = await import("@/app/api/matching/ai/route");
    const res = await POST(
      jsonRequest("http://localhost/api/matching/ai", {
        myItemId: "item-uuid",
      }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });
});

describe("Guest auth: /api/exchange/[swapId]/pdf", () => {
  beforeEach(() => {
    vi.mocked(supabaseServer.getServerSupabase).mockResolvedValue(
      guestSupabase(),
    );
  });

  it("returns 401 when no session is present", async () => {
    const { POST } = await import("@/app/api/exchange/[swapId]/pdf/route");
    const req = new NextRequest(
      "http://localhost/api/exchange/test-swap-id/pdf",
      { method: "POST" },
    );
    const res = await POST(req, {
      params: Promise.resolve({ swapId: "test-swap-id" }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/unauthorized/i);
  });
});
