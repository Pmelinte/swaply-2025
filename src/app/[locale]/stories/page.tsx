"use client";

import { useEffect, useState } from "react";
import { BookOpen, HeartHandshake, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type PublicStory = {
  story_id: string;
  revision: number;
  public_slug: string;
  title: string;
  body: string;
  published_at: string;
};

export default function StoriesPage() {
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [partialError, setPartialError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStories() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        if (active) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("story_publications")
        .select("story_id, revision, public_slug, title, body, published_at")
        .eq("is_visible", true)
        .order("published_at", { ascending: false })
        .limit(12);

      if (!active) return;
      setPartialError(Boolean(error));
      setStories((data ?? []) as PublicStory[]);
      setLoading(false);
    }

    void loadStories();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8" data-page="stories">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 px-5 py-10 text-white shadow-lg sm:px-10">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_85%_15%,white_0,transparent_24%),radial-gradient(circle_at_10%_90%,#86efac_0,transparent_25%)]" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <HeartHandshake className="h-9 w-9" aria-hidden="true" />
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{tHome("guestDiscover")}</h1>
          <p className="mt-3 max-w-2xl text-blue-100">{tHome("activitySwap")}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/30" aria-label={tNav("info")}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700 dark:text-green-300" aria-hidden="true" />
          <p className="text-sm leading-6 text-green-950 dark:text-green-100">{tHome("guestBadges")}</p>
        </div>
      </section>

      {partialError ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" role="status">
          {tCommon("errorOccurred")} · {tCommon("tryAgain")}
        </div>
      ) : null}

      <section aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3" aria-label={tCommon("loadingData")}>
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-48 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((story) => (
              <article key={`${story.story_id}-${story.revision}`} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <BookOpen className="h-6 w-6 text-green-700 dark:text-green-300" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-black text-zinc-900 dark:text-zinc-50">{story.title}</h2>
                <p className="mt-3 line-clamp-5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{story.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <HeartHandshake className="mx-auto h-9 w-9 text-green-700 dark:text-green-300" aria-hidden="true" />
            <p className="mt-4 font-bold text-zinc-900 dark:text-zinc-50">{tCommon("noData")}</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">{tHome("guestInfo")}</p>
            <Link href="/blog" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 font-bold text-white transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
              {tNav("info")}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
