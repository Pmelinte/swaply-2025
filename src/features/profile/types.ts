export interface Profile {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  preferred_language: string | null;
  trust_score: number | null;
  account_type: "standard" | "premium" | string;
  rating: number | null;
  rating_count: number | null;
  onboarding_completed: boolean;
  preferences: any | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
  bio?: string;
  preferred_language?: string;
  preferences?: any;
}
