"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { Pill, SectionCard, StateShowcase } from "@/components/ui";

export default function ObjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, user, loading } = useAppState();
  const item = items.find((i) => i.id === params.id);

  if (loading.items) {
    return (
      <SectionCard
        title="Se încarcă obiectul"
        description="Loading state conform contractului (nu 404)."
      >
        <div className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </SectionCard>
    );
  }

  if (!item) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
        Obiectul nu a fost găsit sau este indisponibil public. Navighează înapoi către lista de obiecte.
        <div className="mt-3">
          <Link
            href="/objects"
            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Înapoi la obiecte
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoggedOutGate returnTo={`/objects/${params.id}`} />;
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title={item.title}
        description="Detalii + acțiuni + metadata AI ca sugestii (nu suprascrie user_final)."
      >
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            {item.photos[0] ? (
              <Image
                src={item.photos[0]}
                alt={item.title}
                width={400}
                height={320}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Fără imagine
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <Pill color="blue">Categorie: {item.category}</Pill>
              <Pill color="green">Status: {item.status}</Pill>
              <Pill color="zinc">Locație: {item.location}</Pill>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.description}</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Îmi doresc în schimb: {item.wishlist}
            </p>
            <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              AI suggested tags: {item.aiSuggestedTags?.join(", ") || "-"} · user_final: {item.userFinalTags?.join(", ") || "-"}
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => router.push("/match")}
              >
                Cere match & explicație
              </button>
              <button
                className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
                onClick={() => router.push("/chat")}
              >
                Inițiază chat securizat
              </button>
              <button
                className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                onClick={() => router.push("/change")}
              >
                Propune schimb
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Politici & RLS" description="Vizibilitate controlată prin profil și grant-uri minime.">
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Public vede doar items active și marcate ca is_active=true.</li>
          <li>Owner vede și obiecte inactive sau rezervate.</li>
          <li>Demo data marcată cu is_demo pentru a evita confundarea cu producția.</li>
        </ul>
        <Link href="/info" className="text-sm font-semibold text-blue-700 underline dark:text-blue-200">
          Vezi mai multe reguli
        </Link>
      </SectionCard>

      <StateShowcase
        title="Stări DETALIU OBIECT"
        states={[
          {
            key: "loading",
            title: "Se pregătește galeria",
            description: "Skeleton pentru imagine și detalii cât timp se preia obiectul.",
          },
          {
            key: "empty",
            title: "Galerie goală",
            description: "Fallback „Fără imagine” + CTA de upload din /objects/[id]/edit.",
          },
          {
            key: "error",
            title: "ID invalid",
            description: "Mesaj dedicat + buton către listă; nu returnăm 404 pe flux canonic.",
          },
        ]}
      />
    </div>
  );
}
