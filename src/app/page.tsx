"use client";

import { CTAButton, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";
import { MapPreview } from "@/components/MapPreview";
import { LoggedOutGate, MissingDataCallout } from "@/components/gated";
import { useAppState } from "@/lib/state";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const { user, announcements, featureToggles, items } = useAppState();
  const t = useTranslations("home");
  const hasLocation = Boolean(user?.location?.city);
  const hasItems = items.some((item) => item.ownerId === user?.id);

  return (
    <div className="space-y-6">
      <SectionCard
        title={t("discoverOpportunities")}
        description={t("chooseHowToStart")}
        action={<CTAButton href="/objects">{t("viewAvailableObjects")}</CTAButton>}
      >
        {user ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {t("greeting", { name: user.displayName })}
            </p>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <CTAButton href="/match" variant="ghost">
                {t("analyzeMatches")}
              </CTAButton>
              <CTAButton href="/objects">{t("addObject")}</CTAButton>
              <CTAButton href="/change" variant="ghost">
                {t("monitorExchanges")}
              </CTAButton>
            </div>
          </div>
        ) : (
          <LoggedOutGate returnTo="/" />
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <SectionCard
          title={t("activeUsersMap")}
          description={t("mapDescription")}
          action={<CTAButton href="/info" variant="ghost">{t("learnPremiumBenefits")}</CTAButton>}
        >
          {!hasLocation && user ? (
            <MissingDataCallout
              title={t("completeProfileAndLocation")}
              message={t("completeProfileDescription")}
              cta={<CTAButton href="/profile">{t("openProfile")}</CTAButton>}
            />
          ) : null}
          <MapPreview />
          {user?.badge === "free" ? (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              {t("mapVisibilityNote")}
            </div>
          ) : null}
        </SectionCard>
        <div className="space-y-3">
          <SectionCard title={t("announcements")} description={t("announcementsDescription")}>
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
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Adauga un obiect, cauta pe harta, analizeaza potriviri sau propune un schimb.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Link-uri permise</h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Profil & Setari, Beneficii Premium/Platinum, Matching, Obiecte, Mesaje, Termeni & Politici.</p>
          </div>
        </div>
      </SectionCard>

      {!hasItems && user ? (
        <MissingDataCallout
          title={t("noListedObjects")}
          message={t("addObjectForProposals")}
          cta={<CTAButton href="/objects">{t("addObject")}</CTAButton>}
        />
      ) : null}

      {!featureToggles.aiEnabled ? (
        <SectionCard title={t("aiFallback")} description={t("manualModeActive")}>
          <Pill color="amber">{t("aiDisabled")}</Pill>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {t("aiDisabledDescription")}
          </p>
        </SectionCard>
      ) : (
        <SectionCard title={t("aiActive")} description={t("aiActiveDescription")}>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {t("aiOutputNote")}
          </p>
        </SectionCard>
      )}

      <NextStepRecommendation
        steps={
          user
            ? [
                { label: t("addObjectCta"), href: "/objects/new", description: t("addObjectCtaDescription") },
                { label: t("analyzeMatchesCta"), href: "/match", description: t("analyzeMatchesCtaDescription") },
                { label: t("exploreObjects"), href: "/objects", description: t("exploreObjectsDescription") },
              ]
            : [
                { label: t("loginCta"), href: "/login", description: t("loginCta") },
                { label: t("exploreObjectsGuest"), href: "/objects", description: t("exploreObjectsGuestDescription") },
              ]
        }
      />

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
