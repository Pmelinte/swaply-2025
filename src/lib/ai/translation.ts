import type { AIGateway } from "./gateway";
import type {
  TranslateTextRequest,
  TranslateTextResult,
  TranslationProposal,
} from "./contracts";

export async function proposeTranslation(
  gateway: AIGateway,
  request: TranslateTextRequest,
): Promise<TranslationProposal> {
  const text = request.text.trim();
  if (!text) throw new Error("translation_text_required");

  if (request.sourceLocale === request.targetLocale) {
    return {
      text,
      originalText: text,
      translatedText: text,
      sourceLocale: request.sourceLocale,
      targetLocale: request.targetLocale,
      source: "fallback",
      status: "same_language",
      requiresHumanConfirmation: true,
      warning: "Source and target locale are identical; original text was preserved.",
    };
  }

  const result = await gateway.run<TranslateTextRequest, TranslateTextResult>({
    taskType: "translate",
    input: { ...request, text },
    locale: request.targetLocale,
  });

  if (!result.output) {
    throw new Error(result.errorCode ?? "translation_failed");
  }

  const translatedText = result.output.translatedText ?? result.output.text;
  const originalText = result.output.originalText ?? text;
  const sourceLocale = result.output.sourceLocale ?? request.sourceLocale;
  const targetLocale = result.output.targetLocale ?? request.targetLocale;

  return {
    text: translatedText,
    originalText,
    translatedText,
    sourceLocale,
    targetLocale,
    source: result.output.source,
    warning: result.output.warning,
    status: result.output.source === "ai" && result.status === "ok" ? "translated" : "fallback",
    requiresHumanConfirmation: true,
  };
}
