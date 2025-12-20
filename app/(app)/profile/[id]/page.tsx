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

  // Încărcăm profilul userului
  const { data: user, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !user) {
    notFound();
  }

  // Rating summary
  const ratingSummary = await getUserRatingSummaryAction(userId);

  // Recenzii primite
  const reviews = await reviewsRepository.listReviewsForUser(userId);

  // Profilurile celor care au lăsat recenzii
  const reviewerIds = reviews.map((r) => r.reviewerId);
  const { data: reviewerProfiles } = await supabase
    .from("profiles")
    .select("user_id, name, avatar_url")
    .in("user_id", reviewerIds);

  const reviewerMap = Object.fromEntries(
    (reviewerProfiles ?? []).map((rp) => [rp.user_id, rp])
  );

  // Schimburi în care userul a fost implicat
  const { data: exchangeRows } = await supabase
    .from("exchanges")
    .select("*")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  const exchanges = exchangeRows ?? [];
  const completedCount = exchanges.filter((e) => e.status === "completed").length;
  const recentExchanges = exchanges.slice(0, 5);

  // Profilurile partenerilor de schimb
  const partnerIds = Array.from(
    new Set(
      recentExchanges.map((e) =>
        e.user_a_id === userId ? e.user_b_id : e.user_a_id
      )
    )
  );

  const { data: partnerProfiles } = await supabase
    .from("profiles")
    .select("user_id, name, avatar_url")
    .in("user_id", partnerIds);

  const partnerMap = Object.fromEntries(
    (partnerProfiles ?? []).map((p) => [p.user_id, p])
  );

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
                {ratingSummary.averageStars} / 5 (
                {ratingSummary.totalReviews} recenzii)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* LOCATION */}
      {user.location && (
        <p className="text-gray-600 text-sm">📍 {user.location}</p>
      )}

      {/* BIO */}
      {user.bio && (
        <p className="text-gray-700 text-sm leading-6">{user.bio}</p>
      )}

      <hr className="my-4" />

      {/* ISTORIC SCHIMBURI */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Istoric schimburi</h2>

        {exchanges.length === 0 ? (
          <p className="text-gray-600 text-sm">
            Acest utilizator nu are încă schimburi înregistrate.
          </p>
        ) : (
          <div className="space-y-2 mb-3 text-sm text-gray-700">
            <p>
              Schimburi finalizate:{" "}
              <span className="font-semibold">{completedCount}</span>
            </p>
            <p className="text-xs text-gray-500">
              Mai jos vezi până la ultimele 5 schimburi.
            </p>
          </div>
        )}

        {recentExchanges.length > 0 && (
          <div className="space-y-4">
            {recentExchanges.map((ex) => {
              const partnerId =
                ex.user_a_id === userId ? ex.user_b_id : ex.user_a_id;
              const partner = partnerMap[partnerId];

              return (
                <div
                  key={ex.id}
                  className="border p-4 rounded-xl bg-gray-50 flex items-center gap-3"
                >
                  {/* Avatar partener */}
                  <img
                    src={partner?.avatar_url ?? "/placeholder-avatar.png"}
                    alt={partner?.name ?? "Partener"}
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Schimb cu{" "}
                      <span className="font-semibold">
                        {partner?.name ?? "Utilizator"}
                      </span>
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Status:{" "}
                      <span className="font-semibold">
                        {formatExchangeStatus(ex.status)}
                      </span>{" "}
                      · {ex.created_at?.slice(0, 10)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
            {reviews.map((rev) => {
              const reviewer = reviewerMap[rev.reviewerId];

              return (
                <div
                  key={rev.id}
                  className="border p-4 rounded-xl bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar reviewer */}
                    <img
                      src={reviewer?.avatar_url ?? "/placeholder-avatar.png"}
                      alt={reviewer?.name ?? "Reviewer"}
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    <div>
                      {/* Nume reviewer */}
                      <p className="font-medium text-sm">
                        {reviewer?.name ?? "Utilizator"}
                      </p>

                      {/* Rating stars */}
                      <p className="text-yellow-500 text-lg leading-none">
                        {"★".repeat(rev.stars)}
                        {"☆".repeat(5 - rev.stars)}
                      </p>
                    </div>
                  </div>

                  {/* Comment */}
                  {rev.comment && (
                    <p className="text-sm text-gray-700 mt-3">{rev.comment}</p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-500 mt-2">
                    {rev.createdAt.slice(0, 10)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatExchangeStatus(status: string): string {
  switch (status) {
    case "pending":
      return "În așteptare";
    case "negotiating":
      return "În negociere";
    case "accepted":
      return "Acceptat";
    case "shipping":
      return "În livrare";
    case "completed":
      return "Finalizat";
    case "cancelled":
      return "Anulat";
    default:
      return status;
  }
}
