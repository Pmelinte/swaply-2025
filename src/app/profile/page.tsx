"use client";

import { useState } from "react";
import { useAppState } from "@/lib/state";
import { LoggedOutGate, MissingDataCallout } from "@/components/gated";
import { Badge, Pill, SectionCard, StateShowcase } from "@/components/ui";
import { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const { user, updateProfile, loading, lastError } = useAppState();
  const [draft, setDraft] = useState<UserProfile | null>(user);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (loading.profile) {
    return (
      <SectionCard
        title="Se încarcă profilul"
        description="Loading state conform contractului; nu returnăm 404."
      >
        <div className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </SectionCard>
    );
  }

  if (!user || !draft) {
    return <LoggedOutGate returnTo="/profile" />;
  }

  const update = (partial: Partial<UserProfile>) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    void updateProfile(next, { persist: false });
  };

  const locationIncomplete = !draft.location?.city || !draft.location?.country;

  return (
    <div className="space-y-4">
      <SectionCard
        title="Identitate publică"
        description="Ce vede lumea: nume afișat, avatar, bio, limbi vorbite."
        action={<Badge tier={draft.badge} />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Nume afișat
            <input
              value={draft.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Prenume (opțional)
            <input
              value={draft.firstName ?? ""}
              onChange={(e) => update({ firstName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Descriere scurtă (bio)
          <textarea
            value={draft.bio ?? ""}
            onChange={(e) => update({ bio: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            rows={3}
          />
        </label>
        <div className="flex flex-wrap gap-2 text-xs">
          {draft.languages.map((lang) => (
            <Pill key={lang}>{lang.toUpperCase()}</Pill>
          ))}
        </div>
      </SectionCard>

      {locationIncomplete ? (
        <MissingDataCallout
          title="Locație incompletă"
          message="Setează țară și oraș pentru a permite harta și match-urile bazate pe proximitate."
          cta={<span className="text-sm font-semibold">Completați câmpurile de mai jos.</span>}
        />
      ) : null}

      <SectionCard
        title="Localizare"
        description="Țară / regiune / oraș + coordonate aproximative. Fără geocoding automat."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Țară
            <input
              value={draft.location?.country ?? ""}
              onChange={(e) =>
                update({ location: { ...(draft.location ?? {}), country: e.target.value } })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Regiune
            <input
              value={draft.location?.region ?? ""}
              onChange={(e) =>
                update({ location: { ...(draft.location ?? {}), region: e.target.value } })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Oraș
            <input
              value={draft.location?.city ?? ""}
              onChange={(e) =>
                update({ location: { ...(draft.location ?? {}), city: e.target.value } })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Cod poștal
            <input
              value={draft.location?.postalCode ?? ""}
              onChange={(e) =>
                update({ location: { ...(draft.location ?? {}), postalCode: e.target.value } })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Rază maximă de deplasare (km)
            <input
              type="number"
              value={draft.location?.travelRadiusKm ?? 0}
              onChange={(e) =>
                update({
                  location: {
                    ...(draft.location ?? {}),
                    travelRadiusKm: Number(e.target.value),
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.visibility.showExactLocation}
              onChange={(e) =>
                update({
                  visibility: { ...draft.visibility, showExactLocation: e.target.checked },
                })
              }
            />
            Locație exactă vizibilă
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.visibility.showLastSeen}
              onChange={(e) =>
                update({
                  visibility: { ...draft.visibility, showLastSeen: e.target.checked },
                })
              }
            />
            Ultima activitate vizibilă
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Preferințe schimb"
        description="Logistică, notificări, vizibilitate obiecte."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Vizibilitate profil
            <select
              value={draft.visibility.publicProfile ? "public" : "private"}
              onChange={(e) =>
                update({ visibility: { ...draft.visibility, publicProfile: e.target.value === "public" } })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="public">Public</option>
              <option value="private">Privat</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Obiecte vizibile
            <select
              value={draft.visibility.itemsVisibility}
              onChange={(e) =>
                update({
                  visibility: {
                    ...draft.visibility,
                    itemsVisibility: e.target.value as UserProfile["visibility"]["itemsVisibility"],
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="public">Public</option>
              <option value="match_only">Doar match-uri</option>
            </select>
          </label>
        </div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Logistică preferată
          <select
            value={draft.swapPreferences.logistics}
            onChange={(e) =>
              update({
                swapPreferences: {
                  ...draft.swapPreferences,
                  logistics: e.target.value as UserProfile["swapPreferences"]["logistics"],
                },
              })
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="in_person">Întâlnire fizică</option>
            <option value="courier">Curier</option>
            <option value="flexible">Flexibil</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Note
          <textarea
            value={draft.swapPreferences.notes ?? ""}
            onChange={(e) =>
              update({
                swapPreferences: { ...draft.swapPreferences, notes: e.target.value },
              })
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            rows={2}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.notifications.email}
              onChange={(e) =>
                update({ notifications: { ...draft.notifications, email: e.target.checked } })
              }
            />
            Notificări email
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.notifications.push}
              onChange={(e) =>
                update({ notifications: { ...draft.notifications, push: e.target.checked } })
              }
            />
            Notificări push
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.notifications.chat}
              onChange={(e) =>
                update({ notifications: { ...draft.notifications, chat: e.target.checked } })
              }
            />
            Notificări chat
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.notifications.matches}
              onChange={(e) =>
                update({ notifications: { ...draft.notifications, matches: e.target.checked } })
              }
            />
            Notificări match
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Siguranță & control"
        description="2FA, dispozitive active, logout global."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.security.twoFactorEnabled}
              onChange={(e) =>
                update({ security: { ...draft.security, twoFactorEnabled: e.target.checked } })
              }
            />
            2FA activ
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Metodă 2FA
            <select
              value={draft.security.method ?? "totp"}
              onChange={(e) =>
                update({
                  security: {
                    ...draft.security,
                    method: e.target.value as UserProfile["security"]["method"],
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="totp">TOTP</option>
              <option value="sms">SMS OTP</option>
              <option value="passkey">Passkey / WebAuthn</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.security.passkeysEnabled}
              onChange={(e) =>
                update({ security: { ...draft.security, passkeysEnabled: e.target.checked } })
              }
            />
            Activează passkeys pe device compatibil
          </label>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <Pill color="blue">Logout din toate sesiunile</Pill>
          <Pill color="amber">Raportare probleme</Pill>
        </div>
      </SectionCard>

      <SectionCard
        title="Reputație & tokeni"
        description="Date read-only despre activitatea ta."
        action={<Pill color="green">{draft.stats.reputation}</Pill>}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-zinc-500">Tokeni</p>
            <p className="text-xl font-bold">{draft.stats.tokens}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Swap-uri finalizate</p>
            <p className="text-xl font-bold">{draft.stats.completedSwaps}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Listări active</p>
            <p className="text-xl font-bold">{draft.stats.activeListings}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">Badge</p>
            <Badge tier={draft.badge} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Salvare profil"
        description="CTA explicit conform contractului. Salvarea este simulată în memorie pentru demo."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              await updateProfile(draft, { persist: true });
              setSaveMessage("Profil salvat (Supabase sau fallback local).");
            onClick={() => {
              updateProfile(draft);
              setSaveMessage("Profil salvat (demo) – persistă local în sesiune.");
            }}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Salvează
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => setSaveMessage("Eroare simulată: reîncearcă sau verifică conexiunea.")}
          >
            Simulează eroare
          </button>
        </div>
        {saveMessage ? (
          <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100">
            {lastError ? `${saveMessage} · ${lastError}` : saveMessage}
            {saveMessage}
          </div>
        ) : null}
      </SectionCard>

      <StateShowcase
        title="Stări PROFIL"
        states={[
          {
            key: "loading",
            title: "Se încarcă profilul",
            description: "Placeholder skeleton pentru câmpuri + badge vizibil până sosește payload-ul user.",
          },
          {
            key: "empty",
            title: "Profil incomplet",
            description: "Afișăm avertisment pentru lipsă locație și CTA de salvare. Datele lipsă nu blochează pagina.",
          },
          {
            key: "error",
            title: "Eroare la salvare",
            description: "Mesaj dedicat + recomandare retry; nu pierdem valorile completate în formular.",
          },
        ]}
      />
    </div>
  );
}
