"use client";

import { useEffect, useState } from "react";
import useTranslation from "@/components/LanguageProvider";

type Profile = {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  location?: string | null;
  language?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

export default function ProfilePage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/profile", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error ?? "Failed to load profile");
        }

        if (!cancelled) {
          setProfile(json?.profile ?? null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>
        <p className="text-sm opacity-80">{t("profile.subtitle")}</p>
      </header>

      {loading && (
        <div className="rounded-md border p-4 text-sm">{t("common.loading")}</div>
      )}

      {error && (
        <div className="rounded-md border p-4 text-sm">
          <div className="font-medium">{t("common.error")}</div>
          <div className="opacity-80">{error}</div>
        </div>
      )}

      {!loading && !error && (
        <section className="rounded-md border p-4 space-y-3">
          <div className="text-sm">
            <span className="font-medium">{t("profile.name")}:</span>{" "}
            {profile?.full_name ?? "—"}
          </div>
          <div className="text-sm">
            <span className="font-medium">{t("profile.location")}:</span>{" "}
            {profile?.location ?? "—"}
          </div>
          <div className="text-sm">
            <span className="font-medium">{t("profile.language")}:</span>{" "}
            {profile?.language ?? "—"}
          </div>
        </section>
      )}
    </main>
  );
}
