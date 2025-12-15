export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface ItemFormData {
  title: string;
  description: string;
  image_url: string;
}
