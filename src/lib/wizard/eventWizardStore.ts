export type EventFormData = {
  // Step 1 — Event Type
  event_title: string;
  event_type_l1: string;
  event_type_l2: string;
  is_online: boolean;

  // Step 2 — Details, Date & Location
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  timezone: string;
  season: string[];
  recurrence: string;
  event_description: string;
  language_of_event: string[];

  // Location (if not online)
  country: string;
  region: string;
  city: string;
  venue_name: string;
  lat: string;
  lon: string;
  location_type: string;

  // Route (if travel-type event)
  route_type: string;
  route_start_city: string;
  route_end_city: string;
  route_waypoints: string;
  route_total_km: string;
  route_gpx_url: string;

  // Transport tickets
  transport_mode: string;
  booking_reference: string;
  departure_city: string;
  arrival_city: string;
  seat_class: string;
  seats_available: number;
  face_value_eur: string;
  is_transferable: boolean;
  baggage_included: boolean;
  rail_pass_type: string;
  rail_pass_days_remaining: number;

  // Sports tickets
  sport_type: string;
  competition_name: string;
  venue_sector: string;
  venue_row: string;
  seat_number: string;
  hospitality_included: boolean;

  // Step 3 — Participants & Capacity
  capacity_total: number;
  capacity_available: number;
  group_size_min: number;
  group_size_max: number;
  age_restriction: string;
  age_min: string;
  kid_friendly: boolean;
  pet_friendly: boolean;
  includes_accommodation: boolean;
  includes_transport: boolean;
  includes_meals: boolean;
  includes_equipment: boolean;
  equipment_list: string;
  dress_code: string;
  id_required: boolean;
  booking_deadline_date: string;
  advance_booking_months: number;

  // Step 4 — Exchange Terms
  swap_for_type: string[];
  swap_wants_description: string;
  swap_value_match: string;
  perceived_value_tier: string;
  escrow_accepted: boolean;
  swap_geo_preference: string;
  swap_partial_allowed: boolean;
  swap_partial_topup_eur: string;
  exchange_points: string;

  // Step 5 — Confirmation
  confirm_authorized: boolean;
  confirm_accurate: boolean;
  confirm_terms: boolean;
  cross_category_swap: boolean;
  chain_swap_allowed: boolean;
};

export const INITIAL_EVENT_FORM: EventFormData = {
  event_title: "",
  event_type_l1: "",
  event_type_l2: "",
  is_online: false,
  start_date: "",
  start_time: "",
  end_date: "",
  end_time: "",
  timezone: "",
  season: [],
  recurrence: "One-time",
  event_description: "",
  language_of_event: [],
  country: "",
  region: "",
  city: "",
  venue_name: "",
  lat: "",
  lon: "",
  location_type: "",
  route_type: "",
  route_start_city: "",
  route_end_city: "",
  route_waypoints: "",
  route_total_km: "",
  route_gpx_url: "",
  transport_mode: "",
  booking_reference: "",
  departure_city: "",
  arrival_city: "",
  seat_class: "",
  seats_available: 1,
  face_value_eur: "",
  is_transferable: true,
  baggage_included: false,
  rail_pass_type: "",
  rail_pass_days_remaining: 0,
  sport_type: "",
  competition_name: "",
  venue_sector: "",
  venue_row: "",
  seat_number: "",
  hospitality_included: false,
  capacity_total: 1,
  capacity_available: 1,
  group_size_min: 1,
  group_size_max: 10,
  age_restriction: "No restriction",
  age_min: "",
  kid_friendly: true,
  pet_friendly: false,
  includes_accommodation: false,
  includes_transport: false,
  includes_meals: false,
  includes_equipment: false,
  equipment_list: "",
  dress_code: "",
  id_required: false,
  booking_deadline_date: "",
  advance_booking_months: 0,
  swap_for_type: [],
  swap_wants_description: "",
  swap_value_match: "",
  perceived_value_tier: "",
  escrow_accepted: false,
  swap_geo_preference: "",
  swap_partial_allowed: false,
  swap_partial_topup_eur: "",
  exchange_points: "",
  confirm_authorized: false,
  confirm_accurate: false,
  confirm_terms: false,
  cross_category_swap: false,
  chain_swap_allowed: false,
};

export const EVENT_DRAFT_KEY = "swaply_event_wizard_draft";

