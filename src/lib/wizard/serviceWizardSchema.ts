import { z } from "zod";

export const serviceStep1Schema = z.object({
  service_category_l1: z.string().min(1, "Service category is required"),
  service_title: z.string().min(3, "Title is required (min 3 chars)"),
  service_modality: z.string().min(1, "Modality is required"),
});

export const serviceStep2Schema = z.object({
  service_full_description: z.string().min(50, "Description must be at least 50 characters"),
  experience_level: z.string().min(1, "Experience level is required"),
  provider_type: z.string().min(1, "Provider type is required"),
});

export const serviceStep3Schema = z.object({
  availability_days: z.array(z.string()).min(1, "Select at least one day"),
});

export const serviceStep4Schema = z.object({
  swap_for_type: z.array(z.string()).min(1, "Select at least one swap type"),
  swap_wants_description: z.string().min(1, "Describe what you want in return"),
  perceived_value_tier: z.string().min(1, "Value tier is required"),
});

export const serviceStep5Schema = z.object({
  confirm_authorized: z.literal(true),
  confirm_accurate: z.literal(true),
  confirm_terms: z.literal(true),
});
