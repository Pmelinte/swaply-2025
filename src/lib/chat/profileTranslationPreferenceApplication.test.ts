import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 66.5 profile translation preference application", () => {
  it("hydrates both canonical database preference fields", () => {
    const mappers = source("src/lib/state/mappers.ts");

    expect(mappers).toContain("data.auto_translate_messages");
    expect(mappers).toContain("data.show_original_language");
    expect(mappers).toContain("translationPreferences:");
  });

  it("seeds automatic translation once per conversation without enforcing it", () => {
    const chatClient = source("src/app/[locale]/chat/ChatClient.tsx");

    expect(chatClient).toContain("translationPreferenceSeededRef");
    expect(chatClient).toContain("getProfileTranslationPreferences(user)");
    expect(chatClient).toContain("if (!user?.id || !autoTranslateMessages) return");
    expect(chatClient).toContain("if (!conversation.translationEnabled)");
    expect(chatClient).toContain("toggleConversationTranslation(conversation.id)");
    expect(chatClient).not.toContain("conversations.map((conversation) => ({ ...conversation, translationEnabled: true");
  });

  it("keeps manual translation toggles available after the initial seed", () => {
    const chatClient = source("src/app/[locale]/chat/ChatClient.tsx");

    expect(chatClient).toContain("translationPreferenceSeededRef.current.has(conversation.id)");
    expect(chatClient).toContain("translationPreferenceSeededRef.current.add(conversation.id)");
    expect(chatClient).toContain("toggleConversationTranslation");
  });
});
