'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/components/LanguageProvider';

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
  const { t } = useTranslation();
  const [form, setForm] = useState<ProfileFormData>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<ProfileFormData>(EMPTY_FORM);
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
        if (!res.ok) throw new Error(t('error_load_profile'));

        const json = await res.json();
        const p: Profile | null = json.profile;

        if (mounted && p) {
          const next = {
            name: p.name ?? '',
            location: p.location ?? '',
            language: p.language ?? 'en',
            avatar_url: p.avatar_url ?? '',
          };
          setForm(next);
          setInitialForm(next);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || t('error_load_profile'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [t]);

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
        throw new Error(err?.error || t('error_update_profile'));
      }

      setSuccess(t('profile_updated'));
      setInitialForm(form);
    } catch (err: any) {
      setError(err.message || t('error_update_profile'));
    } finally {
      setSaving(false);
    }
  }

  const handleCancel = () => {
    setForm(initialForm);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-card text-card-foreground rounded-3xl shadow-lg p-8 border border-slate-200">
        <h1 className="text-3xl font-bold mb-1">{t('profile')}</h1>
        <p className="text-slate-600 mb-8">
          {t('profile_description')}
        </p>

        {loading && <p className="text-slate-600">{t('loading')}</p>}

        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('name')}</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{t('location')}</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t('preferred_language')}</label>
              <select
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="ro">{t('ro')}</option>
                <option value="en">{t('en')}</option>
                <option value="fr">{t('fr')}</option>
                <option value="es">{t('es')}</option>
                <option value="de">{t('de')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{`${t('avatar')} (URL)`}</label>
              <input
                className="w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Upload system with Cloudinary will be added later.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                onClick={handleCancel}
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
              >
                {saving ? t('saving') : t('save_profile')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
