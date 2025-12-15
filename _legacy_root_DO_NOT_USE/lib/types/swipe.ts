export interface SwipeFeedItem {
  id: string;
  sourceId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  profileName?: string | null;
  profileAvatarUrl?: string | null;
  location?: string | null;
  tags?: string[] | null;
}
