import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260731130000_v1_04_3_fix_message_activity_trigger.sql",
  ),
  "utf8",
);

describe("V1-04.3 message activity trigger", () => {
  it("uses only the current messages.conversation_id column", () => {
    expect(migration).toContain("new.conversation_id");
    expect(migration).not.toContain("struct_conv_id");
  });

  it("casts the text conversation id safely and updates the canonical conversation", () => {
    expect(migration).toMatch(/new\.conversation_id::uuid/i);
    expect(migration).toMatch(/when\s+invalid_text_representation/i);
    expect(migration).toMatch(/update\s+public\.conversations/i);
    expect(migration).toMatch(/where\s+id\s*=\s*v_conversation_id/i);
  });

  it("keeps direct trigger execution unavailable to application roles", () => {
    expect(migration).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.touch_conversation_activity_from_message_v1\(\)\s+from\s+public,\s*anon,\s*authenticated/i,
    );
  });
});
