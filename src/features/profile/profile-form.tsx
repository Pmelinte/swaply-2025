'use client';

import { FormEvent, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { Profile } from '@/lib/types';

interface ProfileFormProps {
  initialProfile: Profile | null;
}

const badgeOptions = [
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
  { value: 'platinum', label: 'Platinum' }
];

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [profile, setProfile] = useState<Profile>(
    initialProfile ?? {
      id: '',
      display_name: '',
      language: 'ro',
      badge_level: 'free'
    }
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    setErrorMessage('');

    const supabase = getSupabaseBrowserClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setStatus('error');
      setErrorMessage('Trebuie să fii autentificat.');
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url ?? null,
      language: profile.language ?? 'ro',
      badge_level: profile.badge_level ?? 'free',
      location_hint: profile.location_hint ?? null,
      preferences: profile.preferences ?? {}
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }

    setStatus('saved');
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-gray-800">
          Nume afișat
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={profile.display_name ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
          />
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-800">
          Limbă
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={profile.language ?? 'ro'}
            onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))}
          >
            <option value="ro">Română</option>
            <option value="en">Engleză</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-800">
          Badge
          <select
            className="w-full rounded-lg border px-3 py-2"
            value={profile.badge_level ?? 'free'}
            onChange={(e) => setProfile((p) => ({ ...p, badge_level: e.target.value as Profile['badge_level'] }))}
          >
            {badgeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-800">
          Hint locație (nu stocăm adresa exactă)
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={profile.location_hint ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, location_hint: e.target.value }))}
          />
        </label>
      </div>
      <div>
        <label className="space-y-1 text-sm font-medium text-gray-800">
          Avatar URL (Cloudinary)
          <input
            className="w-full rounded-lg border px-3 py-2"
            value={profile.avatar_url ?? ''}
            onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))}
            placeholder="https://res.cloudinary.com/..."
          />
        </label>
        <p className="mt-1 text-xs text-gray-600">Upload-ul securizat prin Cloudinary trebuie folosit; completarea manuală este temporară.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-lg bg-primary px-4 py-2 text-white"
          disabled={status === 'saving'}
          type="submit"
        >
          {status === 'saving' ? 'Se salvează...' : 'Salvează profilul'}
        </button>
        {status === 'saved' ? <span className="text-sm text-green-700">Salvat</span> : null}
        {status === 'error' ? <span className="text-sm text-red-600">{errorMessage}</span> : null}
      </div>
      <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        Zone AI/Maps avansate sunt marcate ca TODO (NEDEFINIT ÎN DOCS) și sunt dezactivate până la clarificare.
      </div>
    </form>
  );
}
