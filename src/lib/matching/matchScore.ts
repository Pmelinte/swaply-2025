export type ScoreBreakdown = {
  categoryMatch: number;
  valueMatch: number;
  typeMatch: number;
  geoScore: number;
  trustScore: number;
  activityScore: number;
  total: number;
};

export function calculateMatchScore(
  myItem: any,
  theirItem: any,
  myProfile: any,
  theirProfile: any,
): ScoreBreakdown {
  const categoryMatch = myItem.swap_wants_category_l1
    ? theirItem.category === myItem.swap_wants_category_l1
      ? 100
      : 20
    : 60;

  const tierMap: Record<string, number> = { small: 1, medium: 2, large: 3, special: 4 };
  const myTier = tierMap[myItem.perceived_value_tier] ?? 2;
  const theirTier = tierMap[theirItem.perceived_value_tier] ?? 2;
  const valueMatch = Math.max(0, 100 - Math.abs(myTier - theirTier) * 30);

  const typeMatch =
    Array.isArray(theirItem.swap_open_to) && theirItem.swap_open_to.includes(myItem.item_type)
      ? 100
      : 0;

  const object_score = categoryMatch * 0.5 + valueMatch * 0.3 + typeMatch * 0.2;

  const myLat = myProfile?.address_lat ?? (myProfile?.location as any)?.lat;
  const myLon = myProfile?.address_lon ?? (myProfile?.location as any)?.lon;
  const theirLat = theirProfile?.address_lat ?? (theirProfile?.location as any)?.lat;
  const theirLon = theirProfile?.address_lon ?? (theirProfile?.location as any)?.lon;

  let geoScore = 50;
  if (myLat && theirLat) {
    const R = 6371;
    const dLat = ((theirLat - myLat) * Math.PI) / 180;
    const dLon = ((theirLon - myLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((myLat * Math.PI) / 180) *
        Math.cos((theirLat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    geoScore = distKm < 50 ? 100 : distKm < 300 ? 80 : distKm < 1000 ? 60 : 30;
  }

  const trustScore = Math.min(100, (theirProfile?.trust_score ?? 0) / 10);

  const lastActive = theirProfile?.last_active_at;
  const daysSince = lastActive
    ? (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  const activityScore = Math.max(0, 100 - daysSince * 5);

  const user_score = geoScore * 0.5 + trustScore * 0.3 + activityScore * 0.2;
  const total = Math.round(object_score * 0.7 + user_score * 0.3);

  return { categoryMatch, valueMatch, typeMatch, geoScore, trustScore, activityScore, total };
}
