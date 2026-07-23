import { beforeEach, describe, expect, it, vi } from "vitest";

const authGetUser = vi.fn();
const maybeSingle = vi.fn();
const single = vi.fn();
const rpc = vi.fn();
const selectAfterInsert = vi.fn(() => ({ single }));
const insert = vi.fn(() => ({ select: selectAfterInsert }));
const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));
const prefMaybeSingle = vi.fn();
const prefEq = vi.fn(() => ({ maybeSingle: prefMaybeSingle }));
const prefSelect = vi.fn(() => ({ eq: prefEq }));
const notificationInsert = vi.fn();
const eqConversation = vi.fn(() => ({ maybeSingle }));
const selectConversation = vi.fn(() => ({ eq: eqConversation }));
const from = vi.fn((table: string) => {
  if (table === "conversations") {
    return { select: selectConversation, update };
  }
  if (table === "messages") {
    return { insert };
  }
  if (table === "notification_preferences") {
    return { select: prefSelect };
  }
  if (table === "notifications") {
    return { insert: notificationInsert };
  }
  throw new Error(`unexpected table ${table}`);
});

vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: vi.fn(async () => ({
    auth: { getUser: authGetUser },
    from,
    rpc,
  })),
}));

function request(body: unknown) {
  return new Request("http://localhost/api/chat/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authGetUser.mockResolvedValue({ data: { user: { id: "user-a" } } });
    maybeSingle.mockResolvedValue({
      data: {
        id: "conv-1",
        swap_id: "swap-1",
        match_id: null,
        participant_ids: ["user-a", "user-b"],
      },
      error: null,
    });
    single.mockResolvedValue({
      data: { id: "msg-1", content: "hello", sender_id: "user-a" },
      error: null,
    });
    rpc.mockResolvedValue({ data: true, error: null });
    prefMaybeSingle.mockResolvedValue({ data: null, error: null });
    notificationInsert.mockResolvedValue({ data: null, error: null });
    updateEq.mockResolvedValue({ data: null, error: null });
  });

  it("derives sender and recipient server-side for a participant", async () => {
    const { POST } = await import("@/app/api/chat/messages/route");
    const res = await POST(request({
      conversationId: "conv-1",
      content: "hello",
      sender_id: "spoofed-user",
      recipient_id: "spoofed-recipient",
    }));

    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      conversation_id: "conv-1",
      sender_id: "user-a",
      recipient_id: "user-b",
      content: "hello",
      message_type: "text",
    }));
    expect(rpc).toHaveBeenCalledWith("can_users_chat_v1", {
      p_participant_a: "user-a",
      p_participant_b: "user-b",
    });
  });

  it("refuses outsiders before inserting", async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: "outsider" } } });
    const { POST } = await import("@/app/api/chat/messages/route");
    const res = await POST(request({ conversationId: "conv-1", content: "hello" }));

    expect(res.status).toBe(403);
    expect(insert).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(notificationInsert).not.toHaveBeenCalled();
  });

  it("refuses blocked participants without insert or notification", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const { POST } = await import("@/app/api/chat/messages/route");
    const res = await POST(request({ conversationId: "conv-1", content: "hello" }));

    expect(res.status).toBe(403);
    expect(insert).not.toHaveBeenCalled();
    expect(notificationInsert).not.toHaveBeenCalled();
  });

  it("refuses chat when the block RPC errors without insert or notification", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "rpc unavailable" } });
    const { POST } = await import("@/app/api/chat/messages/route");
    const res = await POST(request({ conversationId: "conv-1", content: "hello" }));

    expect(res.status).toBe(403);
    expect(insert).not.toHaveBeenCalled();
    expect(notificationInsert).not.toHaveBeenCalled();
  });

  it("rejects overlong content before insert", async () => {
    const { POST } = await import("@/app/api/chat/messages/route");
    const res = await POST(request({
      conversationId: "conv-1",
      content: "x".repeat(4001),
    }));

    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
});
