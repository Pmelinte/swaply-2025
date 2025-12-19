// src/features/items/index.ts

/**
 * Public entrypoint pentru feature-ul Items.
 *
 * Scop:
 * - o singură cale de import în restul aplicației
 * - eliminăm importuri “legacy” care rup build-ul când mutăm fișiere
 *
 * Regula: restul proiectului importă DOAR din "@/features/items"
 */

// Types (source of truth)
export * from "./types";

// Validation (export explicit ca să evităm coliziuni gen ItemFormData)
export {
  itemFormSchema,
  itemImageSchema,
  itemConditionValues,
  itemConditionLabels,
  normalizeItemFormData,
} from "./validation";

// Server actions (shape stabil)
export * from "./server/item-actions";
export * from "./server/items-actions";

// UI exports (opțional, dar util)
export { default as ItemEditForm } from "./components/ItemEditForm";
export { default as MyItemsList } from "./components/my-items-list";
export { default as ItemRowActions } from "./components/ItemRowActions";
export { ItemForm } from "./components/item-form";
