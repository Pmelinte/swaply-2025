'use client';

import { useEffect, useState } from 'react';

type Profile = {
  id?: string;
  user_id?: string;
  name: string | null;
  location: string | null;
  language: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
};

type ProfileFormData = {
  name: string;
  location: string;
  language: string;
  avatar_url: string;
};

const EMPTY_FORM: ProfileFormData = {
  name: '',
  location: '',
  language: 'en',
  avatar_url: '',
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/profile', {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
          throw new Error(`Failed to load profile (${res.status})`);
        }

        const data = (await res.json()) as { profile: Profile | null };

        if (isMounted && data.profile) {
          const p = data.profile;
          setForm({
            name: p.name ?? '',
            location: p.location ?? '',
            language: p.language ?? 'en',
            avatar_url: p.avatar_url ?? '',
          });
        } else if (isMounted) {
          setForm(EMPTY_FORM);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message ?? 'Failed to load profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg =
          body?.error ??
          `Failed to save profile (status ${res.status}).`;
        throw new Error(msg);
      }

      setSuccess('Profile saved successfully.');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  function onChange<K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl bg-slate-800/95 shadow-2xl border border-slate-700 px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Profile
        </h1>
        <p className="text-sm text-slate-300 mb-8">
          Manage your identity and preferences in Swaply. All fields are optional except your preferred language.
        </p>

        {loading ? (
          <div className="text-sm text-slate-300">Loading profile…</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-500/60 bg-red-500/10 text-red-100 px-4 py-2 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 text-emerald-100 px-4 py-2 text-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => onChange('name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="City, Country"
                  value={form.location}
                  onChange={(e) => onChange('location', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Preferred language
              </label>
              <select
                className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.language}
                onChange={(e) => onChange('language', e.target.value)}
              >
                <option value="ro">Română</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-100 mb-2">
                Avatar (URL for now)
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://…your-image.jpg"
                value={form.avatar_url}
                onChange={(e) => onChange('avatar_url', e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Later we&apos;ll hook this to Cloudinary upload. For now you can paste a direct image URL.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setError(null);
                  setSuccess(null);
                }}
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/80 transition-colors"
                disabled={saving}
              >
                Reset
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
