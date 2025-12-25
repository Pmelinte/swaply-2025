'use client';

import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-muted"
      onClick={handleLogout}
      type="button"
    >
      Logout
    </button>
  );
}
