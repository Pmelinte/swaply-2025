// src/app/(app)/settings/profile/page.tsx

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";
import { getUserRatingSummaryAction } from "@/features/reviews/server/reviews-actions";

export default async function ProfilePage() {
  const supabase = createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Rating summary pentru profil
  const ratingSummary = await getUserRatingSummaryAction(user.id);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Profilul meu</h1>

      {/* Rating Section */}
      <div className="p-4 border rounded-xl bg-gray-50">
        <p className="font-semibold text-lg mb-2">Reputație</p>

        {ratingSummary.totalReviews === 0 ? (
          <p className="text-sm text-gray-600">
            Nu ai primit încă recenzii.
          </p>
        ) : (
          <div>
            <p className="text-xl font-bold text-yellow-500">
              {"★".repeat(Math.round(ratingSummary.averageStars))}
              {"☆".repeat(5 - Math.round(ratingSummary.averageStars))}
            </p>
            <p className="text-sm text-gray-600">
              {ratingSummary.averageStars} / 5 · {ratingSummary.totalReviews} recenzii
            </p>
          </div>
        )}
      </div>

      {/* Profile Editor */}
      <ProfileClient userId={user.id} />
    </div>
  );
}
