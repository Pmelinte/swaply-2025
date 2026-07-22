import type { ServiceFormData } from "./serviceWizardStore";

const optionalArray = (values: string[]) => (values.length > 0 ? values : null);
const optionalString = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function normalizeServiceWizardItemInsert(form: ServiceFormData, ownerId: string) {
  return {
    owner_id: ownerId,
    title: form.service_title.trim(),
    description: form.service_full_description.trim(),
    category: "service",
    condition: "good",
    status: "active",
    item_type: "service",
    wizard_type: "service",
    wizard_step: 5,
    swap_open_to: optionalArray(form.swap_for_type),
    swap_wants_description: optionalString(form.swap_wants_description),
    swap_value_match: optionalString(form.swap_value_match),
    swap_geo_preference: optionalString(form.swap_geo_preference),
    swap_chain_allowed: form.chain_swap_allowed,
    cross_category_swap: form.cross_category_swap,
    swap_partial_allowed: form.swap_partial_allowed,
    swap_partial_topup_eur: form.swap_partial_topup_eur ? parseFloat(form.swap_partial_topup_eur) : null,
    perceived_value_tier: optionalString(form.perceived_value_tier),
    service_data: {
      service_category_l1: form.service_category_l1,
      service_category_l2: optionalString(form.service_category_l2),
      service_category_l3: optionalString(form.service_category_l3),
      service_title: form.service_title.trim(),
      service_short_description: optionalString(form.service_short_description),
      service_modality: form.service_modality,
      service_full_description: form.service_full_description.trim(),
      experience_years: form.experience_years,
      experience_level: form.experience_level,
      certifications: optionalArray(form.certifications),
      languages_service: optionalArray(form.languages_service),
      portfolio_urls: optionalArray(form.portfolio_urls),
      portfolio_images: optionalArray(form.portfolio_images),
      provider_type: form.provider_type,
      availability_days: form.availability_days,
      availability_time_of_day: optionalArray(form.availability_time_of_day),
      service_duration: optionalArray(form.service_duration),
      available_from_date: optionalString(form.available_from_date),
      available_until_date: optionalString(form.available_until_date),
      advance_notice_days: form.advance_notice_days,
      urgent_available: form.urgent_available,
      recurring_possible: form.recurring_possible,
      recurring_frequency: optionalArray(form.recurring_frequency),
      escrow_accepted: form.escrow_accepted,
      swap_geo_radius_km: form.swap_geo_radius_km,
    },
  };
}
