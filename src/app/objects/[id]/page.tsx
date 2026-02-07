"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { Pill, SectionCard, StateShowcase } from "@/components/ui";

export default function ObjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { items, user, loading, proposeSwap } = useAppState();
  const myActiveItems = useMemo(
    () =>
      user
        ? items.filter((i) => i.ownerId === user.id && i.isActive && i.status === "active")
        : [],
    [items, user],
  );
  const [offerItemId, setOfferItemId] = useState<string>("");
  const [activePhoto, setActivePhoto] = useState(0);
  const validOfferItemId = myActiveItems.some((i) => i.id === offerItemId) ? offerItemId : "";
  const effectiveOfferItemId = validOfferItemId || myActiveItems[0]?.id || "";
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
          <div className="space-y-2">
            <div className="overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              {item.photos[activePhoto] ? (
                <Image
                  src={item.photos[activePhoto]}
                  alt={`${item.title} — foto ${activePhoto + 1}`}
                  width={400}
                  height={320}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
                  Fara imagine
                </div>
              )}
            </div>
            {item.photos.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto">
                {item.photos.map((photo, idx) => (
                  <button
                    key={photo}
                    type="button"
                    onClick={() => setActivePhoto(idx)}
                    className={`flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                      idx === activePhoto
                        ? "border-blue-600"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={photo}
                      alt={`${item.title} — thumbnail ${idx + 1}`}
                      width={64}
                      height={64}
                      className="h-16 w-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <Pill color="blue">Categorie: {item.category}</Pill>
              <Pill color="zinc">Condiție: {item.condition}</Pill>
              <Pill color="green">Status: {item.status}</Pill>
              <Pill color="zinc">Locație: {item.location}</Pill>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.description}</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Îmi doresc în schimb: {item.wishlist}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
                <p className="font-semibold">AI suggested tags</p>
                <p>{item.aiSuggestedTags?.join(", ") || "-"}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                <p className="font-semibold">User final tags</p>
                <p>{item.userFinalTags?.join(", ") || "-"}</p>
              </div>
            </div>

            {item.ownerId !== user.id ? (
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Obiectul tău oferit (pentru propunere swap)
                <select
                  value={effectiveOfferItemId}
                  onChange={(e) => setOfferItemId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {myActiveItems.length ? (
                    myActiveItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))
                  ) : (
                    <option value="">Nu ai obiecte active</option>
                  )}
                </select>
              </label>
            ) : null}
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={() => router.push("/match")}
              >
                Cere match & explicație
              </button>
              <button
                className="rounded-full bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
                onClick={() =>
                  router.push(
                    item.ownerId === user.id
                      ? "/chat"
                      : `/chat?to=${encodeURIComponent(item.ownerId)}`,
                  )
                }
              >
                Inițiază chat securizat
              </button>
              <button
                className="rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                disabled={item.ownerId !== user.id && !effectiveOfferItemId}
                onClick={() => {
                  if (item.ownerId === user.id) {
                    router.push("/change");
                    return;
                  }
                  void (async () => {
                    const swap = await proposeSwap({
                      requesterItemId: effectiveOfferItemId,
                      responderItemId: item.id,
                      responderId: item.ownerId,
                    });
                    router.push(swap ? `/change?swap=${swap.id}` : "/change");
                  })();
                }}
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
