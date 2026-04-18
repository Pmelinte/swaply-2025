export type ServiceFormData = {
  // Step 1 — Service Type
  service_category_l1: string;
  service_category_l2: string;
  service_category_l3: string;
  service_title: string;
  service_short_description: string;
  service_modality: string; // Remote | On-site | Both

  // Step 2 — Description & Portfolio
  service_full_description: string;
  experience_years: number;
  experience_level: string;
  certifications: string[];
  languages_service: string[];
  portfolio_urls: string[];
  portfolio_images: string[];
  provider_type: string;

  // Step 3 — Availability
  availability_days: string[];
  availability_time_of_day: string[];
  service_duration: string[];
  available_from_date: string;
  available_until_date: string;
  advance_notice_days: number;
  urgent_available: boolean;
  recurring_possible: boolean;
  recurring_frequency: string[];

  // Step 4 — Exchange Terms
  swap_for_type: string[];
  swap_wants_description: string;
  swap_value_match: string;
  perceived_value_tier: string;
  escrow_accepted: boolean;
  swap_geo_preference: string;
  swap_geo_radius_km: number;
  swap_partial_allowed: boolean;
  swap_partial_topup_eur: string;

  // Step 5 — Confirmation
  confirm_authorized: boolean;
  confirm_accurate: boolean;
  confirm_terms: boolean;
  cross_category_swap: boolean;
  chain_swap_allowed: boolean;
};

export const INITIAL_SERVICE_FORM: ServiceFormData = {
  service_category_l1: "",
  service_category_l2: "",
  service_category_l3: "",
  service_title: "",
  service_short_description: "",
  service_modality: "",
  service_full_description: "",
  experience_years: 0,
  experience_level: "",
  certifications: [],
  languages_service: [],
  portfolio_urls: [],
  portfolio_images: [],
  provider_type: "",
  availability_days: [],
  availability_time_of_day: [],
  service_duration: [],
  available_from_date: "",
  available_until_date: "",
  advance_notice_days: 1,
  urgent_available: false,
  recurring_possible: false,
  recurring_frequency: [],
  swap_for_type: [],
  swap_wants_description: "",
  swap_value_match: "",
  perceived_value_tier: "",
  escrow_accepted: false,
  swap_geo_preference: "",
  swap_geo_radius_km: 50,
  swap_partial_allowed: false,
  swap_partial_topup_eur: "",
  confirm_authorized: false,
  confirm_accurate: false,
  confirm_terms: false,
  cross_category_swap: false,
  chain_swap_allowed: false,
};

export const SERVICE_DRAFT_KEY = "swaply_service_wizard_draft";

export const SERVICE_L1_CATEGORIES = [
  { emoji: "🔨", value: "Home & Construction", key: "serviceL1Construction" },
  { emoji: "🧹", value: "Cleaning", key: "serviceL1Cleaning" },
  { emoji: "🌿", value: "Environmental", key: "serviceL1Environmental" },
  { emoji: "🚗", value: "Transport", key: "serviceL1Transport" },
  { emoji: "💼", value: "Business & Professional", key: "serviceL1Business" },
  { emoji: "💻", value: "Tech & Engineering", key: "serviceL1Tech" },
  { emoji: "🎨", value: "Creative & Design", key: "serviceL1Creative" },
  { emoji: "💰", value: "Finance & Accounting", key: "serviceL1Finance" },
  { emoji: "🏥", value: "Health & Wellness", key: "serviceL1Health" },
  { emoji: "📚", value: "Education & Training", key: "serviceL1Education" },
  { emoji: "🎭", value: "Entertainment & Food", key: "serviceL1Entertainment" },
  { emoji: "✂️", value: "Personal & Domestic", key: "serviceL1Personal" },
  { emoji: "⚡", value: "Geothermal & Heat Pump", key: "serviceL1Geothermal" },
];

export const SERVICE_L2_MAP: Record<string, string[]> = {
  "Home & Construction": ["General Contracting", "Plumbing", "Electrical", "Carpentry", "Painting", "Roofing", "Flooring", "HVAC"],
  "Cleaning": ["Residential", "Commercial", "Industrial", "Window", "Carpet", "Post-construction"],
  "Environmental": ["Waste Management", "Recycling", "Pest Control", "Landscape", "Energy Audits"],
  "Transport": ["✈️ Air", "🚢 Naval/Maritime", "🚗 Road", "🚂 Rail", "🚲 Bike/Micro", "📦 Logistics & Warehousing"],
  "Business & Professional": ["Legal", "Consulting", "HR", "Marketing", "Sales", "Translation"],
  "Tech & Engineering": ["Web Dev", "Mobile Dev", "DevOps", "Data Science", "AI/ML", "Engineering Design", "IT Support"],
  "Creative & Design": ["Graphic Design", "UI/UX", "Photography", "Video", "Writing", "Music Production"],
  "Finance & Accounting": ["Bookkeeping", "Tax", "Investment Advisory", "Payroll"],
  "Health & Wellness": ["Medical", "Dental", "Therapy", "Fitness", "Nutrition", "Massage"],
  "Education & Training": ["Tutoring", "Language Lessons", "Coaching", "Workshops", "Online Courses"],
  "Entertainment & Food": ["Catering", "DJ/Music", "Event Hosting", "Cooking Classes"],
  "Personal & Domestic": ["Hair & Beauty", "Babysitting", "Elder Care", "Pet Care", "Errands"],
  "Geothermal & Heat Pump": ["Ground-source HP", "Air-source HP", "Water-source HP", "Design & Install"],
};
