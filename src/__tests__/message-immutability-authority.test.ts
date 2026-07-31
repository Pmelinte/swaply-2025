import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260731033000_v1_04_2b4_message_immutability.sql",
  "utf8",
);
const translationRoute = readFileSync(
  "src/app/api/messages/[id]/translate/route.ts",
  "utf8",
);

describe("message immutability authority", () => {
  it("blocks deletion and protects every field except read receipts and translation cache", () => {
    expect(migration).toContain("message_delete_forbidden");
    expect(migration).toContain("message_content_immutable");
    expect(migration).toContain("message_metadata_immutable");
    expect(migration).toContain("message_read_receipt_recipient_required");
    expect(migration).toContain("before update or delete on public.messages");
    expect(migration).toContain("array['is_read', 'read_at', 'metadata']");
    expect(migration).toContain("array['translations', 'detected_language']");
  });

  it("keeps the active translation cache inside the permitted metadata keys", () => {
    expect(translationRoute).toContain("mergeTranslationMetadata");
    expect(translationRoute).toContain("update({ metadata: nextMetadata })");
    expect(translationRoute).not.toMatch(/update\(\{[^}]*content:/s);
    expect(translationRoute).not.toMatch(/\.delete\(\)/);
  });
});
