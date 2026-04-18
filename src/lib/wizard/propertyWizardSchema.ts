import { z } from "zod";

export const step1Schema = z.object({
  property_type: z.string().min(1, "Property type is required"),
  property_category: z.string().min(1, "Property category is required"),
});

export const step2Schema = z.object({
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
});

export const step3Schema = z.object({
  total_area_sqm: z.string().min(1, "Total area is required"),
});

export const step4Schema = z.object({
  furnishing_level: z.string().min(1, "Furnishing level is required"),
});

export const step5Schema = z.object({});

export const step6Schema = z.object({
  exchange_type: z.string().min(1, "Exchange type is required"),
  desired_exchange_description: z.string().min(1, "Please describe what you are looking for in return"),
});

export const step7Schema = z.object({
  check_in_time: z.string().min(1, "Check-in time is required"),
  check_out_time: z.string().min(1, "Check-out time is required"),
});

export const step8Schema = z.object({
  confirm_vacation_only: z.literal(true, { errorMap: () => ({ message: "You must confirm vacation-only use" }) }),
  confirm_accurate_info: z.literal(true, { errorMap: () => ({ message: "You must confirm the information is accurate" }) }),
  confirm_terms: z.literal(true, { errorMap: () => ({ message: "You must accept the Terms of Use" }) }),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step8Data = z.infer<typeof step8Schema>;
