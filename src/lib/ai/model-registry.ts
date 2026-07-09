import type { AITaskType } from "./taskTypes";

export interface AIModelRegistryEntry {
  provider: string;
  model: string;
  taskTypes: AITaskType[];
  priority: number;
  enabled: boolean;
  notes?: string;
}

export function selectModelsForTask(
  registry: AIModelRegistryEntry[],
  taskType: AITaskType,
): AIModelRegistryEntry[] {
  return registry
    .filter((entry) => entry.enabled && entry.taskTypes.includes(taskType))
    .sort((a, b) => a.priority - b.priority);
}

export const defaultAIModelRegistry: AIModelRegistryEntry[] = [];
