import dynamic from "next/dynamic";
import { isAuthenticated } from "@/lib/supabase/auth";
import Link from "next/link";

const WantedClient = dynamic(() => import("./WantedClient"));

export default async function WantedPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Wanted Requests</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">See what other users are looking for and propose a swap!</p>
          <div className="mt-4 text-center">
            <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              Create an account to post requests
            </Link>
          </div>
        </section>
      </div>
    );
  }
  return <WantedClient />;
}
