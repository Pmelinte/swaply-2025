// src/features/items/validation.ts

import { z } from "zod";

// condițiile posibile pentru obiect
export const itemConditionSchema = z.enum([
  "new",
  "like_new",
  "very_good",
  "good",
  "acceptable",
]);

// schema principală pentru formularul de item (add / edit)
export const itemFormSchema = z.object({
  title: z
    .string({
      required_error: "Titlul este obligatoriu.",
    })
    .min(3, "Titlul trebuie să aibă cel puțin 3 caractere.")
    .max(120, "Titlul nu poate depăși 120 de caractere.")
    .transform((v) => v.trim()),

  description: z
    .string({
      required_error: "Descrierea este obligatorie.",
    })
    .min(10, "Descrierea trebuie să aibă cel puțin 10 caractere.")
    .max(3000, "Descrierea nu poate depăși 3000 de caractere.")
    .transform((v) => v.trim()),

  category: z
    .string({
      required_error: "Categoria este obligatorie.",
    })
    .min(2, "Categoria este prea scurtă.")
    .max(80, "Categoria este prea lungă.")
    .transform((v) => v.trim()),

  subcategory: z
    .string()
    .min(2, "Subcategoria este prea scurtă.")
    .max(80, "Subcategoria este prea lungă.")
    .optional(),

  condition: itemConditionSchema,

  approximateValue: z
    .number()
    .nonnegative("Valoarea nu poate fi negativă.")
    .max(1000000000, "Valoarea este prea mare.")
    .optional(),

  currency: z
    .string()
    .min(1, "Moneda este prea scurtă.")
    .max(10, "Moneda este prea lungă.")
    .optional(),

  images: z
    .array(
      z.object({
        url: z
          .string({
            required_error: "Imaginea trebuie să aibă un URL.",
          })
          .url("URL-ul imaginii nu este valid."),
      })
    )
    .min(1, "Trebuie să adaugi cel puțin o imagine.")
    .optional(),

  // metadata AI este opțională – nu blocăm formularul fără ea
  aiMetadata: z
    .object({
      suggestedTitle: z.string().optional(),
      suggestedCategory: z.string().optional(),
      suggestedSubcategory: z.string().optional(),
    })
    .optional(),
});

export type ItemFormSchema = z.infer<typeof itemFormSchema>;
