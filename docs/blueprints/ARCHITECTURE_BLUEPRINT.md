# Swaply — Architecture Blueprint (Contract tehnic)

## 0) Sursa de adevăr
1) Excalidraw (UX + fluxuri + texte) = „documentul de adevăr”.
2) Programmatic spec export (verbatim) = „lista executabilă” de cerințe (ID-uri).
3) DB Baseline (RLS + grants + policies) = „adevărul tehnic al datelor”.

Regulă: dacă apar contradicții, se rezolvă explicit într-un commit/document (nu “interpretare din mers”).

## 1) Principii (non-negociabile)
- Un singur adevăr: o singură bază de date canonică, un singur repo canonic, un singur deployment “prod”.
- Nicio cheie secretă în client. Niciodată.
- “Unfinished” nu rupe build-ul: butoane disabled + mesaj (feature flags).
- Fără “fake_*” tabele. Demo data se face controlat (flag `is_demo` sau staging).
- RLS + least privilege: grants minimale, policies clare, TO authenticated unde e cazul.

## 2) Stack (asumat)
- Next.js (App Router) + React + TypeScript
- Supabase (Auth + Postgres + RLS)
- Cloudinary (media)
- AI: Hugging Face (clasificare imagine) + (opțional) alte servicii AI, DOAR server-side
- Hartă: provider TBD (privacy-first + cost control)

## 3) Structură proiect (convenție)
- `/app` — routing pages (Home/Objects/Match/Chat/Change/Info/Login/Profile)
- `/src/features/*` — logică pe domenii (items, matching, chat, swaps, profile, notifications)
- `/docs/*` — spec, blueprint, DB baseline, audit snapshots
- `/supabase/migrations/*` (dacă folosiți migrations versionate în repo)

Regulă: UI + logică se organizează pe features (nu “toate componentele într-un singur folder”).

## 4) Navigație & crom UI (din schemă)
- Bottom navigation persistentă (numită “footer” în schemă): Home / Objects / Match / Chat / Change / Info
- Sus: selector limbă (RO ▼) + meniul contextual (⋮)
- Info page accesibilă de oriunde.

## 5) Gating / Empty states (ca să nu pară “stricat”)
Orice pagină trebuie să aibă:
- stare “logged out” (preview + CTA login, păstrează return-to)
- stare “missing data” (ex: fără items/wishlist, fără swap) + un singur CTA “Următorul pas recomandat”
- fallback când AI e down (manual mode)

## 6) Data access (contract)
- Clientul NU face query-uri sensibile fără RLS corect.
- Pentru operații critice (ex: “confirm swap”, “token ledger”), folosește server actions / API routes.
- Cheile pentru Cloudinary/HF/alte servicii sunt DOAR în server runtime (Vercel env vars).

## 7) AI contract (pe scurt, tehnic)
- Calls doar server-side, cu timeout, retry controlat, dedupe (hash), caching.
- Moderare pentru text + imagini + atașamente (anti-abuz).
- Output AI salvat ca metadata versionată: provider/model_version/trace_id.
- Păstrează separat: `ai_suggested_*` vs `user_final_*`.
- Explainability: “De ce?” cu motive scurte, fără leak de date private.

## 8) Observability & “anti-mii de erori”
- CI: build + typecheck + lint + smoke tests.
- PR-uri mici, verificabile, cu checklist de acceptanță.
- Orice schimbare DB = migrare versionată + update DB_BASELINE.

## 9) Deployment
- Un singur proiect Vercel “prod” legat la repo canonic.
- Un proiect “staging” (recomandat) pentru demo data masivă / testare fără risc.
