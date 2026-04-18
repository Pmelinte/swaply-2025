import { getSupabaseClient } from "@/lib/supabase/client";
import type { EventFormData } from "./eventWizardStore";

export async function submitEventWizard(
  form: EventFormData,
  userId: string,
): Promise<{ id: string }[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not available");

  const { data, error } = await supabase
    .from("items")
    .insert({
      owner_id: userId,
      title: form.event_title.trim(),
      description: form.event_description.trim(),
      category: "event",
      condition: "good",
      status: "active",
      item_type: "event",
      wizard_type: form.event_type_l1 || "event",
      wizard_step: 5,
      swap_open_to: form.swap_for_type.join(","),
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
      event_data: {
        // Step 1
        event_title: form.event_title,
        event_type_l1: form.event_type_l1,
        event_type_l2: form.event_type_l2 || null,
        is_online: form.is_online,
        // Step 2
        start_date: form.start_date || null,
        start_time: form.start_time || null,
        end_date: form.end_date || null,
        end_time: form.end_time || null,
        timezone: form.timezone || null,
        season: form.season.length > 0 ? form.season : null,
        recurrence: form.recurrence,
        event_description: form.event_description,
        language_of_event: form.language_of_event.length > 0 ? form.language_of_event : null,
        country: form.country || null,
        region: form.region || null,
        city: form.city || null,
        venue_name: form.venue_name || null,
        lat: form.lat ? parseFloat(form.lat) : null,
        lon: form.lon ? parseFloat(form.lon) : null,
        location_type: form.location_type || null,
        route_type: form.route_type || null,
        route_start_city: form.route_start_city || null,
        route_end_city: form.route_end_city || null,
        route_waypoints: form.route_waypoints || null,
        route_total_km: form.route_total_km ? parseFloat(form.route_total_km) : null,
        route_gpx_url: form.route_gpx_url || null,
        transport_mode: form.transport_mode || null,
        booking_reference: form.booking_reference || null,
        departure_city: form.departure_city || null,
        arrival_city: form.arrival_city || null,
        seat_class: form.seat_class || null,
        seats_available: form.seats_available,
        face_value_eur: form.face_value_eur ? parseFloat(form.face_value_eur) : null,
        is_transferable: form.is_transferable,
        baggage_included: form.baggage_included,
        rail_pass_type: form.rail_pass_type || null,
        rail_pass_days_remaining: form.rail_pass_days_remaining,
        sport_type: form.sport_type || null,
        competition_name: form.competition_name || null,
        venue_sector: form.venue_sector || null,
        venue_row: form.venue_row || null,
        seat_number: form.seat_number || null,
        hospitality_included: form.hospitality_included,
        // Step 3
        capacity_total: form.capacity_total,
        capacity_available: form.capacity_available,
        group_size_min: form.group_size_min,
        group_size_max: form.group_size_max,
        age_restriction: form.age_restriction,
        age_min: form.age_min ? parseInt(form.age_min) : null,
        kid_friendly: form.kid_friendly,
        pet_friendly: form.pet_friendly,
        includes_accommodation: form.includes_accommodation,
        includes_transport: form.includes_transport,
        includes_meals: form.includes_meals,
        includes_equipment: form.includes_equipment,
        equipment_list: form.equipment_list || null,
        dress_code: form.dress_code || null,
        id_required: form.id_required,
        booking_deadline_date: form.booking_deadline_date || null,
        advance_booking_months: form.advance_booking_months,
        // Step 4
        escrow_accepted: form.escrow_accepted,
        exchange_points: form.exchange_points ? parseFloat(form.exchange_points) : null,
      },
    })
    .select("id");

  if (error) throw error;
  return (data as { id: string }[]) ?? [];
}
