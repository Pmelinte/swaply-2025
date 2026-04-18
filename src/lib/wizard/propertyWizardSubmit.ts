import { getSupabaseClient } from "@/lib/supabase/client";
import type { PropertyFormData } from "./propertyWizardStore";

export async function submitPropertyWizard(
  form: PropertyFormData,
  userId: string,
): Promise<{ id: string }[]> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not available");

  const title =
    [form.property_type, form.city || form.country].filter(Boolean).join(" in ") ||
    "Property listing";

  const { data, error } = await supabase
    .from("items")
    .insert({
      owner_id: userId,
      title,
      description: form.desired_exchange_description || "",
      category: "property",
      condition: "good",
      status: "active",
      item_type: "property",
      wizard_type: "property",
      wizard_step: 8,
      swap_geo_preference: form.swap_geo_preference || null,
      swap_wants_description: form.desired_exchange_description || null,
      swap_chain_allowed: form.chain_swap_allowed,
      cross_category_swap: form.cross_category_swap,
      swap_partial_allowed: form.swap_partial_allowed,
      swap_partial_topup_eur: form.swap_partial_topup_eur
        ? parseFloat(form.swap_partial_topup_eur)
        : null,
      property_data: {
        // Step 1
        property_type: form.property_type,
        property_subtype: form.property_subtype || null,
        property_category: form.property_category,
        year_built: form.year_built ? parseInt(form.year_built) : null,
        last_renovated: form.last_renovated ? parseInt(form.last_renovated) : null,
        renovation_details: form.renovation_details || null,
        // Step 2
        country: form.country,
        region: form.region || null,
        city: form.city,
        address_line1: form.address_line1 || null,
        lat: form.lat ? parseFloat(form.lat) : null,
        lon: form.lon ? parseFloat(form.lon) : null,
        location_type: form.location_type.length > 0 ? form.location_type : null,
        proximity_sea_km: form.proximity_sea_km ? parseFloat(form.proximity_sea_km) : null,
        proximity_mountain_km: form.proximity_mountain_km ? parseFloat(form.proximity_mountain_km) : null,
        proximity_forest_km: form.proximity_forest_km ? parseFloat(form.proximity_forest_km) : null,
        distance_to_center_km: form.distance_to_center_km ? parseFloat(form.distance_to_center_km) : null,
        nearest_airport_code: form.nearest_airport_code || null,
        // Step 3
        total_buildings: form.total_buildings,
        building_condition: form.building_condition || null,
        construction_material: form.construction_material.length > 0 ? form.construction_material : null,
        floor_count: form.floor_count,
        property_floor: form.property_floor,
        has_elevator: form.has_elevator,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        toilets_extra: form.toilets_extra,
        living_rooms: form.living_rooms,
        kitchen_count: form.kitchen_count,
        office_rooms: form.office_rooms,
        storage_rooms: form.storage_rooms,
        total_area_sqm: form.total_area_sqm ? parseFloat(form.total_area_sqm) : null,
        living_area_sqm: form.living_area_sqm ? parseFloat(form.living_area_sqm) : null,
        garden_area_sqm: form.garden_area_sqm ? parseFloat(form.garden_area_sqm) : null,
        terrace_area_sqm: form.terrace_area_sqm ? parseFloat(form.terrace_area_sqm) : null,
        pool_area_sqm: form.pool_area_sqm ? parseFloat(form.pool_area_sqm) : null,
        // Step 4
        has_swimming_pool: form.has_swimming_pool,
        pool_type: form.pool_type || null,
        has_hot_tub: form.has_hot_tub,
        has_sauna: form.has_sauna,
        has_gym: form.has_gym,
        has_tennis_court: form.has_tennis_court,
        has_playground: form.has_playground,
        has_bbq_area: form.has_bbq_area,
        outdoor_fireplace: form.outdoor_fireplace,
        outdoor_kitchen: form.outdoor_kitchen,
        has_garden: form.has_garden,
        parking_spaces: form.parking_spaces,
        garage_type: form.garage_type,
        ev_charging: form.ev_charging,
        parking_distance_m: form.parking_distance_m ? parseFloat(form.parking_distance_m) : null,
        kitchen_appliances: form.kitchen_appliances.length > 0 ? form.kitchen_appliances : null,
        bed_types: form.bed_types.length > 0 ? form.bed_types : null,
        mattress_quality: form.mattress_quality || null,
        linen_provided: form.linen_provided,
        towels_provided: form.towels_provided,
        extra_pillows: form.extra_pillows,
        furnishing_level: form.furnishing_level || null,
        // Step 5
        heating_type: form.heating_type.length > 0 ? form.heating_type : null,
        cooling_type: form.cooling_type.length > 0 ? form.cooling_type : null,
        water_source: form.water_source || null,
        hot_water_system: form.hot_water_system || null,
        electricity_source: form.electricity_source.length > 0 ? form.electricity_source : null,
        solar_panels: form.solar_panels,
        solar_capacity_kw: form.solar_capacity_kw ? parseFloat(form.solar_capacity_kw) : null,
        internet_type: form.internet_type || null,
        internet_speed_mbps: form.internet_speed_mbps ? parseFloat(form.internet_speed_mbps) : null,
        smart_home_features: form.smart_home_features,
        smart_home_details: form.smart_home_details || null,
        eco_certifications: form.eco_certifications.length > 0 ? form.eco_certifications : null,
        backup_generator: form.backup_generator,
        septic_tank: form.septic_tank,
        // Step 6
        exchange_type: form.exchange_type || null,
        exchange_duration: form.exchange_duration.length > 0 ? form.exchange_duration : null,
        minimum_stay_days: form.minimum_stay_days ? parseInt(form.minimum_stay_days) : null,
        maximum_stay_days: form.maximum_stay_days ? parseInt(form.maximum_stay_days) : null,
        preferred_seasons: form.preferred_seasons.length > 0 ? form.preferred_seasons : null,
        number_of_guests_allowed: form.number_of_guests_allowed,
        flexible_dates: form.flexible_dates,
        available_start_date: form.available_start_date || null,
        available_end_date: form.available_end_date || null,
        advance_booking_days: form.advance_booking_days ? parseInt(form.advance_booking_days) : null,
        desired_exchange_destination: form.desired_exchange_destination || null,
        desired_exchange_country: form.desired_exchange_country || null,
        escrow_accepted: form.escrow_accepted,
        escrow_required: form.escrow_required,
        security_deposit_eur: form.security_deposit_eur ? parseFloat(form.security_deposit_eur) : null,
        // Step 7
        check_in_time: form.check_in_time,
        check_out_time: form.check_out_time,
        smoking_allowed: form.smoking_allowed,
        alcohol_allowed: form.alcohol_allowed,
        parties_allowed: form.parties_allowed,
        quiet_hours: form.quiet_hours || null,
        guests_limit: form.guests_limit,
        children_allowed: form.children_allowed,
        min_child_age: form.min_child_age ? parseInt(form.min_child_age) : null,
        infants_allowed: form.infants_allowed,
        pets_allowed: form.pets_allowed,
        pets_types: form.pets_types.length > 0 ? form.pets_types : null,
        local_wildlife_note: form.local_wildlife_note || null,
        smoking_outdoor_area: form.smoking_outdoor_area,
        housekeeping_included: form.housekeeping_included,
        housekeeping_frequency: form.housekeeping_frequency || null,
        security_system: form.security_system,
        cctv_present: form.cctv_present,
        cctv_disclosure: form.cctv_disclosure || null,
        keypad_entry: form.keypad_entry,
        emergency_contact_available: form.emergency_contact_available,
        special_house_rules: form.special_house_rules || null,
        accessibility_features: form.accessibility_features.length > 0 ? form.accessibility_features : null,
      },
    })
    .select("id");

  if (error) throw error;
  return (data as { id: string }[]) ?? [];
}
