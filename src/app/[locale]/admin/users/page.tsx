"use client";

import { useCallback, useState } from "react";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AdminGuard } from "@/features/admin/AdminShell";
import { useAdminActions } from "@/features/admin/useAdminActions";
import {
  Users,
  Search,
  Ban,
  Undo2,
  Clock,
  Star,
} from "lucide-react";

interface AdminUser {
  id: string;
  user_id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  badge: string;
  account_status: string;
  is_suspended: boolean;
  suspended_until: string | null;
  rating: number;
  rating_count: number;
  created_at: string;
  stats: { completedSwaps?: number; tokens?: number } | null;
}

const BADGE_COLORS: Record<string, string> = {
  free: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  premium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  platinum: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function UsersContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { changeBadge, suspendUser, banUser, unbanUser } = useAdminActions();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select(
        "id, user_id, username, email, display_name, avatar_url, badge, account_status, is_suspended, suspended_until, rating, rating_count, created_at, stats",
      )
      .or(
        `email.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`,
      )
      .order("created_at", { ascending: false })
      .limit(50);

    setUsers((data as AdminUser[]) ?? []);
    setLoading(false);
  }, [searchQuery]);

  const handleBadgeChange = useCallback(
    async (userId: string, newBadge: string) => {
      setActionLoading(userId);
      const result = await changeBadge(userId, newBadge);
      if (result.error) {
        alert(`Eroare: ${result.error}`);
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, badge: newBadge } : u,
          ),
        );
      }
      setActionLoading(null);
    },
    [changeBadge],
  );

  const handleSuspend = useCallback(
    async (userId: string) => {
      const reason = prompt("Motiv suspendare:");
      if (!reason) return;
      setActionLoading(userId);
      const result = await suspendUser(userId, 7, reason);
      if (result.error) {
        alert(`Eroare: ${result.error}`);
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, is_suspended: true, suspended_until: new Date(Date.now() + 7 * 86400000).toISOString() }
              : u,
          ),
        );
      }
      setActionLoading(null);
    },
    [suspendUser],
  );

  const handleBan = useCallback(
    async (userId: string) => {
      const reason = prompt("Motiv ban permanent:");
      if (!reason) return;
      if (!confirm("Ești sigur că vrei să blochezi permanent acest utilizator?")) return;
      setActionLoading(userId);
      const result = await banUser(userId, reason);
      if (result.error) {
        alert(`Eroare: ${result.error}`);
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, account_status: "deleted" } : u,
          ),
        );
      }
      setActionLoading(null);
    },
    [banUser],
  );

  const handleUnban = useCallback(
    async (userId: string) => {
      setActionLoading(userId);
      const result = await unbanUser(userId);
      if (result.error) {
        alert(`Eroare: ${result.error}`);
      } else {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, account_status: "active", is_suspended: false, suspended_until: null }
              : u,
          ),
        );
      }
      setActionLoading(null);
    },
    [unbanUser],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        <Users className="mb-0.5 mr-2 inline h-5 w-5" />
        Utilizatori
      </h2>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Caută după email, username sau nume..."
            className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Caută
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <Search className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500">
            {searchQuery
              ? "Niciun utilizator găsit."
              : "Caută un utilizator după email sau username."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const isLoading = actionLoading === u.id;
            const isSuspended = u.is_suspended || u.account_status === "deleted";

            return (
              <div
                key={u.id}
                className={`rounded-xl border bg-white p-4 dark:bg-zinc-900 ${
                  isSuspended
                    ? "border-red-200 dark:border-red-900"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      u.display_name?.[0]?.toUpperCase() ?? "?"
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {u.display_name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${BADGE_COLORS[u.badge] ?? BADGE_COLORS.free}`}
                      >
                        {u.badge}
                      </span>
                      {isSuspended && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          {u.account_status === "deleted"
                            ? "BANNED"
                            : "SUSPENDED"}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-500">
                      @{u.username} · {u.email}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>
                        <Clock className="mb-0.5 mr-0.5 inline h-3 w-3" />
                        {new Date(u.created_at).toLocaleDateString("ro-RO")}
                      </span>
                      <span>
                        <Star className="mb-0.5 mr-0.5 inline h-3 w-3" />
                        {u.rating?.toFixed(1) ?? "0.0"} ({u.rating_count ?? 0})
                      </span>
                      <span>
                        Swap-uri: {u.stats?.completedSwaps ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <select
                      value={u.badge}
                      onChange={(e) =>
                        handleBadgeChange(u.id, e.target.value)
                      }
                      disabled={isLoading}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="platinum">Platinum</option>
                    </select>

                    {!isSuspended ? (
                      <>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleSuspend(u.id)}
                          className="rounded-lg border border-amber-200 p-1.5 text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:hover:bg-amber-950/30"
                          title="Suspendă 7 zile"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleBan(u.id)}
                          className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950/30"
                          title="Ban permanent"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleUnban(u.id)}
                        className="rounded-lg border border-emerald-200 p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                        title="Deblochează"
                      >
                        <Undo2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {u.suspended_until && u.is_suspended && (
                  <p className="mt-2 text-xs text-red-500">
                    Suspendat până la:{" "}
                    {new Date(u.suspended_until).toLocaleString("ro-RO")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <UsersContent />
    </AdminGuard>
  );
}
