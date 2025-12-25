export type BadgeLevel = 'free' | 'premium' | 'platinum';

export interface Profile {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  language?: string;
  badge_level?: BadgeLevel;
  location_hint?: string;
  preferences?: Record<string, unknown>;
  created_at?: string;
}

export interface ItemRecord {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  images?: string[];
  category_id?: string | null;
  is_active: boolean;
  is_demo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SwapIntent {
  id: string;
  requester_id: string;
  target_item_id: string;
  offered_item_id?: string | null;
  status?: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at?: string;
}

export interface SwapRecord {
  id: string;
  initiator_id: string;
  receiver_id: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  payload?: Record<string, unknown>;
  read_at?: string | null;
  created_at?: string;
}
