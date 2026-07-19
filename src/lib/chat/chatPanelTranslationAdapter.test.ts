import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 66.4 chat panel translation adapter", () => {
  it("routes translation through the shared failure-safe helper", () => {
    const chatPanel = source("src/features/chat/ChatPanel.tsx");

    expect(chatPanel).toContain('from "@/lib/chat/chatTranslation"');
    expect(chatPanel).toContain("translateMessage(msg.content, targetLang)");
    expect(chatPanel).toContain("likelyNeedsTranslation(msg.content, targetLang)");
    expect(chatPanel).not.toContain('fetch("/api/translate"');
  });

  it("keeps the original authoritative and renders a successful translation separately", () => {
    const chatPanel = source("src/features/chat/ChatPanel.tsx");
    const original = '<p className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">{msg.content}</p>';
    const translated = "{translatedText && !showOriginal ? (";

    expect(chatPanel).toContain(original);
    expect(chatPanel).toContain(translated);
    expect(chatPanel.indexOf(original)).toBeLessThan(chatPanel.indexOf(translated));
    expect(chatPanel).toContain('translationResult?.status === "translated"');
  });

  it("auto-translates only eligible incoming text and keeps retry available after failure", () => {
    const chatPanel = source("src/features/chat/ChatPanel.tsx");

    expect(chatPanel).toContain("!isMe && !isLocation && likelyNeedsTranslation");
    expect(chatPanel).toContain("translationEnabled && canTranslate && !translationAttempted");
    expect(chatPanel).toContain('setTranslationFailed(result.status === "fallback")');
    expect(chatPanel).toContain("setTranslationFailed(true)");
    expect(chatPanel).toContain("{translationFailed ? (");
    expect(chatPanel).toContain("onClick={() => void handleTranslate()}");
  });
});
