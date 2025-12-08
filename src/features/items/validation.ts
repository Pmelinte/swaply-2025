// src/features/items/validation.ts

import { z } from "zod";

// Schema minimă pentru item, doar ca să fie fișierul valid
export const itemFormSchema = z.object({});

export type ItemFormSchema = z.infer<typeof itemFormSchema>;
