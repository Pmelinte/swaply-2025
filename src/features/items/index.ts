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

export * from "./types";
export * from "./validation";

// Server actions (shape stabil)
export * from "./server/item-actions";
export * from "./server/items-actions";

// UI exports (opțional, dar util)
export { default as ItemEditForm } from "./components/ItemEditForm";
export { default as MyItemsList } from "./components/my-items-list";
export { default as ItemRowActions } from "./components/ItemRowActions";
export { ItemForm } from "./components/item-form";
