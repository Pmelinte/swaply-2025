import type { AIGateway } from "./gateway";
import type {
  ClassifyItemRequest,
  ClassifyItemResult,
  GenerateItemDescriptionRequest,
  GenerateItemDescriptionResult,
  ItemEnrichmentProposal,
  ItemEnrichmentRequest,
} from "./contracts";

export async function proposeItemEnrichment(
  gateway: AIGateway,
  request: ItemEnrichmentRequest,
): Promise<ItemEnrichmentProposal> {
  const originalTitle = request.title?.trim() ?? "";
  const originalDescription = request.description?.trim() ?? "";

  const classificationRequest: ClassifyItemRequest = {
    titleHint: originalTitle || undefined,
    descriptionHint: originalDescription || undefined,
    images: request.images,
    locale: request.locale,
  };

  const classification = await gateway.run<ClassifyItemRequest, ClassifyItemResult>({
    taskType: "classify_item",
    input: classificationRequest,
    locale: request.locale,
  });

  if (!classification.output) {
    throw new Error(classification.errorCode ?? "item_classification_failed");
  }

  const classified = classification.output;
  const baseTitle = originalTitle || humanizeCategory(classified.subcategory ?? classified.category);
  const descriptionRequest: GenerateItemDescriptionRequest = {
    title: baseTitle,
    category: classified.category,
    subcategory: classified.subcategory,
    condition: request.condition,
    userNotes: originalDescription || null,
    locale: request.locale,
  };

  const description = await gateway.run<GenerateItemDescriptionRequest, GenerateItemDescriptionResult>({
    taskType: "generate_item_description",
    input: descriptionRequest,
    locale: request.locale,
  });

  if (!description.output) {
    throw new Error(description.errorCode ?? "item_description_failed");
  }

  const generated = description.output;
  const warnings = buildWarnings(request, classified, classification.status, description.status);

  return {
    suggestedTitle: generated.title,
    suggestedDescription: generated.description,
    suggestedCategory: classified.category,
    suggestedSubcategory: classified.subcategory,
    suggestedTags: uniqueTags([...classified.tags, ...generated.tags]),
    confidence: classified.confidence,
    classificationSource: classified.source,
    descriptionSource: generated.source,
    requiresHumanConfirmation: true,
    warnings,
  };
}

function buildWarnings(
  request: ItemEnrichmentRequest,
  classification: ClassifyItemResult,
  classificationStatus: string,
  descriptionStatus: string,
) {
  const warnings: string[] = [];

  if (classification.source === "fallback" || classificationStatus !== "ok") {
    warnings.push("Classification used a fallback and must be reviewed carefully.");
  }
  if (descriptionStatus !== "ok") {
    warnings.push("Description used a deterministic fallback.");
  }
  if (request.images?.length && classification.source === "fallback") {
    warnings.push("Images were not analysed by an active vision provider.");
  }
  if (classification.confidence < 0.6) {
    warnings.push("Classification confidence is below the automatic-suggestion threshold.");
  }

  return warnings;
}

function humanizeCategory(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 8);
}