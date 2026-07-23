import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as supabaseServer from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server");
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}));

type ServerSupabaseClient = Awaited<ReturnType<typeof supabaseServer.getServerSupabase>>;

function request(body: object): NextRequest {
  return new NextRequest("http://localhost/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/favorites", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("denies unauthenticated favorite writes", async () => {
    vi.mocked(supabaseServer.getServerSupabase).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as unknown as ServerSupabaseClient);

    const { POST } = await import("@/app/api/favorites/route");
    const res = await POST(request({ itemId: "12345678", favorite: true }));

    expect(res.status).toBe(401);
  });

  it("derives user_id from the server session and ignores client user_id", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabaseServer.getServerSupabase).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "server-user" } } }) },
      from: vi.fn(() => ({ upsert })),
    } as unknown as ServerSupabaseClient);

    const { POST } = await import("@/app/api/favorites/route");
    const res = await POST(request({ itemId: "item-12345678", favorite: true, user_id: "client-user" }));

    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      { user_id: "server-user", item_id: "item-12345678" },
      { onConflict: "user_id,item_id" },
    );
  });
});
