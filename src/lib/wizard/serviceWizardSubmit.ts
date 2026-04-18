import { getSupabaseClient } from "@/lib/supabase/client";
import type { ServiceFormData } from "./serviceWizardStore";

export async function submitServiceWizard(
  form: ServiceFormData,
  userId: string,
): Promise<{ id: string }[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not available");

  const { data, error } = await supabase
    .from("items")
    .insert({
      owner_id: userId,
      title: form.service_title.trim(),
      description: form.service_full_description.trim(),
      category: "service",
      condition: "good",
      status: "active",
      item_type: "service",
      wizard_type: form.service_category_l1 || "service",
      wizard_step: 5,
      swap_open_to: form.swap_for_type.length > 0 ? form.swap_for_type : null,
      swap_wants_description: form.swap_wants_description || null,
      swap_value_match: form.swap_value_match || null,
      swap_geo_preference: form.swap_geo_preference || null,
      swap_chain_allowed: form.chain_swap_allowed,
      cross_category_swap: form.cross_category_swap,
      swap_partial_allowed: form.swap_partial_allowed,
      swap_partial_topup_eur: form.swap_partial_topup_eur
        ? parseFloat(form.swap_partial_topup_eur)
        : null,
      perceived_value_tier: form.perceived_value_tier || null,
      service_data: {
        // Step 1
        service_category_l1: form.service_category_l1,
        service_category_l2: form.service_category_l2 || null,
        service_category_l3: form.service_category_l3 || null,
        service_title: form.service_title,
        service_short_description: form.service_short_description || null,
        service_modality: form.service_modality,
        // Step 2
        service_full_description: form.service_full_description,
        experience_years: form.experience_years,
        experience_level: form.experience_level,
        certifications: form.certifications.length > 0 ? form.certifications : null,
        languages_service: form.languages_service.length > 0 ? form.languages_service : null,
        portfolio_urls: form.portfolio_urls.length > 0 ? form.portfolio_urls : null,
        portfolio_images: form.portfolio_images.length > 0 ? form.portfolio_images : null,
        provider_type: form.provider_type,
        // Step 3
        availability_days: form.availability_days,
        availability_time_of_day: form.availability_time_of_day.length > 0 ? form.availability_time_of_day : null,
        service_duration: form.service_duration.length > 0 ? form.service_duration : null,
        available_from_date: form.available_from_date || null,
        available_until_date: form.available_until_date || null,
        advance_notice_days: form.advance_notice_days,
        urgent_available: form.urgent_available,
        recurring_possible: form.recurring_possible,
        recurring_frequency: form.recurring_frequency.length > 0 ? form.recurring_frequency : null,
        // Step 4
        escrow_accepted: form.escrow_accepted,
        swap_geo_radius_km: form.swap_geo_radius_km,
      },
    })
    .select("id");

  if (error) throw error;
  return (data as { id: string }[]) ?? [];
}
