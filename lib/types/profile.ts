export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  location: string | null;
  preferred_language: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  name: string;
  location: string;
  preferred_language: string;
  avatar_url: string;
}
