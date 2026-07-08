import type { AITaskType } from "./taskTypes";

export interface SafeAITaskMetadata {
  taskType: AITaskType;
  locale?: string | null;
  sourceLocale?: string | null;
  targetLocale?: string | null;
  userId?: string | null;
  inputHash?: string | null;
  promptVersion?: string | null;
  fieldCount: number;
  textFieldCount: number;
  imageCount: number;
  hasLocationHint: boolean;
  hasCurrencyHint: boolean;
}

export interface BuildSafeAITaskMetadataInput {
  taskType: AITaskType;
  input: unknown;
  locale?: string | null;
  sourceLocale?: string | null;
  targetLocale?: string | null;
  userId?: string | null;
  inputHash?: string | null;
  promptVersion?: string | null;
}

export function buildSafeAITaskMetadata(request: BuildSafeAITaskMetadataInput): SafeAITaskMetadata {
  const input = isRecord(request.input) ? request.input : {};
  const values = Object.values(input);

  return {
    taskType: request.taskType,
    locale: request.locale ?? readString(input.locale),
    sourceLocale: request.sourceLocale ?? readString(input.sourceLocale),
    targetLocale: request.targetLocale ?? readString(input.targetLocale),
    userId: request.userId ?? null,
    inputHash: request.inputHash ?? null,
    promptVersion: request.promptVersion ?? null,
    fieldCount: Object.keys(input).length,
    textFieldCount: values.filter((value) => typeof value === "string" && value.trim().length > 0).length,
    imageCount: countImages(input),
    hasLocationHint: hasAnyKey(input, ["location", "country", "countryCode", "city", "distanceKm"]),
    hasCurrencyHint: hasAnyKey(input, ["currency", "amount", "price", "value"]),
  };
}

function countImages(input: Record<string, unknown>) {
  const images = input.images;
  if (Array.isArray(images)) return images.length;
  if (typeof input.imageUrl === "string" && input.imageUrl.length > 0) return 1;
  if (typeof input.cloudinaryPublicId === "string" && input.cloudinaryPublicId.length > 0) return 1;
  return 0;
}

function hasAnyKey(input: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
