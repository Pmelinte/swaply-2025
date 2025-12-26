"use client";

import { CTAButton, Pill, SectionCard, StateShowcase } from "@/components/ui";
import { MapPreview } from "@/components/MapPreview";
import { LoggedOutGate, MissingDataCallout } from "@/components/gated";
import { useAppState } from "@/lib/state";

export default function HomePage() {
  const { user, announcements, featureToggles, items } = useAppState();
  const hasLocation = Boolean(user?.location?.city);
  const hasItems = items.some((item) => item.ownerId === user?.id);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Descoperă oportunități de schimb în zona ta"
        description="Alege cum vrei să începi: explorează obiecte, caută pe hartă sau verifică match-urile tale."
        action={<CTAButton href="/objects">Vezi obiecte disponibile</CTAButton>}
      >
        {user ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Salut, {user.displayName}! Harta afișează doar utilizatorii Premium și Platinum. Badge-ul tău îți controlează vizibilitatea.
            </p>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <CTAButton href="/match" variant="ghost">
                Vezi match-urile tale
              </CTAButton>
              <CTAButton href="/objects">Adaugă un obiect</CTAButton>
              <CTAButton href="/change" variant="ghost">
                Monitorizează schimburile
              </CTAButton>
            </div>
          </div>
        ) : (
          <LoggedOutGate returnTo="/" />
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <SectionCard
          title="Hartă utilizatori activi"
          description="Pe hartă sunt evidențiați utilizatorii Premium și Platinum."
          action={<CTAButton href="/info" variant="ghost">Află beneficiile conturilor Premium</CTAButton>}
        >
          {!hasLocation && user ? (
            <MissingDataCallout
              title="Completează profilul și locația"
              message="Activează funcțiile bazate pe hartă adăugând locația aproximativă."
              cta={<CTAButton href="/profile">Deschide profil</CTAButton>}
            />
          ) : null}
          <MapPreview />
          {user?.badge === "free" ? (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              Apariția pe hartă este disponibilă pentru conturile Premium. Poți explora ofertele și iniția schimburi fără a fi vizibil public.
            </div>
          ) : null}
        </SectionCard>
        <div className="space-y-3">
          <SectionCard title="Anunțuri" description="Mesaje sistem, discrete și dismissible.">
            <div className="space-y-2">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`rounded-xl p-3 text-sm ${
                    ann.priority === "warning"
                      ? "bg-amber-50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                      : ann.priority === "success"
                        ? "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"
                        : "bg-zinc-50 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100"
                  }`}
                >
                  {ann.message}
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Stări & mesaje obligatorii">
            <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Funcție nouă disponibilă</li>
              <li>Profil incomplet – unele funcții sunt limitate</li>
              <li>Actualizare importantă cu prioritate peste conținut</li>
            </ul>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Ghid rapid" description="Home page este hub de orientare, fără swipe sau decizii finale.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Login preview</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Zonele publice sunt vizibile chiar și fără cont, cu CTA de autentificare.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">CTA recomandate</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Adaugă un obiect, caută pe hartă, vezi match-uri sau inițiază un swap.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Link-uri permise</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Profil & Setări, Beneficii Premium/Platinum, Match-uri, Obiecte, Chat, Termeni & Politici.</p>
          </div>
        </div>
      </SectionCard>

      {!hasItems && user ? (
        <MissingDataCallout
          title="Nu ai încă obiecte listate"
          message="Adaugă un obiect pentru a primi propuneri relevante."
          cta={<CTAButton href="/objects">Adaugă obiect</CTAButton>}
        />
      ) : null}

      {!featureToggles.aiEnabled ? (
        <SectionCard title="Fallback AI" description="Mod manual activ când serviciile AI sunt indisponibile.">
          <Pill color="amber">AI dezactivat</Pill>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Clasificarea și explicațiile se bazează pe regulile manuale pentru a nu bloca fluxurile critice.
          </p>
        </SectionCard>
      ) : (
        <SectionCard title="AI activ" description="Sugestiile de pe Home respectă contractul AI (server-side).">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Output AI este salvat ca metadata versionată și nu suprascrie preferințele finale ale utilizatorilor.
          </p>
        </SectionCard>
      )}

      <SectionCard
        title="Stări HOME"
        description="Loading / empty / error vizibile conform contractului. Nicio rută nu returnează 404 în flux normal."
      >
        <StateShowcase
          title="State obligatorii"
          states={[
            {
              key: "loading",
              title: "Se încarcă harta și feed-ul",
              description: "Afișăm skeleton + spinner discret pentru hartă și carduri până sosesc datele.",
            },
            {
              key: "empty",
              title: "Fără anunțuri sau date user",
              description: "Mesaj de empty state + CTA spre /login sau /profile pentru completare profil.",
            },
            {
              key: "error",
              title: "Eroare temporară la feed",
              description: "Mesaj clar, fără crash; permite relansarea acțiunii sau navigarea spre /info pentru status sistem.",
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
