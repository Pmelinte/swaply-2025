'use client';

import { useEffect, useState } from 'react';

type Profile = {
  id?: string;
  user_id?: string;
  name: string | null;
  location: string | null;
  language: string | null;
  avatar_url: string | null;
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
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error(`Load failed (${res.status})`);

        const json = await res.json();
        const p: Profile | null = json.profile;

        if (mounted && p) {
          setForm({
            name: p.name ?? '',
            location: p.location ?? '',
            language: p.language ?? 'en',
            avatar_url: p.avatar_url ?? '',
          });
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
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
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Save failed (${res.status})`);
      }

      setSuccess('Profile saved successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 border border-gray-300">
        
        <h1 className="text-3xl font-bold mb-1">Profile</h1>
        <p className="text-gray-600 mb-8">
          Manage your Swaply identity and preferences.
        </p>

        {loading && <p className="text-gray-600">Loading…</p>}

        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-green-100 border border-green-300 text-green-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Location</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Preferred Language</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="ro">Română</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Avatar (URL)</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload system with Cloudinary will be added later.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-gray-400 bg-gray-200 hover:bg-gray-300"
                onClick={() => setForm(EMPTY_FORM)}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
