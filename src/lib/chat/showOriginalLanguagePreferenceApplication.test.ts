import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 66.6 show-original display preference application", () => {
  it("reads the canonical hydrated profile display preference", () => {
    const chatPanel = source("src/features/chat/ChatPanel.tsx");

    expect(chatPanel).toContain(
      'import { getProfileTranslationPreferences } from "@/lib/profile/profileTranslationPreferences"',
    );
    expect(chatPanel).toContain(
      "const { showOriginalLanguage } = getProfileTranslationPreferences(user)",
    );
  });

  it("uses the profile preference only as the initial per-message display policy", () => {
    const chatPanel = source("src/features/chat/ChatPanel.tsx");

    expect(chatPanel).toContain(
      "showOriginal={showOriginalMap[msg.id] ?? showOriginalLanguage}",
    );
    expect(chatPanel).toContain(
      "[messageId]: !(prev[messageId] ?? showOriginalLanguage)",
    );
    expect(chatPanel).toContain("onToggleOriginal={() => toggleShowOriginal(msg.id)}");
  });

  it("keeps the original message authoritative while translation remains optional", () => {
    const chatPanel = source("src/features/chat/ChatPanel.tsx");

    expect(chatPanel).toContain("{msg.content}</p>");
    expect(chatPanel).toContain("translatedText && !showOriginal");
    expect(chatPanel).toContain(
      'showOriginal ? tc("showTranslation") : tc("showOriginal")',
    );
  });
});
