import type { AITaskType } from "./taskTypes";

export interface AIModelRegistryEntry {
  provider: string;
  model: string;
  taskTypes: AITaskType[];
  priority: number;
  enabled: boolean;
  notes?: string;
}

export function selectModelsForTask(registry: AIModelRegistryEntry[], taskType: AITaskType): AIModelRegistryEntry[] {
  return registry
    .filter((entry) => entry.enabled && entry.taskTypes.includes(taskType))
    .sort((a, b) => a.priority - b.priority);
}

export const defaultAIModelRegistry: AIModelRegistryEntry[] = [
  {
    provider: "huggingface",
    model: "facebook/bart-large-mnli+unitary/toxic-bert",
    taskTypes: ["classify_item", "moderate_chat"],
    priority: 10,
    enabled: true,
    notes: "Existing server-side provider only; no new provider or cost activation in E1.2.",
  },
];
