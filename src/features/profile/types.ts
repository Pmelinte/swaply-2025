export interface Profile {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  rating: number | null;
  rating_count: number | null;
  onboarding_completed: boolean;
  preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  full_name?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  bio?: string | null;
}
