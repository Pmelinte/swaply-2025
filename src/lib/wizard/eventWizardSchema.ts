import { z } from "zod";

export const eventStep1Schema = z.object({
  event_title: z.string().min(3, "Title is required"),
  event_type_l1: z.string().min(1, "Event type is required"),
});

export const eventStep2Schema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  event_description: z.string().min(20, "Description must be at least 20 characters"),
});

export const eventStep3Schema = z.object({
  capacity_total: z.number().min(1, "Capacity must be at least 1"),
});

export const eventStep4Schema = z.object({
  swap_for_type: z.array(z.string()).min(1, "Select at least one swap type"),
  swap_wants_description: z.string().min(1, "Describe what you want in return"),
  perceived_value_tier: z.string().min(1, "Value tier is required"),
});

export const eventStep5Schema = z.object({
  confirm_authorized: z.literal(true),
  confirm_accurate: z.literal(true),
  confirm_terms: z.literal(true),
});