export const EVENT_L1_CATEGORIES = [
  { emoji: "🌍", value: "Travel & Vacations", key: "eventL1Travel", showsAccommodationWarning: false },
  { emoji: "🎫", value: "Tickets & Access", key: "eventL1Tickets", showsAccommodationWarning: false },
  { emoji: "📚", value: "Courses & Workshops", key: "eventL1Courses", showsAccommodationWarning: false },
  { emoji: "🏃", value: "Sports & Outdoor", key: "eventL1Sports", showsAccommodationWarning: false },
  { emoji: "🎵", value: "Concerts & Festivals", key: "eventL1Concerts", showsAccommodationWarning: false },
  { emoji: "💼", value: "Conferences & Business", key: "eventL1Conferences", showsAccommodationWarning: false },
  { emoji: "✨", value: "Experiences", key: "eventL1Experiences", showsAccommodationWarning: false },
  { emoji: "👥", value: "Group Activities", key: "eventL1GroupActivities", showsAccommodationWarning: false },
  { emoji: "🚗", value: "Transport & Shared Travel", key: "eventL1Transport", showsAccommodationWarning: false },
  { emoji: "🏠", value: "Accommodation & Home Swap", key: "eventL1Accommodation", showsAccommodationWarning: true },
  { emoji: "🎪", value: "Event Services", key: "eventL1EventServices", showsAccommodationWarning: false },
  { emoji: "🔧", value: "Event Equipment", key: "eventL1Equipment", showsAccommodationWarning: false },
  { emoji: "🍽️", value: "Food & Catering", key: "eventL1Food", showsAccommodationWarning: false },
  { emoji: "🧘", value: "Wellness & Retreats", key: "eventL1Wellness", showsAccommodationWarning: false },
  { emoji: "🤝", value: "Volunteering & Community", key: "eventL1Volunteering", showsAccommodationWarning: false },
];

export const EVENT_L2_MAP: Record<string, string[]> = {
  "Travel & Vacations": ["City Break", "Beach", "Mountain", "Adventure", "Road Trip", "Cruise", "Safari", "Cultural", "Backpacking"],
  "Tickets & Access": ["Transport Tickets", "Sports Event Tickets", "Museum Pass", "Theme Park", "VIP Access", "Theater", "Exhibition"],
  "Courses & Workshops": ["Art", "Music", "Cooking", "Language", "Tech", "Business", "Fitness", "Dance", "Photography"],
  "Sports & Outdoor": ["Running", "Cycling", "Hiking", "Climbing", "Water Sports", "Skiing", "Team Sports", "Combat Sports", "Extreme Sports", "Yoga"],
  "Concerts & Festivals": ["Rock/Pop", "Classical", "Electronic", "Festival", "Jazz", "Opera"],
  "Conferences & Business": ["Industry Conference", "Seminar", "Networking", "Trade Show", "Summit", "Expo"],
  "Experiences": ["Escape Room", "Wine Tasting", "Cooking Class", "Hot Air Balloon", "Helicopter Tour", "Racing", "Skydiving", "VR Experience"],
  "Group Activities": ["Team Building", "Bachelor/ette Party", "Birthday Party", "Reunion", "Game Night", "Book Club", "Meetup"],
  "Transport & Shared Travel": ["Carpool", "Vehicle Rental", "Bike Rental", "Boat Charter", "Private Driver", "Airport Transfer"],
  "Accommodation & Home Swap": ["Home Exchange", "Guesthouse", "Villa", "Cabin", "Apartment", "Room"],
  "Event Services": ["Photographer", "DJ", "Host/MC", "Decorator", "Planner", "Sound/Lights", "Security"],
  "Event Equipment": ["Tent Rental", "Tables/Chairs", "Audio", "Lights", "Stage", "Catering Equipment"],
  "Food & Catering": ["Catering", "Food Truck", "Private Chef", "Bakery", "Reservations", "Tasting"],
  "Wellness & Retreats": ["Yoga Retreat", "Meditation", "Spa", "Detox", "Silent Retreat"],
  "Volunteering & Community": ["Community Event", "Charity"],
};

export const ACCOMMODATION_L1 = "Accommodation & Home Swap";
export const TRANSPORT_TICKETS_L2 = "Transport Tickets";
export const SPORTS_TICKETS_L2 = "Sports Event Tickets";
