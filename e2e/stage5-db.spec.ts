import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_MATCH_ID = process.env.SWAPLY_DEMO_MATCH_ID;
const DEMO_SWAP_ID = process.env.SWAPLY_DEMO_SWAP_ID;
const DEMO_CONVERSATION_ID = process.env.SWAPLY_DEMO_CONVERSATION_ID;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

test.describe("Stage 5 database contracts", () => {
  test("required exchange tables are reachable", async () => {
    const supabase = getAdminClient();
    test.skip(!supabase, "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run DB contract tests.");

    const tables = ["matches", "swaps", "conversations", "messages", "notifications", "items", "profiles"];
    for (const table of tables) {
      const { error } = await supabase!.from(table).select("*", { count: "exact", head: true });
      expect(error, `${table} should be queryable`).toBeNull();
    }
  });

  test("demo match has Stage 5 fields when provided", async () => {
    const supabase = getAdminClient();
    test.skip(!supabase || !DEMO_MATCH_ID, "Set Supabase service credentials and SWAPLY_DEMO_MATCH_ID.");

    const { data, error } = await supabase!
      .from("matches")
      .select("id, initiator_id, target_user_id, initiator_item_id, target_item_id, status, ai_score, converted_swap_id")
      .eq("id", DEMO_MATCH_ID!)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe(DEMO_MATCH_ID);
    expect(data?.initiator_id).toBeTruthy();
    expect(data?.target_user_id).toBeTruthy();
    expect(data?.target_item_id).toBeTruthy();
    expect(data?.status).toBeTruthy();
  });

  test("demo swap has conversation and completion fields when provided", async () => {
    const supabase = getAdminClient();
    test.skip(!supabase || !DEMO_SWAP_ID, "Set Supabase service credentials and SWAPLY_DEMO_SWAP_ID.");

    const { data, error } = await supabase!
      .from("swaps")
      .select("id, requester_id, responder_id, offered_item_id, requested_item_id, status, conversation_id")
      .eq("id", DEMO_SWAP_ID!)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.id).toBe(DEMO_SWAP_ID);
    expect(data?.requester_id).toBeTruthy();
    expect(data?.responder_id).toBeTruthy();
    expect(data?.status).toBeTruthy();
  });

  test("demo conversation can load messages when provided", async () => {
    const supabase = getAdminClient();
    test.skip(!supabase || !DEMO_CONVERSATION_ID, "Set Supabase service credentials and SWAPLY_DEMO_CONVERSATION_ID.");

    const { data: conversation, error: conversationError } = await supabase!
      .from("conversations")
      .select("id, swap_id, participant_ids, item_ids, status")
      .eq("id", DEMO_CONVERSATION_ID!)
      .maybeSingle();

    expect(conversationError).toBeNull();
    expect(conversation?.id).toBe(DEMO_CONVERSATION_ID);
    expect(Array.isArray(conversation?.participant_ids)).toBe(true);

    const { error: messagesError } = await supabase!
      .from("messages")
      .select("id, content, sender_id, recipient_id, conversation_id", { count: "exact", head: true })
      .eq("conversation_id", DEMO_CONVERSATION_ID!);

    expect(messagesError).toBeNull();
  });
});
