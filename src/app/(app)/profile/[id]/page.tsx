// src/app/(app)/profile/[id]/page.tsx

import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRatingSummaryAction } from "@/features/reviews/server/reviews-actions";
import { reviewsRepository } from "@/features/reviews/server/reviews-repository";

interface ProfilePageProps {
  params: { id: string };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const userId = params.id;

  const supabase = createServerClient();

  // Încărcăm user-ul
  const { data: user, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !user) {
    console.error("PublicProfilePage error:", error);
    notFound();
  }

  // Rating summary
  const ratingSummary = await getUserRatingSummaryAction(userId);

  // Lista recenziilor primite
  const reviews = await reviewsRepository.listReviewsForUser(userId);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <img
          src={user.avatar_url ?? "/placeholder-avatar.png"}
          alt={user.name ?? "User"}
          className="w-20 h-20 rounded-full object-cover"
        />

        <div>
          <h1 className="text-2xl font-bold">{user.name ?? "Utilizator"}</h1>

          {/* Rating */}
          {ratingSummary.totalReviews === 0 ? (
            <p className="text-gray-600 text-sm">Fără recenzii încă</p>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <span className="text-xl">
                {"★".repeat(Math.round(ratingSummary.averageStars))}
                {"☆".repeat(5 - Math.round(ratingSummary.averageStars))}
              </span>
              <span className="text-sm text-gray-700">
                {ratingSummary.averageStars} / 5 ({ratingSummary.totalReviews} recenzii)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* LOCATION */}
      {user.location && (
        <p className="text-gray-600 text-sm">📍 {user.location}</p>
      )}

      {/* DESCRIERE (dacă există) */}
      {user.bio && (
        <p className="text-gray-700 text-sm leading-6">{user.bio}</p>
      )}

      <hr className="my-4" />

      {/* REVIEWS */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recenzii primite</h2>

        {reviews.length === 0 ? (
          <p className="text-gray-600 text-sm">
            Acest utilizator nu are încă recenzii.
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="border p-3 rounded-lg bg-gray-50 shadow-sm"
              >
                <p className="text-yellow-500 font-semibold">
                  {"★".repeat(rev.stars)}
                  {"☆".repeat(5 - rev.stars)}
                </p>

                {rev.comment && (
                  <p className="text-sm text-gray-700 mt-1">{rev.comment}</p>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  {rev.createdAt.slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
