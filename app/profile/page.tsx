'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ProfileFormData } from '@/lib/types/profile';
import { useTranslation } from '@/components/LanguageProvider';

const LANGUAGE_OPTIONS = [
  { value: 'en', labelKey: 'en' },
  { value: 'es', labelKey: 'es' },
  { value: 'fr', labelKey: 'fr' },
  { value: 'de', labelKey: 'de' },
  { value: 'ro', labelKey: 'ro' },
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    location: '',
    preferred_language: 'en',
    avatar_url: '',
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);
        await fetchProfile();
      } catch (err) {
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    initialize();
  }, [router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || t('error_load_profile'));
      }

      setFormData({
        name: data.profile?.name || '',
        location: data.profile?.location || '',
        preferred_language: data.profile?.preferred_language || 'en',
        avatar_url: data.profile?.avatar_url || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_load_profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || t('error_avatar_upload'));
      }

      handleInputChange('avatar_url', data.image_url);
    } catch (err) {
      handleInputChange('avatar_url', '');
      setError(err instanceof Error ? err.message : t('error_avatar_upload'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || t('error_update_profile'));
      }

      setSuccess(t('profile_updated'));
      setFormData({
        name: data.profile?.name || '',
        location: data.profile?.location || '',
        preferred_language: data.profile?.preferred_language || 'en',
        avatar_url: data.profile?.avatar_url || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error_update_profile'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">{t('loading')}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{t('profile')}</h1>
          <p className="text-slate-400 text-sm">
            {t('profile_description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                {t('name')}
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium">
                {t('location')}
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Preferred language */}
          <div className="space-y-2">
            <label htmlFor="preferred_language" className="block text-sm font-medium">
              {t('preferred_language')}
            </label>
            <select
              id="preferred_language"
              value={formData.preferred_language}
              onChange={(e) => handleInputChange('preferred_language', e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Avatar */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">{t('avatar')}</label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                {formData.avatar_url ? (
                  <Image
                    src={formData.avatar_url}
                    alt="Avatar"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-slate-500 text-sm">{t('no_avatar')}</span>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                >
                  {uploading ? t('uploading') : t('upload_avatar')}
                </button>

                <p className="text-xs text-slate-500">{t('avatar_requirements')}</p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-4 bg-green-900/40 border border-green-700 rounded-lg text-green-200">
              {success}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg"
            >
              {t('cancel')}
            </button>

            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg"
            >
              {loading ? t('saving') : t('save_profile')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
