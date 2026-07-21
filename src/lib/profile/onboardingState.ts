export const ONBOARDING_STEPS = ["identity", "location", "languages", "preferences", "interests"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface OnboardingProfileState {
  display_name?: string | null;
  first_name?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  address_country?: string | null;
  address_city?: string | null;
  languages?: string[] | null;
  swap_geo_range?: string | null;
  swap_context?: string[] | null;
  open_to_types?: string[] | null;
  swap_intent?: string | null;
  bio?: string | null;
  affinity_groups?: string[] | null;
  interests?: string[] | null;
  occupation?: string | null;
  onboarding_completed?: boolean | null;
  onboarding_step?: string | null;
}

export function stepNumberFromStoredStep(step: unknown): number {
  if (step === "done") return 5;
  const index = ONBOARDING_STEPS.indexOf(step as OnboardingStep);
  return index >= 0 ? index + 1 : 1;
}

export function nextStoredStep(currentStep: number): OnboardingStep | "done" {
  if (currentStep >= ONBOARDING_STEPS.length) return "done";
  return ONBOARDING_STEPS[currentStep];
}

export function validateRequiredOnboardingProfile(profile: OnboardingProfileState): string[] {
  const missing: string[] = [];
  const name = profile.display_name?.trim() ?? "";
  if (name.length < 2) missing.push("display_name");
  if (!profile.date_of_birth) missing.push("date_of_birth");
  if (!profile.address_country) missing.push("address_country");
  if (!Array.isArray(profile.languages) || profile.languages.length === 0) missing.push("languages");
  return missing;
}

export function isAtLeastSixteen(dateOfBirth: string, now = new Date()): boolean {
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return false;
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const month = now.getUTCMonth() - dob.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age >= 16;
}
