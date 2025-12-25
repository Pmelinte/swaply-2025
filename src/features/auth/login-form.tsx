'use client';

import { useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LoginForm() {
  const params = useSearchParams();
  const returnTo = params.get('returnTo') ?? '/';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${returnTo}`
      }
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
      return;
    }

    setStatus('sent');
    setMessage('Verifică emailul pentru linkul de autentificare.');
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-gray-800" htmlFor="email">
          Email
        </label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          id="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </div>
      <button
        className="w-full rounded-lg bg-primary px-4 py-2 text-white"
        disabled={status === 'loading'}
        type="submit"
      >
        {status === 'loading' ? 'Se trimite...' : 'Trimite link de login'}
      </button>
      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
      <p className="text-xs text-gray-500">
        Return to: <span className="font-semibold">{returnTo}</span>
      </p>
    </form>
  );
}
