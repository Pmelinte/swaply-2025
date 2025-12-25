import Link from 'next/link';
import { Section } from '@/components/section';
import { getServerSession, getCurrentProfile } from '@/lib/auth';
import { FeaturePlaceholder } from '@/components/feature-placeholder';

export default async function HomePage() {
  const session = await getServerSession();
  const profile = await getCurrentProfile();

  const loggedOut = !session;

  return (
    <div className="space-y-4">
      <Section subtitle="Descoperă platforma de schimb de obiecte între persoane." title="Home">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold text-gray-900">Descoperă oportunități de schimb în zona ta.</h1>
          <p className="text-sm text-gray-700">
            Alege cum vrei să începi: explorează obiecte, caută pe hartă sau verifică match-urile tale.
          </p>
          {loggedOut ? (
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-lg bg-primary px-4 py-2 text-white" href="/login">
                Autentificare
              </Link>
              <Link className="rounded-lg border px-4 py-2 text-sm font-semibold" href="/objects">
                Vezi obiecte disponibile
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <Link className="rounded-lg bg-primary px-4 py-3 text-center text-white" href="/objects">
                Vezi obiecte disponibile
              </Link>
              <Link className="rounded-lg border px-4 py-3 text-center font-semibold" href="/match">
                Vezi match-urile tale
              </Link>
              <Link className="rounded-lg border px-4 py-3 text-center font-semibold" href="/change">
                Vezi harta utilizatorilor
              </Link>
              <Link className="rounded-lg border px-4 py-3 text-center font-semibold" href="/objects/new">
                Adaugă un obiect
              </Link>
            </div>
          )}
        </div>
      </Section>

      <Section
        subtitle="Harta este element central. Pin-urile publice doar pentru badge Premium/Platinum."
        title="Utilizatori activi în apropiere"
      >
        <FeaturePlaceholder
          description="Provider hartă TBD - TODO (NEDEFINIT ÎN DOCS). Interacțiunea cu harta nu declanșează swipe."
          id="HOME_PAGE-105"
          title="Harta utilizatorilor"
        />
      </Section>

      <Section subtitle="Badge vizibil în header și influențează vizibilitatea pe hartă." title="Badge utilizator">
        <div className="space-y-2 rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-700">
            Statut curent: <span className="font-semibold">{profile?.badge_level ?? 'free'}</span>
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>Free: badge simplu, neutru.</li>
            <li>Premium: badge evidențiat (culoare distinctă).</li>
            <li>Platinum: badge special (culoare + icon subtil).</li>
          </ul>
          <Link className="text-sm font-semibold text-primary" href="/profile">
            Beneficii cont
          </Link>
        </div>
      </Section>

      <Section subtitle="Banner cookies + link manage cookies vizibil." title="Cookies & Anunțuri">
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          Banner cookies trebuie afișat pe Home; implementarea completă de preferințe este TODO (NEDEFINIT ÎN DOCS) dar linkul
          “Manage cookies” duce către Info.
        </div>
      </Section>
    </div>
  );
}
