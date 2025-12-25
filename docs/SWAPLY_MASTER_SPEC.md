# SWAPLY MASTER SPEC (canonical, full merge)

## Scope & Principii (sursa de adevăr și reguli non-negociabile)

### Din docs/README.md
# Swaply — Docs Index (Start here)

## Source of Truth
1) Excalidraw UX/Flows: `/docs/design/` (canonical)
2) Programmatic Spec (verbatim, ID-based): `/docs/spec/`
3) Blueprints (implementation contracts): `/docs/blueprints/`
4) DB baseline (RLS/grants/policies contract): `/docs/db/`

## What a developer/agent must do
- Implement features by referencing the Programmatic Spec IDs (no omissions).
- Respect DB Baseline: RLS ON + least privilege grants.
- No fake tables. Demo data uses `is_demo` or staging.
- Unfinished = disabled gracefully (never break build).
- Keys/server-only for all external services.

## Files
- Architecture Blueprint: `/docs/blueprints/ARCHITECTURE_BLUEPRINT.md`
- Data Model & RLS Blueprint: `/docs/blueprints/DATA_MODEL_RLS_BLUEPRINT.md`
- Acceptance Matrix: `/docs/blueprints/ACCEPTANCE_MATRIX.md`
- DB Baseline: `/docs/db/DB_BASELINE.md`


### Din ARCHITECTURE_BLUEPRINT.md
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


## Glosar entități (conform contractelor existente)

- categories — tabel canonic (detalii în secțiunea Data model & DB contract)
- items — tabel canonic (detalii în secțiunea Data model & DB contract)
- messages — tabel canonic (detalii în secțiunea Data model & DB contract)
- notifications — tabel canonic (detalii în secțiunea Data model & DB contract)
- profiles — tabel canonic (detalii în secțiunea Data model & DB contract)
- swap_intents — tabel canonic (detalii în secțiunea Data model & DB contract)
- swaps — tabel canonic (detalii în secțiunea Data model & DB contract)
- Alte entități, cum apar în Programmatic Spec (IDs și comportamente complete) — vezi secțiunea "UI Pages & Routes — Programmatic Spec (verbatim)".
- Definiții suplimentare / contracte entități specifice nu sunt separate în alte fișiere; pentru orice câmp sau rol explicit, consultați spec-ul programatic inclus integral mai jos. Dacă ați identifica entități suplimentare care nu apar aici, marcați ca NEDEFINIT ÎN DOCS și ridicați întrebare.

## User flows (cap-coadă, fără omisiuni)

- Fluxurile complete, stările, validările, erorile, permisiunile și edge-case-urile sunt descrise detaliat în Programmatic Spec (IDs) inclusă mai jos, care acoperă Home, Login, Profile, Objects, Matching, Chat, Swap/Change, Info și orice alte ecrane menționate.
- Acceptanța și gating-urile suplimentare sunt descrise în ACCEPTANCE_MATRIX.md (inclus integral mai jos) și în principiile din blueprint-uri.

## UI Pages & Routes — Programmatic Spec (verbatim, fără omisiuni)

### swaply_programmatic_spec.md
# Swaply — Programmatic Spec (verbatim export)

- Source: `Swaply-2025-12-25-1702.excalidraw`
- Generated at: `2025-12-25T16:46:52`

---


## Home page

_BBox: x=417, y=219, w=554, h=800_

- **HOME_PAGE-001** — RO ▼
- **HOME_PAGE-002** — ⋮
- **HOME_PAGE-003** — Nelogat
- **HOME_PAGE-004** — RO ▼
- **HOME_PAGE-005** — ⋮
- **HOME_PAGE-006** — Logat
- **HOME_PAGE-007** — BADGE UTILIZATOR — HOME PAGE (LOGAT)
- **HOME_PAGE-008** — Afișare:
- **HOME_PAGE-009** — Toate paginile
- **HOME_PAGE-010** — - Badge vizibil lângă avatar / nume utilizator (sus, discret).
- **HOME_PAGE-011** — - Niveluri:
- **HOME_PAGE-012** — • Free
- **HOME_PAGE-013** — • Premium
- **HOME_PAGE-014** — UI: preview blurat + CTA
- **HOME_PAGE-015** — • Platinum
- **HOME_PAGE-016** — Rol badge:
- **HOME_PAGE-017** — - Indică statutul contului.
- **HOME_PAGE-018** — - Creează diferențiere vizuală și aspirațională.
- **HOME_PAGE-019** — - Este vizibil utilizatorului și celorlalți (unde e cazul).
- **HOME_PAGE-020** — Reguli:
- **HOME_PAGE-021** — - Free: badge simplu, neutru.
- **HOME_PAGE-022** — - Premium: badge evidențiat (culoare distinctă).
- **HOME_PAGE-023** — - Platinum: badge special (culoare + icon subtil).
- **HOME_PAGE-024** — Interacțiune:
- **HOME_PAGE-025** — - Click pe badge → deschide pagină / modal „Beneficii cont”.
- **HOME_PAGE-026** — - Pentru Free: explică avantajele Premium / Platinum.
- **HOME_PAGE-027** — - Pentru Premium / Platinum: afișează beneficiile active.
- **HOME_PAGE-028** — Legătură cu hartă:
- **HOME_PAGE-029** — - Doar utilizatorii Premium și Platinum sunt afișați ca pini publici pe hartă.
- **HOME_PAGE-030** — - Tipul de pin reflectă nivelul badge-ului (Premium vs Platinum).
- **HOME_PAGE-031** — Notă:
- **HOME_PAGE-032** — Badge-ul este informativ și aspirațional, nu intruziv.
- **HOME_PAGE-033** — HOME PAGE — ZONA LOGAT (SPEC)
- **HOME_PAGE-034** — - Descoperă platforma de schimb 
   de obiecte între persoane.
- **HOME_PAGE-035** — neimplementat = disabled, nu 404, nu crash
- **HOME_PAGE-036** — Mesaj principal (sus):
- **HOME_PAGE-037** — „Descoperă oportunități de schimb în zona ta.”
- **HOME_PAGE-038** — Sub-mesaj:
- **HOME_PAGE-039** — - Vezi exemple de obiecte oferite și dorite.
- **HOME_PAGE-040** — „Alege cum vrei să începi: explorează obiecte, caută pe hartă sau verifică match-urile tale.”
- **HOME_PAGE-041** — - Înțelege cum funcționează schimbul fără bani.
- **HOME_PAGE-042** — CTA-uri principale:
- **HOME_PAGE-043** — - Vezi harta utilizatorilor (preview).
- **HOME_PAGE-044** — - „Vezi obiecte disponibile” → pagina Obiecte (swipe)
- **HOME_PAGE-045** — - „Caută pe hartă” → focus hartă + filtre
- **HOME_PAGE-046** — - „Vezi match-urile tale” → Match page
- **HOME_PAGE-047** — - „Adaugă un obiect” → flux adăugare obiect
- **HOME_PAGE-048** — HOME PAGE — REGULI FINALE & INDICAȚII PENTRU DEVELOPER
- **HOME_PAGE-049** — 1) Rolul paginii
- **HOME_PAGE-050** — 5) Hartă — reguli clare
- **HOME_PAGE-051** — - Home page LOGAT este hub de orientare.
- **HOME_PAGE-052** — - Harta este element central.
- **HOME_PAGE-053** — - Nu conține swipe, formulare complexe sau decizii finale.
- **HOME_PAGE-054** — - Afișează implicit doar utilizatori Premium & Platinum.
- **HOME_PAGE-055** — - Orice acțiune majoră redirecționează către o pagină dedicată.
- **HOME_PAGE-056** — - Pin-urile sunt anonimizate conform setărilor din Profil.
- **HOME_PAGE-057** — 2) Anunțuri / mesaje sistem (zona discretă)
- **HOME_PAGE-058** — - Dacă densitatea este mică:
- **HOME_PAGE-059** — - Mesaje temporare de tip:
- **HOME_PAGE-060** — • se afișează fallback vizual (zone / talciocuri / exemple)
- **HOME_PAGE-061** — • „Funcție nouă disponibilă”
- **HOME_PAGE-062** — - Interacțiunea cu harta NU declanșează swipe.
- **HOME_PAGE-063** — Autentificare
Creează cont
- **HOME_PAGE-064** — • „Actualizare importantă”
- **HOME_PAGE-065** — 6) Badge & statut
- **HOME_PAGE-066** — • „Profil incomplet – unele funcții sunt limitate”
- **HOME_PAGE-067** — - Badge-ul (Free / Premium / Platinum) este vizibil în header.
- **HOME_PAGE-068** — - Anunțurile sunt:
- **HOME_PAGE-069** — - Click pe badge → pagină informativă beneficii.
- **HOME_PAGE-070** — • non-intruzive
- **HOME_PAGE-071** — - Badge-ul influențează vizibilitatea pe hartă.
- **HOME_PAGE-072** — • dismissible
- **HOME_PAGE-073** — 7) Frâne & mesaje obligatorii
- **HOME_PAGE-074** — • cu prioritate față de conținutul dinamic
- **HOME_PAGE-075** — - Fără locație:
- **HOME_PAGE-076** — 3) Link-uri permise pe Home (LOGAT)
- **HOME_PAGE-077** — „Completează profilul și locația pentru a activa funcțiile bazate pe hartă.”
- **HOME_PAGE-078** — - Profil & Setări
- **HOME_PAGE-079** — - Fără obiecte:
- **HOME_PAGE-080** — - Beneficii Premium / Platinum
- **HOME_PAGE-081** — „Adaugă un obiect pentru a primi propuneri relevante.”
- **HOME_PAGE-082** — - Match-uri
- **HOME_PAGE-083** — 8) Reguli tehnice (anti-haos)
- **HOME_PAGE-084** — - Obiecte
- **HOME_PAGE-085** — - Home page NU scrie direct date critice în DB.
- **HOME_PAGE-086** — → Autentifică-te
- **HOME_PAGE-087** — - Chat
- **HOME_PAGE-088** — - Home page consumă date agregate (read-only).
- **HOME_PAGE-089** — - Termeni & Condiții (link discret, persistent)
- **HOME_PAGE-090** — - Toate redirecționările respectă starea profilului (onboarding first).
- **HOME_PAGE-091** — - Politica de confidențialitate (link discret)
- **HOME_PAGE-092** — - Selectorul de limbă este global și independent de Home.
- **HOME_PAGE-093** — 4) Ce NU apare pe Home
- **HOME_PAGE-094** — 9) Evoluție viitoare (dezactivată în beta)
- **HOME_PAGE-095** — - Setări detaliate
- **HOME_PAGE-096** — - Anunțuri sponsorizate (doar contextual, fără feed agresiv)
- **HOME_PAGE-097** — - Formulare lungi
- **HOME_PAGE-098** — - Evidențiere evenimente / talciocuri locale
- **HOME_PAGE-099** — - Export date
- **HOME_PAGE-100** — - Promoții Premium limitate în timp
- **HOME_PAGE-101** — - Acțiuni critice (ștergere cont etc.)
- **HOME_PAGE-102** — REGULĂ FINALĂ:
- **HOME_PAGE-103** — - Joc / gamification avansat
- **HOME_PAGE-104** — Home page trebuie să fie rapid de înțeles în <10 secunde de la login.
- **HOME_PAGE-105** — Zona hartă:
- **HOME_PAGE-106** — Titlu: „Utilizatori activi în apropierea ta”
- **HOME_PAGE-107** — Text informativ fix: „Pe hartă sunt evidențiați utilizatorii Premium și Platinum.”
- **HOME_PAGE-108** — Link opțional: „Află beneficiile conturilor Premium”
- **HOME_PAGE-109** — Mesaj pentru user FREE (condițional):
- **HOME_PAGE-110** — „Apariția ta pe hartă este disponibilă pentru conturile Premium. Poți explora ofertele și iniția schimburi fără a fi vizibil public.”
- **HOME_PAGE-111** — HOME — HARTĂ (Map provider (TBD) — privacy-first + cost control) — REGULI COST/DATE
- **HOME_PAGE-112** — Mesaj de frână (profil / locație incompletă):
- **HOME_PAGE-113** — Decizie:
- **HOME_PAGE-114** — „Completează profilul și locația pentru a activa funcțiile bazate pe hartă.”
- **HOME_PAGE-115** — - Folosim Map provider (TBD) — privacy-first + cost control pentru hartă (UI).
- **HOME_PAGE-116** — → buton către Profil page
- **HOME_PAGE-117** — - NU folosim geocoding/reverse-geocoding în beta (cost + GDPR + complexitate).
- **HOME_PAGE-118** — Regulă:
- **HOME_PAGE-119** — NELOGAT (Home):
- **HOME_PAGE-120** — Home page LOGAT este hub de orientare și lansare de fluxuri. Swipe-ul se face exclusiv pe pagina Obiecte.
- **HOME_PAGE-121** — - Hartă = preview read-only (pan/zoom permis opțional).
- **HOME_PAGE-122** — - Afișează doar markeri agregati / aproximativi (ex: oraș/zonă), fără locații exacte.
- **HOME_PAGE-123** — - Fără click pe utilizatori / fără date personale.
- **HOME_PAGE-124** — - Dacă se cere locație device → doar după consimțământ (opțional); altfel nu cerem.
- **HOME_PAGE-125** — LOGAT:
- **HOME_PAGE-126** — - Hartă interactivă, dar respectă setările de vizibilitate din Profil.
- **HOME_PAGE-127** — - Locație utilizator: doar aproximativ (ex: oraș sau “within radius”), nu coordonate exacte publice.
- **HOME_PAGE-128** — Date & DB:
- **HOME_PAGE-129** — - În profil salvăm manual: țară/județ/oraș + (opțional) coordonate lat/lng introduse din UI.
- **HOME_PAGE-130** — - Fără transformări adresă→coord (geocoding) și fără coord→adresă (reverse).
- **HOME_PAGE-131** — Accept / Manage / Reject” + link către Info > Cookies
- **HOME_PAGE-132** — Fallback:
- **HOME_PAGE-133** — - Dacă Maps API nu e disponibil: afișăm placeholder “Hartă indisponibilă” + nu blocăm restul Home.
- **HOME_PAGE-134** — NAVIGAȚIE GLOBALĂ — FOOTER
- **HOME_PAGE-135** — Footer-ul este afișat pe toate paginile aplicației.
- **HOME_PAGE-136** — Conține următoarele pagini:
- **HOME_PAGE-137** — Home / Objects / Match / Chat / Change / Info
- **HOME_PAGE-138** — Map provider (TBD) — privacy-first + cost control
- **HOME_PAGE-139** — Reguli:
- **HOME_PAGE-140** — Map provider (TBD) — privacy-first + cost control
- **HOME_PAGE-141** — - Pagina curentă este marcată vizual.
- **HOME_PAGE-142** — - Navigația este identică pe toate paginile.
- **HOME_PAGE-143** — - Accesarea unei pagini verifică starea utilizatorului (login, profil complet).
- **HOME_PAGE-144** — Home page
- **HOME_PAGE-145** — - Dacă o condiție nu este îndeplinită, se afișează mesaj explicativ și redirect.

## Login page

_BBox: x=42.740035155401756, y=595.4566638742727, w=321.1984452038714, h=430.4385255523962_

- **LOGIN_PAGE-001** — RO ▼
- **LOGIN_PAGE-002** — Autentificare 
 Înregistrare 
 Reset parolă
- **LOGIN_PAGE-003** — LOGIN PAGE — SPEC + REGULI
- **LOGIN_PAGE-004** — A) Ecrane / moduri
- **LOGIN_PAGE-005** — - Autentificare (email + parolă)
- **LOGIN_PAGE-006** — - Înregistrare (email + parolă + confirmare parolă)
- **LOGIN_PAGE-007** — - Reset parolă (email)
- **LOGIN_PAGE-008** — - Confirmare email (după înregistrare) – dacă e cazul
- **LOGIN_PAGE-009** — - Setare parolă nouă (după reset) – link token
- **LOGIN_PAGE-010** — B) Reguli navigație
- **LOGIN_PAGE-011** — - Dacă user e deja LOGAT → redirect la Profil page.
- **LOGIN_PAGE-012** — - După login reușit → redirect la Profil page.
- **LOGIN_PAGE-013** — - Dacă user vine din CTA de pe o pagină: păstrează „returnTo” și redirecționează înapoi după login.
- **LOGIN_PAGE-014** — C) Legal (obligatoriu)
- **LOGIN_PAGE-015** — - Link permanent către Termeni & Condiții + Politica GDPR.
- **LOGIN_PAGE-016** — - La înregistrare: checkbox obligatoriu de acceptare (T&C + GDPR).
- **LOGIN_PAGE-017** — - Persistă consimțământul: timestamp + versiune document (și IP opțional).
- **LOGIN_PAGE-018** — D) Validări / UX
- **LOGIN_PAGE-019** — - Mesaje clare pentru erori (email invalid, parolă greșită, cont inexistent).
- **LOGIN_PAGE-020** — - Rate limit / protecție brute force (minim).
- **LOGIN_PAGE-021** — - „Ține-mă minte” (opțional) sau sesiune standard.
- **LOGIN_PAGE-022** — LOGIN PAGE — SPEC FINAL (SINTETIZAT)
- **LOGIN_PAGE-023** — 1) Metode de autentificare (UI)
- **LOGIN_PAGE-024** — A) Email + parolă (default, obligatoriu)
- **LOGIN_PAGE-025** — B) Google (SSO)
- **LOGIN_PAGE-026** — C) Telefon (OTP) (opțional)
- **LOGIN_PAGE-027** — Home (NELOGAT)
- **LOGIN_PAGE-028** — 2) 2FA / Nivel superior (pas suplimentar DUPĂ login)
- **LOGIN_PAGE-029** — - 2FA nu este metodă de login, ci pas de confirmare.
- **LOGIN_PAGE-030** — → Login page (identitate)
- **LOGIN_PAGE-031** — - Metode 2FA:
- **LOGIN_PAGE-032** — → Profil page (configurare obligatorie)
- **LOGIN_PAGE-033** — A) Authenticator TOTP (preferat)
- **LOGIN_PAGE-034** — B) SMS OTP (acceptat, cu cost)
- **LOGIN_PAGE-035** — → Home (LOGAT)
- **LOGIN_PAGE-036** — C) Passkey / WebAuthn (preferat pe device compatibil)
- **LOGIN_PAGE-037** — → Objects page (prima acțiune recomandată)
- **LOGIN_PAGE-038** — - Email OTP este permis doar ca fallback (opțional, nu “strong”).
- **LOGIN_PAGE-039** — Când se cere 2FA:
- **LOGIN_PAGE-040** — → orice altă pagină
- **LOGIN_PAGE-041** — - dacă user a activat 2FA în setări
- **LOGIN_PAGE-042** — - pentru acțiuni critice: ștergere cont, export date, schimbare email/parolă/telefon
- **LOGIN_PAGE-043** — Persistență / DB:
- **LOGIN_PAGE-044** — Home (LOGAT)
- **LOGIN_PAGE-045** — - 2FA_enabled (boolean)
- **LOGIN_PAGE-046** — - 2FA_method (totp | sms | passkey)
- **LOGIN_PAGE-047** — - NU se salvează coduri OTP
- **LOGIN_PAGE-048** — → orice pagină
- **LOGIN_PAGE-049** — - Se salvează doar secret TOTP (criptat) sau credential ID (passkey)
- **LOGIN_PAGE-050** — 3) Passkeys / Biometric
- **LOGIN_PAGE-051** — - Tratate ca “Passkey (WebAuthn)”
- **LOGIN_PAGE-052** — - Pot înlocui parola pe device compatibil
- **LOGIN_PAGE-053** — - NU se amestecă cu fluxul basic de login
- **LOGIN_PAGE-054** — 4) Legal (obligatoriu)
- **LOGIN_PAGE-055** — - Link permanent către Termeni & Condiții + Politica GDPR
- **LOGIN_PAGE-056** — - La înregistrare: checkbox obligatoriu de acceptare
- **LOGIN_PAGE-057** — - Consimțământ persistat: timestamp + versiune document (IP opțional)
- **LOGIN_PAGE-058** — Notă de implementare:
- **LOGIN_PAGE-059** — - Toate metodele sunt definite în schemă.
- **LOGIN_PAGE-060** — - Activarea lor poate fi graduală (beta → production) fără refactor UI.
- **LOGIN_PAGE-061** — Login page

## Profil page

_BBox: x=580.6933183227591, y=1056.4912938525083, w=491.97193895411243, h=665.5333180484329_

- **PROFIL_PAGE-001** — RO ▼
- **PROFIL_PAGE-002** — Autentificare 
 Înregistrare 
 Reset parolă
- **PROFIL_PAGE-003** — 1️⃣ Identitate publică
- **PROFIL_PAGE-004** — - ce vede
- **PROFIL_PAGE-005** — 6️⃣ Setări de vizibilitate
- **PROFIL_PAGE-006** — - Nume afișat
- **PROFIL_PAGE-007** — - Profil public / privat
- **PROFIL_PAGE-008** — - Prenume (opțional)
- **PROFIL_PAGE-009** — - Obiecte vizibile public / doar match-uri
- **PROFIL_PAGE-010** — - ce poate edita
- **PROFIL_PAGE-011** — - Poză profil (avatar)
- **PROFIL_PAGE-012** — - Locație exactă vizibilă (da / nu)
- **PROFIL_PAGE-013** — - Descriere scurtă (bio)
- **PROFIL_PAGE-014** — - Ultima activitate vizibilă (da / nu)
- **PROFIL_PAGE-015** — - ce poate salva
- **PROFIL_PAGE-016** — - Limbi vorbite
- **PROFIL_PAGE-017** — 7️⃣ Notificări
- **PROFIL_PAGE-018** — 2️⃣ Localizare
- **PROFIL_PAGE-019** — - Notificări email
- **PROFIL_PAGE-020** — - Țară
- **PROFIL_PAGE-021** — - Notificări push
- **PROFIL_PAGE-022** — - Județ / regiune
- **PROFIL_PAGE-023** — Profil page – LOGAT
- **PROFIL_PAGE-024** — - Notificări chat
- **PROFIL_PAGE-025** — - Oraș / localitate
- **PROFIL_PAGE-026** — - Notificări match
- **PROFIL_PAGE-027** — Poză profil (avatar)
- **PROFIL_PAGE-028** — [Identitate]
- **PROFIL_PAGE-029** — - Cod poștal (opțional)
- **PROFIL_PAGE-030** — - Notificări schimb acceptat / refuzat
- **PROFIL_PAGE-031** — - upload local (poză)
- **PROFIL_PAGE-032** — - Coordonate (lat / lng – intern)
- **PROFIL_PAGE-033** — [Localizare]
- **PROFIL_PAGE-034** — 8️⃣ Siguranță & control
- **PROFIL_PAGE-035** — - Rază maximă de deplasare
- **PROFIL_PAGE-036** — - link extern (URL)
- **PROFIL_PAGE-037** — - Schimbare parolă
- **PROFIL_PAGE-038** — [Preferințe schimb]
- **PROFIL_PAGE-039** — 3️⃣ Contact & autentificare
- **PROFIL_PAGE-040** — - Dispozitive active
- **PROFIL_PAGE-041** — - avatar generat (fallback)
- **PROFIL_PAGE-042** — - Email (principal)
- **PROFIL_PAGE-043** — [Logistică]
- **PROFIL_PAGE-044** — - Logout din toate sesiunile
- **PROFIL_PAGE-045** — - Email secundar (opțional)
- **PROFIL_PAGE-046** — 1️⃣ Upload local
- **PROFIL_PAGE-047** — - Raportare probleme
- **PROFIL_PAGE-048** — [Setări]
- **PROFIL_PAGE-049** — – poză încărcată de utilizator
- **PROFIL_PAGE-050** — - Telefon (opțional)
- **PROFIL_PAGE-051** — – este varianta principală
- **PROFIL_PAGE-052** — 9️⃣ Stare, reputație, istoric (read-only)
- **PROFIL_PAGE-053** — - Metodă autentificare (email / social / etc)
- **PROFIL_PAGE-054** — [Reputație – read-only]
- **PROFIL_PAGE-055** — 2️⃣ Link extern (URL)
- **PROFIL_PAGE-056** — - Număr obiecte oferite
- **PROFIL_PAGE-057** — – pentru cei care au deja poză (ex: site personal)
- **PROFIL_PAGE-058** — (nu se editează, nu se șterge)
- **PROFIL_PAGE-059** — - Ultima autentificare (read-only)
- **PROFIL_PAGE-060** — [Acțiuni critice]
- **PROFIL_PAGE-061** — – nu obligi upload
- **PROFIL_PAGE-062** — - Număr obiecte schimbate
- **PROFIL_PAGE-063** — 4️⃣ Preferințe de schimb
- **PROFIL_PAGE-064** — 3️⃣ Avatar generat automat (fallback)
- **PROFIL_PAGE-065** — - Schimburi finalizate
- **PROFIL_PAGE-066** — – inițiale / icon / culoare
- **PROFIL_PAGE-067** — - Categorii obiecte oferite
- **PROFIL_PAGE-068** — – apare dacă nu există poză
- **PROFIL_PAGE-069** — - Schimburi anulate
- **PROFIL_PAGE-070** — PROFIL PAGE — NOTE PENTRU DEVELOPER
- **PROFIL_PAGE-071** — - Categorii obiecte dorite
- **PROFIL_PAGE-072** — 👉 Un singur avatar activ la un moment dat.
- **PROFIL_PAGE-073** — - Rating primit
- **PROFIL_PAGE-074** — 1) Persistență / DB
- **PROFIL_PAGE-075** — - Acceptă schimb multiplu (da / nu)
- **PROFIL_PAGE-076** — 👉 Redimensionare imagine la dimensiunea cadrului
- **PROFIL_PAGE-077** — - Toate câmpurile de profil se salvează în DB (profil = “source of truth” pentru user).
- **PROFIL_PAGE-078** — - Badge-uri / nivel
- **PROFIL_PAGE-079** — - Acceptă diferență de valoare (da / nu)
- **PROFIL_PAGE-080** — - Email = unic (index). Telefon = unic opțional (index).
- **PROFIL_PAGE-081** — Poză profil
- **PROFIL_PAGE-082** — - Data creării contului
- **PROFIL_PAGE-083** — - Localizare: păstrează și text (țară/județ/oraș) + coordonate (lat/lng) pentru că vor fi folosite la query (matching geografic).
- **PROFIL_PAGE-084** — Formate acceptate: JPG, PNG, WEBP
- **PROFIL_PAGE-085** — - Acceptă doar schimb local / și transport
- **PROFIL_PAGE-086** — [ i ]
- **PROFIL_PAGE-087** — 🔟 Acțiuni critice
- **PROFIL_PAGE-088** — - Categorii oferite/dorite = listă multi-select (relație many-to-many), NU text liber.
- **PROFIL_PAGE-089** — 5️⃣ Logistică & predare
- **PROFIL_PAGE-090** — 2) Avatar / Foto profil
- **PROFIL_PAGE-091** — Upload local: imagine reală
- **PROFIL_PAGE-092** — - Dezactivare cont
- **PROFIL_PAGE-093** — - Metode de predare acceptate:
- **PROFIL_PAGE-094** — - Suportă: upload local (imagine), link extern (URL imagine public), fallback avatar generat automat.
- **PROFIL_PAGE-095** — - Ștergere cont (hard delete)
- **PROFIL_PAGE-096** — - față în față
- **PROFIL_PAGE-097** — Link extern: URL imagine public
- **PROFIL_PAGE-098** — - Un singur avatar activ la un moment dat.
- **PROFIL_PAGE-099** — - Export date personale
- **PROFIL_PAGE-100** — - curier
- **PROFIL_PAGE-101** — - Redimensionare automată (ex: max 512px) + păstrare aspect.
- **PROFIL_PAGE-102** — - Formate acceptate: JPG, PNG, WEBP.
- **PROFIL_PAGE-103** — - punct intermediar
- **PROFIL_PAGE-104** — PROFIL PAGE — LOCAȚIE & HARTĂ (OBLIGATORIU)
- **PROFIL_PAGE-105** — GDPR:
- **PROFIL_PAGE-106** — 3) Reputație / Statistici (READ-ONLY)
- **PROFIL_PAGE-107** — - Disponibilitate orară
- **PROFIL_PAGE-108** — - Drept de acces (export date) — deja acoperit
- **PROFIL_PAGE-109** — Scop:
- **PROFIL_PAGE-110** — - Reputația și statisticile NU se editează din profil.
- **PROFIL_PAGE-111** — - Note pentru predare
- **PROFIL_PAGE-112** — - Sunt derivate din alte entități (schimburi/match-uri etc) și doar afișate.
- **PROFIL_PAGE-113** — - Drept de ștergere (delete cont) — deja acoperit
- **PROFIL_PAGE-114** — Profil page este locul unde utilizatorul:
- **PROFIL_PAGE-115** — 4) Import / Export (Acțiuni critice)
- **PROFIL_PAGE-116** — - Drept de rectificare (edit profil)
- **PROFIL_PAGE-117** — - Export date personale: profil + preferințe + activitate (minim).
- **PROFIL_PAGE-118** — - setează locația
- **PROFIL_PAGE-119** — - Drept de retragere consimțământ → dezactivare cont
- **PROFIL_PAGE-120** — - Import date profil (opțional): doar pentru restaurare (profil/avatare/preferințe), fără date tranzacționale.
- **PROFIL_PAGE-121** — - vede CUM va apărea pe hartă
- **PROFIL_PAGE-122** — 5) Vizibilitate & notificări
- **PROFIL_PAGE-123** — - Vizibilitatea (public/privat, locație exactă, ultima activitate) trebuie salvată și aplicată peste tot.
- **PROFIL_PAGE-124** — - înțelege beneficiile funcțiilor bazate pe locație
- **PROFIL_PAGE-125** — - Notificări (email/push/chat/match/schimb) = setări persistente.
- **PROFIL_PAGE-126** — - controlează nivelul de siguranță (anonimizare)
- **PROFIL_PAGE-127** — 6) Siguranță
- **PROFIL_PAGE-128** — ────────────────────────
- **PROFIL_PAGE-129** — - Schimbare parolă / logout din toate sesiunile / dispozitive active = funcții separate, dar entry point în Profil.
- **PROFIL_PAGE-130** — 1) Mini preview hartă (Map provider (TBD) — privacy-first + cost control)
- **PROFIL_PAGE-131** — PROFIL PAGE — ACȚIUNI (UI + REGULI)
- **PROFIL_PAGE-132** — A) Butoane principale
- **PROFIL_PAGE-133** — - Afișează o mini-hartă cu pin (preview).
- **PROFIL_PAGE-134** — - Salvează modificări
- **PROFIL_PAGE-135** — - Pin-ul reprezintă locația APROXIMATIVĂ, nu adresa exactă.
- **PROFIL_PAGE-136** — - activ doar dacă există schimbări (dirty state)
- **PROFIL_PAGE-137** — - validare înainte de save; afișează erori pe câmpuri
- **PROFIL_PAGE-138** — - Text clar: “Așa vei apărea pe hartă”.
- **PROFIL_PAGE-139** — - la succes: mesaj “Salvat” + update UI
- **PROFIL_PAGE-140** — Interacțiuni:
- **PROFIL_PAGE-141** — - Anulează / Revino
- **PROFIL_PAGE-142** — - utilizatorul poate ajusta zona / muta pin-ul (opțional)
- **PROFIL_PAGE-143** — - revine la ultima stare salvată (reset form)
- **PROFIL_PAGE-144** — B) Avatar / Foto profil
- **PROFIL_PAGE-145** — - modificările se reflectă imediat în preview
- **PROFIL_PAGE-146** — - Încarcă poză (Upload)
- **PROFIL_PAGE-147** — ────────────────────────
- **PROFIL_PAGE-148** — 2) Rază de anonimizare (control utilizator)
- **PROFIL_PAGE-149** — - acceptă doar JPG/PNG/WEBP
- **PROFIL_PAGE-150** — - Selector rază (ex: 2 km – 5 km – 10 km – 25 km)
- **PROFIL_PAGE-151** — - la succes: setează avatarul ca activ
- **PROFIL_PAGE-152** — - Explicație vizuală (cerc pe hartă)
- **PROFIL_PAGE-153** — - Setează link (URL)
- **PROFIL_PAGE-154** — - validează că este URL public către imagine
- **PROFIL_PAGE-155** — - Text clar:
- **PROFIL_PAGE-156** — - la succes: setează avatarul ca activ
- **PROFIL_PAGE-157** — “Cu cât raza este mai mare, cu atât locația ta este mai sigură,
- **PROFIL_PAGE-158** — - Șterge poză / Reset avatar
- **PROFIL_PAGE-159** — - revine la avatar generat automat (fallback)
- **PROFIL_PAGE-160** — dar rezultatele pot fi mai puțin precise.”
- **PROFIL_PAGE-161** — ────────────────────────
- **PROFIL_PAGE-162** — - șterge referința din DB + (opțional) din storage
- **PROFIL_PAGE-163** — 3) Informare explicită — DE CE e necesară locația
- **PROFIL_PAGE-164** — C) Sesiune / cont
- **PROFIL_PAGE-165** — Bloc informativ (nu ascuns, nu tehnic):
- **PROFIL_PAGE-166** — - Logout
- **PROFIL_PAGE-167** — - închide sesiunea curentă și redirecționează la Home (NELOGAT)
- **PROFIL_PAGE-168** — - Locația este folosită pentru:
- **PROFIL_PAGE-169** — - Logout din toate sesiunile (Security)
- **PROFIL_PAGE-170** — ✔ căutare geografică
- **PROFIL_PAGE-171** — - invalidează toate sesiunile active (securitate)
- **PROFIL_PAGE-172** — D) Acțiuni critice (confirmări)
- **PROFIL_PAGE-173** — ✔ propuneri AI de matching
- **PROFIL_PAGE-174** — - Dezactivează cont
- **PROFIL_PAGE-175** — ✔ sugestii loc întâlnire
- **PROFIL_PAGE-176** — - necesită confirmare (modal + parolă/confirm text)
- **PROFIL_PAGE-177** — - Șterge cont (hard delete)
- **PROFIL_PAGE-178** — ✔ sugestii curieri / transport
- **PROFIL_PAGE-179** — - necesită confirmare dublă; avertizează că este ireversibil
- **PROFIL_PAGE-180** — ✔ descoperire de locuri / experiențe
- **PROFIL_PAGE-181** — - Export date personale
- **PROFIL_PAGE-182** — - Fără locație:
- **PROFIL_PAGE-183** — - generează fișier (JSON/ZIP) cu profil + preferințe + activitate minimă
- **PROFIL_PAGE-184** — 7) Legal / GDPR / Consimțământ
- **PROFIL_PAGE-185** — ⚠ aceste funcționalități sunt limitate sau indisponibile
- **PROFIL_PAGE-186** — - Link vizibil și permanent către:
- **PROFIL_PAGE-187** — ────────────────────────
- **PROFIL_PAGE-188** — - Termeni și condiții
- **PROFIL_PAGE-189** — 4) Control vizibilitate
- **PROFIL_PAGE-190** — - Politica de confidențialitate (GDPR)
- **PROFIL_PAGE-191** — - Toggle: “Arată-mă pe hartă”
- **PROFIL_PAGE-192** — (link-uri accesibile din Profil și din paginile NELOGAT)
- **PROFIL_PAGE-193** — - Consimțământ explicit (checkbox):
- **PROFIL_PAGE-194** — - ON → apare pin public (anonimizat)
- **PROFIL_PAGE-195** — - „Am citit și sunt de acord cu Termenii și Condițiile”
- **PROFIL_PAGE-196** — - „Am citit și sunt de acord cu Politica de confidențialitate”
- **PROFIL_PAGE-197** — - OFF → nu apare pin public, dar sistemul poate folosi locația intern
- **PROFIL_PAGE-198** — - Reguli de salvare:
- **PROFIL_PAGE-199** — - Text clar:
- **PROFIL_PAGE-200** — - Salvarea datelor NU este permisă fără bifarea consimțământului.
- **PROFIL_PAGE-201** — “Poți schimba această setare oricând.”
- **PROFIL_PAGE-202** — - Checkbox-ul este obligatoriu la:
- **PROFIL_PAGE-203** — ────────────────────────
- **PROFIL_PAGE-204** — - crearea contului
- **PROFIL_PAGE-205** — 5) Securitate & confidențialitate (GDPR-friendly)
- **PROFIL_PAGE-206** — - prima salvare a profilului
- **PROFIL_PAGE-207** — - Nu afișăm adresa exactă public.
- **PROFIL_PAGE-208** — - Dacă termenii se modifică:
- **PROFIL_PAGE-209** — - Pin-ul public este anonimizat conform razei alese.
- **PROFIL_PAGE-210** — - consimțământul trebuie reconfirmat la următoarea autentificare/salvare.
- **PROFIL_PAGE-211** — - Persistență GDPR:
- **PROFIL_PAGE-212** — - Coordonatele exacte (dacă există) sunt folosite doar intern
- **PROFIL_PAGE-213** — - salvează în DB:
- **PROFIL_PAGE-214** — pentru calcule de distanță.
- **PROFIL_PAGE-215** — - data și ora consimțământului
- **PROFIL_PAGE-216** — - versiunea documentului legal acceptat
- **PROFIL_PAGE-217** — - Locația nu este partajată cu alți utilizatori în mod direct.
- **PROFIL_PAGE-218** — - IP (opțional, dacă e necesar legal)
- **PROFIL_PAGE-219** — ────────────────────────
- **PROFIL_PAGE-220** — 6) Confirmare explicită (prima setare)
- **PROFIL_PAGE-221** — Retragere consimțământ → acces restricționat
- **PROFIL_PAGE-222** — Consimțământ = per utilizator, nu per sesiune
- **PROFIL_PAGE-223** — - Checkbox:
- **PROFIL_PAGE-224** — “Am înțeles cum apare locația mea pe hartă și sunt de acord.”
- **PROFIL_PAGE-225** — - Fără bifare:
- **PROFIL_PAGE-226** — Map provider (TBD) — privacy-first + cost control
- **PROFIL_PAGE-227** — - salvarea locației NU este permisă
- **PROFIL_PAGE-228** — Profil page

## Object page

_BBox: x=1053, y=219, w=829.8208549624519, h=800_

- **OBJECT_PAGE-001** — RO ▼
- **OBJECT_PAGE-002** — ⋮
- **OBJECT_PAGE-003** — Nelogat
- **OBJECT_PAGE-004** — RO ▼
- **OBJECT_PAGE-005** — ⋮
- **OBJECT_PAGE-006** — Logat
- **OBJECT_PAGE-007** — neimplementat = disabled, nu 404, nu crash
- **OBJECT_PAGE-008** — Toate paginile
- **OBJECT_PAGE-009** — Objecte   dorite
- **OBJECT_PAGE-010** — ⇆
- **OBJECT_PAGE-011** — UI: preview blurat + CTA
- **OBJECT_PAGE-012** — ←  card  →
- **OBJECT_PAGE-013** — A) OBJECTS PAGE — NOTE PENTRU DEVELOPER (FINAL)
- **OBJECT_PAGE-014** — 0) Regula de aur (anti-confuzie)
- **OBJECT_PAGE-015** — În Objects NU există “accept / resping / negociere”.
- **OBJECT_PAGE-016** — Objects doar: like/skip, selectare max 3, contorizare; analiza se deschide în Matching.
- **OBJECT_PAGE-017** — Toate deciziile + rezervările se fac în Matching.
- **OBJECT_PAGE-018** — 1) Structură UI (ce vede userul)
- **OBJECT_PAGE-019** — Pagina are două zone mari:
- **OBJECT_PAGE-020** — NU există alte pagini.
- **OBJECT_PAGE-021** — - Vezi obiecte oferite (preview).
- **OBJECT_PAGE-022** — A) SUS = „Oferta altora” (obiecte oferite de alți useri)
- **OBJECT_PAGE-023** — B) UI COPY — Objects (Hub)
- **OBJECT_PAGE-024** — A1) Swipe SUS (card mare)
- **OBJECT_PAGE-025** — 1️⃣ SUS — SWIPE „CE POT PRIMI”
- **OBJECT_PAGE-026** — A2) Top 3 dorințe ale mele (Wishlist) (3 carduri mici sub swipe)
- **OBJECT_PAGE-027** — - Vezi obiecte dorite (preview).
- **OBJECT_PAGE-028** — Ce pot primi
- **OBJECT_PAGE-029** — B) JOS = „Ce ofer eu” (obiectele mele oferite)
- **OBJECT_PAGE-030** — Swipe pentru a arăta interes. Deciziile se fac în Matching.
- **OBJECT_PAGE-031** — B1) Swipe JOS (card mare)
- **OBJECT_PAGE-032** — Like = semnal de interes
- **OBJECT_PAGE-033** — - Înțelege mecanismul de swipe și potrivire.
- **OBJECT_PAGE-034** — Obiect 1
- **OBJECT_PAGE-035** — Obiect 2
- **OBJECT_PAGE-036** — Obiect 3
- **OBJECT_PAGE-037** — B2) Top 3 obiecte oferite de mine (3 carduri mici sub swipe)
- **OBJECT_PAGE-038** — Obiectul nu este rezervat
- **OBJECT_PAGE-039** — Plasare contoare (obligatoriu fix, ca să fie clar):
- **OBJECT_PAGE-040** — - Detaliile complete sunt disponibile 
   după autentificare.
- **OBJECT_PAGE-041** — Empty state: Nu sunt oferte potrivite acum
- **OBJECT_PAGE-042** — Sub fiecare swipe (A1 și B1) există:
- **OBJECT_PAGE-043** — Contor Like-uri: 0/3 (ex: „Like-uri alese: 2/3”)
- **OBJECT_PAGE-044** — 2️⃣ TOP 3 — DORINȚELE MELE
- **OBJECT_PAGE-045** — CTA: „Matching” (activ când contorul >0; evidențiat când ajunge la 3/3)
- **OBJECT_PAGE-046** — Dorințele mele
- **OBJECT_PAGE-047** — Sub fiecare card din A2 și B2 există:
- **OBJECT_PAGE-048** — Maxim 3 active. Folosite de AI pentru analiză.
- **OBJECT_PAGE-049** — Contor Oferte (ex: 0/3) + CTA „Matching”
- **OBJECT_PAGE-050** — Oferte: n / 3
- **OBJECT_PAGE-051** — Matching
- **OBJECT_PAGE-052** — Sub fiecare dorit: „Oferte: n/3” + „Matching”.
- **OBJECT_PAGE-053** — (icon) Editare
- **OBJECT_PAGE-054** — Sub fiecare oferit: „Cereri: n/3” + „Matching”.
- **OBJECT_PAGE-055** — Vezi toate dorințele
- **OBJECT_PAGE-056** — 2) De unde se alimentează SWIPE-urile (surse de date)
- **OBJECT_PAGE-057** — A1) Swipe SUS (Oferta altora) = “ce îmi propune piața”
- **OBJECT_PAGE-058** — 3️⃣ JOS — SWIPE „CE OFER EU”
- **OBJECT_PAGE-059** — Sursa: Items oferite de alți utilizatori (publicate ca “available”), filtrate astfel:
- **OBJECT_PAGE-060** — Ce ofer eu
- **OBJECT_PAGE-061** — filtre hard: distanță (din profil + radius anonimizat), categorie/subcategorie permise, limbă/țară (opțional)
- **OBJECT_PAGE-062** — Like = merită analizat
- **OBJECT_PAGE-063** — filtre soft AI: preferințele din profil + ce ai în wishlist + istoricul de like/skip
- **OBJECT_PAGE-064** — Deciziile se fac în Matching
- **OBJECT_PAGE-065** — Rezultat: un flux de carduri “oferte ale altora” pe care userul dă like/skip.
- **OBJECT_PAGE-066** — Empty state: Nu sunt cereri pentru obiectele tale
- **OBJECT_PAGE-067** — B1) Swipe JOS (cererile altora) = „cine ar vrea ce ofer eu”
- **OBJECT_PAGE-068** — Autentificare
Creează cont
- **OBJECT_PAGE-069** — Sursa: Wishlist-urile (cererile) altor utilizatori, filtrate astfel:
- **OBJECT_PAGE-070** — 4️⃣ TOP 3 — OFERTELE MELE
- **OBJECT_PAGE-071** — pornește de la obiectele mele oferite (B2) → extrage categorii/tags/AI-labels → caută useri care cer ceva compatibil
- **OBJECT_PAGE-072** — Ofertele mele active
- **OBJECT_PAGE-073** — filtre hard: distanță + radius + preferințe de schimb / logistică
- **OBJECT_PAGE-074** — Maxim 3 analizate simultan.
- **OBJECT_PAGE-075** — Cereri: n / 3
- **OBJECT_PAGE-076** — filtre soft AI: “potrivire probabilă” (ex: dacă tu ai scule, nu împinge dantele spre tine ca cerere principală)
- **OBJECT_PAGE-077** — Matching
- **OBJECT_PAGE-078** — Rezultat: un flux de carduri “cereri ale altora” pe care userul dă like/skip.
- **OBJECT_PAGE-079** — (icon) Editare
- **OBJECT_PAGE-080** — Important: Swipe SUS și Swipe JOS sunt fluxuri diferite, cu surse diferite. Nu le amestecați.
- **OBJECT_PAGE-081** — Vezi toate ofertele
- **OBJECT_PAGE-082** — → Autentifică-te
- **OBJECT_PAGE-083** — 3) Alinierea dintre “Dorite” și “Oferite” (logica de trimitere în Matching)
- **OBJECT_PAGE-084** — Când userul dă like:
- **OBJECT_PAGE-085** — La A1 (ofertă a altuia) → se creează un Intent: “îmi place oferta X”
- **OBJECT_PAGE-086** — La B1 (cerere a altuia) → se creează un Intent: “aș putea satisface cererea Y”
- **OBJECT_PAGE-087** — Când userul deschide Matching:
- **OBJECT_PAGE-088** — Matching primește:
- **OBJECT_PAGE-089** — lista de Intent-uri A1 (oferte care îmi plac)
- **OBJECT_PAGE-090** — lista de Intent-uri B1 (cereri compatibile cu ce ofer eu)
- **OBJECT_PAGE-091** — snapshot cu Wishlist (A2) + Obiectele mele (B2)
- **OBJECT_PAGE-092** — Matching rulează AI + îmi arată propuneri de schimb (nu Objects).
- **OBJECT_PAGE-093** — C) UI COPY — Liste Extinse („Vezi toate”)
- **OBJECT_PAGE-094** — Objecte   oferite
- **OBJECT_PAGE-095** — 4) Liste extinse („Vezi toate”) = „surse de adevăr” (source of truth)
- **OBJECT_PAGE-096** — ⚠️ NU pagină. Sheet / modal / panou. Swipe rămâne dedesubt.
- **OBJECT_PAGE-097** — Wishlist / Obiectele mele = surse de adevăr
- **OBJECT_PAGE-098** — Creezi/editezi/ștergi în lista extinsă („Vezi toate”).
- **OBJECT_PAGE-099** — 2A️⃣ „VEZI TOATE DORINȚELE” (SHEET / LISTĂ EXTINSĂ)
- **OBJECT_PAGE-100** — 5) Reguli
- **OBJECT_PAGE-101** — Max 3 like-uri active per zonă
- **OBJECT_PAGE-102** — Toate dorințele
- **OBJECT_PAGE-103** — Contor vizibil sub fiecare zonă (0/3)
- **OBJECT_PAGE-104** — Doar primele 3 sunt active în analiză. Restul sunt păstrate ca istoric.
- **OBJECT_PAGE-105** — Activează / Dezactivează
- **OBJECT_PAGE-106** — La atingerea a 3:
- **OBJECT_PAGE-107** — Editează
- **OBJECT_PAGE-108** — swipe blocat
- **OBJECT_PAGE-109** — Matching
- **OBJECT_PAGE-110** — intențiile sunt trimise în Matching
- **OBJECT_PAGE-111** — Buton: Adaugă dorință
- **OBJECT_PAGE-112** — ofertele sunt trimise în Matching
- **OBJECT_PAGE-113** — Empty state: Nu ai dorințe definite
- **OBJECT_PAGE-114** — Notificări: se trimit la intrarea în negotiating, nu la simple like-uri.
- **OBJECT_PAGE-115** — Adaugă ce ai dori să primești pentru a începe.
- **OBJECT_PAGE-116** — Dacă e negotiating și nu se finalizează: revine în available după un TTL (inițial propunere: 24h; ajustabil din experiență)
- **OBJECT_PAGE-117** — 6) Monedă & conversie (afișare)
- **OBJECT_PAGE-118** — 4A️⃣ „VEZI TOATE OFERTELE” (SHEET / LISTĂ EXTINSĂ)
- **OBJECT_PAGE-119** — Valoarea se salvează “raw” (ex: EUR/ron) + sursa estimării.
- **OBJECT_PAGE-120** — Toate ofertele mele
- **OBJECT_PAGE-121** — La afișare se convertește în moneda userului (din profil; fallback locație).
- **OBJECT_PAGE-122** — Doar primele 3 sunt analizate activ.
- **OBJECT_PAGE-123** — Valoarea e informativă, nu contractuală.
- **OBJECT_PAGE-124** — Activează / Dezactivează
- **OBJECT_PAGE-125** — Editează
- **OBJECT_PAGE-126** — Matching
- **OBJECT_PAGE-127** — Adaugă un obiect pentru a primi cereri.
- **OBJECT_PAGE-128** — Empty state: Nu ai obiecte oferite
- **OBJECT_PAGE-129** — Adaugă un obiect pentru a primi cereri.
- **OBJECT_PAGE-130** — ⇆
- **OBJECT_PAGE-131** — ←  card  →
- **OBJECT_PAGE-132** — Obiect 1
- **OBJECT_PAGE-133** — Obiect 2
- **OBJECT_PAGE-134** — Obiect 3
- **OBJECT_PAGE-135** — Object page

## Object subpage

_BBox: x=1409.510673304001, y=1112.7287000097638, w=780.6257292935088, h=1055.338154826699_

- **OBJECT_SUBPAGE-001** — RO ▼
- **OBJECT_SUBPAGE-002** — D) SPEC COMPLET — OBIECT (DETAIL) + REGULI (ETAPA DE TESTARE)
- **OBJECT_SUBPAGE-003** — D7) Flux AI complet (ordine corectă a pașilor)
- **OBJECT_SUBPAGE-004** — D0) Principiu
- **OBJECT_SUBPAGE-005** — Când userul adaugă sau schimbă imaginea:
- **OBJECT_SUBPAGE-006** — Pagina/Sheet-ul de Obiect este sursa de adevăr pentru:
- **OBJECT_SUBPAGE-007** — Upload imagine (local sau URL)
- **OBJECT_SUBPAGE-008** — datele obiectului
- **OBJECT_SUBPAGE-009** — Generare variante (thumb/medium)
- **OBJECT_SUBPAGE-010** — imaginile obiectului
- **OBJECT_SUBPAGE-011** — Salvare referințe imagine la obiect
- **OBJECT_SUBPAGE-012** — clasificarea AI
- **OBJECT_SUBPAGE-013** — Rulează AI:
- **OBJECT_SUBPAGE-014** — pregătirea pentru Matching (intenție/flexibilitate/context etc.)
- **OBJECT_SUBPAGE-015** — identificare (title/tags)
- **OBJECT_SUBPAGE-016** — Objects (hub) doar listează/semnalizează. Obiect (detail) definește.
- **OBJECT_SUBPAGE-017** — clasificare HF (labels + scor)
- **OBJECT_SUBPAGE-018** — D1) Categorii & Subcategorii (exhaustive, din DB/API)
- **OBJECT_SUBPAGE-019** — UI afișează sugestii + butoane de aplicare
- **OBJECT_SUBPAGE-020** — Cerință
- **OBJECT_SUBPAGE-021** — Regulă: Obiectul poate fi salvat și fără AI, dar AI rulează când poate.
- **OBJECT_SUBPAGE-022** — Categoriile și subcategoriile NU sunt text liber.
- **OBJECT_SUBPAGE-023** — D8) Câmpurile obiectului (complete, pentru schema ta de “contract semantic”)
- **OBJECT_SUBPAGE-024** — Sunt încărcate din bază de date și servite prin API (sau direct din Supabase, dar logic e “API de categorii”).
- **OBJECT_SUBPAGE-025** — Model logic (minim)
- **OBJECT_SUBPAGE-026** — Obligatorii (pentru testare)
- **OBJECT_SUBPAGE-027** — categories: (id, name_ro, name_en?, order, is_active)
- **OBJECT_SUBPAGE-028** — Titlu (text)
- **OBJECT_SUBPAGE-029** — subcategories: (id, category_id, name_ro, name_en?, order, is_active)
- **OBJECT_SUBPAGE-030** — Categorie (din DB)
- **OBJECT_SUBPAGE-031** — Reguli
- **OBJECT_SUBPAGE-032** — Subcategorie (din DB)
- **OBJECT_SUBPAGE-033** — dropdown 1: Categorie (obligatoriu)
- **OBJECT_SUBPAGE-034** — Cel puțin 0 imagini (imaginea e recomandată, nu obligatorie)
- **OBJECT_SUBPAGE-035** — dropdown 2: Subcategorie (obligatoriu, filtrat după categorie)
- **OBJECT_SUBPAGE-036** — Opționale (dar definite clar)
- **OBJECT_SUBPAGE-037** — fallback dacă DB nu are date:
- **OBJECT_SUBPAGE-038** — Descriere
- **OBJECT_SUBPAGE-039** — UI: „Categoriile nu sunt încă încărcate.” + buton „Reîncearcă”
- **OBJECT_SUBPAGE-040** — Tags (manual + AI suggested)
- **OBJECT_SUBPAGE-041** — obiectul nu poate fi publicat ca “available” fără categorie/subcategorie
- **OBJECT_SUBPAGE-042** — Intenție: Explorez / Deschis / Clar / Serios
- **OBJECT_SUBPAGE-043** — D2) Imagine — surse (link + local) + reguli
- **OBJECT_SUBPAGE-044** — Flexibilitate: Strict / Moderat / Larg
- **OBJECT_SUBPAGE-045** — Surse acceptate (ambele)
- **OBJECT_SUBPAGE-046** — Context: Permanent / Vacanță / Temporar / Urgent
- **OBJECT_SUBPAGE-047** — Upload local (fișier)
- **OBJECT_SUBPAGE-048** — Valoare percepută: Mică / Medie / Mare / Specială
- **OBJECT_SUBPAGE-049** — Link (URL)
- **OBJECT_SUBPAGE-050** — Contează cui ajunge (toggle)
- **OBJECT_SUBPAGE-051** — Reguli de validare
- **OBJECT_SUBPAGE-052** — Accept pachet (toggle)
- **OBJECT_SUBPAGE-053** — acceptă doar: jpg/jpeg/png/webp (la început)
- **OBJECT_SUBPAGE-054** — max size (config): ex. 10MB (valoare exactă o decide implementarea)
- **OBJECT_SUBPAGE-055** — Mesaj pentru AI (text)
- **OBJECT_SUBPAGE-056** — dacă link-ul e invalid sau nu e imagine:
- **OBJECT_SUBPAGE-057** — Locație + radius (pentru local/hărți, dacă e în schemă)
- **OBJECT_SUBPAGE-058** — UI: „Link invalid sau imagine inaccesibilă.”
- **OBJECT_SUBPAGE-059** — D9) UI Copy — Obiect (Detail) (gata de lipit)
- **OBJECT_SUBPAGE-060** — D3) Imagine — redimensionare + încadrări în card (resize/fit)
- **OBJECT_SUBPAGE-061** — Titlu
- **OBJECT_SUBPAGE-062** — Cerință UX (obligatoriu)
- **OBJECT_SUBPAGE-063** — Detalii obiect
- **OBJECT_SUBPAGE-064** — imaginea trebuie să încapă frumos în card fără să arate “tăiată prost”.
- **OBJECT_SUBPAGE-065** — Notă informativă
- **OBJECT_SUBPAGE-066** — Reguli UI (card + detail)
- **OBJECT_SUBPAGE-067** — Imagine
- **OBJECT_SUBPAGE-068** — în card (Objects, liste):
- **OBJECT_SUBPAGE-069** — Adaugă imagine
- **OBJECT_SUBPAGE-070** — cover cu focalizare centrată (sau smart-crop dacă există)
- **OBJECT_SUBPAGE-071** — Opțiuni: Încarcă local / Adaugă link
- **OBJECT_SUBPAGE-072** — aspect ratio stabil (ex: 1:1 sau 4:3 – alegeți unul și îl păstrați peste tot)
- **OBJECT_SUBPAGE-073** — dacă lipsește: Fără imagine — Adaugă o imagine pentru potriviri mai bune.
- **OBJECT_SUBPAGE-074** — în detail (pagina obiect):
- **OBJECT_SUBPAGE-075** — Categorie
- **OBJECT_SUBPAGE-076** — contain sau galerie cu zoom (opțional)
- **OBJECT_SUBPAGE-077** — Categorie (dropdown)
- **OBJECT_SUBPAGE-078** — Reguli tehnice (fără cod, doar comportament)
- **OBJECT_SUBPAGE-079** — Subcategorie (dropdown)
- **OBJECT_SUBPAGE-080** — la upload se generează cel puțin:
- **OBJECT_SUBPAGE-081** — AI (după imagine)
- **OBJECT_SUBPAGE-082** — thumb (card)
- **OBJECT_SUBPAGE-083** — medium (detail)
- **OBJECT_SUBPAGE-084** — Sugestie titlu (AI): [text] (scor: x) — Aplică
- **OBJECT_SUBPAGE-085** — dacă nu există variante generate → fallback la original, dar UI păstrează aspect ratio.
- **OBJECT_SUBPAGE-086** — Etichete (AI): [tag1, tag2…] — Adaugă
- **OBJECT_SUBPAGE-087** — D4) Imagine lipsă → placeholder “No Image” (obligatoriu)
- **OBJECT_SUBPAGE-088** — Intenție
- **OBJECT_SUBPAGE-089** — Cerință
- **OBJECT_SUBPAGE-090** — Cât de serios vrei să fie schimbul?
- **OBJECT_SUBPAGE-091** — Dacă nu există nicio imagine:
- **OBJECT_SUBPAGE-092** — Explorez / Sunt deschis / Caut schimb clar / Angajament mare
- **OBJECT_SUBPAGE-093** — se afișează o imagine generică No Image
- **OBJECT_SUBPAGE-094** — Flexibilitate
- **OBJECT_SUBPAGE-095** — cardurile nu se “rup” vizual
- **OBJECT_SUBPAGE-096** — Cât de strict ești?
- **OBJECT_SUBPAGE-097** — Copy
- **OBJECT_SUBPAGE-098** — Strict / Moderat / Larg
- **OBJECT_SUBPAGE-099** — titlu mic: „Fără imagine”
- **OBJECT_SUBPAGE-100** — Context
- **OBJECT_SUBPAGE-101** — subtitlu: „Adaugă o imagine pentru potriviri mai bune.”
- **OBJECT_SUBPAGE-102** — În ce context vrei schimbul?
- **OBJECT_SUBPAGE-103** — D5) Identificarea obiectului din imagine (AI hint, nu clasă finală)
- **OBJECT_SUBPAGE-104** — Permanent / Vacanță / Temporar / Urgent
- **OBJECT_SUBPAGE-105** — Ce înseamnă “identificare” aici
- **OBJECT_SUBPAGE-106** — Valoare percepută
- **OBJECT_SUBPAGE-107** — AI extrage indicii din imagine pentru:
- **OBJECT_SUBPAGE-108** — Cum percepi valoarea acestui obiect? (nu este preț)
- **OBJECT_SUBPAGE-109** — sugestie titlu
- **OBJECT_SUBPAGE-110** — Mică / Medie / Mare / Specială
- **OBJECT_SUBPAGE-111** — sugestie tags
- **OBJECT_SUBPAGE-112** — verificare “are sens” vs textul introdus
- **OBJECT_SUBPAGE-113** — Dacă “Specială”:
- **OBJECT_SUBPAGE-114** — Output minim
- **OBJECT_SUBPAGE-115** — Uneori contează cui ajunge. Un mesaj personal poate crește șansele schimbului.
- **OBJECT_SUBPAGE-116** — suggested_title (ex: “Bicicletă MTB”)
- **OBJECT_SUBPAGE-117** — Contează cui ajunge
- **OBJECT_SUBPAGE-118** — suggested_tags (listă)
- **OBJECT_SUBPAGE-119** — Contează cui ajunge acest obiect (toggle)
- **OBJECT_SUBPAGE-120** — confidence (0–1)
- **OBJECT_SUBPAGE-121** — Accept pachet
- **OBJECT_SUBPAGE-122** — Reguli
- **OBJECT_SUBPAGE-123** — Accept schimb cu mai multe obiecte (toggle)
- **OBJECT_SUBPAGE-124** — userul poate accepta sau ignora
- **OBJECT_SUBPAGE-125** — Mesaj pentru AI
- **OBJECT_SUBPAGE-126** — UI: buton mic „Folosește sugestia”
- **OBJECT_SUBPAGE-127** — Ce ar trebui să știe AI despre acest obiect sau schimb?
- **OBJECT_SUBPAGE-128** — D6) Clasificarea obiectului din imagine (Hugging Face) (obligatoriu ca specificație)
- **OBJECT_SUBPAGE-129** — Placeholder: Ex: „Prefer local”, „Nu mă grăbesc”, „Are valoare personală”
- **OBJECT_SUBPAGE-130** — Cerință
- **OBJECT_SUBPAGE-131** — Butoane
- **OBJECT_SUBPAGE-132** — La adăugare/actualizare imagine:
- **OBJECT_SUBPAGE-133** — Salvează
- **OBJECT_SUBPAGE-134** — se trimite către modelul Hugging Face (sau endpoint intermediar)
- **OBJECT_SUBPAGE-135** — Înapoi
- **OBJECT_SUBPAGE-136** — se primește:
- **OBJECT_SUBPAGE-137** — D10) Verificare (ca să nu ne mai „mirăm că nu funcționează”)
- **OBJECT_SUBPAGE-138** — etichete (top-k)
- **OBJECT_SUBPAGE-139** — În etapa de testare, considerăm “Obiect valid” doar dacă:
- **OBJECT_SUBPAGE-140** — scoruri
- **OBJECT_SUBPAGE-141** — eventual categorie sugerată
- **OBJECT_SUBPAGE-142** — categorie + subcategorie sunt setate (din DB/API)
- **OBJECT_SUBPAGE-143** — Reguli
- **OBJECT_SUBPAGE-144** — imaginea fie există, fie placeholder-ul funcționează
- **OBJECT_SUBPAGE-145** — clasificarea nu e “adevăr”, e propunere
- **OBJECT_SUBPAGE-146** — upload local și link funcționează (ambele)
- **OBJECT_SUBPAGE-147** — dacă HF e down:
- **OBJECT_SUBPAGE-148** — resize/încadrare e stabilă în card
- **OBJECT_SUBPAGE-149** — UI: „AI indisponibil momentan. Poți continua manual.”
- **OBJECT_SUBPAGE-150** — AI poate eșua fără să blocheze salvarea
- **OBJECT_SUBPAGE-151** — rezultatul se salvează ca metadată (auditabil, refolosibil în Matching)
- **OBJECT_SUBPAGE-152** — Cu cât completezi mai multe detalii, cu atât Matching îți propune schimburi mai bune. Nimic nu e obligatoriu.
- **OBJECT_SUBPAGE-153** — “Stare/condiție” a obiectului (fizic) ca semnal de matching
- **OBJECT_SUBPAGE-154** — În schemă apare “stare” în sens de Activ/Inactiv (publicare), dar nu apare clar condiția fizică (nou/folosit/uzat/de reparat etc.) ca input pe Obiect.
- **OBJECT_SUBPAGE-155** — Mai apare undeva o mențiune de tip “condiție acceptată (opțional)” la “dorit”, dar nu e transformată în câmp clar pe Obiect detail.
- **OBJECT_SUBPAGE-156** — Semnalul “deschidere la schimb indirect / lanț A→B→C”
- **OBJECT_SUBPAGE-157** — Nu e prezent ca toggle/flag în pagina Obiect. Dacă vrei vreodată matching de tip “lanț”, trebuie să existe un semnal explicit (altfel e magie și devine haos).
- **OBJECT_SUBPAGE-158** — “Feedback cognitiv” în pagina Obiect (mega important pentru UX)
- **OBJECT_SUBPAGE-159** — În schema actuală există mesajul general “completează mai mult = matching mai bun”, dar nu există o secțiune concretă de tip:
- **OBJECT_SUBPAGE-160** — „Ce știe AI despre obiectul meu?” (etichete, categorie sugerată, scoruri, interpretare)
- **OBJECT_SUBPAGE-161** — „Ce lipsește ca să primesc potriviri mai bune?” (ex: fără imagine, fără subcategorie, fără valoare percepută, fără context etc.)
- **OBJECT_SUBPAGE-162** — Asta e fix partea care reduce frustrarea (“nu merge matching-ul!”) și te ajută să păstrezi piața fluidă.
- **OBJECT_SUBPAGE-163** — Ce trebuie introdus în spec-ul paginii Obiect (ca să fie “complet”)
- **OBJECT_SUBPAGE-164** — Un câmp nou: Condiție obiect (enum simplu: Nou / Foarte bun / Bun / Utilizat / De reparat / Special/colecție — sau cum vrei tu).
- **OBJECT_SUBPAGE-165** — Un toggle opțional: Permite schimb indirect (lanț) (cu un tooltip clar că e avansat).
- **OBJECT_SUBPAGE-166** — O secțiune read-only: „Rezumat pentru Matching” care afișează semnalele active + “completitudine” + recomandări de îmbunătățire.
- **OBJECT_SUBPAGE-167** — Object subpage

## Chat page

_BBox: x=2589.5, y=223.5, w=554, h=800_

- **CHAT_PAGE-001** — RO ▼
- **CHAT_PAGE-002** — ⋮
- **CHAT_PAGE-003** — Nelogat
- **CHAT_PAGE-004** — RO ▼
- **CHAT_PAGE-005** — ⋮
- **CHAT_PAGE-006** — Logat
- **CHAT_PAGE-007** — neimplementat = disabled, nu 404, nu crash
- **CHAT_PAGE-008** — Toate paginile
- **CHAT_PAGE-009** — UI: preview blurat + CTA
- **CHAT_PAGE-010** — zona de chat
- **CHAT_PAGE-011** — - Mesajele sunt disponibile
 doar între utilizatori autentificați.
- **CHAT_PAGE-012** — - Chatul este activ doar după un match.
- **CHAT_PAGE-013** — CHAT PAGE — NOTE PENTRU DEVELOPER (Swaply) — FULL TEXT (update cu Header + Limbă + Meniu contextual + Footer)
- **CHAT_PAGE-014** — PARTEA 2 — SECURITATE, MODERARE, RANG, ATAȘAMENTE, ANTI-VIRUS, LOCAȚIE
- **CHAT_PAGE-015** — PARTEA 0 — CHROME GLOBAL (Header / Language / Context Menu / Footer)
- **CHAT_PAGE-016** — 1) Politici de securitate & moderare (obligatoriu)
- **CHAT_PAGE-017** — 0.1 Header (global, pe toate paginile inclusiv Chat)
- **CHAT_PAGE-018** — Chat-ul are moderare automată + manuală.
- **CHAT_PAGE-019** — Header-ul este persistent și include:
- **CHAT_PAGE-020** — Limbaj agresiv/jignitor, hărțuire, amenințări, discriminare, pornografie, conținut ilegal → măsuri graduale:
- **CHAT_PAGE-021** — Logo Swaply (click → Home)
- **CHAT_PAGE-022** — avertisment (soft)
- **CHAT_PAGE-023** — Navigație principală (conform schemei): Home / Objects / Match / Chat / Change / Info
- **CHAT_PAGE-024** — limitare temporară (slow mode / mute)
- **CHAT_PAGE-025** — Icon notificări (badge count)
- **CHAT_PAGE-026** — retrogradare rang
- **CHAT_PAGE-027** — Icon mesaje (badge count, shortcut către Chat)
- **CHAT_PAGE-028** — suspendare (temporary ban)
- **CHAT_PAGE-029** — Avatar profil (click → meniul contextual)
- **CHAT_PAGE-030** — ban permanent (pentru recidivă sau abuz grav)
- **CHAT_PAGE-031** — Header-ul trebuie să fie responsive:
- **CHAT_PAGE-032** — Utilizatorul poate trimite raport (Report) pe:
- **CHAT_PAGE-033** — Desktop: nav text + iconuri
- **CHAT_PAGE-034** — mesaj
- **CHAT_PAGE-035** — Mobile: hamburger / bottom nav (conform design) + icon mesaje/notifications
- **CHAT_PAGE-036** — thread
- **CHAT_PAGE-037** — Header-ul afișează stări importante:
- **CHAT_PAGE-038** — utilizator
- **CHAT_PAGE-039** — user logat vs nelogat (login/register CTA când e nelogat)
- **CHAT_PAGE-040** — atașament
- **CHAT_PAGE-041** — indicator limbă curentă (flag/abbr)
- **CHAT_PAGE-042** — Orice „enforcement action” trebuie să fie auditabil (log: cine/ce/când/de ce).
- **CHAT_PAGE-043** — indicator de rețea (opțional): offline/online pentru chat
- **CHAT_PAGE-044** — 2) Sistem de rang + penalizări + recuperare
- **CHAT_PAGE-045** — 0.2 Selector de limbă (global)
- **CHAT_PAGE-046** — Platforma are Rang / Reputație care poate fi afectată de:
- **CHAT_PAGE-047** — Există un selector de limbă disponibil din header sau din meniul contextual.
- **CHAT_PAGE-048** — limbaj agresiv/toxic
- **CHAT_PAGE-049** — Limba activă afectează:
- **CHAT_PAGE-050** — spam
- **CHAT_PAGE-051** — UI (toate label-urile)
- **CHAT_PAGE-052** — scam indicators (încercări de a muta conversația în afara platformei, cereri insistente de bani, etc.)
- **CHAT_PAGE-053** — format date/monedă
- **CHAT_PAGE-054** — raportări valide confirmate
- **CHAT_PAGE-055** — limba implicită de afișare în Chat (preferred_language)
- **CHAT_PAGE-056** — Retrogradarea rangului:
- **CHAT_PAGE-057** — Regulă prioritară:
- **CHAT_PAGE-058** — scade vizibilitatea/matching-ul, reduce limitele (ex: atașamente/mesaje/zi), poate bloca HOLD/Confirm.
- **CHAT_PAGE-059** — preferred_language setat de user
- **CHAT_PAGE-060** — Recuperare rang:
- **CHAT_PAGE-061** — device/browser locale
- **CHAT_PAGE-062** — prin „angajament” (acceptare reguli + mesaj de tip pledge)
- **CHAT_PAGE-063** — În Chat:
- **CHAT_PAGE-064** — posibil prin „tokeni” (mecanism de „reabilitare” / „bond” / „staking” pentru recâștigarea unor drepturi)
- **CHAT_PAGE-065** — există setare per-thread: Auto-translate ON/OFF
- **CHAT_PAGE-066** — recidiva în perioada de probă → penalizare accelerată.
- **CHAT_PAGE-067** — există traducere la cerere pentru orice mesaj
- **CHAT_PAGE-068** — 3) AI — rol clar, non-blocking, dar cu putere de protecție
- **CHAT_PAGE-069** — AI-ul în Chat are rol de „Safety & Negotiation Assistant”. Nu trebuie să oprească funcționarea chat-ului dacă e indisponibil, dar când e disponibil, face:
- **CHAT_PAGE-070** — Autentificare
Creează cont
- **CHAT_PAGE-071** — 0.3 Meniu contextual (global)
- **CHAT_PAGE-072** — Meniul contextual se deschide din avatarul din header (sau long-press pe mobile).
- **CHAT_PAGE-073** — 3.1 Moderare limbaj (toxicity)
- **CHAT_PAGE-074** — Conține minim:
- **CHAT_PAGE-075** — Detectează: insultă, hate speech, amenințări, hărțuire, șantaj.
- **CHAT_PAGE-076** — Profil (view/edit)
- **CHAT_PAGE-077** — Acțiuni:
- **CHAT_PAGE-078** — Obiectele mele (My items)
- **CHAT_PAGE-079** — Afișează warning UI: „Mesajul poate încălca regulile.”
- **CHAT_PAGE-080** — Match / Chat (shortcut)
- **CHAT_PAGE-081** — Pentru abuz repetat: aplică automat „slow mode”/mute și marchează pentru review.
- **CHAT_PAGE-082** — Setări (Settings)
- **CHAT_PAGE-083** — Marchează impact în rang (conform policy).
- **CHAT_PAGE-084** — Limbă (Language)
- **CHAT_PAGE-085** — 3.2 Scam / fraud / manipulare
- **CHAT_PAGE-086** — Termeni & condiții
- **CHAT_PAGE-087** — Detectează tipare:
- **CHAT_PAGE-088** — Politică GDPR / Privacy
- **CHAT_PAGE-089** — „trimite-mi banii”, „plătește în avans”, „dă-mi codul”, „mută conversația pe WhatsApp”, „link dubios”
- **CHAT_PAGE-090** — presiune/urgență artificială
- **CHAT_PAGE-091** — Ajutor / Support / Report a problem
- **CHAT_PAGE-092** — Acțiuni:
- **CHAT_PAGE-093** — Logout
- **CHAT_PAGE-094** — banner de avertizare pentru celălalt utilizator
- **CHAT_PAGE-095** — Meniul contextual trebuie să fie consistent și accesibil pe toate paginile.
- **CHAT_PAGE-096** — reduce „trust score” și marchează thread pentru review.
- **CHAT_PAGE-097** — Pentru user nelogat:
- **CHAT_PAGE-098** — 3.3 Protecția datelor (PII) & GDPR cues
- **CHAT_PAGE-099** — Login / Register
- **CHAT_PAGE-100** — Detectează și avertizează la transmiterea de:
- **CHAT_PAGE-101** — Termeni & condiții / Privacy
- **CHAT_PAGE-102** — CNP, serie CI, card bancar, parole/coduri, date medicale, etc.
- **CHAT_PAGE-103** — 0.4 Footer (global, pe toate paginile inclusiv Chat)
- **CHAT_PAGE-104** — UI: „Ești pe cale să trimiți date sensibile. Continui?”
- **CHAT_PAGE-105** — Footer-ul conține:
- **CHAT_PAGE-106** — 3.4 Atașamente — anti-malware & control tipuri
- **CHAT_PAGE-107** — Link Termeni & condiții
- **CHAT_PAGE-108** — → Autentifică-te
- **CHAT_PAGE-109** — Orice fișier încărcat trece prin:
- **CHAT_PAGE-110** — Link Privacy / GDPR
- **CHAT_PAGE-111** — validare tip (allowlist): PDF/JPG/PNG/WEBP (și eventual DOCX, dar cu prudență)
- **CHAT_PAGE-112** — Link Contact / Support
- **CHAT_PAGE-113** — limită dimensiune
- **CHAT_PAGE-114** — Link About / Info
- **CHAT_PAGE-115** — scanare anti-malware server-side înainte de a fi disponibil pentru download (ex: ClamAV sau serviciu dedicat)
- **CHAT_PAGE-116** — (Opțional) social / newsletter
- **CHAT_PAGE-117** — blocare automată la suspiciune + mesaj sistem „Fișier blocat pentru siguranță”
- **CHAT_PAGE-118** — Copyright “Swaply”
- **CHAT_PAGE-119** — Link-uri externe:
- **CHAT_PAGE-120** — Footer-ul trebuie să existe și în stările fără conținut (ex: “no threads yet”).
- **CHAT_PAGE-121** — Pe mobile, footer-ul nu trebuie să încurce input-ul din chat (composer). Dacă există bottom-nav, footer-ul poate fi minim sau ascuns.
- **CHAT_PAGE-122** — link preview doar după verificare (allowlist / reputație domeniu)
- **CHAT_PAGE-123** — eventual dezactivare click direct pentru domenii suspecte.
- **CHAT_PAGE-124** — PARTEA 1 — CHAT PAGE (CORE)
- **CHAT_PAGE-125** — Rolul paginii: Chat-ul este „camera de negociere” asociată unui Match. Nu este messenger general. Chat-ul există doar după Match.
- **CHAT_PAGE-126** — Notă de implementare: scanarea trebuie să fie server-side; client-side e inutilă pentru securitate reală.
- **CHAT_PAGE-127** — 3.5 Ajutor de negociere (opțional, dar util)
- **CHAT_PAGE-128** — Acces & reguli
- **CHAT_PAGE-129** — Sugerează formulări mai clare și civilizate
- **CHAT_PAGE-130** — Pagina este disponibilă doar pentru useri autentificați.
- **CHAT_PAGE-131** — Rezumă negocierea (thread lung)
- **CHAT_PAGE-132** — Un thread de chat este accesibil doar participanților (user A + user B) și este legat de match_id.
- **CHAT_PAGE-133** — Propune structurarea ofertei în „Offer Card” (Accept/Counter/Decline)
- **CHAT_PAGE-134** — LIKE nu blochează. CHAT nu blochează. Rezervarea se face numai prin HOLD în chat.
- **CHAT_PAGE-135** — Traducere RO/EN etc. (dacă userii folosesc limbi diferite)
- **CHAT_PAGE-136** — Dacă AI/helper/servicii externe pică: chat-ul trebuie să funcționeze normal (fallback silent).
- **CHAT_PAGE-137** — 4) Partajare locație (după confirmarea schimbului)
- **CHAT_PAGE-138** — Layout (desktop + mobile)
- **CHAT_PAGE-139** — Locația (share location / meeting point) este permisă DOAR după:
- **CHAT_PAGE-140** — Desktop: 2 coloane
- **CHAT_PAGE-141** — propunere acceptată + (opțional) HOLD activ, dar ideal:
- **CHAT_PAGE-142** — Stânga: Istoricul chat-urilor (thread list)
- **CHAT_PAGE-143** — după dublă confirmare „Confirmă schimbul” sau după „Confirm întâlnirea”.
- **CHAT_PAGE-144** — Dreapta: Zona de chat (mesaje + composer)
- **CHAT_PAGE-145** — Locația poate fi:
- **CHAT_PAGE-146** — Mobile: listă → intri în thread (stil WhatsApp/Signal).
- **CHAT_PAGE-147** — pin pe hartă
- **CHAT_PAGE-148** — Istoricul chat-urilor (stânga)
- **CHAT_PAGE-149** — adresă text
- **CHAT_PAGE-150** — Search + filtre: Active / Încheiate / Cu HOLD / Necitite
- **CHAT_PAGE-151** — interval orar
- **CHAT_PAGE-152** — Fiecare thread afișează:
- **CHAT_PAGE-153** — Locația are „visibility rules”:
- **CHAT_PAGE-154** — avatar + nume + ultimul mesaj + timestamp
- **CHAT_PAGE-155** — doar participanții
- **CHAT_PAGE-156** — badge: HOLD activ / HOLD expirat / Necitit
- **CHAT_PAGE-157** — opțiune „expiră după X ore” (privacy by default)
- **CHAT_PAGE-158** — mini-card obiecte negociate (icon/thumbnail mic)
- **CHAT_PAGE-159** — 5) Atașamente suportate (în Chat)
- **CHAT_PAGE-160** — Header thread (dreapta sus)
- **CHAT_PAGE-161** — Imagini suplimentare (detalii produs)
- **CHAT_PAGE-162** — Nume utilizator + status thread: Negociere / HOLD activ / Încheiat
- **CHAT_PAGE-163** — PDF: „fișa produsului”, „garanție”, „factură” (atenție PII)
- **CHAT_PAGE-164** — Link rapid către:
- **CHAT_PAGE-165** — Posibil „album” per negociere (dar legat de thread)
- **CHAT_PAGE-166** — profil utilizator
- **CHAT_PAGE-167** — Orice atașament trebuie să fie legat de thread + audit log + drept de ștergere conform policy.
- **CHAT_PAGE-168** — pagina obiectelor (item detail) implicate în negociere
- **CHAT_PAGE-169** — 6) Controale pentru user (UX de siguranță)
- **CHAT_PAGE-170** — Banda de negociere (sub header, mereu vizibilă în thread)
- **CHAT_PAGE-171** — Butoane în thread:
- **CHAT_PAGE-172** — Carduri mici: Obiectul meu vs Obiectul tău (cu thumbnail + titlu)
- **CHAT_PAGE-173** — Block user (blochează mesaje viitoare, nu șterge istoricul)
- **CHAT_PAGE-174** — Secțiune Propunerea curentă (dacă există) ca „Offer Card” (nu text liber)
- **CHAT_PAGE-175** — Report
- **CHAT_PAGE-176** — Buton rezervare: HOLD (cu TTL)
- **CHAT_PAGE-177** — Mute
- **CHAT_PAGE-178** — HOLD este explicit și are TTL (ex: 30 min / 2h / 24h)
- **CHAT_PAGE-179** — Export conversație (opțional, GDPR-friendly)
- **CHAT_PAGE-180** — HOLD poate fi „cerut” și „acceptat” (status vizibil)
- **CHAT_PAGE-181** — „Safety tips” în UI când apar semnale de risc.
- **CHAT_PAGE-182** — Timer vizibil în UI; la expirare: mesaj sistem + status revine la „Negociere”
- **CHAT_PAGE-183** — 7) Sugestii extra (recomandate)
- **CHAT_PAGE-184** — istoricul chat-urilor
- **CHAT_PAGE-185** — Mesaje (zona principală)
- **CHAT_PAGE-186** — Rate limiting pe mesaje și atașamente (anti-spam).
- **CHAT_PAGE-187** — Mesaje text + imagini (atașamente)
- **CHAT_PAGE-188** — Message deletion policy:
- **CHAT_PAGE-189** — Mesaje „sistem” (stil card/bubble distinct):
- **CHAT_PAGE-190** — ștergere doar pentru tine vs ștergere pentru amândoi (decide clar)
- **CHAT_PAGE-191** — „HOLD activ până la…”
- **CHAT_PAGE-192** — „HOLD a expirat”
- **CHAT_PAGE-193** — pentru cazuri de moderare: păstrează evidența în audit (nu dispar complet).
- **CHAT_PAGE-194** — „Propunere nouă”
- **CHAT_PAGE-195** — Data retention:
- **CHAT_PAGE-196** — „Schimb confirmat de X / în așteptare Y”
- **CHAT_PAGE-197** — cât timp păstrezi chat-urile (ex: 12-24 luni) + opțiune de ștergere cont (GDPR).
- **CHAT_PAGE-198** — Composer (jos)
- **CHAT_PAGE-199** — Opțional: după dublă confirmare, se poate genera un „Contract de schimb” (PDF intern) cu rezumat: obiecte, data, locație, termeni.
- **CHAT_PAGE-200** — Text input + send
- **CHAT_PAGE-201** — Atașamente: imagini (minim)
- **CHAT_PAGE-202** — Acțiuni Swaply (butoane dedicate):
- **CHAT_PAGE-203** — Device/session security:
- **CHAT_PAGE-204** — Propune (creează Offer Card structurat)
- **CHAT_PAGE-205** — detectare login suspect + reautentificare pentru acțiuni critice (HOLD/Confirm swap/Share location).
- **CHAT_PAGE-206** — Exemple: „Îți ofer X pentru Y”, „X + diferență”, „Bundle X+Y”, „Transport inclus”
- **CHAT_PAGE-207** — Trust tier:
- **CHAT_PAGE-208** — Offer Card are acțiuni: Accept / Counter / Decline
- **CHAT_PAGE-209** — Mesajele din chat pot fi traduse automat sau traduse la cerere, astfel încât userii cu limbi diferite să comunice ușor.
- **CHAT_PAGE-210** — HOLD (setează/solicită HOLD cu TTL preset)
- **CHAT_PAGE-211** — Confirmă schimbul (vezi mai jos)
- **CHAT_PAGE-212** — Confirmarea schimbului (obligatoriu, cu dublă confirmare)
- **CHAT_PAGE-213** — userii noi au limitări (ex: nu pot trimite fișiere până nu au profil complet/verify/email confirm).
- **CHAT_PAGE-214** — Există buton principal în thread: ✅ Confirmă schimbul
- **CHAT_PAGE-215** — PARTEA 3 — TRADUCERE AUTOMATĂ & LA CERERE (i18n)
- **CHAT_PAGE-216** — Funcționează pe principiul dublă confirmare:
- **CHAT_PAGE-217** — Scop
- **CHAT_PAGE-218** — User A apasă → status: „Așteaptă confirmarea celuilalt”
- **CHAT_PAGE-219** — Traducerea este un layer de afișare, mesajul original rămâne sursa de adevăr.
- **CHAT_PAGE-220** — User B apasă → schimbul devine „Finalizat”
- **CHAT_PAGE-221** — Alegerea limbii (language selection)
- **CHAT_PAGE-222** — La apăsare se deschide un ecran/confirm modal cu:
- **CHAT_PAGE-223** — Fiecare user are:
- **CHAT_PAGE-224** — Rezumat: „Eu dau X / Tu dai Y (+ diferență dacă există)”
- **CHAT_PAGE-225** — preferred_language (setare explicită în profil / selector limbă)
- **CHAT_PAGE-226** — Bifă termeni: „Confirm că schimbul s-a realizat”
- **CHAT_PAGE-227** — locale detectat (browser/device) ca fallback
- **CHAT_PAGE-228** — Buton final branduit: Swaply ✅ Confirm definitiv (cu logo mic)
- **CHAT_PAGE-229** — location_country (din profil) doar ca indiciu, NU ca adevăr absolut
- **CHAT_PAGE-230** — Limba de afișare în chat = preferred_language (prioritar), altfel device locale.
- **CHAT_PAGE-231** — După finalizare:
- **CHAT_PAGE-232** — Moduri de traducere
- **CHAT_PAGE-233** — thread devine Încheiat (read-only sau limitat)
- **CHAT_PAGE-234** — Auto-Translate (implicit configurabil)
- **CHAT_PAGE-235** — obiectele își schimbă statusul (indisponibil / swapped) conform logicii aplicației
- **CHAT_PAGE-236** — Dacă limba mesajului detectată ≠ limba preferată a receptorului → se afișează automat traducerea.
- **CHAT_PAGE-237** — Stări de pagină (fallback)
- **CHAT_PAGE-238** — Mesajul original rămâne accesibil prin toggle: „Vezi originalul”.
- **CHAT_PAGE-239** — Nelogat → ecran login
- **CHAT_PAGE-240** — UI: label mic „Tradus automat”.
- **CHAT_PAGE-241** — Logat fără thread-uri → „Nu ai conversații încă” + link către Matching
- **CHAT_PAGE-242** — Translate On Demand (la cerere)
- **CHAT_PAGE-243** — Thread activ (negociere) → normal
- **CHAT_PAGE-244** — Pentru orice mesaj: buton „Tradu” / „Translate”.
- **CHAT_PAGE-245** — HOLD activ → timer + status clar
- **CHAT_PAGE-246** — Dacă auto-translate e OFF, userul poate traduce selectiv.
- **CHAT_PAGE-247** — HOLD expirat → mesaj sistem + revenire la negociere
- **CHAT_PAGE-248** — Detectarea limbii
- **CHAT_PAGE-249** — Obiect indisponibil → banner + thread limitat (fără HOLD/confirm)
- **CHAT_PAGE-250** — Sistemul detectează limba mesajului (language detection) înainte de traducere.
- **CHAT_PAGE-251** — Notificări
- **CHAT_PAGE-252** — Dacă detectarea e incertă → nu traduce automat; oferă doar „Tradu” la cerere.
- **CHAT_PAGE-253** — Badge necitite pe thread list
- **CHAT_PAGE-254** — Afișare & UX
- **CHAT_PAGE-255** — Preferințe per-thread: mute/unmute
- **CHAT_PAGE-256** — În bubble-ul mesajului:
- **CHAT_PAGE-257** — Preferințe globale notificări chat (persistente)
- **CHAT_PAGE-258** — text tradus (dacă e activ)
- **CHAT_PAGE-259** — AI (opțional, non-blocking)
- **CHAT_PAGE-260** — sub el: „Original” (expand/collapse)
- **CHAT_PAGE-261** — AI poate sugera propuneri / rezuma conversația / traduce
- **CHAT_PAGE-262** — Pentru conversații multi-limbă:
- **CHAT_PAGE-263** — AI nu blochează trimiterea mesajelor și nu e required pentru funcționarea chat-ului
- **CHAT_PAGE-264** — opțiune „Auto-translate ON/OFF” în setările thread-ului.
- **CHAT_PAGE-265** — Pentru mesajele de tip Offer Card / System messages:
- **CHAT_PAGE-266** — se traduc prin dicționare UI (i18n), nu prin AI (consistență + cost redus).
- **CHAT_PAGE-267** — Caching & cost control (obligatoriu)
- **CHAT_PAGE-268** — Traducerile se cache-uiesc (ex: message_id + target_language → translated_text).
- **CHAT_PAGE-269** — Dacă userul revine, nu se retraduce.
- **CHAT_PAGE-270** — Rate limiting: limită traduceri / zi (în funcție de rang/plan).
- **CHAT_PAGE-271** — Mesajele foarte lungi: rezumat/fragmentare (sau doar la cerere).
- **CHAT_PAGE-272** — Privacy & Safety
- **CHAT_PAGE-273** — Traducerea trece prin aceleași reguli de moderare:
- **CHAT_PAGE-274** — se moderează originalul (sursă)
- **CHAT_PAGE-275** — se poate modera și traducerea (pentru safety, dar decizia e pe original)
- **CHAT_PAGE-276** — Dacă mesajul conține date sensibile (PII), sistemul poate:
- **CHAT_PAGE-277** — avertiza înainte de traducere (mai ales la cerere)
- **CHAT_PAGE-278** — masca automat anumite pattern-uri (opțional)
- **CHAT_PAGE-279** — Fallback dacă serviciul AI e down
- **CHAT_PAGE-280** — Chat-ul funcționează normal fără traducere.
- **CHAT_PAGE-281** — UI: „Traducerea nu este disponibilă momentan” + buton retry.
- **CHAT_PAGE-282** — Sugestie extra (premium)
- **CHAT_PAGE-283** — În composer, toggle: „Scriu în [limba mea], trimite și traducerea în [limba lui]”.
- **CHAT_PAGE-284** — Receptorul primește direct traducerea + poate vedea originalul.
- **CHAT_PAGE-285** — Chat page

## Swaply page

_BBox: x=3225.5, y=223.5, w=554, h=800_

- **SWAPLY_PAGE-001** — RO ▼
- **SWAPLY_PAGE-002** — Nelogat
- **SWAPLY_PAGE-003** — ⋮
- **SWAPLY_PAGE-004** — RO ▼
- **SWAPLY_PAGE-005** — ⋮
- **SWAPLY_PAGE-006** — Logat
- **SWAPLY_PAGE-007** — Toate paginile
- **SWAPLY_PAGE-008** — PAGINA „SWAPLY” — PAGINA DE CONFIRMARE A SCHIMBULUI (Contract + Logistică + Facilitatori + Hartă + Notificări + Feedback)
- **SWAPLY_PAGE-009** — 0) Scopul paginii
- **SWAPLY_PAGE-010** — Pagina „Swaply” este locul oficial unde un match devine schimb real. Aici se:
- **SWAPLY_PAGE-011** — UI: preview blurat + CTA
- **SWAPLY_PAGE-012** — confirmă schimbul (bilateral),
- **SWAPLY_PAGE-013** — confirmă metoda de schimb (direct/local/internațional/vacanță/casă/serviciu),
- **SWAPLY_PAGE-014** — se generează și se acceptă Acordul PDF (versionat),
- **SWAPLY_PAGE-015** — neimplementat = disabled, nu 404, nu crash
- **SWAPLY_PAGE-016** — se afișează harta (privacy-first) + punct/zonă/rută,
- **SWAPLY_PAGE-017** — se propun facilitatori auto-localizați (global),
- **SWAPLY_PAGE-018** — se gestionează atașamente (garanții/fișe/poze) cu scanare,
- **SWAPLY_PAGE-019** — se finalizează cu feedback care influențează rang/tokeni,
- **SWAPLY_PAGE-020** — se gestionează notificări, termene și consimțăminte speciale.
- **SWAPLY_PAGE-021** — Principiu: Swaply NU arbitrează negocierea. Platforma doar informează și înregistrează acordul.
- **SWAPLY_PAGE-022** — A) UI GLOBAL (obligatoriu pe pagină)
- **SWAPLY_PAGE-023** — A1) Header fix: Logo + Titlu + Status
- **SWAPLY_PAGE-024** — Logo Swaply + titlu “Swaply”
- **SWAPLY_PAGE-025** — Subtitlu: “Confirmarea schimbului între {{UserA}} și {{UserB}}”
- **SWAPLY_PAGE-026** — Status bar / timeline:
- **SWAPLY_PAGE-027** — Draft
- **SWAPLY_PAGE-028** — - Acceptarea sau refuzarea unui schimb 
   este disponibilă doar utilizatorilor autentificați.
- **SWAPLY_PAGE-029** — Pending review
- **SWAPLY_PAGE-030** — Ready to confirm
- **SWAPLY_PAGE-031** — Confirmed by one
- **SWAPLY_PAGE-032** — Swaply Active
- **SWAPLY_PAGE-033** — Completed
- **SWAPLY_PAGE-034** — Dispute
- **SWAPLY_PAGE-035** — Indicator “Versiune acord”: v1 / v2 / v3…
- **SWAPLY_PAGE-036** — A2) Selector limbă (obligatoriu)
- **SWAPLY_PAGE-037** — poziționat în header (dreapta sus) + opțiune “Auto (detectare)”
- **SWAPLY_PAGE-038** — afectează:
- **SWAPLY_PAGE-039** — tot UI-ul paginii
- **SWAPLY_PAGE-040** — rezumatul AI
- **SWAPLY_PAGE-041** — Acordul PDF (limba afișată)
- **SWAPLY_PAGE-042** — modul de traducere din chat (Show original / Show translated)
- **SWAPLY_PAGE-043** — fallback obligatoriu: EN dacă limba nu e disponibilă.
- **SWAPLY_PAGE-044** — A3) Meniu contextual (specific pentru Swaply)
- **SWAPLY_PAGE-045** — Meniu (3 puncte) cu opțiuni:
- **SWAPLY_PAGE-046** — Descarcă Acord PDF (vX)
- **SWAPLY_PAGE-047** — Vezi audit / istoric versiuni (cine a schimbat ce, când)
- **SWAPLY_PAGE-048** — Setări confidențialitate (consimțăminte: locație/telefon/adresă/documente)
- **SWAPLY_PAGE-049** — Raportează problemă (fraudă, abuz, conținut)
- **SWAPLY_PAGE-050** — Deschide Dispută (dacă e activ sau după confirmare)
- **SWAPLY_PAGE-051** — Trimite remind către partener (ex: “Te rog semnează v2”)
- **SWAPLY_PAGE-052** — Export rezumat schimb (PDF/JSON “for my records”) – opțional
- **SWAPLY_PAGE-053** — Ajutor & reguli Swaply (interzis, recomandări întâlnire, ghid ambalare)
- **SWAPLY_PAGE-054** — Opțiune specială (importantă):
- **SWAPLY_PAGE-055** — 9) “Acord poveste” / “Include schimbul într-o poveste” (vezi secțiunea G)
- **SWAPLY_PAGE-056** — A4) Footer (global)
- **SWAPLY_PAGE-057** — Linkuri: Termeni, Confidențialitate (GDPR), Politica anti-fraudă & moderare, Contact/Support
- **SWAPLY_PAGE-058** — “© Swaply” + versiune aplicație (opțional)
- **SWAPLY_PAGE-059** — Link “Raportează o problemă” (redundanță intenționată)
- **SWAPLY_PAGE-060** — Autentificare
Creează cont
- **SWAPLY_PAGE-061** — B) REZUMATUL SCHIMBULUI (obligatoriu)
- **SWAPLY_PAGE-062** — Două carduri mari:
- **SWAPLY_PAGE-063** — Tu oferi: poze, titlu, stare/condiție, descriere scurtă, locație generală (oraș), valoare estimată (opțional).
- **SWAPLY_PAGE-064** — Tu primești: aceleași câmpuri.
- **SWAPLY_PAGE-065** — Câmp opțional: “Observații / înțelegeri speciale”.
- **SWAPLY_PAGE-066** — C) SUBSECȚIUNEA 1 — CONFIRMAREA SCHIMBULUI (Semnare)
- **SWAPLY_PAGE-067** — C1) Informare obligatorie înainte de Confirm
- **SWAPLY_PAGE-068** — Un rezumat scurt (8–10 rânduri) vizibil înainte de buton:
- **SWAPLY_PAGE-069** — ce se schimbă,
- **SWAPLY_PAGE-070** — metoda aleasă,
- **SWAPLY_PAGE-071** — ce date se deblochează după semnare,
- **SWAPLY_PAGE-072** — că facilitatorii sunt terți (fără garanție),
- **SWAPLY_PAGE-073** — → Autentifică-te
- **SWAPLY_PAGE-074** — că modificările cer reconfirmare (v2),
- **SWAPLY_PAGE-075** — că există Dispute + dovezi,
- **SWAPLY_PAGE-076** — că feedback-ul are termen limită (deadline).
- **SWAPLY_PAGE-077** — C2) Semnare bilaterală
- **SWAPLY_PAGE-078** — Buton: „Confirm Swaply / Semnează acordul”
- **SWAPLY_PAGE-079** — Stări:
- **SWAPLY_PAGE-080** — „Semnat de tine, așteaptă semnătura lui {{UserX}}”
- **SWAPLY_PAGE-081** — „Semnat de amândoi → Swaply Active”
- **SWAPLY_PAGE-082** — C3) Regula “reconfirmare”
- **SWAPLY_PAGE-083** — Orice modificare la metodă, locație, interval, consimțăminte, curier/AWB, atașamente esențiale => Acord nou v2 + semnare din nou de ambele părți.
- **SWAPLY_PAGE-084** — D) SUBSECȚIUNEA 2 — CONFIRMAREA METODEI DE SCHIMB
- **SWAPLY_PAGE-085** — Metode (alegi una):
- **SWAPLY_PAGE-086** — Pin special cu: nume locație, interval, note (“la recepție”, “intrarea principală”).
- **SWAPLY_PAGE-087** — Direct (întâlnire)
- **SWAPLY_PAGE-088** — F) SUBSECȚIUNEA 3 — FACILITATORI AUTO-LOCALIZAȚI (global)
- **SWAPLY_PAGE-089** — Local (în aceeași zonă/țară)
- **SWAPLY_PAGE-090** — F1) Regula de auto-localizare
- **SWAPLY_PAGE-091** — Internațional
- **SWAPLY_PAGE-092** — Facilitatorii se propun automat în funcție de:
- **SWAPLY_PAGE-093** — Vacanță / călătorie personală (handoff)
- **SWAPLY_PAGE-094** — locația participantului A,
- **SWAPLY_PAGE-095** — Schimb de case
- **SWAPLY_PAGE-096** — locația participantului B,
- **SWAPLY_PAGE-097** — Schimb de servicii
- **SWAPLY_PAGE-098** — locația întâlnirii/handoff,
- **SWAPLY_PAGE-099** — Fiecare metodă are câmpuri de detaliu + informări, dar Swaply nu arbitrează negocieri.
- **SWAPLY_PAGE-100** — metoda de schimb.
- **SWAPLY_PAGE-101** — E) HARTA (obligatoriu) — privacy-first + pin/zonă/rută
- **SWAPLY_PAGE-102** — Filtre:
- **SWAPLY_PAGE-103** — lângă mine / lângă partener / în locul întâlnirii / pe traseu.
- **SWAPLY_PAGE-104** — E1) 3 moduri
- **SWAPLY_PAGE-105** — F2) Categorii (liste)
- **SWAPLY_PAGE-106** — Aproximativ (pre-semnare): oraș + cerc/radius.
- **SWAPLY_PAGE-107** — Curieri / transport colete
- **SWAPLY_PAGE-108** — Confirmat (post-semnare + consimțământ): pin exact pentru întâlnire/adresă.
- **SWAPLY_PAGE-109** — Transport local
- **SWAPLY_PAGE-110** — Traseu/Zone: Punct fix / Zonă / Rută (linie: start+stop+opriri + interval timp).
- **SWAPLY_PAGE-111** — Transport feroviar
- **SWAPLY_PAGE-112** — E2) Pin “Punct de întâlnire”
- **SWAPLY_PAGE-113** — Închirieri auto
- **SWAPLY_PAGE-114** — Cazări
- **SWAPLY_PAGE-115** — Restaurante / locuri de întâlnire
- **SWAPLY_PAGE-116** — Servicii de ambalare
- **SWAPLY_PAGE-117** — Furnizori ambalaje
- **SWAPLY_PAGE-118** — Asigurări
- **SWAPLY_PAGE-119** — Escrow / garanții (informare)
- **SWAPLY_PAGE-120** — Transferuri bancare / plăți externe (informare + afiliere; fără plăți în app)
- **SWAPLY_PAGE-121** — Regulă: Swaply recomandă și informează; nu garantează terți și nu procesează plăți interne (dacă nu se decide altfel).
- **SWAPLY_PAGE-122** — G) CONSIMȚĂMÂNT “POVESTE” (nou, obligatoriu)
- **SWAPLY_PAGE-123** — Scop: utilizatorii pot accepta ca schimbul să fie folosit într-o “poveste”/story (marketing/community), cu reguli de confidențialitate.
- **SWAPLY_PAGE-124** — G1) Toggle/checkbox-uri (separate)
- **SWAPLY_PAGE-125** — ☐ “Accept includerea schimbului într-o poveste publică”
- **SWAPLY_PAGE-126** — ☐ “Permite folosirea pozelor obiectelor” (fără date personale)
- **SWAPLY_PAGE-127** — ☐ “Permite folosirea conversației” (doar citate anonimizate, opțional)
- **SWAPLY_PAGE-128** — ☐ “Permite afișarea locației” (numai țară/oraș, niciodată adresă)
- **SWAPLY_PAGE-129** — ☐ “Anonimizare completă” (default recomandat)
- **SWAPLY_PAGE-130** — G2) Reguli
- **SWAPLY_PAGE-131** — consimțământul e revocabil
- **SWAPLY_PAGE-132** — povestea nu include nume real, telefon, adresă, coordonate
- **SWAPLY_PAGE-133** — dacă unul refuză, povestea nu se publică.
- **SWAPLY_PAGE-134** — H) DOCUMENTE & ATAȘAMENTE (opțional, dar suport complet)
- **SWAPLY_PAGE-135** — upload: factură/garanție/PDF fișă produs/poze detalii/serie.
- **SWAPLY_PAGE-136** — acces limitat până la semnare (sau doar metadate)
- **SWAPLY_PAGE-137** — scanare malware server-side, fișiere suspecte blocate.
- **SWAPLY_PAGE-138** — I) CONFIDENȚIALITATE & CONSIMȚĂMÂNT (GDPR + safety)
- **SWAPLY_PAGE-139** — Switch-uri:
- **SWAPLY_PAGE-140** — Partajează telefon/email
- **SWAPLY_PAGE-141** — Partajează adresă
- **SWAPLY_PAGE-142** — Partajează locația exactă
- **SWAPLY_PAGE-143** — Partajează documente
- **SWAPLY_PAGE-144** — Reguli:
- **SWAPLY_PAGE-145** — pre-semnare: fără date sensibile
- **SWAPLY_PAGE-146** — post-semnare: doar cu consimțământ
- **SWAPLY_PAGE-147** — retragere: ascunde imediat (audit log)
- **SWAPLY_PAGE-148** — J) DISPUTE / INCIDENTE (cadru minim)
- **SWAPLY_PAGE-149** — Buton: “Deschide Dispută”
- **SWAPLY_PAGE-150** — tip incident + dovezi (poze, AWB, conversație)
- **SWAPLY_PAGE-151** — freeze parțial + status.
- **SWAPLY_PAGE-152** — K) SUBSECȚIUNEA 4 — FEEDBACK + TERMENE (închide fluxul)
- **SWAPLY_PAGE-153** — K1) Confirmare predare/primire
- **SWAPLY_PAGE-154** — Butoane: “Confirm predare / Confirm primire” (sau “confirm prestare” la servicii)
- **SWAPLY_PAGE-155** — K2) Deadline feedback (obligatoriu în spec)
- **SWAPLY_PAGE-156** — se setează automat un interval:
- **SWAPLY_PAGE-157** — exemplu: “Feedback disponibil până la {{feedback_deadline_date}}”
- **SWAPLY_PAGE-158** — după deadline:
- **SWAPLY_PAGE-159** — feedback-ul poate fi închis sau redus (ex: doar rating scurt) – decizie de produs
- **SWAPLY_PAGE-160** — notificări automate înainte de deadline.
- **SWAPLY_PAGE-161** — K3) Feedback
- **SWAPLY_PAGE-162** — rating pe categorii + text opțional
- **SWAPLY_PAGE-163** — actualizează rang/reputație/tokeni.
- **SWAPLY_PAGE-164** — L) NOTIFICĂRI (obligatoriu, integrate cu meniu + header)
- **SWAPLY_PAGE-165** — Tipuri de notificări:
- **SWAPLY_PAGE-166** — Like / Interes
- **SWAPLY_PAGE-167** — Solicitare chat
- **SWAPLY_PAGE-168** — Mesaj nou
- **SWAPLY_PAGE-169** — Swaply: propus / semnat de unul / activ / reconfirmare v2 / anulat
- **SWAPLY_PAGE-170** — Facilitatori: update tracking / reminder (dacă există integrare sau input manual)
- **SWAPLY_PAGE-171** — Atenționare feedback: “mai ai X zile până la deadline”
- **SWAPLY_PAGE-172** — Notificările includ:
- **SWAPLY_PAGE-173** — data/ora evenimentului
- **SWAPLY_PAGE-174** — link direct către Swaply relevant
- **SWAPLY_PAGE-175** — acțiune rapidă (ex: “Semnează”, “Răspunde”, “Lasă feedback”).
- **SWAPLY_PAGE-176** — M) Acord PDF (obligatoriu)
- **SWAPLY_PAGE-177** — Flux:
- **SWAPLY_PAGE-178** — “Vezi Acord PDF (vX)”
- **SWAPLY_PAGE-179** — checkbox “Am luat la cunoștință”
- **SWAPLY_PAGE-180** — “Confirm / Semnez”
- **SWAPLY_PAGE-181** — Sistemul salvează:
- **SWAPLY_PAGE-182** — PDF exact (vX), hash, timestamps A/B, audit log.
- **SWAPLY_PAGE-183** — N) Edge cases
- **SWAPLY_PAGE-184** — modificare după semnare => v2 + reconfirmare
- **SWAPLY_PAGE-185** — pin=linie (croazieră/tren) => Rută (start/stop/opriri + interval)
- **SWAPLY_PAGE-186** — obiect indisponibil => Needs update + blocare semnare
- **SWAPLY_PAGE-187** — Map provider (TBD) — privacy-first + cost control
- **SWAPLY_PAGE-188** — Swaply page

## Info Page

_BBox: x=3862.5, y=220.5, w=554, h=800_

- **INFO_PAGE-001** — RO ▼
- **INFO_PAGE-002** — ⋮
- **INFO_PAGE-003** — Nelogat
- **INFO_PAGE-004** — RO ▼
- **INFO_PAGE-005** — ⋮
- **INFO_PAGE-006** — Logat
- **INFO_PAGE-007** — Toate paginile
- **INFO_PAGE-008** — neimplementat = disabled, nu 404, nu crash
- **INFO_PAGE-009** — INFO PAGE — NOTE PENTRU DEVELOPER (Swaply)
- **INFO_PAGE-010** — 0) Rolul paginii Info (de ce există)
- **INFO_PAGE-011** — Info Page este “centrul de gravitație” pentru:
- **INFO_PAGE-012** — 11) Monetizare — 20 idei pentru fiecare tip de schimb (matrice completă)
- **INFO_PAGE-013** — explicații (Despre, Reguli, Safety),
- **INFO_PAGE-014** — transparență (statistici globale + statistici personale),
- **INFO_PAGE-015** — 11.A Schimb direct (față în față) — 20
- **INFO_PAGE-016** — legal (T&C, GDPR, cookies),
- **INFO_PAGE-017** — Boost local (plătit în tokeni)
- **INFO_PAGE-018** — monetizare (toate mecanismele, clar explicate),
- **INFO_PAGE-019** — AI & AUTOMATIZĂRI — TRANSPARENȚĂ + CONTRACT TEHNIC (OBLIGATORIU)
1) Principiu general

AI-ul în Swaply are rol de asistent (recomandă, clasifică, traduce, protejează), NU de “judecător absolut”.
Orice decizie importantă (confirmare schimb, locație exactă, acceptare condiții, acord poveste, bani/tokeni) rămâne umană + explicită.

2) Componente AI (ce există în sistem)

A. Clasificare imagine (Hugging Face)

Input: imagine obiect (după upload)

Output: label(e), confidence 0–1, posibil categorie/subcategorie sugerată

Folosire: autocomplete titlu, sugestie categorie, tags, “similar items”.

B. Matching AI (recomandări de schimb)

Input: obiectele oferite + wishlist + locație aproximativă + preferințe + istoric like/skip

Output: propuneri swap + scoruri + motive scurte (“de ce”)

Regula de aur: Match propune, user decide.

C. Estimare valoare (AI)

Output: valoare orientativă într-o monedă internă (ex: EUR) + interval + confidence

UI: se afișează ca “estimare orientativă” cu disclaimere (nu preț, nu garanție).

D. Chat: traducere automată + la cerere

Traducerea trece prin aceleași reguli de moderare ca mesajul original.

E. Moderare limbaj (toxicity / hate / threats)

Se aplică pe: chat, titluri/descrieri obiecte, comentarii feedback.

Output: scor + acțiune: allow / warn / block / escalation.

F. Anti-fraudă & link safety

Detectează pattern-uri: cereri bani externe, linkuri suspecte, presiune, scam clasic.

Output: avertisment + banner + raportare rapidă.

G. Anti-malware pentru atașamente

Scanare server-side înainte de download.

Fișiere suspecte: blocate + log audit.

3) Date trimise către AI (minimizare + interdicții)

NU trimitem către servicii externe: email, telefon, adresă exactă, CNP/ID, coordonate exacte, conversații complete “în bloc” fără motiv.

Pentru matching: folosim doar datele necesare (tags, categorii, embeddings, locație aproximativă).

Pentru chat: moderarea e obligatorie (safety), dar păstrăm audit minim.

4) Stocare rezultate AI (versionare + audit)

Orice output AI salvat în DB trebuie să includă:

provider (ex: huggingface / openai / internal)

model + model_version

created_at

input_hash (ca să evităm recalculări)

confidence / scoruri

trace_id (pentru debugging)

Obligatoriu: păstrăm separat:

ai_suggested_* (titlu/categorie/tags/valoare)

user_final_* (ce a ales userul)
Ca să nu “rescriem realitatea” și să putem explica “de ce”.

5) Control user (opt-in/opt-out unde are sens)

În Setări / Info trebuie explicat clar:

Auto-translate: ON/OFF (user choice)

AI suggestions pentru obiecte: ON/OFF (user choice)

Matching AI: ON/OFF (user choice) — dacă OFF, user vede doar căutare/filtre clasice

Moderare safety: NU se poate opri (obligatoriu pentru platformă)

“Folosește datele mele pentru îmbunătățirea modelelor”: OFF by default (opt-in explicit)

6) Fallback obligatoriu (când AI pică)

Platforma NU are voie să se blocheze dacă AI e indisponibil.

Clasificare imagine: dacă eșuează → user completează manual titlu/categorie

Matching: dacă eșuează → “manual browse” + filtru clasic

Traducere: dacă eșuează → afișează original + buton retry

Moderare: dacă eșuează → “safe mode”: limitează trimiterea de linkuri/atașamente până revine (dar fără crash).

7) Rate limit + cost control (ca să nu luăm foc la facturi)

Dedupe: același input (hash) → nu recalculăm.

Timeouts: AI calls au timeout strict (ex: 8–15s) + retry controlat.

Queue: taskurile grele (matching global, embedding, scanări) merg în job queue/background.

Limite per user/zi: traduceri, explain, estimări.

Caching: rezultate AI reutilizabile.

8) “Explainability” (de ce am primit recomandarea asta?)

Pentru orice propunere de match / penalizare / avertisment:

UI: buton “De ce?”

Output scurt, fără date sensibile: 3–5 bullets (ex: categorie compatibilă, proximitate, istoric preferințe)

Nu divulgăm date despre celălalt user care nu sunt publice.

9) Prompt-injection & conținut ostil (regulă pentru dev)

User content este neîncrezut by default:

Linkuri, fișiere, texte pot încerca să “păcălească” AI-ul.

AI-ul nu are voie să execute instrucțiuni din conținutul userului (ex: “ignore rules”).

Output AI trebuie filtrat/sanitizat (fără HTML/script).

10) Dashboard intern (admin/dev) — minim necesar

Existență (chiar dacă e ascuns inițial):

loguri AI (trace_id, model, erori)

vizualizare ai_metadata pe item/match/chat (redactat PII)

toggle global “AI maintenance mode”.

11) Disclaimer în UI (transparent, scurt)

“AI poate greși. Recomandările sunt orientative.”

“Valoarea estimată nu este preț.”

“Moderarea automată poate bloca temporar conținut; ai drept de contestare.”
- **INFO_PAGE-020** — Badge “Verified meetup-ready” (abonament)
- **INFO_PAGE-021** — suport (help, contact, raportare abuz).
- **INFO_PAGE-022** — Conținutul este static + semi-dinamic:
- **INFO_PAGE-023** — Prioritate în listări “near me”
- **INFO_PAGE-024** — Static: texte, reguli, acorduri, FAQ, pagini legale.
- **INFO_PAGE-025** — Sloturi extra de obiecte active
- **INFO_PAGE-026** — Dinamic: statistici globale (agregate) + statistici user (doar dacă e logat), curs valutar, balanță tokeni, istorice.
- **INFO_PAGE-027** — 1) UI obligatoriu (identic cu restul site-ului)
- **INFO_PAGE-028** — Legal links accesibile global
- **INFO_PAGE-029** — Poze suplimentare / video demo
- **INFO_PAGE-030** — Header: Navigație principală selector limbă RO ▼ + meniu contextual ⋮.
- **INFO_PAGE-031** — AI “suggested swap fairness” (analiză)
- **INFO_PAGE-032** — Jos (footer persistent): navigația principală (Home/Objects/Match/Chat/Change/Info) — mereu vizibilă
- **INFO_PAGE-033** — Footer: linkuri legale + contact + raportare + cookies + versiune / “last updated”.
- **INFO_PAGE-034** — Filtre avansate (brand/condiție/rang)
- **INFO_PAGE-035** — Language: schimbarea limbii afectează texte UI +  Info (About, Reguli, T&C, GDPR, Cookies). (Exact cum apare în schemă.)
- **INFO_PAGE-036** — “Hold slot” (rezervare obiect 24h)
- **INFO_PAGE-037** — 2) Structura paginii (layout)
- **INFO_PAGE-038** — Raport reputație extins (analytics)
- **INFO_PAGE-039** — Pagina e împărțită în tab-uri/accordion (ca să nu fie un “roman infinit”):
- **INFO_PAGE-040** — Mesaje traduse nelimitat (pachet)
- **INFO_PAGE-041** — Despre Swaply
- **INFO_PAGE-042** — Cum funcționează schimburile (modalități)
- **INFO_PAGE-043** — Template-uri de negociere (premium)
- **INFO_PAGE-044** — Statistici globale
- **INFO_PAGE-045** — “Safe meeting checklist” + reminders (premium)
- **INFO_PAGE-046** — Statisticile mele (doar logat)
- **INFO_PAGE-047** — Rang & reputație (cum se calculează + upgrade plătit)
- **INFO_PAGE-048** — Acces la “facilitatori” (fee)
- **INFO_PAGE-049** — Tokeni (ce sunt, cum se obțin, cum se cheltuie)
- **INFO_PAGE-050** — Programare întâlnire integrată (calendar)
- **INFO_PAGE-051** — Schimb valutar (conversie + reguli de afișare)
- **INFO_PAGE-052** — Help & reguli (safety, moderare, acorduri)
- **INFO_PAGE-053** — Confirmare schimb + “smart receipt” PDF (fee mic)
- **INFO_PAGE-054** — Monetizare (matrice completă pe tipuri de schimb)
- **INFO_PAGE-055** — Asigurare micro pentru întâlnire (partener)
- **INFO_PAGE-056** — Legal & Contact (T&C, GDPR, Cookies, suport)
- **INFO_PAGE-057** — Dacă user NU e logat: arată CTA clar: „Autentificare / Creează cont” + buton „→ Autentifică-te” (cum e deja desenat în schemă). Secțiunile 4–7 devin “preview” cu lock + explicație.
- **INFO_PAGE-058** — Verificare identitate (KYC opțional)
- **INFO_PAGE-059** — “No-show protection” (sistem de depozit tokeni)
- **INFO_PAGE-060** — 3) Despre Swaply (About)
- **INFO_PAGE-061** — Publicare în “Top swaps of week” (promo)
- **INFO_PAGE-062** — Misiune: schimburi între oameni, cu încredere, claritate, reputație.
- **INFO_PAGE-063** — Comision mic pentru “premium matching queue”
- **INFO_PAGE-064** — Ce NU e Swaply: nu e marketplace clasic (nu obligă la bani), nu garantează evaluări perfecte, nu e serviciu de curierat (doar integrează opțiuni).
- **INFO_PAGE-065** — 11.B Schimb local (cu logistică mică / curier local) — 20
- **INFO_PAGE-066** — Principii: transparență, safety, privacy-first, anti-scam.
- **INFO_PAGE-067** — Integrare curieri locali (affiliate)
- **INFO_PAGE-068** — “Last updated” (data ultimei revizii a regulilor).
- **INFO_PAGE-069** — 4) Cum funcționează schimburile (modalități + clarificări)
- **INFO_PAGE-070** — Etichete de livrare generate în app (fee)
- **INFO_PAGE-071** — 4.1 Modalități de schimb (listă “de manual”)
- **INFO_PAGE-072** — Pickup scheduling (fee)
- **INFO_PAGE-073** — Direct (față în față)
- **INFO_PAGE-074** — Ambalare recomandată + “kit” (partener)
- **INFO_PAGE-075** — Local (același oraș / județ)
- **INFO_PAGE-076** — Național (cu livrare)
- **INFO_PAGE-077** — Insurance local (partener)
- **INFO_PAGE-078** — Internațional (cu livrare + vamă)
- **INFO_PAGE-079** — Tracking în app (premium)
- **INFO_PAGE-080** — Vacanță / “hand-off” (întâlnire planificată în altă locație)
- **INFO_PAGE-081** — Casă/locuință (schimburi mari / pe termen)
- **INFO_PAGE-082** — Puncte de predare (lockers) — comision
- **INFO_PAGE-083** — Servicii (timp/skill contra obiect/serviciu)
- **INFO_PAGE-084** — - Despre Swaply
- **INFO_PAGE-085** — “Same-day swap” boost (tokeni)
- **INFO_PAGE-086** — 4.2 Harta (obligatoriu, privacy-first)
- **INFO_PAGE-087** — 3 niveluri de locație:
- **INFO_PAGE-088** — Verificare dimensiuni/greutate AI (premium)
- **INFO_PAGE-089** — Aproximativ (pre-semnare): oraș + cerc/radius (fără adresă)
- **INFO_PAGE-090** — Calcul cost livrare automat (premium)
- **INFO_PAGE-091** — Confirmat (post-semnare + consimțământ): pin exact pentru întâlnire/adresă
- **INFO_PAGE-092** — Traseu (opțional): “pe drum spre…” pentru vacanțe / livrări (linie/zonă, nu tracking live default)
- **INFO_PAGE-093** — “Split cost” tool (premium)
- **INFO_PAGE-094** — Filtre hartă: “lângă mine / lângă partener / în locul întâlnirii / pe traseu”.
- **INFO_PAGE-095** — Service de fotografiere (partener)
- **INFO_PAGE-096** — 5) Statistici globale (agregate, fără date personale)
- **INFO_PAGE-097** — - Reguli de utilizare
- **INFO_PAGE-098** — Scop: să arate “cât de viu e ecosistemul”.
- **INFO_PAGE-099** — Evaluare stare obiect (AI) (tokeni)
- **INFO_PAGE-100** — Afișează:
- **INFO_PAGE-101** — Protecție dispute (fee)
- **INFO_PAGE-102** — Nr. total schimburi finalizate (overall + ultimele 30 zile)
- **INFO_PAGE-103** — Nr. total obiecte listate / dorite
- **INFO_PAGE-104** — Escrow light pentru livrare (fee)
- **INFO_PAGE-105** — Nr. categorii + top categorii
- **INFO_PAGE-106** — “Local trade guarantee” (abonament)
- **INFO_PAGE-107** — Nr. țări + top țări / orașe
- **INFO_PAGE-108** — Distribuție ranguri (ex: Bronze/Silver/Gold/Platinum sau alt sistem)
- **INFO_PAGE-109** — Promo “hot deals local” (promo fee)
- **INFO_PAGE-110** — - Informații legale și de contact
- **INFO_PAGE-111** — Distribuție modalități de schimb (direct/local/internațional/vacanță/casă/servicii)
- **INFO_PAGE-112** — “Priority support” (abonament)
- **INFO_PAGE-113** — Nr. feedback-uri totale + scor mediu global (cu disclaimere)
- **INFO_PAGE-114** — “Bulk swapping” (10 obiecte) (plan)
- **INFO_PAGE-115** — Status sistem: uptime / “incidente recente” (minimal, tip “status page” light)
- **INFO_PAGE-116** — Important: toate aceste statistici sunt agregate și anonimizate. Niciun username nu apare aici.
- **INFO_PAGE-117** — Comision pentru facilitatori locali
- **INFO_PAGE-118** — 6) Statisticile mele (doar logat)
- **INFO_PAGE-119** — 11.C Schimb internațional — 20
- **INFO_PAGE-120** — Afișează dashboard personal:
- **INFO_PAGE-121** — Obiecte expuse (active / arhivate / șterse)
- **INFO_PAGE-122** — Calcul vamă/taxe orientativ (premium)
- **INFO_PAGE-123** — Obiecte dorite (wishlist)
- **INFO_PAGE-124** — Integrare shipping internațional (affiliate)
- **INFO_PAGE-125** — Like-uri primite / like-uri oferite
- **INFO_PAGE-126** — Sesiuni de chat: inițiate / primite / active / închise
- **INFO_PAGE-127** — Documente vamale generate (fee)
- **INFO_PAGE-128** — Schimburi finalizate (total + pe tip: direct/local/internațional/vacanță/casă/servicii)
- **INFO_PAGE-129** — Insurance internațional (partener)
- **INFO_PAGE-130** — Metode folosite (grafic mic)
- **INFO_PAGE-131** — Feedback-uri oferite / primite + rata de răspuns la feedback
- **INFO_PAGE-132** — Ambalare certificată (partener)
- **INFO_PAGE-133** — Dispute / rapoarte (dacă există) + status
- **INFO_PAGE-134** — Escrow complet (fee %)
- **INFO_PAGE-135** — “Poveste”: câte schimburi au fost acceptate pentru “story” (doar cu acord explicit)
- **INFO_PAGE-136** — 7) Rang & reputație (clasificare + “plata rangului”)
- **INFO_PAGE-137** — Verificare identitate obligatorie pentru anumite praguri
- **INFO_PAGE-138** — 7.1 Ce este rangul
- **INFO_PAGE-139** — Verificare fraudă + scoring (premium)
- **INFO_PAGE-140** — Rangul este o combinație de:
- **INFO_PAGE-141** — vechime cont + verificări (email/telefon/ID dacă există ca opțiune),
- **INFO_PAGE-142** — Traducere profesională (partener)
- **INFO_PAGE-143** — comportament (rate de răspuns, abandon chat, no-show),
- **INFO_PAGE-144** — “Time-zone scheduling” (premium)
- **INFO_PAGE-145** — 12) AI Safety & Ops (OBLIGATORIU PENTRU IMPLEMENTARE)
- **INFO_PAGE-146** — schimburi finalizate,
- **INFO_PAGE-147** — 12.1 Chei & apeluri către AI (security)
- **INFO_PAGE-148** — “International priority matching” (tokeni)
- **INFO_PAGE-149** — feedback primit (calitate + consistență),
- **INFO_PAGE-150** — respectarea regulilor (moderare limbaj, raportări validate),
- **INFO_PAGE-151** — Toate apelurile către Hugging Face / orice model extern se fac DOAR server-side (API route / server actions).
- **INFO_PAGE-152** — Tracking avansat multi-curier (premium)
- **INFO_PAGE-153** — “tranzacții sigure” (ex: confirmări complete, locație oferită doar după acord, etc).
- **INFO_PAGE-154** — Nicio cheie / token nu ajunge în client (nici în bundle, nici în request-uri directe).
- **INFO_PAGE-155** — “Return handling” (partener)
- **INFO_PAGE-156** — 7.2 Upgrade plătit (atenție: să nu pară “pay-to-win”)
- **INFO_PAGE-157** — Permite “rang plătit” ca beneficii de vizibilitate și confort, NU ca ștergere de istoric:
- **INFO_PAGE-158** — Pentru upload imagini/fișiere: linkuri semnate / permisiuni minime, fără expunere publică by default.
- **INFO_PAGE-159** — “Damage claim assistant” (AI premium)
- **INFO_PAGE-160** — badge vizual + prioritate în liste
- **INFO_PAGE-161** — 12.2 Moderare imagini înainte de clasificare
- **INFO_PAGE-162** — Conversie valutară + recomandări (premium)
- **INFO_PAGE-163** — filtre avansate
- **INFO_PAGE-164** — Orice imagine uploadată trece printr-un filtru de siguranță (NSFW/violent/illegal policy) înainte să fie trimisă la clasificare.
- **INFO_PAGE-165** — suport prioritar
- **INFO_PAGE-166** — Depozite/lockers internaționale (partener)
- **INFO_PAGE-167** — mai multe “boost-uri” / lună
- **INFO_PAGE-168** — Dacă e suspectă: se blochează procesarea + se oferă mesaj clar userului + opțiune de contestare.
- **INFO_PAGE-169** — Pachete “global trader” (abonament)
- **INFO_PAGE-170** — limite crescute (anunțuri, poze, chat-uri simultane)
- **INFO_PAGE-171** — rapoarte/analytics personale extinse
- **INFO_PAGE-172** — 12.3 Retenție date (GDPR-ready)
- **INFO_PAGE-173** — Comision pentru “verified international” badge
- **INFO_PAGE-174** — Regulă: dacă user primește penalizări (ban/mute/strike), rangul plătit NU îl salvează. Poate doar fi “înghețat”.
- **INFO_PAGE-175** — Definim o politică de retenție per tip de date (mesaje chat, fișiere, loguri moderare, rezultate AI, istorice tokeni).
- **INFO_PAGE-176** — Compliance rules by country (premium access)
- **INFO_PAGE-177** — 7.3 Ecran în Info: “Cum urci în rang”
- **INFO_PAGE-178** — La cerere “delete account”: se șterg/anonimizează datele personale + se păstrează doar ce e obligatoriu legal (ex: ledger tranzacții) în formă minimă.
- **INFO_PAGE-179** — O mini-legendă clară + exemple: “dacă finalizezi 3 schimburi și primești 3 feedback-uri → urci”.
- **INFO_PAGE-180** — Protecție dispute extinsă (fee)
- **INFO_PAGE-181** — 8) Tokeni (gestionare completă)
- **INFO_PAGE-182** — 12.4 Contestare & human review
- **INFO_PAGE-183** — 11.D Schimb în vacanță / hand-off — 20
- **INFO_PAGE-184** — 8.1 Ce sunt tokenii
- **INFO_PAGE-185** — Tokenii sunt “monedă internă” pentru funcții premium (boost, traduceri AI extra, verificări, etc).
- **INFO_PAGE-186** — Orice block/warn automat are buton “Contestă”.
- **INFO_PAGE-187** — Pin/zonă întâlnire avansată pe hartă (premium)
- **INFO_PAGE-188** — 8.2 Cum îi obții
- **INFO_PAGE-189** — Există coadă de review (admin/moderator) + log audit (trace_id) redactat de PII.
- **INFO_PAGE-190** — “Route-based matching” (premium)
- **INFO_PAGE-191** — cumpărare (pachete)
- **INFO_PAGE-192** — 12.5 Model updates, versionare, rollback
- **INFO_PAGE-193** — câștig prin comportament bun (feedback oferit la timp, schimb finalizat, verificări)
- **INFO_PAGE-194** — “Travel window” listing (abonament)
- **INFO_PAGE-195** — bonusuri (campanii)
- **INFO_PAGE-196** — Orice schimbare model = bump de versiune + notă în changelog + posibilitate de rollback.
- **INFO_PAGE-197** — Confirmare întâlnire cu reminders (premium)
- **INFO_PAGE-198** — recompense de la facilitatori (dacă există rol)
- **INFO_PAGE-199** — Rezultatele AI salvate păstrează model_version, ca să explicăm diferențe între vechi/nou.
- **INFO_PAGE-200** — “Meet halfway” suggestion AI (tokeni)
- **INFO_PAGE-201** — 8.3 Cum îi cheltui
- **INFO_PAGE-202** — boost vizibilitate obiect
- **INFO_PAGE-203** — Facilitatori (ghid/local) (fee)
- **INFO_PAGE-204** — deblocare contacte / locație (în condiții controlate)
- **INFO_PAGE-205** — Puncte de predare partenere (hotel/cafenea) (comision)
- **INFO_PAGE-206** — traducere AI în chat (peste limita gratuită)
- **INFO_PAGE-207** — “evaluare AI” / clasificare / sugestii matching extra
- **INFO_PAGE-208** — “Trip swap insurance” (partener)
- **INFO_PAGE-209** — escrow/garanții (dacă se implementează)
- **INFO_PAGE-210** — Verificare seriozitate (depozit tokeni)
- **INFO_PAGE-211** — 8.4 Istoric & transparență
- **INFO_PAGE-212** — sold curent
- **INFO_PAGE-213** — Calendar + itinerary share (premium)
- **INFO_PAGE-214** — istoric tranzacții (câștigat / cheltuit / rambursat)
- **INFO_PAGE-215** — Chat traducere nelimitată în călătorie (pachet)
- **INFO_PAGE-216** — reguli de expirare (dacă există)
- **INFO_PAGE-217** — anti-fraudă: limitări, verificări, chargeback policy
- **INFO_PAGE-218** — “Backup plan” (lockers/curier) (fee)
- **INFO_PAGE-219** — 9) Schimb valutar (curs + afișare prețuri aproximative)
- **INFO_PAGE-220** — “Group swaps” (familie/grup) (plan)
- **INFO_PAGE-221** — Scop: obiectele pot avea “valoare aproximativă” în monede diferite, ca să negocieze mai ușor.
- **INFO_PAGE-222** — Afișează:
- **INFO_PAGE-223** — QR handoff receipt (fee)
- **INFO_PAGE-224** — Autentificare
Creează cont
- **INFO_PAGE-225** — convertor simplu (moneda de bază = setarea userului)
- **INFO_PAGE-226** — Confirmare locație exactă cu permisiuni temporare (premium)
- **INFO_PAGE-227** — curs “azi” + sursa cursului + “last updated”
- **INFO_PAGE-228** — reguli: valoarea e orientativă, nu e ofertă comercială, Swaply nu garantează prețuri.
- **INFO_PAGE-229** — “No-show penalty” automat (token rules)
- **INFO_PAGE-230** — setări: “afișează automat în moneda mea” (toggle)
- **INFO_PAGE-231** — “Travel badge” (abonament)
- **INFO_PAGE-232** — 10) Help & reguli (safety + acorduri)
- **INFO_PAGE-233** — 10.1 Reguli de utilizare (core)
- **INFO_PAGE-234** — Promo “Vacation swaps” list (promo fee)
- **INFO_PAGE-235** — anti-scam: fără linkuri suspecte, fără cereri de bani în afara mecanismelor acceptate
- **INFO_PAGE-236** — Recomandări locale (partener turism) (affiliate)
- **INFO_PAGE-237** — întâlnire safe: loc public, zi, confirmare, fără presiune
- **INFO_PAGE-238** — Comision pentru pachete “vacation swap”
- **INFO_PAGE-239** — interdicții: hate speech, amenințări, doxxing
- **INFO_PAGE-240** — moderare: limbaj agresiv → avertisment → mute → ban + impact rang
- **INFO_PAGE-241** — 11.E Schimb casă/locuință (mare, complex) — 20
- **INFO_PAGE-242** — raportare: “Report user / item / message” + status tichete
- **INFO_PAGE-243** — Verificare identitate avansată (KYC)
- **INFO_PAGE-244** — 10.2 Acorduri importante
- **INFO_PAGE-245** — Termeni & Condiții
- **INFO_PAGE-246** — Contract template (premium)
- **INFO_PAGE-247** — Politica de confidențialitate (GDPR)
- **INFO_PAGE-248** — Escrow / garanție (fee %)
- **INFO_PAGE-249** — Cookies (banner + setări)
- **INFO_PAGE-250** — → Autentifică-te
- **INFO_PAGE-251** — Acord pentru “poveste” (opt-in explicit după schimb): “Accept ca schimbul să fie inclus într-o poveste / testimonial (anonim sau cu nume)”
- **INFO_PAGE-252** — Asigurare (partener)
- **INFO_PAGE-253** — Inventar digital + foto/video (premium)
- **INFO_PAGE-254** — Acord pentru locație exactă (post-confirmare)
- **INFO_PAGE-255** — 10.3 FAQ / sfaturi
- **INFO_PAGE-256** — Checklist predare/primire (premium)
- **INFO_PAGE-257** — “Cum fac un schimb corect”
- **INFO_PAGE-258** — “Inspection assistant” (AI premium)
- **INFO_PAGE-259** — “Cum negociez”
- **INFO_PAGE-260** — “Ce fac dacă nu răspunde”
- **INFO_PAGE-261** — Calendar predare/primire (premium)
- **INFO_PAGE-262** — “Ce fac dacă nu apare la întâlnire”
- **INFO_PAGE-263** — Semnătură electronică (fee)
- **INFO_PAGE-264** — “Ce fac dacă produsul nu e cum a fost descris”
- **INFO_PAGE-265** — “Cum funcționează facilitarea”
- **INFO_PAGE-266** — Facilitatori / mediator (fee)
- **INFO_PAGE-267** — Depozit tokeni ca garanție (rules)
- **INFO_PAGE-268** — “Damage dispute package” (fee)
- **INFO_PAGE-269** — Servicii curățenie partenere (affiliate)
- **INFO_PAGE-270** — Lock smart / access window (partener)
- **INFO_PAGE-271** — Verificare documente (partener)
- **INFO_PAGE-272** — Rating special pentru “home swapper” (abonament)
- **INFO_PAGE-273** — Limită de vizualizări + boost (premium)
- **INFO_PAGE-274** — “Neighborhood guide” (premium)
- **INFO_PAGE-275** — Comision pentru listări premium
- **INFO_PAGE-276** — Suport 24/7 (plan premium)
- **INFO_PAGE-277** — 11.F Schimb servicii — 20
- **INFO_PAGE-278** — Badge “verified skill” (fee)
- **INFO_PAGE-279** — Portofoliu extins (abonament)
- **INFO_PAGE-280** — Booking/calendar (premium)
- **INFO_PAGE-281** — Contract template servicii (premium)
- **INFO_PAGE-282** — Escrow pe etape (fee %)
- **INFO_PAGE-283** — Asigurare profesională (partener)
- **INFO_PAGE-284** — Mediere dispute (fee)
- **INFO_PAGE-285** — Review verificat (premium)
- **INFO_PAGE-286** — “Service bundles” (plan)
- **INFO_PAGE-287** — Matching AI skill-to-need (tokeni)
- **INFO_PAGE-288** — Traducere chat (pachet)
- **INFO_PAGE-289** — Video-call integrat (premium)
- **INFO_PAGE-290** — “No-show rules” (depozit tokeni)
- **INFO_PAGE-291** — Verificare identitate (KYC)
- **INFO_PAGE-292** — Niveluri de acces (public/privat) (plan)
- **INFO_PAGE-293** — Promo “featured services” (promo fee)
- **INFO_PAGE-294** — Comision pentru plăți procesate (dacă există)
- **INFO_PAGE-295** — “Time tracking” (premium)
- **INFO_PAGE-296** — Certificate uploads (premium)
- **INFO_PAGE-297** — Suport prioritar (abonament)
- **INFO_PAGE-298** — 12) Legal & Contact (obligatoriu)
- **INFO_PAGE-299** — Termeni & Condiții
- **INFO_PAGE-300** — GDPR / Privacy Policy (download data + delete account)
- **INFO_PAGE-301** — Cookies: banner + “manage preferences”
- **INFO_PAGE-302** — Contact: suport, feedback, raportare abuz, solicitări legale
- **INFO_PAGE-303** — Notă: Swaply e intermediar de platformă, nu garantează calitatea obiectelor; responsabilitatea finală e la părți (formulat juridic corect în T&C).
- **INFO_PAGE-304** — 13) Notă separată (de pus și la Home): Cookies
- **INFO_PAGE-305** — Pe Home trebuie banner cookies + link “Manage cookies” în footer și în Info > Legal. (Crosslink obligatoriu.)
- **INFO_PAGE-306** — Map provider (TBD) — privacy-first + cost control
- **INFO_PAGE-307** — Info Page

### swaply_programmatic_spec.json (verbatim)

```
{
  "source_excalidraw": "Swaply-2025-12-25-1702.excalidraw",
  "generated_at": "2025-12-25T16:46:52",
  "pages": [
    {
      "title": "Home page",
      "bbox": {
        "x": 417,
        "y": 219,
        "w": 554,
        "h": 800
      },
      "line_items": [
        {
          "id": "HOME_PAGE-001",
          "text": "RO ▼"
        },
        {
          "id": "HOME_PAGE-002",
          "text": "⋮"
        },
        {
          "id": "HOME_PAGE-003",
          "text": "Nelogat"
        },
        {
          "id": "HOME_PAGE-004",
          "text": "RO ▼"
        },
        {
          "id": "HOME_PAGE-005",
          "text": "⋮"
        },
        {
          "id": "HOME_PAGE-006",
          "text": "Logat"
        },
        {
          "id": "HOME_PAGE-007",
          "text": "BADGE UTILIZATOR — HOME PAGE (LOGAT)"
        },
        {
          "id": "HOME_PAGE-008",
          "text": "Afișare:"
        },
        {
          "id": "HOME_PAGE-009",
          "text": "Toate paginile"
        },
        {
          "id": "HOME_PAGE-010",
          "text": "- Badge vizibil lângă avatar / nume utilizator (sus, discret)."
        },
        {
          "id": "HOME_PAGE-011",
          "text": "- Niveluri:"
        },
        {
          "id": "HOME_PAGE-012",
          "text": "• Free"
        },
        {
          "id": "HOME_PAGE-013",
          "text": "• Premium"
        },
        {
          "id": "HOME_PAGE-014",
          "text": "UI: preview blurat + CTA"
        },
        {
          "id": "HOME_PAGE-015",
          "text": "• Platinum"
        },
        {
          "id": "HOME_PAGE-016",
          "text": "Rol badge:"
        },
        {
          "id": "HOME_PAGE-017",
          "text": "- Indică statutul contului."
        },
        {
          "id": "HOME_PAGE-018",
          "text": "- Creează diferențiere vizuală și aspirațională."
        },
        {
          "id": "HOME_PAGE-019",
          "text": "- Este vizibil utilizatorului și celorlalți (unde e cazul)."
        },
        {
          "id": "HOME_PAGE-020",
          "text": "Reguli:"
        },
        {
          "id": "HOME_PAGE-021",
          "text": "- Free: badge simplu, neutru."
        },
        {
          "id": "HOME_PAGE-022",
          "text": "- Premium: badge evidențiat (culoare distinctă)."
        },
        {
          "id": "HOME_PAGE-023",
          "text": "- Platinum: badge special (culoare + icon subtil)."
        },
        {
          "id": "HOME_PAGE-024",
          "text": "Interacțiune:"
        },
        {
          "id": "HOME_PAGE-025",
          "text": "- Click pe badge → deschide pagină / modal „Beneficii cont”."
        },
        {
          "id": "HOME_PAGE-026",
          "text": "- Pentru Free: explică avantajele Premium / Platinum."
        },
        {
          "id": "HOME_PAGE-027",
          "text": "- Pentru Premium / Platinum: afișează beneficiile active."
        },
        {
          "id": "HOME_PAGE-028",
          "text": "Legătură cu hartă:"
        },
        {
          "id": "HOME_PAGE-029",
          "text": "- Doar utilizatorii Premium și Platinum sunt afișați ca pini publici pe hartă."
        },
        {
          "id": "HOME_PAGE-030",
          "text": "- Tipul de pin reflectă nivelul badge-ului (Premium vs Platinum)."
        },
        {
          "id": "HOME_PAGE-031",
          "text": "Notă:"
        },
        {
          "id": "HOME_PAGE-032",
          "text": "Badge-ul este informativ și aspirațional, nu intruziv."
        },
        {
          "id": "HOME_PAGE-033",
          "text": "HOME PAGE — ZONA LOGAT (SPEC)"
        },
        {
          "id": "HOME_PAGE-034",
          "text": "- Descoperă platforma de schimb \n   de obiecte între persoane."
        },
        {
          "id": "HOME_PAGE-035",
          "text": "neimplementat = disabled, nu 404, nu crash"
        },
        {
          "id": "HOME_PAGE-036",
          "text": "Mesaj principal (sus):"
        },
        {
          "id": "HOME_PAGE-037",
          "text": "„Descoperă oportunități de schimb în zona ta.”"
        },
        {
          "id": "HOME_PAGE-038",
          "text": "Sub-mesaj:"
        },
        {
          "id": "HOME_PAGE-039",
          "text": "- Vezi exemple de obiecte oferite și dorite."
        },
        {
          "id": "HOME_PAGE-040",
          "text": "„Alege cum vrei să începi: explorează obiecte, caută pe hartă sau verifică match-urile tale.”"
        },
        {
          "id": "HOME_PAGE-041",
          "text": "- Înțelege cum funcționează schimbul fără bani."
        },
        {
          "id": "HOME_PAGE-042",
          "text": "CTA-uri principale:"
        },
        {
          "id": "HOME_PAGE-043",
          "text": "- Vezi harta utilizatorilor (preview)."
        },
        {
          "id": "HOME_PAGE-044",
          "text": "- „Vezi obiecte disponibile” → pagina Obiecte (swipe)"
        },
        {
          "id": "HOME_PAGE-045",
          "text": "- „Caută pe hartă” → focus hartă + filtre"
        },
        {
          "id": "HOME_PAGE-046",
          "text": "- „Vezi match-urile tale” → Match page"
        },
        {
          "id": "HOME_PAGE-047",
          "text": "- „Adaugă un obiect” → flux adăugare obiect"
        },
        {
          "id": "HOME_PAGE-048",
          "text": "HOME PAGE — REGULI FINALE & INDICAȚII PENTRU DEVELOPER"
        },
        {
          "id": "HOME_PAGE-049",
          "text": "1) Rolul paginii"
        },
        {
          "id": "HOME_PAGE-050",
          "text": "5) Hartă — reguli clare"
        },
        {
          "id": "HOME_PAGE-051",
          "text": "- Home page LOGAT este hub de orientare."
        },
        {
          "id": "HOME_PAGE-052",
          "text": "- Harta este element central."
        },
        {
          "id": "HOME_PAGE-053",
          "text": "- Nu conține swipe, formulare complexe sau decizii finale."
        },
        {
          "id": "HOME_PAGE-054",
          "text": "- Afișează implicit doar utilizatori Premium & Platinum."
        },
        {
          "id": "HOME_PAGE-055",
          "text": "- Orice acțiune majoră redirecționează către o pagină dedicată."
        },
        {
          "id": "HOME_PAGE-056",
          "text": "- Pin-urile sunt anonimizate conform setărilor din Profil."
        },
        {
          "id": "HOME_PAGE-057",
          "text": "2) Anunțuri / mesaje sistem (zona discretă)"
        },
        {
          "id": "HOME_PAGE-058",
          "text": "- Dacă densitatea este mică:"
        },
        {
          "id": "HOME_PAGE-059",
          "text": "- Mesaje temporare de tip:"
        },
        {
          "id": "HOME_PAGE-060",
          "text": "• se afișează fallback vizual (zone / talciocuri / exemple)"
        },
        {
          "id": "HOME_PAGE-061",
          "text": "• „Funcție nouă disponibilă”"
        },
        {
          "id": "HOME_PAGE-062",
          "text": "- Interacțiunea cu harta NU declanșează swipe."
        },
        {
          "id": "HOME_PAGE-063",
          "text": "Autentificare\nCreează cont"
        },
        {
          "id": "HOME_PAGE-064",
          "text": "• „Actualizare importantă”"
        },
        {
          "id": "HOME_PAGE-065",
          "text": "6) Badge & statut"
        },
        {
          "id": "HOME_PAGE-066",
          "text": "• „Profil incomplet – unele funcții sunt limitate”"
        },
        {
          "id": "HOME_PAGE-067",
          "text": "- Badge-ul (Free / Premium / Platinum) este vizibil în header."
        },
        {
          "id": "HOME_PAGE-068",
          "text": "- Anunțurile sunt:"
        },
        {
          "id": "HOME_PAGE-069",
          "text": "- Click pe badge → pagină informativă beneficii."
        },
        {
          "id": "HOME_PAGE-070",
          "text": "• non-intruzive"
        },
        {
          "id": "HOME_PAGE-071",
          "text": "- Badge-ul influențează vizibilitatea pe hartă."
        },
        {
          "id": "HOME_PAGE-072",
          "text": "• dismissible"
        },
        {
          "id": "HOME_PAGE-073",
          "text": "7) Frâne & mesaje obligatorii"
        },
        {
          "id": "HOME_PAGE-074",
          "text": "• cu prioritate față de conținutul dinamic"
        },
        {
          "id": "HOME_PAGE-075",
          "text": "- Fără locație:"
        },
        {
          "id": "HOME_PAGE-076",
          "text": "3) Link-uri permise pe Home (LOGAT)"
        },
        {
          "id": "HOME_PAGE-077",
          "text": "„Completează profilul și locația pentru a activa funcțiile bazate pe hartă.”"
        },
        {
          "id": "HOME_PAGE-078",
          "text": "- Profil & Setări"
        },
        {
          "id": "HOME_PAGE-079",
          "text": "- Fără obiecte:"
        },
        {
          "id": "HOME_PAGE-080",
          "text": "- Beneficii Premium / Platinum"
        },
        {
          "id": "HOME_PAGE-081",
          "text": "„Adaugă un obiect pentru a primi propuneri relevante.”"
        },
        {
          "id": "HOME_PAGE-082",
          "text": "- Match-uri"
        },
        {
          "id": "HOME_PAGE-083",
          "text": "8) Reguli tehnice (anti-haos)"
        },
        {
          "id": "HOME_PAGE-084",
          "text": "- Obiecte"
        },
        {
          "id": "HOME_PAGE-085",
          "text": "- Home page NU scrie direct date critice în DB."
        },
        {
          "id": "HOME_PAGE-086",
          "text": "→ Autentifică-te"
        },
        {
          "id": "HOME_PAGE-087",
          "text": "- Chat"
        },
        {
          "id": "HOME_PAGE-088",
          "text": "- Home page consumă date agregate (read-only)."
        },
        {
          "id": "HOME_PAGE-089",
          "text": "- Termeni & Condiții (link discret, persistent)"
        },
        {
          "id": "HOME_PAGE-090",
          "text": "- Toate redirecționările respectă starea profilului (onboarding first)."
        },
        {
          "id": "HOME_PAGE-091",
          "text": "- Politica de confidențialitate (link discret)"
        },
        {
          "id": "HOME_PAGE-092",
          "text": "- Selectorul de limbă este global și independent de Home."
        },
        {
          "id": "HOME_PAGE-093",
          "text": "4) Ce NU apare pe Home"
        },
        {
          "id": "HOME_PAGE-094",
          "text": "9) Evoluție viitoare (dezactivată în beta)"
        },
        {
          "id": "HOME_PAGE-095",
          "text": "- Setări detaliate"
        },
        {
          "id": "HOME_PAGE-096",
          "text": "- Anunțuri sponsorizate (doar contextual, fără feed agresiv)"
        },
        {
          "id": "HOME_PAGE-097",
          "text": "- Formulare lungi"
        },
        {
          "id": "HOME_PAGE-098",
          "text": "- Evidențiere evenimente / talciocuri locale"
        },
        {
          "id": "HOME_PAGE-099",
          "text": "- Export date"
        },
        {
          "id": "HOME_PAGE-100",
          "text": "- Promoții Premium limitate în timp"
        },
        {
          "id": "HOME_PAGE-101",
          "text": "- Acțiuni critice (ștergere cont etc.)"
        },
        {
          "id": "HOME_PAGE-102",
          "text": "REGULĂ FINALĂ:"
        },
        {
          "id": "HOME_PAGE-103",
          "text": "- Joc / gamification avansat"
        },
        {
          "id": "HOME_PAGE-104",
          "text": "Home page trebuie să fie rapid de înțeles în <10 secunde de la login."
        },
        {
          "id": "HOME_PAGE-105",
          "text": "Zona hartă:"
        },
        {
          "id": "HOME_PAGE-106",
          "text": "Titlu: „Utilizatori activi în apropierea ta”"
        },
        {
          "id": "HOME_PAGE-107",
          "text": "Text informativ fix: „Pe hartă sunt evidențiați utilizatorii Premium și Platinum.”"
        },
        {
          "id": "HOME_PAGE-108",
          "text": "Link opțional: „Află beneficiile conturilor Premium”"
        },
        {
          "id": "HOME_PAGE-109",
          "text": "Mesaj pentru user FREE (condițional):"
        },
        {
          "id": "HOME_PAGE-110",
          "text": "„Apariția ta pe hartă este disponibilă pentru conturile Premium. Poți explora ofertele și iniția schimburi fără a fi vizibil public.”"
        },
        {
          "id": "HOME_PAGE-111",
          "text": "HOME — HARTĂ (Map provider (TBD) — privacy-first + cost control) — REGULI COST/DATE"
        },
        {
          "id": "HOME_PAGE-112",
          "text": "Mesaj de frână (profil / locație incompletă):"
        },
        {
          "id": "HOME_PAGE-113",
          "text": "Decizie:"
        },
        {
          "id": "HOME_PAGE-114",
          "text": "„Completează profilul și locația pentru a activa funcțiile bazate pe hartă.”"
        },
        {
          "id": "HOME_PAGE-115",
          "text": "- Folosim Map provider (TBD) — privacy-first + cost control pentru hartă (UI)."
        },
        {
          "id": "HOME_PAGE-116",
          "text": "→ buton către Profil page"
        },
        {
          "id": "HOME_PAGE-117",
          "text": "- NU folosim geocoding/reverse-geocoding în beta (cost + GDPR + complexitate)."
        },
        {
          "id": "HOME_PAGE-118",
          "text": "Regulă:"
        },
        {
          "id": "HOME_PAGE-119",
          "text": "NELOGAT (Home):"
        },
        {
          "id": "HOME_PAGE-120",
          "text": "Home page LOGAT este hub de orientare și lansare de fluxuri. Swipe-ul se face exclusiv pe pagina Obiecte."
        },
        {
          "id": "HOME_PAGE-121",
          "text": "- Hartă = preview read-only (pan/zoom permis opțional)."
        },
        {
          "id": "HOME_PAGE-122",
          "text": "- Afișează doar markeri agregati / aproximativi (ex: oraș/zonă), fără locații exacte."
        },
        {
          "id": "HOME_PAGE-123",
          "text": "- Fără click pe utilizatori / fără date personale."
        },
        {
          "id": "HOME_PAGE-124",
          "text": "- Dacă se cere locație device → doar după consimțământ (opțional); altfel nu cerem."
        },
        {
          "id": "HOME_PAGE-125",
          "text": "LOGAT:"
        },
        {
          "id": "HOME_PAGE-126",
          "text": "- Hartă interactivă, dar respectă setările de vizibilitate din Profil."
        },
        {
          "id": "HOME_PAGE-127",
          "text": "- Locație utilizator: doar aproximativ (ex: oraș sau “within radius”), nu coordonate exacte publice."
        },
        {
          "id": "HOME_PAGE-128",
          "text": "Date & DB:"
        },
        {
          "id": "HOME_PAGE-129",
          "text": "- În profil salvăm manual: țară/județ/oraș + (opțional) coordonate lat/lng introduse din UI."
        },
        {
          "id": "HOME_PAGE-130",
          "text": "- Fără transformări adresă→coord (geocoding) și fără coord→adresă (reverse)."
        },
        {
          "id": "HOME_PAGE-131",
          "text": "Accept / Manage / Reject” + link către Info > Cookies"
        },
        {
          "id": "HOME_PAGE-132",
          "text": "Fallback:"
        },
        {
          "id": "HOME_PAGE-133",
          "text": "- Dacă Maps API nu e disponibil: afișăm placeholder “Hartă indisponibilă” + nu blocăm restul Home."
        },
        {
          "id": "HOME_PAGE-134",
          "text": "NAVIGAȚIE GLOBALĂ — FOOTER"
        },
        {
          "id": "HOME_PAGE-135",
          "text": "Footer-ul este afișat pe toate paginile aplicației."
        },
        {
          "id": "HOME_PAGE-136",
          "text": "Conține următoarele pagini:"
        },
        {
          "id": "HOME_PAGE-137",
          "text": "Home / Objects / Match / Chat / Change / Info"
        },
        {
          "id": "HOME_PAGE-138",
          "text": "Map provider (TBD) — privacy-first + cost control"
        },
        {
          "id": "HOME_PAGE-139",
          "text": "Reguli:"
        },
        {
          "id": "HOME_PAGE-140",
          "text": "Map provider (TBD) — privacy-first + cost control"
        },
        {
          "id": "HOME_PAGE-141",
          "text": "- Pagina curentă este marcată vizual."
        },
        {
          "id": "HOME_PAGE-142",
          "text": "- Navigația este identică pe toate paginile."
        },
        {
          "id": "HOME_PAGE-143",
          "text": "- Accesarea unei pagini verifică starea utilizatorului (login, profil complet)."
        },
        {
          "id": "HOME_PAGE-144",
          "text": "Home page"
        },
        {
          "id": "HOME_PAGE-145",
          "text": "- Dacă o condiție nu este îndeplinită, se afișează mesaj explicativ și redirect."
        }
      ]
    },
    {
      "title": "Login page",
      "bbox": {
        "x": 42.740035155401756,
        "y": 595.4566638742727,
        "w": 321.1984452038714,
        "h": 430.4385255523962
      },
      "line_items": [
        {
          "id": "LOGIN_PAGE-001",
          "text": "RO ▼"
        },
        {
          "id": "LOGIN_PAGE-002",
          "text": "Autentificare \n Înregistrare \n Reset parolă"
        },
        {
          "id": "LOGIN_PAGE-003",
          "text": "LOGIN PAGE — SPEC + REGULI"
        },
        {
          "id": "LOGIN_PAGE-004",
          "text": "A) Ecrane / moduri"
        },
        {
          "id": "LOGIN_PAGE-005",
          "text": "- Autentificare (email + parolă)"
        },
        {
          "id": "LOGIN_PAGE-006",
          "text": "- Înregistrare (email + parolă + confirmare parolă)"
        },
        {
          "id": "LOGIN_PAGE-007",
          "text": "- Reset parolă (email)"
        },
        {
          "id": "LOGIN_PAGE-008",
          "text": "- Confirmare email (după înregistrare) – dacă e cazul"
        },
        {
          "id": "LOGIN_PAGE-009",
          "text": "- Setare parolă nouă (după reset) – link token"
        },
        {
          "id": "LOGIN_PAGE-010",
          "text": "B) Reguli navigație"
        },
        {
          "id": "LOGIN_PAGE-011",
          "text": "- Dacă user e deja LOGAT → redirect la Profil page."
        },
        {
          "id": "LOGIN_PAGE-012",
          "text": "- După login reușit → redirect la Profil page."
        },
        {
          "id": "LOGIN_PAGE-013",
          "text": "- Dacă user vine din CTA de pe o pagină: păstrează „returnTo” și redirecționează înapoi după login."
        },
        {
          "id": "LOGIN_PAGE-014",
          "text": "C) Legal (obligatoriu)"
        },
        {
          "id": "LOGIN_PAGE-015",
          "text": "- Link permanent către Termeni & Condiții + Politica GDPR."
        },
        {
          "id": "LOGIN_PAGE-016",
          "text": "- La înregistrare: checkbox obligatoriu de acceptare (T&C + GDPR)."
        },
        {
          "id": "LOGIN_PAGE-017",
          "text": "- Persistă consimțământul: timestamp + versiune document (și IP opțional)."
        },
        {
          "id": "LOGIN_PAGE-018",
          "text": "D) Validări / UX"
        },
        {
          "id": "LOGIN_PAGE-019",
          "text": "- Mesaje clare pentru erori (email invalid, parolă greșită, cont inexistent)."
        },
        {
          "id": "LOGIN_PAGE-020",
          "text": "- Rate limit / protecție brute force (minim)."
        },
        {
          "id": "LOGIN_PAGE-021",
          "text": "- „Ține-mă minte” (opțional) sau sesiune standard."
        },
        {
          "id": "LOGIN_PAGE-022",
          "text": "LOGIN PAGE — SPEC FINAL (SINTETIZAT)"
        },
        {
          "id": "LOGIN_PAGE-023",
          "text": "1) Metode de autentificare (UI)"
        },
        {
          "id": "LOGIN_PAGE-024",
          "text": "A) Email + parolă (default, obligatoriu)"
        },
        {
          "id": "LOGIN_PAGE-025",
          "text": "B) Google (SSO)"
        },
        {
          "id": "LOGIN_PAGE-026",
          "text": "C) Telefon (OTP) (opțional)"
        },
        {
          "id": "LOGIN_PAGE-027",
          "text": "Home (NELOGAT)"
        },
        {
          "id": "LOGIN_PAGE-028",
          "text": "2) 2FA / Nivel superior (pas suplimentar DUPĂ login)"
        },
        {
          "id": "LOGIN_PAGE-029",
          "text": "- 2FA nu este metodă de login, ci pas de confirmare."
        },
        {
          "id": "LOGIN_PAGE-030",
          "text": "→ Login page (identitate)"
        },
        {
          "id": "LOGIN_PAGE-031",
          "text": "- Metode 2FA:"
        },
        {
          "id": "LOGIN_PAGE-032",
          "text": "→ Profil page (configurare obligatorie)"
        },
        {
          "id": "LOGIN_PAGE-033",
          "text": "A) Authenticator TOTP (preferat)"
        },
        {
          "id": "LOGIN_PAGE-034",
          "text": "B) SMS OTP (acceptat, cu cost)"
        },
        {
          "id": "LOGIN_PAGE-035",
          "text": "→ Home (LOGAT)"
        },
        {
          "id": "LOGIN_PAGE-036",
          "text": "C) Passkey / WebAuthn (preferat pe device compatibil)"
        },
        {
          "id": "LOGIN_PAGE-037",
          "text": "→ Objects page (prima acțiune recomandată)"
        },
        {
          "id": "LOGIN_PAGE-038",
          "text": "- Email OTP este permis doar ca fallback (opțional, nu “strong”)."
        },
        {
          "id": "LOGIN_PAGE-039",
          "text": "Când se cere 2FA:"
        },
        {
          "id": "LOGIN_PAGE-040",
          "text": "→ orice altă pagină"
        },
        {
          "id": "LOGIN_PAGE-041",
          "text": "- dacă user a activat 2FA în setări"
        },
        {
          "id": "LOGIN_PAGE-042",
          "text": "- pentru acțiuni critice: ștergere cont, export date, schimbare email/parolă/telefon"
        },
        {
          "id": "LOGIN_PAGE-043",
          "text": "Persistență / DB:"
        },
        {
          "id": "LOGIN_PAGE-044",
          "text": "Home (LOGAT)"
        },
        {
          "id": "LOGIN_PAGE-045",
          "text": "- 2FA_enabled (boolean)"
        },
        {
          "id": "LOGIN_PAGE-046",
          "text": "- 2FA_method (totp | sms | passkey)"
        },
        {
          "id": "LOGIN_PAGE-047",
          "text": "- NU se salvează coduri OTP"
        },
        {
          "id": "LOGIN_PAGE-048",
          "text": "→ orice pagină"
        },
        {
          "id": "LOGIN_PAGE-049",
          "text": "- Se salvează doar secret TOTP (criptat) sau credential ID (passkey)"
        },
        {
          "id": "LOGIN_PAGE-050",
          "text": "3) Passkeys / Biometric"
        },
        {
          "id": "LOGIN_PAGE-051",
          "text": "- Tratate ca “Passkey (WebAuthn)”"
        },
        {
          "id": "LOGIN_PAGE-052",
          "text": "- Pot înlocui parola pe device compatibil"
        },
        {
          "id": "LOGIN_PAGE-053",
          "text": "- NU se amestecă cu fluxul basic de login"
        },
        {
          "id": "LOGIN_PAGE-054",
          "text": "4) Legal (obligatoriu)"
        },
        {
          "id": "LOGIN_PAGE-055",
          "text": "- Link permanent către Termeni & Condiții + Politica GDPR"
        },
        {
          "id": "LOGIN_PAGE-056",
          "text": "- La înregistrare: checkbox obligatoriu de acceptare"
        },
        {
          "id": "LOGIN_PAGE-057",
          "text": "- Consimțământ persistat: timestamp + versiune document (IP opțional)"
        },
        {
          "id": "LOGIN_PAGE-058",
          "text": "Notă de implementare:"
        },
        {
          "id": "LOGIN_PAGE-059",
          "text": "- Toate metodele sunt definite în schemă."
        },
        {
          "id": "LOGIN_PAGE-060",
          "text": "- Activarea lor poate fi graduală (beta → production) fără refactor UI."
        },
        {
          "id": "LOGIN_PAGE-061",
          "text": "Login page"
        }
      ]
    },
    {
      "title": "Profil page",
      "bbox": {
        "x": 580.6933183227591,
        "y": 1056.4912938525083,
        "w": 491.97193895411243,
        "h": 665.5333180484329
      },
      "line_items": [
        {
          "id": "PROFIL_PAGE-001",
          "text": "RO ▼"
        },
        {
          "id": "PROFIL_PAGE-002",
          "text": "Autentificare \n Înregistrare \n Reset parolă"
        },
        {
          "id": "PROFIL_PAGE-003",
          "text": "1️⃣ Identitate publică"
        },
        {
          "id": "PROFIL_PAGE-004",
          "text": "- ce vede"
        },
        {
          "id": "PROFIL_PAGE-005",
          "text": "6️⃣ Setări de vizibilitate"
        },
        {
          "id": "PROFIL_PAGE-006",
          "text": "- Nume afișat"
        },
        {
          "id": "PROFIL_PAGE-007",
          "text": "- Profil public / privat"
        },
        {
          "id": "PROFIL_PAGE-008",
          "text": "- Prenume (opțional)"
        },
        {
          "id": "PROFIL_PAGE-009",
          "text": "- Obiecte vizibile public / doar match-uri"
        },
        {
          "id": "PROFIL_PAGE-010",
          "text": "- ce poate edita"
        },
        {
          "id": "PROFIL_PAGE-011",
          "text": "- Poză profil (avatar)"
        },
        {
          "id": "PROFIL_PAGE-012",
          "text": "- Locație exactă vizibilă (da / nu)"
        },
        {
          "id": "PROFIL_PAGE-013",
          "text": "- Descriere scurtă (bio)"
        },
        {
          "id": "PROFIL_PAGE-014",
          "text": "- Ultima activitate vizibilă (da / nu)"
        },
        {
          "id": "PROFIL_PAGE-015",
          "text": "- ce poate salva"
        },
        {
          "id": "PROFIL_PAGE-016",
          "text": "- Limbi vorbite"
        },
        {
          "id": "PROFIL_PAGE-017",
          "text": "7️⃣ Notificări"
        },
        {
          "id": "PROFIL_PAGE-018",
          "text": "2️⃣ Localizare"
        },
        {
          "id": "PROFIL_PAGE-019",
          "text": "- Notificări email"
        },
        {
          "id": "PROFIL_PAGE-020",
          "text": "- Țară"
        },
        {
          "id": "PROFIL_PAGE-021",
          "text": "- Notificări push"
        },
        {
          "id": "PROFIL_PAGE-022",
          "text": "- Județ / regiune"
        },
        {
          "id": "PROFIL_PAGE-023",
          "text": "Profil page – LOGAT"
        },
        {
          "id": "PROFIL_PAGE-024",
          "text": "- Notificări chat"
        },
        {
          "id": "PROFIL_PAGE-025",
          "text": "- Oraș / localitate"
        },
        {
          "id": "PROFIL_PAGE-026",
          "text": "- Notificări match"
        },
        {
          "id": "PROFIL_PAGE-027",
          "text": "Poză profil (avatar)"
        },
        {
          "id": "PROFIL_PAGE-028",
          "text": "[Identitate]"
        },
        {
          "id": "PROFIL_PAGE-029",
          "text": "- Cod poștal (opțional)"
        },
        {
          "id": "PROFIL_PAGE-030",
          "text": "- Notificări schimb acceptat / refuzat"
        },
        {
          "id": "PROFIL_PAGE-031",
          "text": "- upload local (poză)"
        },
        {
          "id": "PROFIL_PAGE-032",
          "text": "- Coordonate (lat / lng – intern)"
        },
        {
          "id": "PROFIL_PAGE-033",
          "text": "[Localizare]"
        },
        {
          "id": "PROFIL_PAGE-034",
          "text": "8️⃣ Siguranță & control"
        },
        {
          "id": "PROFIL_PAGE-035",
          "text": "- Rază maximă de deplasare"
        },
        {
          "id": "PROFIL_PAGE-036",
          "text": "- link extern (URL)"
        },
        {
          "id": "PROFIL_PAGE-037",
          "text": "- Schimbare parolă"
        },
        {
          "id": "PROFIL_PAGE-038",
          "text": "[Preferințe schimb]"
        },
        {
          "id": "PROFIL_PAGE-039",
          "text": "3️⃣ Contact & autentificare"
        },
        {
          "id": "PROFIL_PAGE-040",
          "text": "- Dispozitive active"
        },
        {
          "id": "PROFIL_PAGE-041",
          "text": "- avatar generat (fallback)"
        },
        {
          "id": "PROFIL_PAGE-042",
          "text": "- Email (principal)"
        },
        {
          "id": "PROFIL_PAGE-043",
          "text": "[Logistică]"
        },
        {
          "id": "PROFIL_PAGE-044",
          "text": "- Logout din toate sesiunile"
        },
        {
          "id": "PROFIL_PAGE-045",
          "text": "- Email secundar (opțional)"
        },
        {
          "id": "PROFIL_PAGE-046",
          "text": "1️⃣ Upload local"
        },
        {
          "id": "PROFIL_PAGE-047",
          "text": "- Raportare probleme"
        },
        {
          "id": "PROFIL_PAGE-048",
          "text": "[Setări]"
        },
        {
          "id": "PROFIL_PAGE-049",
          "text": "– poză încărcată de utilizator"
        },
        {
          "id": "PROFIL_PAGE-050",
          "text": "- Telefon (opțional)"
        },
        {
          "id": "PROFIL_PAGE-051",
          "text": "– este varianta principală"
        },
        {
          "id": "PROFIL_PAGE-052",
          "text": "9️⃣ Stare, reputație, istoric (read-only)"
        },
        {
          "id": "PROFIL_PAGE-053",
          "text": "- Metodă autentificare (email / social / etc)"
        },
        {
          "id": "PROFIL_PAGE-054",
          "text": "[Reputație – read-only]"
        },
        {
          "id": "PROFIL_PAGE-055",
          "text": "2️⃣ Link extern (URL)"
        },
        {
          "id": "PROFIL_PAGE-056",
          "text": "- Număr obiecte oferite"
        },
        {
          "id": "PROFIL_PAGE-057",
          "text": "– pentru cei care au deja poză (ex: site personal)"
        },
        {
          "id": "PROFIL_PAGE-058",
          "text": "(nu se editează, nu se șterge)"
        },
        {
          "id": "PROFIL_PAGE-059",
          "text": "- Ultima autentificare (read-only)"
        },
        {
          "id": "PROFIL_PAGE-060",
          "text": "[Acțiuni critice]"
        },
        {
          "id": "PROFIL_PAGE-061",
          "text": "– nu obligi upload"
        },
        {
          "id": "PROFIL_PAGE-062",
          "text": "- Număr obiecte schimbate"
        },
        {
          "id": "PROFIL_PAGE-063",
          "text": "4️⃣ Preferințe de schimb"
        },
        {
          "id": "PROFIL_PAGE-064",
          "text": "3️⃣ Avatar generat automat (fallback)"
        },
        {
          "id": "PROFIL_PAGE-065",
          "text": "- Schimburi finalizate"
        },
        {
          "id": "PROFIL_PAGE-066",
          "text": "– inițiale / icon / culoare"
        },
        {
          "id": "PROFIL_PAGE-067",
          "text": "- Categorii obiecte oferite"
        },
        {
          "id": "PROFIL_PAGE-068",
          "text": "– apare dacă nu există poză"
        },
        {
          "id": "PROFIL_PAGE-069",
          "text": "- Schimburi anulate"
        },
        {
          "id": "PROFIL_PAGE-070",
          "text": "PROFIL PAGE — NOTE PENTRU DEVELOPER"
        },
        {
          "id": "PROFIL_PAGE-071",
          "text": "- Categorii obiecte dorite"
        },
        {
          "id": "PROFIL_PAGE-072",
          "text": "👉 Un singur avatar activ la un moment dat."
        },
        {
          "id": "PROFIL_PAGE-073",
          "text": "- Rating primit"
        },
        {
          "id": "PROFIL_PAGE-074",
          "text": "1) Persistență / DB"
        },
        {
          "id": "PROFIL_PAGE-075",
          "text": "- Acceptă schimb multiplu (da / nu)"
        },
        {
          "id": "PROFIL_PAGE-076",
          "text": "👉 Redimensionare imagine la dimensiunea cadrului"
        },
        {
          "id": "PROFIL_PAGE-077",
          "text": "- Toate câmpurile de profil se salvează în DB (profil = “source of truth” pentru user)."
        },
        {
          "id": "PROFIL_PAGE-078",
          "text": "- Badge-uri / nivel"
        },
        {
          "id": "PROFIL_PAGE-079",
          "text": "- Acceptă diferență de valoare (da / nu)"
        },
        {
          "id": "PROFIL_PAGE-080",
          "text": "- Email = unic (index). Telefon = unic opțional (index)."
        },
        {
          "id": "PROFIL_PAGE-081",
          "text": "Poză profil"
        },
        {
          "id": "PROFIL_PAGE-082",
          "text": "- Data creării contului"
        },
        {
          "id": "PROFIL_PAGE-083",
          "text": "- Localizare: păstrează și text (țară/județ/oraș) + coordonate (lat/lng) pentru că vor fi folosite la query (matching geografic)."
        },
        {
          "id": "PROFIL_PAGE-084",
          "text": "Formate acceptate: JPG, PNG, WEBP"
        },
        {
          "id": "PROFIL_PAGE-085",
          "text": "- Acceptă doar schimb local / și transport"
        },
        {
          "id": "PROFIL_PAGE-086",
          "text": "[ i ]"
        },
        {
          "id": "PROFIL_PAGE-087",
          "text": "🔟 Acțiuni critice"
        },
        {
          "id": "PROFIL_PAGE-088",
          "text": "- Categorii oferite/dorite = listă multi-select (relație many-to-many), NU text liber."
        },
        {
          "id": "PROFIL_PAGE-089",
          "text": "5️⃣ Logistică & predare"
        },
        {
          "id": "PROFIL_PAGE-090",
          "text": "2) Avatar / Foto profil"
        },
        {
          "id": "PROFIL_PAGE-091",
          "text": "Upload local: imagine reală"
        },
        {
          "id": "PROFIL_PAGE-092",
          "text": "- Dezactivare cont"
        },
        {
          "id": "PROFIL_PAGE-093",
          "text": "- Metode de predare acceptate:"
        },
        {
          "id": "PROFIL_PAGE-094",
          "text": "- Suportă: upload local (imagine), link extern (URL imagine public), fallback avatar generat automat."
        },
        {
          "id": "PROFIL_PAGE-095",
          "text": "- Ștergere cont (hard delete)"
        },
        {
          "id": "PROFIL_PAGE-096",
          "text": "- față în față"
        },
        {
          "id": "PROFIL_PAGE-097",
          "text": "Link extern: URL imagine public"
        },
        {
          "id": "PROFIL_PAGE-098",
          "text": "- Un singur avatar activ la un moment dat."
        },
        {
          "id": "PROFIL_PAGE-099",
          "text": "- Export date personale"
        },
        {
          "id": "PROFIL_PAGE-100",
          "text": "- curier"
        },
        {
          "id": "PROFIL_PAGE-101",
          "text": "- Redimensionare automată (ex: max 512px) + păstrare aspect."
        },
        {
          "id": "PROFIL_PAGE-102",
          "text": "- Formate acceptate: JPG, PNG, WEBP."
        },
        {
          "id": "PROFIL_PAGE-103",
          "text": "- punct intermediar"
        },
        {
          "id": "PROFIL_PAGE-104",
          "text": "PROFIL PAGE — LOCAȚIE & HARTĂ (OBLIGATORIU)"
        },
        {
          "id": "PROFIL_PAGE-105",
          "text": "GDPR:"
        },
        {
          "id": "PROFIL_PAGE-106",
          "text": "3) Reputație / Statistici (READ-ONLY)"
        },
        {
          "id": "PROFIL_PAGE-107",
          "text": "- Disponibilitate orară"
        },
        {
          "id": "PROFIL_PAGE-108",
          "text": "- Drept de acces (export date) — deja acoperit"
        },
        {
          "id": "PROFIL_PAGE-109",
          "text": "Scop:"
        },
        {
          "id": "PROFIL_PAGE-110",
          "text": "- Reputația și statisticile NU se editează din profil."
        },
        {
          "id": "PROFIL_PAGE-111",
          "text": "- Note pentru predare"
        },
        {
          "id": "PROFIL_PAGE-112",
          "text": "- Sunt derivate din alte entități (schimburi/match-uri etc) și doar afișate."
        },
        {
          "id": "PROFIL_PAGE-113",
          "text": "- Drept de ștergere (delete cont) — deja acoperit"
        },
        {
          "id": "PROFIL_PAGE-114",
          "text": "Profil page este locul unde utilizatorul:"
        },
        {
          "id": "PROFIL_PAGE-115",
          "text": "4) Import / Export (Acțiuni critice)"
        },
        {
          "id": "PROFIL_PAGE-116",
          "text": "- Drept de rectificare (edit profil)"
        },
        {
          "id": "PROFIL_PAGE-117",
          "text": "- Export date personale: profil + preferințe + activitate (minim)."
        },
        {
          "id": "PROFIL_PAGE-118",
          "text": "- setează locația"
        },
        {
          "id": "PROFIL_PAGE-119",
          "text": "- Drept de retragere consimțământ → dezactivare cont"
        },
        {
          "id": "PROFIL_PAGE-120",
          "text": "- Import date profil (opțional): doar pentru restaurare (profil/avatare/preferințe), fără date tranzacționale."
        },
        {
          "id": "PROFIL_PAGE-121",
          "text": "- vede CUM va apărea pe hartă"
        },
        {
          "id": "PROFIL_PAGE-122",
          "text": "5) Vizibilitate & notificări"
        },
        {
          "id": "PROFIL_PAGE-123",
          "text": "- Vizibilitatea (public/privat, locație exactă, ultima activitate) trebuie salvată și aplicată peste tot."
        },
        {
          "id": "PROFIL_PAGE-124",
          "text": "- înțelege beneficiile funcțiilor bazate pe locație"
        },
        {
          "id": "PROFIL_PAGE-125",
          "text": "- Notificări (email/push/chat/match/schimb) = setări persistente."
        },
        {
          "id": "PROFIL_PAGE-126",
          "text": "- controlează nivelul de siguranță (anonimizare)"
        },
        {
          "id": "PROFIL_PAGE-127",
          "text": "6) Siguranță"
        },
        {
          "id": "PROFIL_PAGE-128",
          "text": "────────────────────────"
        },
        {
          "id": "PROFIL_PAGE-129",
          "text": "- Schimbare parolă / logout din toate sesiunile / dispozitive active = funcții separate, dar entry point în Profil."
        },
        {
          "id": "PROFIL_PAGE-130",
          "text": "1) Mini preview hartă (Map provider (TBD) — privacy-first + cost control)"
        },
        {
          "id": "PROFIL_PAGE-131",
          "text": "PROFIL PAGE — ACȚIUNI (UI + REGULI)"
        },
        {
          "id": "PROFIL_PAGE-132",
          "text": "A) Butoane principale"
        },
        {
          "id": "PROFIL_PAGE-133",
          "text": "- Afișează o mini-hartă cu pin (preview)."
        },
        {
          "id": "PROFIL_PAGE-134",
          "text": "- Salvează modificări"
        },
        {
          "id": "PROFIL_PAGE-135",
          "text": "- Pin-ul reprezintă locația APROXIMATIVĂ, nu adresa exactă."
        },
        {
          "id": "PROFIL_PAGE-136",
          "text": "- activ doar dacă există schimbări (dirty state)"
        },
        {
          "id": "PROFIL_PAGE-137",
          "text": "- validare înainte de save; afișează erori pe câmpuri"
        },
        {
          "id": "PROFIL_PAGE-138",
          "text": "- Text clar: “Așa vei apărea pe hartă”."
        },
        {
          "id": "PROFIL_PAGE-139",
          "text": "- la succes: mesaj “Salvat” + update UI"
        },
        {
          "id": "PROFIL_PAGE-140",
          "text": "Interacțiuni:"
        },
        {
          "id": "PROFIL_PAGE-141",
          "text": "- Anulează / Revino"
        },
        {
          "id": "PROFIL_PAGE-142",
          "text": "- utilizatorul poate ajusta zona / muta pin-ul (opțional)"
        },
        {
          "id": "PROFIL_PAGE-143",
          "text": "- revine la ultima stare salvată (reset form)"
        },
        {
          "id": "PROFIL_PAGE-144",
          "text": "B) Avatar / Foto profil"
        },
        {
          "id": "PROFIL_PAGE-145",
          "text": "- modificările se reflectă imediat în preview"
        },
        {
          "id": "PROFIL_PAGE-146",
          "text": "- Încarcă poză (Upload)"
        },
        {
          "id": "PROFIL_PAGE-147",
          "text": "────────────────────────"
        },
        {
          "id": "PROFIL_PAGE-148",
          "text": "2) Rază de anonimizare (control utilizator)"
        },
        {
          "id": "PROFIL_PAGE-149",
          "text": "- acceptă doar JPG/PNG/WEBP"
        },
        {
          "id": "PROFIL_PAGE-150",
          "text": "- Selector rază (ex: 2 km – 5 km – 10 km – 25 km)"
        },
        {
          "id": "PROFIL_PAGE-151",
          "text": "- la succes: setează avatarul ca activ"
        },
        {
          "id": "PROFIL_PAGE-152",
          "text": "- Explicație vizuală (cerc pe hartă)"
        },
        {
          "id": "PROFIL_PAGE-153",
          "text": "- Setează link (URL)"
        },
        {
          "id": "PROFIL_PAGE-154",
          "text": "- validează că este URL public către imagine"
        },
        {
          "id": "PROFIL_PAGE-155",
          "text": "- Text clar:"
        },
        {
          "id": "PROFIL_PAGE-156",
          "text": "- la succes: setează avatarul ca activ"
        },
        {
          "id": "PROFIL_PAGE-157",
          "text": "“Cu cât raza este mai mare, cu atât locația ta este mai sigură,"
        },
        {
          "id": "PROFIL_PAGE-158",
          "text": "- Șterge poză / Reset avatar"
        },
        {
          "id": "PROFIL_PAGE-159",
          "text": "- revine la avatar generat automat (fallback)"
        },
        {
          "id": "PROFIL_PAGE-160",
          "text": "dar rezultatele pot fi mai puțin precise.”"
        },
        {
          "id": "PROFIL_PAGE-161",
          "text": "────────────────────────"
        },
        {
          "id": "PROFIL_PAGE-162",
          "text": "- șterge referința din DB + (opțional) din storage"
        },
        {
          "id": "PROFIL_PAGE-163",
          "text": "3) Informare explicită — DE CE e necesară locația"
        },
        {
          "id": "PROFIL_PAGE-164",
          "text": "C) Sesiune / cont"
        },
        {
          "id": "PROFIL_PAGE-165",
          "text": "Bloc informativ (nu ascuns, nu tehnic):"
        },
        {
          "id": "PROFIL_PAGE-166",
          "text": "- Logout"
        },
        {
          "id": "PROFIL_PAGE-167",
          "text": "- închide sesiunea curentă și redirecționează la Home (NELOGAT)"
        },
        {
          "id": "PROFIL_PAGE-168",
          "text": "- Locația este folosită pentru:"
        },
        {
          "id": "PROFIL_PAGE-169",
          "text": "- Logout din toate sesiunile (Security)"
        },
        {
          "id": "PROFIL_PAGE-170",
          "text": "✔ căutare geografică"
        },
        {
          "id": "PROFIL_PAGE-171",
          "text": "- invalidează toate sesiunile active (securitate)"
        },
        {
          "id": "PROFIL_PAGE-172",
          "text": "D) Acțiuni critice (confirmări)"
        },
        {
          "id": "PROFIL_PAGE-173",
          "text": "✔ propuneri AI de matching"
        },
        {
          "id": "PROFIL_PAGE-174",
          "text": "- Dezactivează cont"
        },
        {
          "id": "PROFIL_PAGE-175",
          "text": "✔ sugestii loc întâlnire"
        },
        {
          "id": "PROFIL_PAGE-176",
          "text": "- necesită confirmare (modal + parolă/confirm text)"
        },
        {
          "id": "PROFIL_PAGE-177",
          "text": "- Șterge cont (hard delete)"
        },
        {
          "id": "PROFIL_PAGE-178",
          "text": "✔ sugestii curieri / transport"
        },
        {
          "id": "PROFIL_PAGE-179",
          "text": "- necesită confirmare dublă; avertizează că este ireversibil"
        },
        {
          "id": "PROFIL_PAGE-180",
          "text": "✔ descoperire de locuri / experiențe"
        },
        {
          "id": "PROFIL_PAGE-181",
          "text": "- Export date personale"
        },
        {
          "id": "PROFIL_PAGE-182",
          "text": "- Fără locație:"
        },
        {
          "id": "PROFIL_PAGE-183",
          "text": "- generează fișier (JSON/ZIP) cu profil + preferințe + activitate minimă"
        },
        {
          "id": "PROFIL_PAGE-184",
          "text": "7) Legal / GDPR / Consimțământ"
        },
        {
          "id": "PROFIL_PAGE-185",
          "text": "⚠ aceste funcționalități sunt limitate sau indisponibile"
        },
        {
          "id": "PROFIL_PAGE-186",
          "text": "- Link vizibil și permanent către:"
        },
        {
          "id": "PROFIL_PAGE-187",
          "text": "────────────────────────"
        },
        {
          "id": "PROFIL_PAGE-188",
          "text": "- Termeni și condiții"
        },
        {
          "id": "PROFIL_PAGE-189",
          "text": "4) Control vizibilitate"
        },
        {
          "id": "PROFIL_PAGE-190",
          "text": "- Politica de confidențialitate (GDPR)"
        },
        {
          "id": "PROFIL_PAGE-191",
          "text": "- Toggle: “Arată-mă pe hartă”"
        },
        {
          "id": "PROFIL_PAGE-192",
          "text": "(link-uri accesibile din Profil și din paginile NELOGAT)"
        },
        {
          "id": "PROFIL_PAGE-193",
          "text": "- Consimțământ explicit (checkbox):"
        },
        {
          "id": "PROFIL_PAGE-194",
          "text": "- ON → apare pin public (anonimizat)"
        },
        {
          "id": "PROFIL_PAGE-195",
          "text": "- „Am citit și sunt de acord cu Termenii și Condițiile”"
        },
        {
          "id": "PROFIL_PAGE-196",
          "text": "- „Am citit și sunt de acord cu Politica de confidențialitate”"
        },
        {
          "id": "PROFIL_PAGE-197",
          "text": "- OFF → nu apare pin public, dar sistemul poate folosi locația intern"
        },
        {
          "id": "PROFIL_PAGE-198",
          "text": "- Reguli de salvare:"
        },
        {
          "id": "PROFIL_PAGE-199",
          "text": "- Text clar:"
        },
        {
          "id": "PROFIL_PAGE-200",
          "text": "- Salvarea datelor NU este permisă fără bifarea consimțământului."
        },
        {
          "id": "PROFIL_PAGE-201",
          "text": "“Poți schimba această setare oricând.”"
        },
        {
          "id": "PROFIL_PAGE-202",
          "text": "- Checkbox-ul este obligatoriu la:"
        },
        {
          "id": "PROFIL_PAGE-203",
          "text": "────────────────────────"
        },
        {
          "id": "PROFIL_PAGE-204",
          "text": "- crearea contului"
        },
        {
          "id": "PROFIL_PAGE-205",
          "text": "5) Securitate & confidențialitate (GDPR-friendly)"
        },
        {
          "id": "PROFIL_PAGE-206",
          "text": "- prima salvare a profilului"
        },
        {
          "id": "PROFIL_PAGE-207",
          "text": "- Nu afișăm adresa exactă public."
        },
        {
          "id": "PROFIL_PAGE-208",
          "text": "- Dacă termenii se modifică:"
        },
        {
          "id": "PROFIL_PAGE-209",
          "text": "- Pin-ul public este anonimizat conform razei alese."
        },
        {
          "id": "PROFIL_PAGE-210",
          "text": "- consimțământul trebuie reconfirmat la următoarea autentificare/salvare."
        },
        {
          "id": "PROFIL_PAGE-211",
          "text": "- Persistență GDPR:"
        },
        {
          "id": "PROFIL_PAGE-212",
          "text": "- Coordonatele exacte (dacă există) sunt folosite doar intern"
        },
        {
          "id": "PROFIL_PAGE-213",
          "text": "- salvează în DB:"
        },
        {
          "id": "PROFIL_PAGE-214",
          "text": "pentru calcule de distanță."
        },
        {
          "id": "PROFIL_PAGE-215",
          "text": "- data și ora consimțământului"
        },
        {
          "id": "PROFIL_PAGE-216",
          "text": "- versiunea documentului legal acceptat"
        },
        {
          "id": "PROFIL_PAGE-217",
          "text": "- Locația nu este partajată cu alți utilizatori în mod direct."
        },
        {
          "id": "PROFIL_PAGE-218",
          "text": "- IP (opțional, dacă e necesar legal)"
        },
        {
          "id": "PROFIL_PAGE-219",
          "text": "────────────────────────"
        },
        {
          "id": "PROFIL_PAGE-220",
          "text": "6) Confirmare explicită (prima setare)"
        },
        {
          "id": "PROFIL_PAGE-221",
          "text": "Retragere consimțământ → acces restricționat"
        },
        {
          "id": "PROFIL_PAGE-222",
          "text": "Consimțământ = per utilizator, nu per sesiune"
        },
        {
          "id": "PROFIL_PAGE-223",
          "text": "- Checkbox:"
        },
        {
          "id": "PROFIL_PAGE-224",
          "text": "“Am înțeles cum apare locația mea pe hartă și sunt de acord.”"
        },
        {
          "id": "PROFIL_PAGE-225",
          "text": "- Fără bifare:"
        },
        {
          "id": "PROFIL_PAGE-226",
          "text": "Map provider (TBD) — privacy-first + cost control"
        },
        {
          "id": "PROFIL_PAGE-227",
          "text": "- salvarea locației NU este permisă"
        },
        {
          "id": "PROFIL_PAGE-228",
          "text": "Profil page"
        }
      ]
    },
    {
      "title": "Object page",
      "bbox": {
        "x": 1053,
        "y": 219,
        "w": 829.8208549624519,
        "h": 800
      },
      "line_items": [
        {
          "id": "OBJECT_PAGE-001",
          "text": "RO ▼"
        },
        {
          "id": "OBJECT_PAGE-002",
          "text": "⋮"
        },
        {
          "id": "OBJECT_PAGE-003",
          "text": "Nelogat"
        },
        {
          "id": "OBJECT_PAGE-004",
          "text": "RO ▼"
        },
        {
          "id": "OBJECT_PAGE-005",
          "text": "⋮"
        },
        {
          "id": "OBJECT_PAGE-006",
          "text": "Logat"
        },
        {
          "id": "OBJECT_PAGE-007",
          "text": "neimplementat = disabled, nu 404, nu crash"
        },
        {
          "id": "OBJECT_PAGE-008",
          "text": "Toate paginile"
        },
        {
          "id": "OBJECT_PAGE-009",
          "text": "Objecte   dorite"
        },
        {
          "id": "OBJECT_PAGE-010",
          "text": "⇆"
        },
        {
          "id": "OBJECT_PAGE-011",
          "text": "UI: preview blurat + CTA"
        },
        {
          "id": "OBJECT_PAGE-012",
          "text": "←  card  →"
        },
        {
          "id": "OBJECT_PAGE-013",
          "text": "A) OBJECTS PAGE — NOTE PENTRU DEVELOPER (FINAL)"
        },
        {
          "id": "OBJECT_PAGE-014",
          "text": "0) Regula de aur (anti-confuzie)"
        },
        {
          "id": "OBJECT_PAGE-015",
          "text": "În Objects NU există “accept / resping / negociere”."
        },
        {
          "id": "OBJECT_PAGE-016",
          "text": "Objects doar: like/skip, selectare max 3, contorizare; analiza se deschide în Matching."
        },
        {
          "id": "OBJECT_PAGE-017",
          "text": "Toate deciziile + rezervările se fac în Matching."
        },
        {
          "id": "OBJECT_PAGE-018",
          "text": "1) Structură UI (ce vede userul)"
        },
        {
          "id": "OBJECT_PAGE-019",
          "text": "Pagina are două zone mari:"
        },
        {
          "id": "OBJECT_PAGE-020",
          "text": "NU există alte pagini."
        },
        {
          "id": "OBJECT_PAGE-021",
          "text": "- Vezi obiecte oferite (preview)."
        },
        {
          "id": "OBJECT_PAGE-022",
          "text": "A) SUS = „Oferta altora” (obiecte oferite de alți useri)"
        },
        {
          "id": "OBJECT_PAGE-023",
          "text": "B) UI COPY — Objects (Hub)"
        },
        {
          "id": "OBJECT_PAGE-024",
          "text": "A1) Swipe SUS (card mare)"
        },
        {
          "id": "OBJECT_PAGE-025",
          "text": "1️⃣ SUS — SWIPE „CE POT PRIMI”"
        },
        {
          "id": "OBJECT_PAGE-026",
          "text": "A2) Top 3 dorințe ale mele (Wishlist) (3 carduri mici sub swipe)"
        },
        {
          "id": "OBJECT_PAGE-027",
          "text": "- Vezi obiecte dorite (preview)."
        },
        {
          "id": "OBJECT_PAGE-028",
          "text": "Ce pot primi"
        },
        {
          "id": "OBJECT_PAGE-029",
          "text": "B) JOS = „Ce ofer eu” (obiectele mele oferite)"
        },
        {
          "id": "OBJECT_PAGE-030",
          "text": "Swipe pentru a arăta interes. Deciziile se fac în Matching."
        },
        {
          "id": "OBJECT_PAGE-031",
          "text": "B1) Swipe JOS (card mare)"
        },
        {
          "id": "OBJECT_PAGE-032",
          "text": "Like = semnal de interes"
        },
        {
          "id": "OBJECT_PAGE-033",
          "text": "- Înțelege mecanismul de swipe și potrivire."
        },
        {
          "id": "OBJECT_PAGE-034",
          "text": "Obiect 1"
        },
        {
          "id": "OBJECT_PAGE-035",
          "text": "Obiect 2"
        },
        {
          "id": "OBJECT_PAGE-036",
          "text": "Obiect 3"
        },
        {
          "id": "OBJECT_PAGE-037",
          "text": "B2) Top 3 obiecte oferite de mine (3 carduri mici sub swipe)"
        },
        {
          "id": "OBJECT_PAGE-038",
          "text": "Obiectul nu este rezervat"
        },
        {
          "id": "OBJECT_PAGE-039",
          "text": "Plasare contoare (obligatoriu fix, ca să fie clar):"
        },
        {
          "id": "OBJECT_PAGE-040",
          "text": "- Detaliile complete sunt disponibile \n   după autentificare."
        },
        {
          "id": "OBJECT_PAGE-041",
          "text": "Empty state: Nu sunt oferte potrivite acum"
        },
        {
          "id": "OBJECT_PAGE-042",
          "text": "Sub fiecare swipe (A1 și B1) există:"
        },
        {
          "id": "OBJECT_PAGE-043",
          "text": "Contor Like-uri: 0/3 (ex: „Like-uri alese: 2/3”)"
        },
        {
          "id": "OBJECT_PAGE-044",
          "text": "2️⃣ TOP 3 — DORINȚELE MELE"
        },
        {
          "id": "OBJECT_PAGE-045",
          "text": "CTA: „Matching” (activ când contorul >0; evidențiat când ajunge la 3/3)"
        },
        {
          "id": "OBJECT_PAGE-046",
          "text": "Dorințele mele"
        },
        {
          "id": "OBJECT_PAGE-047",
          "text": "Sub fiecare card din A2 și B2 există:"
        },
        {
          "id": "OBJECT_PAGE-048",
          "text": "Maxim 3 active. Folosite de AI pentru analiză."
        },
        {
          "id": "OBJECT_PAGE-049",
          "text": "Contor Oferte (ex: 0/3) + CTA „Matching”"
        },
        {
          "id": "OBJECT_PAGE-050",
          "text": "Oferte: n / 3"
        },
        {
          "id": "OBJECT_PAGE-051",
          "text": "Matching"
        },
        {
          "id": "OBJECT_PAGE-052",
          "text": "Sub fiecare dorit: „Oferte: n/3” + „Matching”."
        },
        {
          "id": "OBJECT_PAGE-053",
          "text": "(icon) Editare"
        },
        {
          "id": "OBJECT_PAGE-054",
          "text": "Sub fiecare oferit: „Cereri: n/3” + „Matching”."
        },
        {
          "id": "OBJECT_PAGE-055",
          "text": "Vezi toate dorințele"
        },
        {
          "id": "OBJECT_PAGE-056",
          "text": "2) De unde se alimentează SWIPE-urile (surse de date)"
        },
        {
          "id": "OBJECT_PAGE-057",
          "text": "A1) Swipe SUS (Oferta altora) = “ce îmi propune piața”"
        },
        {
          "id": "OBJECT_PAGE-058",
          "text": "3️⃣ JOS — SWIPE „CE OFER EU”"
        },
        {
          "id": "OBJECT_PAGE-059",
          "text": "Sursa: Items oferite de alți utilizatori (publicate ca “available”), filtrate astfel:"
        },
        {
          "id": "OBJECT_PAGE-060",
          "text": "Ce ofer eu"
        },
        {
          "id": "OBJECT_PAGE-061",
          "text": "filtre hard: distanță (din profil + radius anonimizat), categorie/subcategorie permise, limbă/țară (opțional)"
        },
        {
          "id": "OBJECT_PAGE-062",
          "text": "Like = merită analizat"
        },
        {
          "id": "OBJECT_PAGE-063",
          "text": "filtre soft AI: preferințele din profil + ce ai în wishlist + istoricul de like/skip"
        },
        {
          "id": "OBJECT_PAGE-064",
          "text": "Deciziile se fac în Matching"
        },
        {
          "id": "OBJECT_PAGE-065",
          "text": "Rezultat: un flux de carduri “oferte ale altora” pe care userul dă like/skip."
        },
        {
          "id": "OBJECT_PAGE-066",
          "text": "Empty state: Nu sunt cereri pentru obiectele tale"
        },
        {
          "id": "OBJECT_PAGE-067",
          "text": "B1) Swipe JOS (cererile altora) = „cine ar vrea ce ofer eu”"
        },
        {
          "id": "OBJECT_PAGE-068",
          "text": "Autentificare\nCreează cont"
        },
        {
          "id": "OBJECT_PAGE-069",
          "text": "Sursa: Wishlist-urile (cererile) altor utilizatori, filtrate astfel:"
        },
        {
          "id": "OBJECT_PAGE-070",
          "text": "4️⃣ TOP 3 — OFERTELE MELE"
        },
        {
          "id": "OBJECT_PAGE-071",
          "text": "pornește de la obiectele mele oferite (B2) → extrage categorii/tags/AI-labels → caută useri care cer ceva compatibil"
        },
        {
          "id": "OBJECT_PAGE-072",
          "text": "Ofertele mele active"
        },
        {
          "id": "OBJECT_PAGE-073",
          "text": "filtre hard: distanță + radius + preferințe de schimb / logistică"
        },
        {
          "id": "OBJECT_PAGE-074",
          "text": "Maxim 3 analizate simultan."
        },
        {
          "id": "OBJECT_PAGE-075",
          "text": "Cereri: n / 3"
        },
        {
          "id": "OBJECT_PAGE-076",
          "text": "filtre soft AI: “potrivire probabilă” (ex: dacă tu ai scule, nu împinge dantele spre tine ca cerere principală)"
        },
        {
          "id": "OBJECT_PAGE-077",
          "text": "Matching"
        },
        {
          "id": "OBJECT_PAGE-078",
          "text": "Rezultat: un flux de carduri “cereri ale altora” pe care userul dă like/skip."
        },
        {
          "id": "OBJECT_PAGE-079",
          "text": "(icon) Editare"
        },
        {
          "id": "OBJECT_PAGE-080",
          "text": "Important: Swipe SUS și Swipe JOS sunt fluxuri diferite, cu surse diferite. Nu le amestecați."
        },
        {
          "id": "OBJECT_PAGE-081",
          "text": "Vezi toate ofertele"
        },
        {
          "id": "OBJECT_PAGE-082",
          "text": "→ Autentifică-te"
        },
        {
          "id": "OBJECT_PAGE-083",
          "text": "3) Alinierea dintre “Dorite” și “Oferite” (logica de trimitere în Matching)"
        },
        {
          "id": "OBJECT_PAGE-084",
          "text": "Când userul dă like:"
        },
        {
          "id": "OBJECT_PAGE-085",
          "text": "La A1 (ofertă a altuia) → se creează un Intent: “îmi place oferta X”"
        },
        {
          "id": "OBJECT_PAGE-086",
          "text": "La B1 (cerere a altuia) → se creează un Intent: “aș putea satisface cererea Y”"
        },
        {
          "id": "OBJECT_PAGE-087",
          "text": "Când userul deschide Matching:"
        },
        {
          "id": "OBJECT_PAGE-088",
          "text": "Matching primește:"
        },
        {
          "id": "OBJECT_PAGE-089",
          "text": "lista de Intent-uri A1 (oferte care îmi plac)"
        },
        {
          "id": "OBJECT_PAGE-090",
          "text": "lista de Intent-uri B1 (cereri compatibile cu ce ofer eu)"
        },
        {
          "id": "OBJECT_PAGE-091",
          "text": "snapshot cu Wishlist (A2) + Obiectele mele (B2)"
        },
        {
          "id": "OBJECT_PAGE-092",
          "text": "Matching rulează AI + îmi arată propuneri de schimb (nu Objects)."
        },
        {
          "id": "OBJECT_PAGE-093",
          "text": "C) UI COPY — Liste Extinse („Vezi toate”)"
        },
        {
          "id": "OBJECT_PAGE-094",
          "text": "Objecte   oferite"
        },
        {
          "id": "OBJECT_PAGE-095",
          "text": "4) Liste extinse („Vezi toate”) = „surse de adevăr” (source of truth)"
        },
        {
          "id": "OBJECT_PAGE-096",
          "text": "⚠️ NU pagină. Sheet / modal / panou. Swipe rămâne dedesubt."
        },
        {
          "id": "OBJECT_PAGE-097",
          "text": "Wishlist / Obiectele mele = surse de adevăr"
        },
        {
          "id": "OBJECT_PAGE-098",
          "text": "Creezi/editezi/ștergi în lista extinsă („Vezi toate”)."
        },
        {
          "id": "OBJECT_PAGE-099",
          "text": "2A️⃣ „VEZI TOATE DORINȚELE” (SHEET / LISTĂ EXTINSĂ)"
        },
        {
          "id": "OBJECT_PAGE-100",
          "text": "5) Reguli"
        },
        {
          "id": "OBJECT_PAGE-101",
          "text": "Max 3 like-uri active per zonă"
        },
        {
          "id": "OBJECT_PAGE-102",
          "text": "Toate dorințele"
        },
        {
          "id": "OBJECT_PAGE-103",
          "text": "Contor vizibil sub fiecare zonă (0/3)"
        },
        {
          "id": "OBJECT_PAGE-104",
          "text": "Doar primele 3 sunt active în analiză. Restul sunt păstrate ca istoric."
        },
        {
          "id": "OBJECT_PAGE-105",
          "text": "Activează / Dezactivează"
        },
        {
          "id": "OBJECT_PAGE-106",
          "text": "La atingerea a 3:"
        },
        {
          "id": "OBJECT_PAGE-107",
          "text": "Editează"
        },
        {
          "id": "OBJECT_PAGE-108",
          "text": "swipe blocat"
        },
        {
          "id": "OBJECT_PAGE-109",
          "text": "Matching"
        },
        {
          "id": "OBJECT_PAGE-110",
          "text": "intențiile sunt trimise în Matching"
        },
        {
          "id": "OBJECT_PAGE-111",
          "text": "Buton: Adaugă dorință"
        },
        {
          "id": "OBJECT_PAGE-112",
          "text": "ofertele sunt trimise în Matching"
        },
        {
          "id": "OBJECT_PAGE-113",
          "text": "Empty state: Nu ai dorințe definite"
        },
        {
          "id": "OBJECT_PAGE-114",
          "text": "Notificări: se trimit la intrarea în negotiating, nu la simple like-uri."
        },
        {
          "id": "OBJECT_PAGE-115",
          "text": "Adaugă ce ai dori să primești pentru a începe."
        },
        {
          "id": "OBJECT_PAGE-116",
          "text": "Dacă e negotiating și nu se finalizează: revine în available după un TTL (inițial propunere: 24h; ajustabil din experiență)"
        },
        {
          "id": "OBJECT_PAGE-117",
          "text": "6) Monedă & conversie (afișare)"
        },
        {
          "id": "OBJECT_PAGE-118",
          "text": "4A️⃣ „VEZI TOATE OFERTELE” (SHEET / LISTĂ EXTINSĂ)"
        },
        {
          "id": "OBJECT_PAGE-119",
          "text": "Valoarea se salvează “raw” (ex: EUR/ron) + sursa estimării."
        },
        {
          "id": "OBJECT_PAGE-120",
          "text": "Toate ofertele mele"
        },
        {
          "id": "OBJECT_PAGE-121",
          "text": "La afișare se convertește în moneda userului (din profil; fallback locație)."
        },
        {
          "id": "OBJECT_PAGE-122",
          "text": "Doar primele 3 sunt analizate activ."
        },
        {
          "id": "OBJECT_PAGE-123",
          "text": "Valoarea e informativă, nu contractuală."
        },
        {
          "id": "OBJECT_PAGE-124",
          "text": "Activează / Dezactivează"
        },
        {
          "id": "OBJECT_PAGE-125",
          "text": "Editează"
        },
        {
          "id": "OBJECT_PAGE-126",
          "text": "Matching"
        },
        {
          "id": "OBJECT_PAGE-127",
          "text": "Adaugă un obiect pentru a primi cereri."
        },
        {
          "id": "OBJECT_PAGE-128",
          "text": "Empty state: Nu ai obiecte oferite"
        },
        {
          "id": "OBJECT_PAGE-129",
          "text": "Adaugă un obiect pentru a primi cereri."
        },
        {
          "id": "OBJECT_PAGE-130",
          "text": "⇆"
        },
        {
          "id": "OBJECT_PAGE-131",
          "text": "←  card  →"
        },
        {
          "id": "OBJECT_PAGE-132",
          "text": "Obiect 1"
        },
        {
          "id": "OBJECT_PAGE-133",
          "text": "Obiect 2"
        },
        {
          "id": "OBJECT_PAGE-134",
          "text": "Obiect 3"
        },
        {
          "id": "OBJECT_PAGE-135",
          "text": "Object page"
        }
      ]
    },
    {
      "title": "Object subpage",
      "bbox": {
        "x": 1409.510673304001,
        "y": 1112.7287000097638,
        "w": 780.6257292935088,
        "h": 1055.338154826699
      },
      "line_items": [
        {
          "id": "OBJECT_SUBPAGE-001",
          "text": "RO ▼"
        },
        {
          "id": "OBJECT_SUBPAGE-002",
          "text": "D) SPEC COMPLET — OBIECT (DETAIL) + REGULI (ETAPA DE TESTARE)"
        },
        {
          "id": "OBJECT_SUBPAGE-003",
          "text": "D7) Flux AI complet (ordine corectă a pașilor)"
        },
        {
          "id": "OBJECT_SUBPAGE-004",
          "text": "D0) Principiu"
        },
        {
          "id": "OBJECT_SUBPAGE-005",
          "text": "Când userul adaugă sau schimbă imaginea:"
        },
        {
          "id": "OBJECT_SUBPAGE-006",
          "text": "Pagina/Sheet-ul de Obiect este sursa de adevăr pentru:"
        },
        {
          "id": "OBJECT_SUBPAGE-007",
          "text": "Upload imagine (local sau URL)"
        },
        {
          "id": "OBJECT_SUBPAGE-008",
          "text": "datele obiectului"
        },
        {
          "id": "OBJECT_SUBPAGE-009",
          "text": "Generare variante (thumb/medium)"
        },
        {
          "id": "OBJECT_SUBPAGE-010",
          "text": "imaginile obiectului"
        },
        {
          "id": "OBJECT_SUBPAGE-011",
          "text": "Salvare referințe imagine la obiect"
        },
        {
          "id": "OBJECT_SUBPAGE-012",
          "text": "clasificarea AI"
        },
        {
          "id": "OBJECT_SUBPAGE-013",
          "text": "Rulează AI:"
        },
        {
          "id": "OBJECT_SUBPAGE-014",
          "text": "pregătirea pentru Matching (intenție/flexibilitate/context etc.)"
        },
        {
          "id": "OBJECT_SUBPAGE-015",
          "text": "identificare (title/tags)"
        },
        {
          "id": "OBJECT_SUBPAGE-016",
          "text": "Objects (hub) doar listează/semnalizează. Obiect (detail) definește."
        },
        {
          "id": "OBJECT_SUBPAGE-017",
          "text": "clasificare HF (labels + scor)"
        },
        {
          "id": "OBJECT_SUBPAGE-018",
          "text": "D1) Categorii & Subcategorii (exhaustive, din DB/API)"
        },
        {
          "id": "OBJECT_SUBPAGE-019",
          "text": "UI afișează sugestii + butoane de aplicare"
        },
        {
          "id": "OBJECT_SUBPAGE-020",
          "text": "Cerință"
        },
        {
          "id": "OBJECT_SUBPAGE-021",
          "text": "Regulă: Obiectul poate fi salvat și fără AI, dar AI rulează când poate."
        },
        {
          "id": "OBJECT_SUBPAGE-022",
          "text": "Categoriile și subcategoriile NU sunt text liber."
        },
        {
          "id": "OBJECT_SUBPAGE-023",
          "text": "D8) Câmpurile obiectului (complete, pentru schema ta de “contract semantic”)"
        },
        {
          "id": "OBJECT_SUBPAGE-024",
          "text": "Sunt încărcate din bază de date și servite prin API (sau direct din Supabase, dar logic e “API de categorii”)."
        },
        {
          "id": "OBJECT_SUBPAGE-025",
          "text": "Model logic (minim)"
        },
        {
          "id": "OBJECT_SUBPAGE-026",
          "text": "Obligatorii (pentru testare)"
        },
        {
          "id": "OBJECT_SUBPAGE-027",
          "text": "categories: (id, name_ro, name_en?, order, is_active)"
        },
        {
          "id": "OBJECT_SUBPAGE-028",
          "text": "Titlu (text)"
        },
        {
          "id": "OBJECT_SUBPAGE-029",
          "text": "subcategories: (id, category_id, name_ro, name_en?, order, is_active)"
        },
        {
          "id": "OBJECT_SUBPAGE-030",
          "text": "Categorie (din DB)"
        },
        {
          "id": "OBJECT_SUBPAGE-031",
          "text": "Reguli"
        },
        {
          "id": "OBJECT_SUBPAGE-032",
          "text": "Subcategorie (din DB)"
        },
        {
          "id": "OBJECT_SUBPAGE-033",
          "text": "dropdown 1: Categorie (obligatoriu)"
        },
        {
          "id": "OBJECT_SUBPAGE-034",
          "text": "Cel puțin 0 imagini (imaginea e recomandată, nu obligatorie)"
        },
        {
          "id": "OBJECT_SUBPAGE-035",
          "text": "dropdown 2: Subcategorie (obligatoriu, filtrat după categorie)"
        },
        {
          "id": "OBJECT_SUBPAGE-036",
          "text": "Opționale (dar definite clar)"
        },
        {
          "id": "OBJECT_SUBPAGE-037",
          "text": "fallback dacă DB nu are date:"
        },
        {
          "id": "OBJECT_SUBPAGE-038",
          "text": "Descriere"
        },
        {
          "id": "OBJECT_SUBPAGE-039",
          "text": "UI: „Categoriile nu sunt încă încărcate.” + buton „Reîncearcă”"
        },
        {
          "id": "OBJECT_SUBPAGE-040",
          "text": "Tags (manual + AI suggested)"
        },
        {
          "id": "OBJECT_SUBPAGE-041",
          "text": "obiectul nu poate fi publicat ca “available” fără categorie/subcategorie"
        },
        {
          "id": "OBJECT_SUBPAGE-042",
          "text": "Intenție: Explorez / Deschis / Clar / Serios"
        },
        {
          "id": "OBJECT_SUBPAGE-043",
          "text": "D2) Imagine — surse (link + local) + reguli"
        },
        {
          "id": "OBJECT_SUBPAGE-044",
          "text": "Flexibilitate: Strict / Moderat / Larg"
        },
        {
          "id": "OBJECT_SUBPAGE-045",
          "text": "Surse acceptate (ambele)"
        },
        {
          "id": "OBJECT_SUBPAGE-046",
          "text": "Context: Permanent / Vacanță / Temporar / Urgent"
        },
        {
          "id": "OBJECT_SUBPAGE-047",
          "text": "Upload local (fișier)"
        },
        {
          "id": "OBJECT_SUBPAGE-048",
          "text": "Valoare percepută: Mică / Medie / Mare / Specială"
        },
        {
          "id": "OBJECT_SUBPAGE-049",
          "text": "Link (URL)"
        },
        {
          "id": "OBJECT_SUBPAGE-050",
          "text": "Contează cui ajunge (toggle)"
        },
        {
          "id": "OBJECT_SUBPAGE-051",
          "text": "Reguli de validare"
        },
        {
          "id": "OBJECT_SUBPAGE-052",
          "text": "Accept pachet (toggle)"
        },
        {
          "id": "OBJECT_SUBPAGE-053",
          "text": "acceptă doar: jpg/jpeg/png/webp (la început)"
        },
        {
          "id": "OBJECT_SUBPAGE-054",
          "text": "max size (config): ex. 10MB (valoare exactă o decide implementarea)"
        },
        {
          "id": "OBJECT_SUBPAGE-055",
          "text": "Mesaj pentru AI (text)"
        },
        {
          "id": "OBJECT_SUBPAGE-056",
          "text": "dacă link-ul e invalid sau nu e imagine:"
        },
        {
          "id": "OBJECT_SUBPAGE-057",
          "text": "Locație + radius (pentru local/hărți, dacă e în schemă)"
        },
        {
          "id": "OBJECT_SUBPAGE-058",
          "text": "UI: „Link invalid sau imagine inaccesibilă.”"
        },
        {
          "id": "OBJECT_SUBPAGE-059",
          "text": "D9) UI Copy — Obiect (Detail) (gata de lipit)"
        },
        {
          "id": "OBJECT_SUBPAGE-060",
          "text": "D3) Imagine — redimensionare + încadrări în card (resize/fit)"
        },
        {
          "id": "OBJECT_SUBPAGE-061",
          "text": "Titlu"
        },
        {
          "id": "OBJECT_SUBPAGE-062",
          "text": "Cerință UX (obligatoriu)"
        },
        {
          "id": "OBJECT_SUBPAGE-063",
          "text": "Detalii obiect"
        },
        {
          "id": "OBJECT_SUBPAGE-064",
          "text": "imaginea trebuie să încapă frumos în card fără să arate “tăiată prost”."
        },
        {
          "id": "OBJECT_SUBPAGE-065",
          "text": "Notă informativă"
        },
        {
          "id": "OBJECT_SUBPAGE-066",
          "text": "Reguli UI (card + detail)"
        },
        {
          "id": "OBJECT_SUBPAGE-067",
          "text": "Imagine"
        },
        {
          "id": "OBJECT_SUBPAGE-068",
          "text": "în card (Objects, liste):"
        },
        {
          "id": "OBJECT_SUBPAGE-069",
          "text": "Adaugă imagine"
        },
        {
          "id": "OBJECT_SUBPAGE-070",
          "text": "cover cu focalizare centrată (sau smart-crop dacă există)"
        },
        {
          "id": "OBJECT_SUBPAGE-071",
          "text": "Opțiuni: Încarcă local / Adaugă link"
        },
        {
          "id": "OBJECT_SUBPAGE-072",
          "text": "aspect ratio stabil (ex: 1:1 sau 4:3 – alegeți unul și îl păstrați peste tot)"
        },
        {
          "id": "OBJECT_SUBPAGE-073",
          "text": "dacă lipsește: Fără imagine — Adaugă o imagine pentru potriviri mai bune."
        },
        {
          "id": "OBJECT_SUBPAGE-074",
          "text": "în detail (pagina obiect):"
        },
        {
          "id": "OBJECT_SUBPAGE-075",
          "text": "Categorie"
        },
        {
          "id": "OBJECT_SUBPAGE-076",
          "text": "contain sau galerie cu zoom (opțional)"
        },
        {
          "id": "OBJECT_SUBPAGE-077",
          "text": "Categorie (dropdown)"
        },
        {
          "id": "OBJECT_SUBPAGE-078",
          "text": "Reguli tehnice (fără cod, doar comportament)"
        },
        {
          "id": "OBJECT_SUBPAGE-079",
          "text": "Subcategorie (dropdown)"
        },
        {
          "id": "OBJECT_SUBPAGE-080",
          "text": "la upload se generează cel puțin:"
        },
        {
          "id": "OBJECT_SUBPAGE-081",
          "text": "AI (după imagine)"
        },
        {
          "id": "OBJECT_SUBPAGE-082",
          "text": "thumb (card)"
        },
        {
          "id": "OBJECT_SUBPAGE-083",
          "text": "medium (detail)"
        },
        {
          "id": "OBJECT_SUBPAGE-084",
          "text": "Sugestie titlu (AI): [text] (scor: x) — Aplică"
        },
        {
          "id": "OBJECT_SUBPAGE-085",
          "text": "dacă nu există variante generate → fallback la original, dar UI păstrează aspect ratio."
        },
        {
          "id": "OBJECT_SUBPAGE-086",
          "text": "Etichete (AI): [tag1, tag2…] — Adaugă"
        },
        {
          "id": "OBJECT_SUBPAGE-087",
          "text": "D4) Imagine lipsă → placeholder “No Image” (obligatoriu)"
        },
        {
          "id": "OBJECT_SUBPAGE-088",
          "text": "Intenție"
        },
        {
          "id": "OBJECT_SUBPAGE-089",
          "text": "Cerință"
        },
        {
          "id": "OBJECT_SUBPAGE-090",
          "text": "Cât de serios vrei să fie schimbul?"
        },
        {
          "id": "OBJECT_SUBPAGE-091",
          "text": "Dacă nu există nicio imagine:"
        },
        {
          "id": "OBJECT_SUBPAGE-092",
          "text": "Explorez / Sunt deschis / Caut schimb clar / Angajament mare"
        },
        {
          "id": "OBJECT_SUBPAGE-093",
          "text": "se afișează o imagine generică No Image"
        },
        {
          "id": "OBJECT_SUBPAGE-094",
          "text": "Flexibilitate"
        },
        {
          "id": "OBJECT_SUBPAGE-095",
          "text": "cardurile nu se “rup” vizual"
        },
        {
          "id": "OBJECT_SUBPAGE-096",
          "text": "Cât de strict ești?"
        },
        {
          "id": "OBJECT_SUBPAGE-097",
          "text": "Copy"
        },
        {
          "id": "OBJECT_SUBPAGE-098",
          "text": "Strict / Moderat / Larg"
        },
        {
          "id": "OBJECT_SUBPAGE-099",
          "text": "titlu mic: „Fără imagine”"
        },
        {
          "id": "OBJECT_SUBPAGE-100",
          "text": "Context"
        },
        {
          "id": "OBJECT_SUBPAGE-101",
          "text": "subtitlu: „Adaugă o imagine pentru potriviri mai bune.”"
        },
        {
          "id": "OBJECT_SUBPAGE-102",
          "text": "În ce context vrei schimbul?"
        },
        {
          "id": "OBJECT_SUBPAGE-103",
          "text": "D5) Identificarea obiectului din imagine (AI hint, nu clasă finală)"
        },
        {
          "id": "OBJECT_SUBPAGE-104",
          "text": "Permanent / Vacanță / Temporar / Urgent"
        },
        {
          "id": "OBJECT_SUBPAGE-105",
          "text": "Ce înseamnă “identificare” aici"
        },
        {
          "id": "OBJECT_SUBPAGE-106",
          "text": "Valoare percepută"
        },
        {
          "id": "OBJECT_SUBPAGE-107",
          "text": "AI extrage indicii din imagine pentru:"
        },
        {
          "id": "OBJECT_SUBPAGE-108",
          "text": "Cum percepi valoarea acestui obiect? (nu este preț)"
        },
        {
          "id": "OBJECT_SUBPAGE-109",
          "text": "sugestie titlu"
        },
        {
          "id": "OBJECT_SUBPAGE-110",
          "text": "Mică / Medie / Mare / Specială"
        },
        {
          "id": "OBJECT_SUBPAGE-111",
          "text": "sugestie tags"
        },
        {
          "id": "OBJECT_SUBPAGE-112",
          "text": "verificare “are sens” vs textul introdus"
        },
        {
          "id": "OBJECT_SUBPAGE-113",
          "text": "Dacă “Specială”:"
        },
        {
          "id": "OBJECT_SUBPAGE-114",
          "text": "Output minim"
        },
        {
          "id": "OBJECT_SUBPAGE-115",
          "text": "Uneori contează cui ajunge. Un mesaj personal poate crește șansele schimbului."
        },
        {
          "id": "OBJECT_SUBPAGE-116",
          "text": "suggested_title (ex: “Bicicletă MTB”)"
        },
        {
          "id": "OBJECT_SUBPAGE-117",
          "text": "Contează cui ajunge"
        },
        {
          "id": "OBJECT_SUBPAGE-118",
          "text": "suggested_tags (listă)"
        },
        {
          "id": "OBJECT_SUBPAGE-119",
          "text": "Contează cui ajunge acest obiect (toggle)"
        },
        {
          "id": "OBJECT_SUBPAGE-120",
          "text": "confidence (0–1)"
        },
        {
          "id": "OBJECT_SUBPAGE-121",
          "text": "Accept pachet"
        },
        {
          "id": "OBJECT_SUBPAGE-122",
          "text": "Reguli"
        },
        {
          "id": "OBJECT_SUBPAGE-123",
          "text": "Accept schimb cu mai multe obiecte (toggle)"
        },
        {
          "id": "OBJECT_SUBPAGE-124",
          "text": "userul poate accepta sau ignora"
        },
        {
          "id": "OBJECT_SUBPAGE-125",
          "text": "Mesaj pentru AI"
        },
        {
          "id": "OBJECT_SUBPAGE-126",
          "text": "UI: buton mic „Folosește sugestia”"
        },
        {
          "id": "OBJECT_SUBPAGE-127",
          "text": "Ce ar trebui să știe AI despre acest obiect sau schimb?"
        },
        {
          "id": "OBJECT_SUBPAGE-128",
          "text": "D6) Clasificarea obiectului din imagine (Hugging Face) (obligatoriu ca specificație)"
        },
        {
          "id": "OBJECT_SUBPAGE-129",
          "text": "Placeholder: Ex: „Prefer local”, „Nu mă grăbesc”, „Are valoare personală”"
        },
        {
          "id": "OBJECT_SUBPAGE-130",
          "text": "Cerință"
        },
        {
          "id": "OBJECT_SUBPAGE-131",
          "text": "Butoane"
        },
        {
          "id": "OBJECT_SUBPAGE-132",
          "text": "La adăugare/actualizare imagine:"
        },
        {
          "id": "OBJECT_SUBPAGE-133",
          "text": "Salvează"
        },
        {
          "id": "OBJECT_SUBPAGE-134",
          "text": "se trimite către modelul Hugging Face (sau endpoint intermediar)"
        },
        {
          "id": "OBJECT_SUBPAGE-135",
          "text": "Înapoi"
        },
        {
          "id": "OBJECT_SUBPAGE-136",
          "text": "se primește:"
        },
        {
          "id": "OBJECT_SUBPAGE-137",
          "text": "D10) Verificare (ca să nu ne mai „mirăm că nu funcționează”)"
        },
        {
          "id": "OBJECT_SUBPAGE-138",
          "text": "etichete (top-k)"
        },
        {
          "id": "OBJECT_SUBPAGE-139",
          "text": "În etapa de testare, considerăm “Obiect valid” doar dacă:"
        },
        {
          "id": "OBJECT_SUBPAGE-140",
          "text": "scoruri"
        },
        {
          "id": "OBJECT_SUBPAGE-141",
          "text": "eventual categorie sugerată"
        },
        {
          "id": "OBJECT_SUBPAGE-142",
          "text": "categorie + subcategorie sunt setate (din DB/API)"
        },
        {
          "id": "OBJECT_SUBPAGE-143",
          "text": "Reguli"
        },
        {
          "id": "OBJECT_SUBPAGE-144",
          "text": "imaginea fie există, fie placeholder-ul funcționează"
        },
        {
          "id": "OBJECT_SUBPAGE-145",
          "text": "clasificarea nu e “adevăr”, e propunere"
        },
        {
          "id": "OBJECT_SUBPAGE-146",
          "text": "upload local și link funcționează (ambele)"
        },
        {
          "id": "OBJECT_SUBPAGE-147",
          "text": "dacă HF e down:"
        },
        {
          "id": "OBJECT_SUBPAGE-148",
          "text": "resize/încadrare e stabilă în card"
        },
        {
          "id": "OBJECT_SUBPAGE-149",
          "text": "UI: „AI indisponibil momentan. Poți continua manual.”"
        },
        {
          "id": "OBJECT_SUBPAGE-150",
          "text": "AI poate eșua fără să blocheze salvarea"
        },
        {
          "id": "OBJECT_SUBPAGE-151",
          "text": "rezultatul se salvează ca metadată (auditabil, refolosibil în Matching)"
        },
        {
          "id": "OBJECT_SUBPAGE-152",
          "text": "Cu cât completezi mai multe detalii, cu atât Matching îți propune schimburi mai bune. Nimic nu e obligatoriu."
        },
        {
          "id": "OBJECT_SUBPAGE-153",
          "text": "“Stare/condiție” a obiectului (fizic) ca semnal de matching"
        },
        {
          "id": "OBJECT_SUBPAGE-154",
          "text": "În schemă apare “stare” în sens de Activ/Inactiv (publicare), dar nu apare clar condiția fizică (nou/folosit/uzat/de reparat etc.) ca input pe Obiect."
        },
        {
          "id": "OBJECT_SUBPAGE-155",
          "text": "Mai apare undeva o mențiune de tip “condiție acceptată (opțional)” la “dorit”, dar nu e transformată în câmp clar pe Obiect detail."
        },
        {
          "id": "OBJECT_SUBPAGE-156",
          "text": "Semnalul “deschidere la schimb indirect / lanț A→B→C”"
        },
        {
          "id": "OBJECT_SUBPAGE-157",
          "text": "Nu e prezent ca toggle/flag în pagina Obiect. Dacă vrei vreodată matching de tip “lanț”, trebuie să existe un semnal explicit (altfel e magie și devine haos)."
        },
        {
          "id": "OBJECT_SUBPAGE-158",
          "text": "“Feedback cognitiv” în pagina Obiect (mega important pentru UX)"
        },
        {
          "id": "OBJECT_SUBPAGE-159",
          "text": "În schema actuală există mesajul general “completează mai mult = matching mai bun”, dar nu există o secțiune concretă de tip:"
        },
        {
          "id": "OBJECT_SUBPAGE-160",
          "text": "„Ce știe AI despre obiectul meu?” (etichete, categorie sugerată, scoruri, interpretare)"
        },
        {
          "id": "OBJECT_SUBPAGE-161",
          "text": "„Ce lipsește ca să primesc potriviri mai bune?” (ex: fără imagine, fără subcategorie, fără valoare percepută, fără context etc.)"
        },
        {
          "id": "OBJECT_SUBPAGE-162",
          "text": "Asta e fix partea care reduce frustrarea (“nu merge matching-ul!”) și te ajută să păstrezi piața fluidă."
        },
        {
          "id": "OBJECT_SUBPAGE-163",
          "text": "Ce trebuie introdus în spec-ul paginii Obiect (ca să fie “complet”)"
        },
        {
          "id": "OBJECT_SUBPAGE-164",
          "text": "Un câmp nou: Condiție obiect (enum simplu: Nou / Foarte bun / Bun / Utilizat / De reparat / Special/colecție — sau cum vrei tu)."
        },
        {
          "id": "OBJECT_SUBPAGE-165",
          "text": "Un toggle opțional: Permite schimb indirect (lanț) (cu un tooltip clar că e avansat)."
        },
        {
          "id": "OBJECT_SUBPAGE-166",
          "text": "O secțiune read-only: „Rezumat pentru Matching” care afișează semnalele active + “completitudine” + recomandări de îmbunătățire."
        },
        {
          "id": "OBJECT_SUBPAGE-167",
          "text": "Object subpage"
        }
      ]
    },
    {
      "title": "Chat page",
      "bbox": {
        "x": 2589.5,
        "y": 223.5,
        "w": 554,
        "h": 800
      },
      "line_items": [
        {
          "id": "CHAT_PAGE-001",
          "text": "RO ▼"
        },
        {
          "id": "CHAT_PAGE-002",
          "text": "⋮"
        },
        {
          "id": "CHAT_PAGE-003",
          "text": "Nelogat"
        },
        {
          "id": "CHAT_PAGE-004",
          "text": "RO ▼"
        },
        {
          "id": "CHAT_PAGE-005",
          "text": "⋮"
        },
        {
          "id": "CHAT_PAGE-006",
          "text": "Logat"
        },
        {
          "id": "CHAT_PAGE-007",
          "text": "neimplementat = disabled, nu 404, nu crash"
        },
        {
          "id": "CHAT_PAGE-008",
          "text": "Toate paginile"
        },
        {
          "id": "CHAT_PAGE-009",
          "text": "UI: preview blurat + CTA"
        },
        {
          "id": "CHAT_PAGE-010",
          "text": "zona de chat"
        },
        {
          "id": "CHAT_PAGE-011",
          "text": "- Mesajele sunt disponibile\n doar între utilizatori autentificați."
        },
        {
          "id": "CHAT_PAGE-012",
          "text": "- Chatul este activ doar după un match."
        },
        {
          "id": "CHAT_PAGE-013",
          "text": "CHAT PAGE — NOTE PENTRU DEVELOPER (Swaply) — FULL TEXT (update cu Header + Limbă + Meniu contextual + Footer)"
        },
        {
          "id": "CHAT_PAGE-014",
          "text": "PARTEA 2 — SECURITATE, MODERARE, RANG, ATAȘAMENTE, ANTI-VIRUS, LOCAȚIE"
        },
        {
          "id": "CHAT_PAGE-015",
          "text": "PARTEA 0 — CHROME GLOBAL (Header / Language / Context Menu / Footer)"
        },
        {
          "id": "CHAT_PAGE-016",
          "text": "1) Politici de securitate & moderare (obligatoriu)"
        },
        {
          "id": "CHAT_PAGE-017",
          "text": "0.1 Header (global, pe toate paginile inclusiv Chat)"
        },
        {
          "id": "CHAT_PAGE-018",
          "text": "Chat-ul are moderare automată + manuală."
        },
        {
          "id": "CHAT_PAGE-019",
          "text": "Header-ul este persistent și include:"
        },
        {
          "id": "CHAT_PAGE-020",
          "text": "Limbaj agresiv/jignitor, hărțuire, amenințări, discriminare, pornografie, conținut ilegal → măsuri graduale:"
        },
        {
          "id": "CHAT_PAGE-021",
          "text": "Logo Swaply (click → Home)"
        },
        {
          "id": "CHAT_PAGE-022",
          "text": "avertisment (soft)"
        },
        {
          "id": "CHAT_PAGE-023",
          "text": "Navigație principală (conform schemei): Home / Objects / Match / Chat / Change / Info"
        },
        {
          "id": "CHAT_PAGE-024",
          "text": "limitare temporară (slow mode / mute)"
        },
        {
          "id": "CHAT_PAGE-025",
          "text": "Icon notificări (badge count)"
        },
        {
          "id": "CHAT_PAGE-026",
          "text": "retrogradare rang"
        },
        {
          "id": "CHAT_PAGE-027",
          "text": "Icon mesaje (badge count, shortcut către Chat)"
        },
        {
          "id": "CHAT_PAGE-028",
          "text": "suspendare (temporary ban)"
        },
        {
          "id": "CHAT_PAGE-029",
          "text": "Avatar profil (click → meniul contextual)"
        },
        {
          "id": "CHAT_PAGE-030",
          "text": "ban permanent (pentru recidivă sau abuz grav)"
        },
        {
          "id": "CHAT_PAGE-031",
          "text": "Header-ul trebuie să fie responsive:"
        },
        {
          "id": "CHAT_PAGE-032",
          "text": "Utilizatorul poate trimite raport (Report) pe:"
        },
        {
          "id": "CHAT_PAGE-033",
          "text": "Desktop: nav text + iconuri"
        },
        {
          "id": "CHAT_PAGE-034",
          "text": "mesaj"
        },
        {
          "id": "CHAT_PAGE-035",
          "text": "Mobile: hamburger / bottom nav (conform design) + icon mesaje/notifications"
        },
        {
          "id": "CHAT_PAGE-036",
          "text": "thread"
        },
        {
          "id": "CHAT_PAGE-037",
          "text": "Header-ul afișează stări importante:"
        },
        {
          "id": "CHAT_PAGE-038",
          "text": "utilizator"
        },
        {
          "id": "CHAT_PAGE-039",
          "text": "user logat vs nelogat (login/register CTA când e nelogat)"
        },
        {
          "id": "CHAT_PAGE-040",
          "text": "atașament"
        },
        {
          "id": "CHAT_PAGE-041",
          "text": "indicator limbă curentă (flag/abbr)"
        },
        {
          "id": "CHAT_PAGE-042",
          "text": "Orice „enforcement action” trebuie să fie auditabil (log: cine/ce/când/de ce)."
        },
        {
          "id": "CHAT_PAGE-043",
          "text": "indicator de rețea (opțional): offline/online pentru chat"
        },
        {
          "id": "CHAT_PAGE-044",
          "text": "2) Sistem de rang + penalizări + recuperare"
        },
        {
          "id": "CHAT_PAGE-045",
          "text": "0.2 Selector de limbă (global)"
        },
        {
          "id": "CHAT_PAGE-046",
          "text": "Platforma are Rang / Reputație care poate fi afectată de:"
        },
        {
          "id": "CHAT_PAGE-047",
          "text": "Există un selector de limbă disponibil din header sau din meniul contextual."
        },
        {
          "id": "CHAT_PAGE-048",
          "text": "limbaj agresiv/toxic"
        },
        {
          "id": "CHAT_PAGE-049",
          "text": "Limba activă afectează:"
        },
        {
          "id": "CHAT_PAGE-050",
          "text": "spam"
        },
        {
          "id": "CHAT_PAGE-051",
          "text": "UI (toate label-urile)"
        },
        {
          "id": "CHAT_PAGE-052",
          "text": "scam indicators (încercări de a muta conversația în afara platformei, cereri insistente de bani, etc.)"
        },
        {
          "id": "CHAT_PAGE-053",
          "text": "format date/monedă"
        },
        {
          "id": "CHAT_PAGE-054",
          "text": "raportări valide confirmate"
        },
        {
          "id": "CHAT_PAGE-055",
          "text": "limba implicită de afișare în Chat (preferred_language)"
        },
        {
          "id": "CHAT_PAGE-056",
          "text": "Retrogradarea rangului:"
        },
        {
          "id": "CHAT_PAGE-057",
          "text": "Regulă prioritară:"
        },
        {
          "id": "CHAT_PAGE-058",
          "text": "scade vizibilitatea/matching-ul, reduce limitele (ex: atașamente/mesaje/zi), poate bloca HOLD/Confirm."
        },
        {
          "id": "CHAT_PAGE-059",
          "text": "preferred_language setat de user"
        },
        {
          "id": "CHAT_PAGE-060",
          "text": "Recuperare rang:"
        },
        {
          "id": "CHAT_PAGE-061",
          "text": "device/browser locale"
        },
        {
          "id": "CHAT_PAGE-062",
          "text": "prin „angajament” (acceptare reguli + mesaj de tip pledge)"
        },
        {
          "id": "CHAT_PAGE-063",
          "text": "În Chat:"
        },
        {
          "id": "CHAT_PAGE-064",
          "text": "posibil prin „tokeni” (mecanism de „reabilitare” / „bond” / „staking” pentru recâștigarea unor drepturi)"
        },
        {
          "id": "CHAT_PAGE-065",
          "text": "există setare per-thread: Auto-translate ON/OFF"
        },
        {
          "id": "CHAT_PAGE-066",
          "text": "recidiva în perioada de probă → penalizare accelerată."
        },
        {
          "id": "CHAT_PAGE-067",
          "text": "există traducere la cerere pentru orice mesaj"
        },
        {
          "id": "CHAT_PAGE-068",
          "text": "3) AI — rol clar, non-blocking, dar cu putere de protecție"
        },
        {
          "id": "CHAT_PAGE-069",
          "text": "AI-ul în Chat are rol de „Safety & Negotiation Assistant”. Nu trebuie să oprească funcționarea chat-ului dacă e indisponibil, dar când e disponibil, face:"
        },
        {
          "id": "CHAT_PAGE-070",
          "text": "Autentificare\nCreează cont"
        },
        {
          "id": "CHAT_PAGE-071",
          "text": "0.3 Meniu contextual (global)"
        },
        {
          "id": "CHAT_PAGE-072",
          "text": "Meniul contextual se deschide din avatarul din header (sau long-press pe mobile)."
        },
        {
          "id": "CHAT_PAGE-073",
          "text": "3.1 Moderare limbaj (toxicity)"
        },
        {
          "id": "CHAT_PAGE-074",
          "text": "Conține minim:"
        },
        {
          "id": "CHAT_PAGE-075",
          "text": "Detectează: insultă, hate speech, amenințări, hărțuire, șantaj."
        },
        {
          "id": "CHAT_PAGE-076",
          "text": "Profil (view/edit)"
        },
        {
          "id": "CHAT_PAGE-077",
          "text": "Acțiuni:"
        },
        {
          "id": "CHAT_PAGE-078",
          "text": "Obiectele mele (My items)"
        },
        {
          "id": "CHAT_PAGE-079",
          "text": "Afișează warning UI: „Mesajul poate încălca regulile.”"
        },
        {
          "id": "CHAT_PAGE-080",
          "text": "Match / Chat (shortcut)"
        },
        {
          "id": "CHAT_PAGE-081",
          "text": "Pentru abuz repetat: aplică automat „slow mode”/mute și marchează pentru review."
        },
        {
          "id": "CHAT_PAGE-082",
          "text": "Setări (Settings)"
        },
        {
          "id": "CHAT_PAGE-083",
          "text": "Marchează impact în rang (conform policy)."
        },
        {
          "id": "CHAT_PAGE-084",
          "text": "Limbă (Language)"
        },
        {
          "id": "CHAT_PAGE-085",
          "text": "3.2 Scam / fraud / manipulare"
        },
        {
          "id": "CHAT_PAGE-086",
          "text": "Termeni & condiții"
        },
        {
          "id": "CHAT_PAGE-087",
          "text": "Detectează tipare:"
        },
        {
          "id": "CHAT_PAGE-088",
          "text": "Politică GDPR / Privacy"
        },
        {
          "id": "CHAT_PAGE-089",
          "text": "„trimite-mi banii”, „plătește în avans”, „dă-mi codul”, „mută conversația pe WhatsApp”, „link dubios”"
        },
        {
          "id": "CHAT_PAGE-090",
          "text": "presiune/urgență artificială"
        },
        {
          "id": "CHAT_PAGE-091",
          "text": "Ajutor / Support / Report a problem"
        },
        {
          "id": "CHAT_PAGE-092",
          "text": "Acțiuni:"
        },
        {
          "id": "CHAT_PAGE-093",
          "text": "Logout"
        },
        {
          "id": "CHAT_PAGE-094",
          "text": "banner de avertizare pentru celălalt utilizator"
        },
        {
          "id": "CHAT_PAGE-095",
          "text": "Meniul contextual trebuie să fie consistent și accesibil pe toate paginile."
        },
        {
          "id": "CHAT_PAGE-096",
          "text": "reduce „trust score” și marchează thread pentru review."
        },
        {
          "id": "CHAT_PAGE-097",
          "text": "Pentru user nelogat:"
        },
        {
          "id": "CHAT_PAGE-098",
          "text": "3.3 Protecția datelor (PII) & GDPR cues"
        },
        {
          "id": "CHAT_PAGE-099",
          "text": "Login / Register"
        },
        {
          "id": "CHAT_PAGE-100",
          "text": "Detectează și avertizează la transmiterea de:"
        },
        {
          "id": "CHAT_PAGE-101",
          "text": "Termeni & condiții / Privacy"
        },
        {
          "id": "CHAT_PAGE-102",
          "text": "CNP, serie CI, card bancar, parole/coduri, date medicale, etc."
        },
        {
          "id": "CHAT_PAGE-103",
          "text": "0.4 Footer (global, pe toate paginile inclusiv Chat)"
        },
        {
          "id": "CHAT_PAGE-104",
          "text": "UI: „Ești pe cale să trimiți date sensibile. Continui?”"
        },
        {
          "id": "CHAT_PAGE-105",
          "text": "Footer-ul conține:"
        },
        {
          "id": "CHAT_PAGE-106",
          "text": "3.4 Atașamente — anti-malware & control tipuri"
        },
        {
          "id": "CHAT_PAGE-107",
          "text": "Link Termeni & condiții"
        },
        {
          "id": "CHAT_PAGE-108",
          "text": "→ Autentifică-te"
        },
        {
          "id": "CHAT_PAGE-109",
          "text": "Orice fișier încărcat trece prin:"
        },
        {
          "id": "CHAT_PAGE-110",
          "text": "Link Privacy / GDPR"
        },
        {
          "id": "CHAT_PAGE-111",
          "text": "validare tip (allowlist): PDF/JPG/PNG/WEBP (și eventual DOCX, dar cu prudență)"
        },
        {
          "id": "CHAT_PAGE-112",
          "text": "Link Contact / Support"
        },
        {
          "id": "CHAT_PAGE-113",
          "text": "limită dimensiune"
        },
        {
          "id": "CHAT_PAGE-114",
          "text": "Link About / Info"
        },
        {
          "id": "CHAT_PAGE-115",
          "text": "scanare anti-malware server-side înainte de a fi disponibil pentru download (ex: ClamAV sau serviciu dedicat)"
        },
        {
          "id": "CHAT_PAGE-116",
          "text": "(Opțional) social / newsletter"
        },
        {
          "id": "CHAT_PAGE-117",
          "text": "blocare automată la suspiciune + mesaj sistem „Fișier blocat pentru siguranță”"
        },
        {
          "id": "CHAT_PAGE-118",
          "text": "Copyright “Swaply”"
        },
        {
          "id": "CHAT_PAGE-119",
          "text": "Link-uri externe:"
        },
        {
          "id": "CHAT_PAGE-120",
          "text": "Footer-ul trebuie să existe și în stările fără conținut (ex: “no threads yet”)."
        },
        {
          "id": "CHAT_PAGE-121",
          "text": "Pe mobile, footer-ul nu trebuie să încurce input-ul din chat (composer). Dacă există bottom-nav, footer-ul poate fi minim sau ascuns."
        },
        {
          "id": "CHAT_PAGE-122",
          "text": "link preview doar după verificare (allowlist / reputație domeniu)"
        },
        {
          "id": "CHAT_PAGE-123",
          "text": "eventual dezactivare click direct pentru domenii suspecte."
        },
        {
          "id": "CHAT_PAGE-124",
          "text": "PARTEA 1 — CHAT PAGE (CORE)"
        },
        {
          "id": "CHAT_PAGE-125",
          "text": "Rolul paginii: Chat-ul este „camera de negociere” asociată unui Match. Nu este messenger general. Chat-ul există doar după Match."
        },
        {
          "id": "CHAT_PAGE-126",
          "text": "Notă de implementare: scanarea trebuie să fie server-side; client-side e inutilă pentru securitate reală."
        },
        {
          "id": "CHAT_PAGE-127",
          "text": "3.5 Ajutor de negociere (opțional, dar util)"
        },
        {
          "id": "CHAT_PAGE-128",
          "text": "Acces & reguli"
        },
        {
          "id": "CHAT_PAGE-129",
          "text": "Sugerează formulări mai clare și civilizate"
        },
        {
          "id": "CHAT_PAGE-130",
          "text": "Pagina este disponibilă doar pentru useri autentificați."
        },
        {
          "id": "CHAT_PAGE-131",
          "text": "Rezumă negocierea (thread lung)"
        },
        {
          "id": "CHAT_PAGE-132",
          "text": "Un thread de chat este accesibil doar participanților (user A + user B) și este legat de match_id."
        },
        {
          "id": "CHAT_PAGE-133",
          "text": "Propune structurarea ofertei în „Offer Card” (Accept/Counter/Decline)"
        },
        {
          "id": "CHAT_PAGE-134",
          "text": "LIKE nu blochează. CHAT nu blochează. Rezervarea se face numai prin HOLD în chat."
        },
        {
          "id": "CHAT_PAGE-135",
          "text": "Traducere RO/EN etc. (dacă userii folosesc limbi diferite)"
        },
        {
          "id": "CHAT_PAGE-136",
          "text": "Dacă AI/helper/servicii externe pică: chat-ul trebuie să funcționeze normal (fallback silent)."
        },
        {
          "id": "CHAT_PAGE-137",
          "text": "4) Partajare locație (după confirmarea schimbului)"
        },
        {
          "id": "CHAT_PAGE-138",
          "text": "Layout (desktop + mobile)"
        },
        {
          "id": "CHAT_PAGE-139",
          "text": "Locația (share location / meeting point) este permisă DOAR după:"
        },
        {
          "id": "CHAT_PAGE-140",
          "text": "Desktop: 2 coloane"
        },
        {
          "id": "CHAT_PAGE-141",
          "text": "propunere acceptată + (opțional) HOLD activ, dar ideal:"
        },
        {
          "id": "CHAT_PAGE-142",
          "text": "Stânga: Istoricul chat-urilor (thread list)"
        },
        {
          "id": "CHAT_PAGE-143",
          "text": "după dublă confirmare „Confirmă schimbul” sau după „Confirm întâlnirea”."
        },
        {
          "id": "CHAT_PAGE-144",
          "text": "Dreapta: Zona de chat (mesaje + composer)"
        },
        {
          "id": "CHAT_PAGE-145",
          "text": "Locația poate fi:"
        },
        {
          "id": "CHAT_PAGE-146",
          "text": "Mobile: listă → intri în thread (stil WhatsApp/Signal)."
        },
        {
          "id": "CHAT_PAGE-147",
          "text": "pin pe hartă"
        },
        {
          "id": "CHAT_PAGE-148",
          "text": "Istoricul chat-urilor (stânga)"
        },
        {
          "id": "CHAT_PAGE-149",
          "text": "adresă text"
        },
        {
          "id": "CHAT_PAGE-150",
          "text": "Search + filtre: Active / Încheiate / Cu HOLD / Necitite"
        },
        {
          "id": "CHAT_PAGE-151",
          "text": "interval orar"
        },
        {
          "id": "CHAT_PAGE-152",
          "text": "Fiecare thread afișează:"
        },
        {
          "id": "CHAT_PAGE-153",
          "text": "Locația are „visibility rules”:"
        },
        {
          "id": "CHAT_PAGE-154",
          "text": "avatar + nume + ultimul mesaj + timestamp"
        },
        {
          "id": "CHAT_PAGE-155",
          "text": "doar participanții"
        },
        {
          "id": "CHAT_PAGE-156",
          "text": "badge: HOLD activ / HOLD expirat / Necitit"
        },
        {
          "id": "CHAT_PAGE-157",
          "text": "opțiune „expiră după X ore” (privacy by default)"
        },
        {
          "id": "CHAT_PAGE-158",
          "text": "mini-card obiecte negociate (icon/thumbnail mic)"
        },
        {
          "id": "CHAT_PAGE-159",
          "text": "5) Atașamente suportate (în Chat)"
        },
        {
          "id": "CHAT_PAGE-160",
          "text": "Header thread (dreapta sus)"
        },
        {
          "id": "CHAT_PAGE-161",
          "text": "Imagini suplimentare (detalii produs)"
        },
        {
          "id": "CHAT_PAGE-162",
          "text": "Nume utilizator + status thread: Negociere / HOLD activ / Încheiat"
        },
        {
          "id": "CHAT_PAGE-163",
          "text": "PDF: „fișa produsului”, „garanție”, „factură” (atenție PII)"
        },
        {
          "id": "CHAT_PAGE-164",
          "text": "Link rapid către:"
        },
        {
          "id": "CHAT_PAGE-165",
          "text": "Posibil „album” per negociere (dar legat de thread)"
        },
        {
          "id": "CHAT_PAGE-166",
          "text": "profil utilizator"
        },
        {
          "id": "CHAT_PAGE-167",
          "text": "Orice atașament trebuie să fie legat de thread + audit log + drept de ștergere conform policy."
        },
        {
          "id": "CHAT_PAGE-168",
          "text": "pagina obiectelor (item detail) implicate în negociere"
        },
        {
          "id": "CHAT_PAGE-169",
          "text": "6) Controale pentru user (UX de siguranță)"
        },
        {
          "id": "CHAT_PAGE-170",
          "text": "Banda de negociere (sub header, mereu vizibilă în thread)"
        },
        {
          "id": "CHAT_PAGE-171",
          "text": "Butoane în thread:"
        },
        {
          "id": "CHAT_PAGE-172",
          "text": "Carduri mici: Obiectul meu vs Obiectul tău (cu thumbnail + titlu)"
        },
        {
          "id": "CHAT_PAGE-173",
          "text": "Block user (blochează mesaje viitoare, nu șterge istoricul)"
        },
        {
          "id": "CHAT_PAGE-174",
          "text": "Secțiune Propunerea curentă (dacă există) ca „Offer Card” (nu text liber)"
        },
        {
          "id": "CHAT_PAGE-175",
          "text": "Report"
        },
        {
          "id": "CHAT_PAGE-176",
          "text": "Buton rezervare: HOLD (cu TTL)"
        },
        {
          "id": "CHAT_PAGE-177",
          "text": "Mute"
        },
        {
          "id": "CHAT_PAGE-178",
          "text": "HOLD este explicit și are TTL (ex: 30 min / 2h / 24h)"
        },
        {
          "id": "CHAT_PAGE-179",
          "text": "Export conversație (opțional, GDPR-friendly)"
        },
        {
          "id": "CHAT_PAGE-180",
          "text": "HOLD poate fi „cerut” și „acceptat” (status vizibil)"
        },
        {
          "id": "CHAT_PAGE-181",
          "text": "„Safety tips” în UI când apar semnale de risc."
        },
        {
          "id": "CHAT_PAGE-182",
          "text": "Timer vizibil în UI; la expirare: mesaj sistem + status revine la „Negociere”"
        },
        {
          "id": "CHAT_PAGE-183",
          "text": "7) Sugestii extra (recomandate)"
        },
        {
          "id": "CHAT_PAGE-184",
          "text": "istoricul chat-urilor"
        },
        {
          "id": "CHAT_PAGE-185",
          "text": "Mesaje (zona principală)"
        },
        {
          "id": "CHAT_PAGE-186",
          "text": "Rate limiting pe mesaje și atașamente (anti-spam)."
        },
        {
          "id": "CHAT_PAGE-187",
          "text": "Mesaje text + imagini (atașamente)"
        },
        {
          "id": "CHAT_PAGE-188",
          "text": "Message deletion policy:"
        },
        {
          "id": "CHAT_PAGE-189",
          "text": "Mesaje „sistem” (stil card/bubble distinct):"
        },
        {
          "id": "CHAT_PAGE-190",
          "text": "ștergere doar pentru tine vs ștergere pentru amândoi (decide clar)"
        },
        {
          "id": "CHAT_PAGE-191",
          "text": "„HOLD activ până la…”"
        },
        {
          "id": "CHAT_PAGE-192",
          "text": "„HOLD a expirat”"
        },
        {
          "id": "CHAT_PAGE-193",
          "text": "pentru cazuri de moderare: păstrează evidența în audit (nu dispar complet)."
        },
        {
          "id": "CHAT_PAGE-194",
          "text": "„Propunere nouă”"
        },
        {
          "id": "CHAT_PAGE-195",
          "text": "Data retention:"
        },
        {
          "id": "CHAT_PAGE-196",
          "text": "„Schimb confirmat de X / în așteptare Y”"
        },
        {
          "id": "CHAT_PAGE-197",
          "text": "cât timp păstrezi chat-urile (ex: 12-24 luni) + opțiune de ștergere cont (GDPR)."
        },
        {
          "id": "CHAT_PAGE-198",
          "text": "Composer (jos)"
        },
        {
          "id": "CHAT_PAGE-199",
          "text": "Opțional: după dublă confirmare, se poate genera un „Contract de schimb” (PDF intern) cu rezumat: obiecte, data, locație, termeni."
        },
        {
          "id": "CHAT_PAGE-200",
          "text": "Text input + send"
        },
        {
          "id": "CHAT_PAGE-201",
          "text": "Atașamente: imagini (minim)"
        },
        {
          "id": "CHAT_PAGE-202",
          "text": "Acțiuni Swaply (butoane dedicate):"
        },
        {
          "id": "CHAT_PAGE-203",
          "text": "Device/session security:"
        },
        {
          "id": "CHAT_PAGE-204",
          "text": "Propune (creează Offer Card structurat)"
        },
        {
          "id": "CHAT_PAGE-205",
          "text": "detectare login suspect + reautentificare pentru acțiuni critice (HOLD/Confirm swap/Share location)."
        },
        {
          "id": "CHAT_PAGE-206",
          "text": "Exemple: „Îți ofer X pentru Y”, „X + diferență”, „Bundle X+Y”, „Transport inclus”"
        },
        {
          "id": "CHAT_PAGE-207",
          "text": "Trust tier:"
        },
        {
          "id": "CHAT_PAGE-208",
          "text": "Offer Card are acțiuni: Accept / Counter / Decline"
        },
        {
          "id": "CHAT_PAGE-209",
          "text": "Mesajele din chat pot fi traduse automat sau traduse la cerere, astfel încât userii cu limbi diferite să comunice ușor."
        },
        {
          "id": "CHAT_PAGE-210",
          "text": "HOLD (setează/solicită HOLD cu TTL preset)"
        },
        {
          "id": "CHAT_PAGE-211",
          "text": "Confirmă schimbul (vezi mai jos)"
        },
        {
          "id": "CHAT_PAGE-212",
          "text": "Confirmarea schimbului (obligatoriu, cu dublă confirmare)"
        },
        {
          "id": "CHAT_PAGE-213",
          "text": "userii noi au limitări (ex: nu pot trimite fișiere până nu au profil complet/verify/email confirm)."
        },
        {
          "id": "CHAT_PAGE-214",
          "text": "Există buton principal în thread: ✅ Confirmă schimbul"
        },
        {
          "id": "CHAT_PAGE-215",
          "text": "PARTEA 3 — TRADUCERE AUTOMATĂ & LA CERERE (i18n)"
        },
        {
          "id": "CHAT_PAGE-216",
          "text": "Funcționează pe principiul dublă confirmare:"
        },
        {
          "id": "CHAT_PAGE-217",
          "text": "Scop"
        },
        {
          "id": "CHAT_PAGE-218",
          "text": "User A apasă → status: „Așteaptă confirmarea celuilalt”"
        },
        {
          "id": "CHAT_PAGE-219",
          "text": "Traducerea este un layer de afișare, mesajul original rămâne sursa de adevăr."
        },
        {
          "id": "CHAT_PAGE-220",
          "text": "User B apasă → schimbul devine „Finalizat”"
        },
        {
          "id": "CHAT_PAGE-221",
          "text": "Alegerea limbii (language selection)"
        },
        {
          "id": "CHAT_PAGE-222",
          "text": "La apăsare se deschide un ecran/confirm modal cu:"
        },
        {
          "id": "CHAT_PAGE-223",
          "text": "Fiecare user are:"
        },
        {
          "id": "CHAT_PAGE-224",
          "text": "Rezumat: „Eu dau X / Tu dai Y (+ diferență dacă există)”"
        },
        {
          "id": "CHAT_PAGE-225",
          "text": "preferred_language (setare explicită în profil / selector limbă)"
        },
        {
          "id": "CHAT_PAGE-226",
          "text": "Bifă termeni: „Confirm că schimbul s-a realizat”"
        },
        {
          "id": "CHAT_PAGE-227",
          "text": "locale detectat (browser/device) ca fallback"
        },
        {
          "id": "CHAT_PAGE-228",
          "text": "Buton final branduit: Swaply ✅ Confirm definitiv (cu logo mic)"
        },
        {
          "id": "CHAT_PAGE-229",
          "text": "location_country (din profil) doar ca indiciu, NU ca adevăr absolut"
        },
        {
          "id": "CHAT_PAGE-230",
          "text": "Limba de afișare în chat = preferred_language (prioritar), altfel device locale."
        },
        {
          "id": "CHAT_PAGE-231",
          "text": "După finalizare:"
        },
        {
          "id": "CHAT_PAGE-232",
          "text": "Moduri de traducere"
        },
        {
          "id": "CHAT_PAGE-233",
          "text": "thread devine Încheiat (read-only sau limitat)"
        },
        {
          "id": "CHAT_PAGE-234",
          "text": "Auto-Translate (implicit configurabil)"
        },
        {
          "id": "CHAT_PAGE-235",
          "text": "obiectele își schimbă statusul (indisponibil / swapped) conform logicii aplicației"
        },
        {
          "id": "CHAT_PAGE-236",
          "text": "Dacă limba mesajului detectată ≠ limba preferată a receptorului → se afișează automat traducerea."
        },
        {
          "id": "CHAT_PAGE-237",
          "text": "Stări de pagină (fallback)"
        },
        {
          "id": "CHAT_PAGE-238",
          "text": "Mesajul original rămâne accesibil prin toggle: „Vezi originalul”."
        },
        {
          "id": "CHAT_PAGE-239",
          "text": "Nelogat → ecran login"
        },
        {
          "id": "CHAT_PAGE-240",
          "text": "UI: label mic „Tradus automat”."
        },
        {
          "id": "CHAT_PAGE-241",
          "text": "Logat fără thread-uri → „Nu ai conversații încă” + link către Matching"
        },
        {
          "id": "CHAT_PAGE-242",
          "text": "Translate On Demand (la cerere)"
        },
        {
          "id": "CHAT_PAGE-243",
          "text": "Thread activ (negociere) → normal"
        },
        {
          "id": "CHAT_PAGE-244",
          "text": "Pentru orice mesaj: buton „Tradu” / „Translate”."
        },
        {
          "id": "CHAT_PAGE-245",
          "text": "HOLD activ → timer + status clar"
        },
        {
          "id": "CHAT_PAGE-246",
          "text": "Dacă auto-translate e OFF, userul poate traduce selectiv."
        },
        {
          "id": "CHAT_PAGE-247",
          "text": "HOLD expirat → mesaj sistem + revenire la negociere"
        },
        {
          "id": "CHAT_PAGE-248",
          "text": "Detectarea limbii"
        },
        {
          "id": "CHAT_PAGE-249",
          "text": "Obiect indisponibil → banner + thread limitat (fără HOLD/confirm)"
        },
        {
          "id": "CHAT_PAGE-250",
          "text": "Sistemul detectează limba mesajului (language detection) înainte de traducere."
        },
        {
          "id": "CHAT_PAGE-251",
          "text": "Notificări"
        },
        {
          "id": "CHAT_PAGE-252",
          "text": "Dacă detectarea e incertă → nu traduce automat; oferă doar „Tradu” la cerere."
        },
        {
          "id": "CHAT_PAGE-253",
          "text": "Badge necitite pe thread list"
        },
        {
          "id": "CHAT_PAGE-254",
          "text": "Afișare & UX"
        },
        {
          "id": "CHAT_PAGE-255",
          "text": "Preferințe per-thread: mute/unmute"
        },
        {
          "id": "CHAT_PAGE-256",
          "text": "În bubble-ul mesajului:"
        },
        {
          "id": "CHAT_PAGE-257",
          "text": "Preferințe globale notificări chat (persistente)"
        },
        {
          "id": "CHAT_PAGE-258",
          "text": "text tradus (dacă e activ)"
        },
        {
          "id": "CHAT_PAGE-259",
          "text": "AI (opțional, non-blocking)"
        },
        {
          "id": "CHAT_PAGE-260",
          "text": "sub el: „Original” (expand/collapse)"
        },
        {
          "id": "CHAT_PAGE-261",
          "text": "AI poate sugera propuneri / rezuma conversația / traduce"
        },
        {
          "id": "CHAT_PAGE-262",
          "text": "Pentru conversații multi-limbă:"
        },
        {
          "id": "CHAT_PAGE-263",
          "text": "AI nu blochează trimiterea mesajelor și nu e required pentru funcționarea chat-ului"
        },
        {
          "id": "CHAT_PAGE-264",
          "text": "opțiune „Auto-translate ON/OFF” în setările thread-ului."
        },
        {
          "id": "CHAT_PAGE-265",
          "text": "Pentru mesajele de tip Offer Card / System messages:"
        },
        {
          "id": "CHAT_PAGE-266",
          "text": "se traduc prin dicționare UI (i18n), nu prin AI (consistență + cost redus)."
        },
        {
          "id": "CHAT_PAGE-267",
          "text": "Caching & cost control (obligatoriu)"
        },
        {
          "id": "CHAT_PAGE-268",
          "text": "Traducerile se cache-uiesc (ex: message_id + target_language → translated_text)."
        },
        {
          "id": "CHAT_PAGE-269",
          "text": "Dacă userul revine, nu se retraduce."
        },
        {
          "id": "CHAT_PAGE-270",
          "text": "Rate limiting: limită traduceri / zi (în funcție de rang/plan)."
        },
        {
          "id": "CHAT_PAGE-271",
          "text": "Mesajele foarte lungi: rezumat/fragmentare (sau doar la cerere)."
        },
        {
          "id": "CHAT_PAGE-272",
          "text": "Privacy & Safety"
        },
        {
          "id": "CHAT_PAGE-273",
          "text": "Traducerea trece prin aceleași reguli de moderare:"
        },
        {
          "id": "CHAT_PAGE-274",
          "text": "se moderează originalul (sursă)"
        },
        {
          "id": "CHAT_PAGE-275",
          "text": "se poate modera și traducerea (pentru safety, dar decizia e pe original)"
        },
        {
          "id": "CHAT_PAGE-276",
          "text": "Dacă mesajul conține date sensibile (PII), sistemul poate:"
        },
        {
          "id": "CHAT_PAGE-277",
          "text": "avertiza înainte de traducere (mai ales la cerere)"
        },
        {
          "id": "CHAT_PAGE-278",
          "text": "masca automat anumite pattern-uri (opțional)"
        },
        {
          "id": "CHAT_PAGE-279",
          "text": "Fallback dacă serviciul AI e down"
        },
        {
          "id": "CHAT_PAGE-280",
          "text": "Chat-ul funcționează normal fără traducere."
        },
        {
          "id": "CHAT_PAGE-281",
          "text": "UI: „Traducerea nu este disponibilă momentan” + buton retry."
        },
        {
          "id": "CHAT_PAGE-282",
          "text": "Sugestie extra (premium)"
        },
        {
          "id": "CHAT_PAGE-283",
          "text": "În composer, toggle: „Scriu în [limba mea], trimite și traducerea în [limba lui]”."
        },
        {
          "id": "CHAT_PAGE-284",
          "text": "Receptorul primește direct traducerea + poate vedea originalul."
        },
        {
          "id": "CHAT_PAGE-285",
          "text": "Chat page"
        }
      ]
    },
    {
      "title": "Swaply page",
      "bbox": {
        "x": 3225.5,
        "y": 223.5,
        "w": 554,
        "h": 800
      },
      "line_items": [
        {
          "id": "SWAPLY_PAGE-001",
          "text": "RO ▼"
        },
        {
          "id": "SWAPLY_PAGE-002",
          "text": "Nelogat"
        },
        {
          "id": "SWAPLY_PAGE-003",
          "text": "⋮"
        },
        {
          "id": "SWAPLY_PAGE-004",
          "text": "RO ▼"
        },
        {
          "id": "SWAPLY_PAGE-005",
          "text": "⋮"
        },
        {
          "id": "SWAPLY_PAGE-006",
          "text": "Logat"
        },
        {
          "id": "SWAPLY_PAGE-007",
          "text": "Toate paginile"
        },
        {
          "id": "SWAPLY_PAGE-008",
          "text": "PAGINA „SWAPLY” — PAGINA DE CONFIRMARE A SCHIMBULUI (Contract + Logistică + Facilitatori + Hartă + Notificări + Feedback)"
        },
        {
          "id": "SWAPLY_PAGE-009",
          "text": "0) Scopul paginii"
        },
        {
          "id": "SWAPLY_PAGE-010",
          "text": "Pagina „Swaply” este locul oficial unde un match devine schimb real. Aici se:"
        },
        {
          "id": "SWAPLY_PAGE-011",
          "text": "UI: preview blurat + CTA"
        },
        {
          "id": "SWAPLY_PAGE-012",
          "text": "confirmă schimbul (bilateral),"
        },
        {
          "id": "SWAPLY_PAGE-013",
          "text": "confirmă metoda de schimb (direct/local/internațional/vacanță/casă/serviciu),"
        },
        {
          "id": "SWAPLY_PAGE-014",
          "text": "se generează și se acceptă Acordul PDF (versionat),"
        },
        {
          "id": "SWAPLY_PAGE-015",
          "text": "neimplementat = disabled, nu 404, nu crash"
        },
        {
          "id": "SWAPLY_PAGE-016",
          "text": "se afișează harta (privacy-first) + punct/zonă/rută,"
        },
        {
          "id": "SWAPLY_PAGE-017",
          "text": "se propun facilitatori auto-localizați (global),"
        },
        {
          "id": "SWAPLY_PAGE-018",
          "text": "se gestionează atașamente (garanții/fișe/poze) cu scanare,"
        },
        {
          "id": "SWAPLY_PAGE-019",
          "text": "se finalizează cu feedback care influențează rang/tokeni,"
        },
        {
          "id": "SWAPLY_PAGE-020",
          "text": "se gestionează notificări, termene și consimțăminte speciale."
        },
        {
          "id": "SWAPLY_PAGE-021",
          "text": "Principiu: Swaply NU arbitrează negocierea. Platforma doar informează și înregistrează acordul."
        },
        {
          "id": "SWAPLY_PAGE-022",
          "text": "A) UI GLOBAL (obligatoriu pe pagină)"
        },
        {
          "id": "SWAPLY_PAGE-023",
          "text": "A1) Header fix: Logo + Titlu + Status"
        },
        {
          "id": "SWAPLY_PAGE-024",
          "text": "Logo Swaply + titlu “Swaply”"
        },
        {
          "id": "SWAPLY_PAGE-025",
          "text": "Subtitlu: “Confirmarea schimbului între {{UserA}} și {{UserB}}”"
        },
        {
          "id": "SWAPLY_PAGE-026",
          "text": "Status bar / timeline:"
        },
        {
          "id": "SWAPLY_PAGE-027",
          "text": "Draft"
        },
        {
          "id": "SWAPLY_PAGE-028",
          "text": "- Acceptarea sau refuzarea unui schimb \n   este disponibilă doar utilizatorilor autentificați."
        },
        {
          "id": "SWAPLY_PAGE-029",
          "text": "Pending review"
        },
        {
          "id": "SWAPLY_PAGE-030",
          "text": "Ready to confirm"
        },
        {
          "id": "SWAPLY_PAGE-031",
          "text": "Confirmed by one"
        },
        {
          "id": "SWAPLY_PAGE-032",
          "text": "Swaply Active"
        },
        {
          "id": "SWAPLY_PAGE-033",
          "text": "Completed"
        },
        {
          "id": "SWAPLY_PAGE-034",
          "text": "Dispute"
        },
        {
          "id": "SWAPLY_PAGE-035",
          "text": "Indicator “Versiune acord”: v1 / v2 / v3…"
        },
        {
          "id": "SWAPLY_PAGE-036",
          "text": "A2) Selector limbă (obligatoriu)"
        },
        {
          "id": "SWAPLY_PAGE-037",
          "text": "poziționat în header (dreapta sus) + opțiune “Auto (detectare)”"
        },
        {
          "id": "SWAPLY_PAGE-038",
          "text": "afectează:"
        },
        {
          "id": "SWAPLY_PAGE-039",
          "text": "tot UI-ul paginii"
        },
        {
          "id": "SWAPLY_PAGE-040",
          "text": "rezumatul AI"
        },
        {
          "id": "SWAPLY_PAGE-041",
          "text": "Acordul PDF (limba afișată)"
        },
        {
          "id": "SWAPLY_PAGE-042",
          "text": "modul de traducere din chat (Show original / Show translated)"
        },
        {
          "id": "SWAPLY_PAGE-043",
          "text": "fallback obligatoriu: EN dacă limba nu e disponibilă."
        },
        {
          "id": "SWAPLY_PAGE-044",
          "text": "A3) Meniu contextual (specific pentru Swaply)"
        },
        {
          "id": "SWAPLY_PAGE-045",
          "text": "Meniu (3 puncte) cu opțiuni:"
        },
        {
          "id": "SWAPLY_PAGE-046",
          "text": "Descarcă Acord PDF (vX)"
        },
        {
          "id": "SWAPLY_PAGE-047",
          "text": "Vezi audit / istoric versiuni (cine a schimbat ce, când)"
        },
        {
          "id": "SWAPLY_PAGE-048",
          "text": "Setări confidențialitate (consimțăminte: locație/telefon/adresă/documente)"
        },
        {
          "id": "SWAPLY_PAGE-049",
          "text": "Raportează problemă (fraudă, abuz, conținut)"
        },
        {
          "id": "SWAPLY_PAGE-050",
          "text": "Deschide Dispută (dacă e activ sau după confirmare)"
        },
        {
          "id": "SWAPLY_PAGE-051",
          "text": "Trimite remind către partener (ex: “Te rog semnează v2”)"
        },
        {
          "id": "SWAPLY_PAGE-052",
          "text": "Export rezumat schimb (PDF/JSON “for my records”) – opțional"
        },
        {
          "id": "SWAPLY_PAGE-053",
          "text": "Ajutor & reguli Swaply (interzis, recomandări întâlnire, ghid ambalare)"
        },
        {
          "id": "SWAPLY_PAGE-054",
          "text": "Opțiune specială (importantă):"
        },
        {
          "id": "SWAPLY_PAGE-055",
          "text": "9) “Acord poveste” / “Include schimbul într-o poveste” (vezi secțiunea G)"
        },
        {
          "id": "SWAPLY_PAGE-056",
          "text": "A4) Footer (global)"
        },
        {
          "id": "SWAPLY_PAGE-057",
          "text": "Linkuri: Termeni, Confidențialitate (GDPR), Politica anti-fraudă & moderare, Contact/Support"
        },
        {
          "id": "SWAPLY_PAGE-058",
          "text": "“© Swaply” + versiune aplicație (opțional)"
        },
        {
          "id": "SWAPLY_PAGE-059",
          "text": "Link “Raportează o problemă” (redundanță intenționată)"
        },
        {
          "id": "SWAPLY_PAGE-060",
          "text": "Autentificare\nCreează cont"
        },
        {
          "id": "SWAPLY_PAGE-061",
          "text": "B) REZUMATUL SCHIMBULUI (obligatoriu)"
        },
        {
          "id": "SWAPLY_PAGE-062",
          "text": "Două carduri mari:"
        },
        {
          "id": "SWAPLY_PAGE-063",
          "text": "Tu oferi: poze, titlu, stare/condiție, descriere scurtă, locație generală (oraș), valoare estimată (opțional)."
        },
        {
          "id": "SWAPLY_PAGE-064",
          "text": "Tu primești: aceleași câmpuri."
        },
        {
          "id": "SWAPLY_PAGE-065",
          "text": "Câmp opțional: “Observații / înțelegeri speciale”."
        },
        {
          "id": "SWAPLY_PAGE-066",
          "text": "C) SUBSECȚIUNEA 1 — CONFIRMAREA SCHIMBULUI (Semnare)"
        },
        {
          "id": "SWAPLY_PAGE-067",
          "text": "C1) Informare obligatorie înainte de Confirm"
        },
        {
          "id": "SWAPLY_PAGE-068",
          "text": "Un rezumat scurt (8–10 rânduri) vizibil înainte de buton:"
        },
        {
          "id": "SWAPLY_PAGE-069",
          "text": "ce se schimbă,"
        },
        {
          "id": "SWAPLY_PAGE-070",
          "text": "metoda aleasă,"
        },
        {
          "id": "SWAPLY_PAGE-071",
          "text": "ce date se deblochează după semnare,"
        },
        {
          "id": "SWAPLY_PAGE-072",
          "text": "că facilitatorii sunt terți (fără garanție),"
        },
        {
          "id": "SWAPLY_PAGE-073",
          "text": "→ Autentifică-te"
        },
        {
          "id": "SWAPLY_PAGE-074",
          "text": "că modificările cer reconfirmare (v2),"
        },
        {
          "id": "SWAPLY_PAGE-075",
          "text": "că există Dispute + dovezi,"
        },
        {
          "id": "SWAPLY_PAGE-076",
          "text": "că feedback-ul are termen limită (deadline)."
        },
        {
          "id": "SWAPLY_PAGE-077",
          "text": "C2) Semnare bilaterală"
        },
        {
          "id": "SWAPLY_PAGE-078",
          "text": "Buton: „Confirm Swaply / Semnează acordul”"
        },
        {
          "id": "SWAPLY_PAGE-079",
          "text": "Stări:"
        },
        {
          "id": "SWAPLY_PAGE-080",
          "text": "„Semnat de tine, așteaptă semnătura lui {{UserX}}”"
        },
        {
          "id": "SWAPLY_PAGE-081",
          "text": "„Semnat de amândoi → Swaply Active”"
        },
        {
          "id": "SWAPLY_PAGE-082",
          "text": "C3) Regula “reconfirmare”"
        },
        {
          "id": "SWAPLY_PAGE-083",
          "text": "Orice modificare la metodă, locație, interval, consimțăminte, curier/AWB, atașamente esențiale => Acord nou v2 + semnare din nou de ambele părți."
        },
        {
          "id": "SWAPLY_PAGE-084",
          "text": "D) SUBSECȚIUNEA 2 — CONFIRMAREA METODEI DE SCHIMB"
        },
        {
          "id": "SWAPLY_PAGE-085",
          "text": "Metode (alegi una):"
        },
        {
          "id": "SWAPLY_PAGE-086",
          "text": "Pin special cu: nume locație, interval, note (“la recepție”, “intrarea principală”)."
        },
        {
          "id": "SWAPLY_PAGE-087",
          "text": "Direct (întâlnire)"
        },
        {
          "id": "SWAPLY_PAGE-088",
          "text": "F) SUBSECȚIUNEA 3 — FACILITATORI AUTO-LOCALIZAȚI (global)"
        },
        {
          "id": "SWAPLY_PAGE-089",
          "text": "Local (în aceeași zonă/țară)"
        },
        {
          "id": "SWAPLY_PAGE-090",
          "text": "F1) Regula de auto-localizare"
        },
        {
          "id": "SWAPLY_PAGE-091",
          "text": "Internațional"
        },
        {
          "id": "SWAPLY_PAGE-092",
          "text": "Facilitatorii se propun automat în funcție de:"
        },
        {
          "id": "SWAPLY_PAGE-093",
          "text": "Vacanță / călătorie personală (handoff)"
        },
        {
          "id": "SWAPLY_PAGE-094",
          "text": "locația participantului A,"
        },
        {
          "id": "SWAPLY_PAGE-095",
          "text": "Schimb de case"
        },
        {
          "id": "SWAPLY_PAGE-096",
          "text": "locația participantului B,"
        },
        {
          "id": "SWAPLY_PAGE-097",
          "text": "Schimb de servicii"
        },
        {
          "id": "SWAPLY_PAGE-098",
          "text": "locația întâlnirii/handoff,"
        },
        {
          "id": "SWAPLY_PAGE-099",
          "text": "Fiecare metodă are câmpuri de detaliu + informări, dar Swaply nu arbitrează negocieri."
        },
        {
          "id": "SWAPLY_PAGE-100",
          "text": "metoda de schimb."
        },
        {
          "id": "SWAPLY_PAGE-101",
          "text": "E) HARTA (obligatoriu) — privacy-first + pin/zonă/rută"
        },
        {
          "id": "SWAPLY_PAGE-102",
          "text": "Filtre:"
        },
        {
          "id": "SWAPLY_PAGE-103",
          "text": "lângă mine / lângă partener / în locul întâlnirii / pe traseu."
        },
        {
          "id": "SWAPLY_PAGE-104",
          "text": "E1) 3 moduri"
        },
        {
          "id": "SWAPLY_PAGE-105",
          "text": "F2) Categorii (liste)"
        },
        {
          "id": "SWAPLY_PAGE-106",
          "text": "Aproximativ (pre-semnare): oraș + cerc/radius."
        },
        {
          "id": "SWAPLY_PAGE-107",
          "text": "Curieri / transport colete"
        },
        {
          "id": "SWAPLY_PAGE-108",
          "text": "Confirmat (post-semnare + consimțământ): pin exact pentru întâlnire/adresă."
        },
        {
          "id": "SWAPLY_PAGE-109",
          "text": "Transport local"
        },
        {
          "id": "SWAPLY_PAGE-110",
          "text": "Traseu/Zone: Punct fix / Zonă / Rută (linie: start+stop+opriri + interval timp)."
        },
        {
          "id": "SWAPLY_PAGE-111",
          "text": "Transport feroviar"
        },
        {
          "id": "SWAPLY_PAGE-112",
          "text": "E2) Pin “Punct de întâlnire”"
        },
        {
          "id": "SWAPLY_PAGE-113",
          "text": "Închirieri auto"
        },
        {
          "id": "SWAPLY_PAGE-114",
          "text": "Cazări"
        },
        {
          "id": "SWAPLY_PAGE-115",
          "text": "Restaurante / locuri de întâlnire"
        },
        {
          "id": "SWAPLY_PAGE-116",
          "text": "Servicii de ambalare"
        },
        {
          "id": "SWAPLY_PAGE-117",
          "text": "Furnizori ambalaje"
        },
        {
          "id": "SWAPLY_PAGE-118",
          "text": "Asigurări"
        },
        {
          "id": "SWAPLY_PAGE-119",
          "text": "Escrow / garanții (informare)"
        },
        {
          "id": "SWAPLY_PAGE-120",
          "text": "Transferuri bancare / plăți externe (informare + afiliere; fără plăți în app)"
        },
        {
          "id": "SWAPLY_PAGE-121",
          "text": "Regulă: Swaply recomandă și informează; nu garantează terți și nu procesează plăți interne (dacă nu se decide altfel)."
        },
        {
          "id": "SWAPLY_PAGE-122",
          "text": "G) CONSIMȚĂMÂNT “POVESTE” (nou, obligatoriu)"
        },
        {
          "id": "SWAPLY_PAGE-123",
          "text": "Scop: utilizatorii pot accepta ca schimbul să fie folosit într-o “poveste”/story (marketing/community), cu reguli de confidențialitate."
        },
        {
          "id": "SWAPLY_PAGE-124",
          "text": "G1) Toggle/checkbox-uri (separate)"
        },
        {
          "id": "SWAPLY_PAGE-125",
          "text": "☐ “Accept includerea schimbului într-o poveste publică”"
        },
        {
          "id": "SWAPLY_PAGE-126",
          "text": "☐ “Permite folosirea pozelor obiectelor” (fără date personale)"
        },
        {
          "id": "SWAPLY_PAGE-127",
          "text": "☐ “Permite folosirea conversației” (doar citate anonimizate, opțional)"
        },
        {
          "id": "SWAPLY_PAGE-128",
          "text": "☐ “Permite afișarea locației” (numai țară/oraș, niciodată adresă)"
        },
        {
          "id": "SWAPLY_PAGE-129",
          "text": "☐ “Anonimizare completă” (default recomandat)"
        },
        {
          "id": "SWAPLY_PAGE-130",
          "text": "G2) Reguli"
        },
        {
          "id": "SWAPLY_PAGE-131",
          "text": "consimțământul e revocabil"
        },
        {
          "id": "SWAPLY_PAGE-132",
          "text": "povestea nu include nume real, telefon, adresă, coordonate"
        },
        {
          "id": "SWAPLY_PAGE-133",
          "text": "dacă unul refuză, povestea nu se publică."
        },
        {
          "id": "SWAPLY_PAGE-134",
          "text": "H) DOCUMENTE & ATAȘAMENTE (opțional, dar suport complet)"
        },
        {
          "id": "SWAPLY_PAGE-135",
          "text": "upload: factură/garanție/PDF fișă produs/poze detalii/serie."
        },
        {
          "id": "SWAPLY_PAGE-136",
          "text": "acces limitat până la semnare (sau doar metadate)"
        },
        {
          "id": "SWAPLY_PAGE-137",
          "text": "scanare malware server-side, fișiere suspecte blocate."
        },
        {
          "id": "SWAPLY_PAGE-138",
          "text": "I) CONFIDENȚIALITATE & CONSIMȚĂMÂNT (GDPR + safety)"
        },
        {
          "id": "SWAPLY_PAGE-139",
          "text": "Switch-uri:"
        },
        {
          "id": "SWAPLY_PAGE-140",
          "text": "Partajează telefon/email"
        },
        {
          "id": "SWAPLY_PAGE-141",
          "text": "Partajează adresă"
        },
        {
          "id": "SWAPLY_PAGE-142",
          "text": "Partajează locația exactă"
        },
        {
          "id": "SWAPLY_PAGE-143",
          "text": "Partajează documente"
        },
        {
          "id": "SWAPLY_PAGE-144",
          "text": "Reguli:"
        },
        {
          "id": "SWAPLY_PAGE-145",
          "text": "pre-semnare: fără date sensibile"
        },
        {
          "id": "SWAPLY_PAGE-146",
          "text": "post-semnare: doar cu consimțământ"
        },
        {
          "id": "SWAPLY_PAGE-147",
          "text": "retragere: ascunde imediat (audit log)"
        },
        {
          "id": "SWAPLY_PAGE-148",
          "text": "J) DISPUTE / INCIDENTE (cadru minim)"
        },
        {
          "id": "SWAPLY_PAGE-149",
          "text": "Buton: “Deschide Dispută”"
        },
        {
          "id": "SWAPLY_PAGE-150",
          "text": "tip incident + dovezi (poze, AWB, conversație)"
        },
        {
          "id": "SWAPLY_PAGE-151",
          "text": "freeze parțial + status."
        },
        {
          "id": "SWAPLY_PAGE-152",
          "text": "K) SUBSECȚIUNEA 4 — FEEDBACK + TERMENE (închide fluxul)"
        },
        {
          "id": "SWAPLY_PAGE-153",
          "text": "K1) Confirmare predare/primire"
        },
        {
          "id": "SWAPLY_PAGE-154",
          "text": "Butoane: “Confirm predare / Confirm primire” (sau “confirm prestare” la servicii)"
        },
        {
          "id": "SWAPLY_PAGE-155",
          "text": "K2) Deadline feedback (obligatoriu în spec)"
        },
        {
          "id": "SWAPLY_PAGE-156",
          "text": "se setează automat un interval:"
        },
        {
          "id": "SWAPLY_PAGE-157",
          "text": "exemplu: “Feedback disponibil până la {{feedback_deadline_date}}”"
        },
        {
          "id": "SWAPLY_PAGE-158",
          "text": "după deadline:"
        },
        {
          "id": "SWAPLY_PAGE-159",
          "text": "feedback-ul poate fi închis sau redus (ex: doar rating scurt) – decizie de produs"
        },
        {
          "id": "SWAPLY_PAGE-160",
          "text": "notificări automate înainte de deadline."
        },
        {
          "id": "SWAPLY_PAGE-161",
          "text": "K3) Feedback"
        },
        {
          "id": "SWAPLY_PAGE-162",
          "text": "rating pe categorii + text opțional"
        },
        {
          "id": "SWAPLY_PAGE-163",
          "text": "actualizează rang/reputație/tokeni."
        },
        {
          "id": "SWAPLY_PAGE-164",
          "text": "L) NOTIFICĂRI (obligatoriu, integrate cu meniu + header)"
        },
        {
          "id": "SWAPLY_PAGE-165",
          "text": "Tipuri de notificări:"
        },
        {
          "id": "SWAPLY_PAGE-166",
          "text": "Like / Interes"
        },
        {
          "id": "SWAPLY_PAGE-167",
          "text": "Solicitare chat"
        },
        {
          "id": "SWAPLY_PAGE-168",
          "text": "Mesaj nou"
        },
        {
          "id": "SWAPLY_PAGE-169",
          "text": "Swaply: propus / semnat de unul / activ / reconfirmare v2 / anulat"
        },
        {
          "id": "SWAPLY_PAGE-170",
          "text": "Facilitatori: update tracking / reminder (dacă există integrare sau input manual)"
        },
        {
          "id": "SWAPLY_PAGE-171",
          "text": "Atenționare feedback: “mai ai X zile până la deadline”"
        },
        {
          "id": "SWAPLY_PAGE-172",
          "text": "Notificările includ:"
        },
        {
          "id": "SWAPLY_PAGE-173",
          "text": "data/ora evenimentului"
        },
        {
          "id": "SWAPLY_PAGE-174",
          "text": "link direct către Swaply relevant"
        },
        {
          "id": "SWAPLY_PAGE-175",
          "text": "acțiune rapidă (ex: “Semnează”, “Răspunde”, “Lasă feedback”)."
        },
        {
          "id": "SWAPLY_PAGE-176",
          "text": "M) Acord PDF (obligatoriu)"
        },
        {
          "id": "SWAPLY_PAGE-177",
          "text": "Flux:"
        },
        {
          "id": "SWAPLY_PAGE-178",
          "text": "“Vezi Acord PDF (vX)”"
        },
        {
          "id": "SWAPLY_PAGE-179",
          "text": "checkbox “Am luat la cunoștință”"
        },
        {
          "id": "SWAPLY_PAGE-180",
          "text": "“Confirm / Semnez”"
        },
        {
          "id": "SWAPLY_PAGE-181",
          "text": "Sistemul salvează:"
        },
        {
          "id": "SWAPLY_PAGE-182",
          "text": "PDF exact (vX), hash, timestamps A/B, audit log."
        },
        {
          "id": "SWAPLY_PAGE-183",
          "text": "N) Edge cases"
        },
        {
          "id": "SWAPLY_PAGE-184",
          "text": "modificare după semnare => v2 + reconfirmare"
        },
        {
          "id": "SWAPLY_PAGE-185",
          "text": "pin=linie (croazieră/tren) => Rută (start/stop/opriri + interval)"
        },
        {
          "id": "SWAPLY_PAGE-186",
          "text": "obiect indisponibil => Needs update + blocare semnare"
        },
        {
          "id": "SWAPLY_PAGE-187",
          "text": "Map provider (TBD) — privacy-first + cost control"
        },
        {
          "id": "SWAPLY_PAGE-188",
          "text": "Swaply page"
        }
      ]
    },
    {
      "title": "Info Page",
      "bbox": {
        "x": 3862.5,
        "y": 220.5,
        "w": 554,
        "h": 800
      },
      "line_items": [
        {
          "id": "INFO_PAGE-001",
          "text": "RO ▼"
        },
        {
          "id": "INFO_PAGE-002",
          "text": "⋮"
        },
        {
          "id": "INFO_PAGE-003",
          "text": "Nelogat"
        },
        {
          "id": "INFO_PAGE-004",
          "text": "RO ▼"
        },
        {
          "id": "INFO_PAGE-005",
          "text": "⋮"
        },
        {
          "id": "INFO_PAGE-006",
          "text": "Logat"
        },
        {
          "id": "INFO_PAGE-007",
          "text": "Toate paginile"
        },
        {
          "id": "INFO_PAGE-008",
          "text": "neimplementat = disabled, nu 404, nu crash"
        },
        {
          "id": "INFO_PAGE-009",
          "text": "INFO PAGE — NOTE PENTRU DEVELOPER (Swaply)"
        },
        {
          "id": "INFO_PAGE-010",
          "text": "0) Rolul paginii Info (de ce există)"
        },
        {
          "id": "INFO_PAGE-011",
          "text": "Info Page este “centrul de gravitație” pentru:"
        },
        {
          "id": "INFO_PAGE-012",
          "text": "11) Monetizare — 20 idei pentru fiecare tip de schimb (matrice completă)"
        },
        {
          "id": "INFO_PAGE-013",
          "text": "explicații (Despre, Reguli, Safety),"
        },
        {
          "id": "INFO_PAGE-014",
          "text": "transparență (statistici globale + statistici personale),"
        },
        {
          "id": "INFO_PAGE-015",
          "text": "11.A Schimb direct (față în față) — 20"
        },
        {
          "id": "INFO_PAGE-016",
          "text": "legal (T&C, GDPR, cookies),"
        },
        {
          "id": "INFO_PAGE-017",
          "text": "Boost local (plătit în tokeni)"
        },
        {
          "id": "INFO_PAGE-018",
          "text": "monetizare (toate mecanismele, clar explicate),"
        },
        {
          "id": "INFO_PAGE-019",
          "text": "AI & AUTOMATIZĂRI — TRANSPARENȚĂ + CONTRACT TEHNIC (OBLIGATORIU)\n1) Principiu general\n\nAI-ul în Swaply are rol de asistent (recomandă, clasifică, traduce, protejează), NU de “judecător absolut”.\nOrice decizie importantă (confirmare schimb, locație exactă, acceptare condiții, acord poveste, bani/tokeni) rămâne umană + explicită.\n\n2) Componente AI (ce există în sistem)\n\nA. Clasificare imagine (Hugging Face)\n\nInput: imagine obiect (după upload)\n\nOutput: label(e), confidence 0–1, posibil categorie/subcategorie sugerată\n\nFolosire: autocomplete titlu, sugestie categorie, tags, “similar items”.\n\nB. Matching AI (recomandări de schimb)\n\nInput: obiectele oferite + wishlist + locație aproximativă + preferințe + istoric like/skip\n\nOutput: propuneri swap + scoruri + motive scurte (“de ce”)\n\nRegula de aur: Match propune, user decide.\n\nC. Estimare valoare (AI)\n\nOutput: valoare orientativă într-o monedă internă (ex: EUR) + interval + confidence\n\nUI: se afișează ca “estimare orientativă” cu disclaimere (nu preț, nu garanție).\n\nD. Chat: traducere automată + la cerere\n\nTraducerea trece prin aceleași reguli de moderare ca mesajul original.\n\nE. Moderare limbaj (toxicity / hate / threats)\n\nSe aplică pe: chat, titluri/descrieri obiecte, comentarii feedback.\n\nOutput: scor + acțiune: allow / warn / block / escalation.\n\nF. Anti-fraudă & link safety\n\nDetectează pattern-uri: cereri bani externe, linkuri suspecte, presiune, scam clasic.\n\nOutput: avertisment + banner + raportare rapidă.\n\nG. Anti-malware pentru atașamente\n\nScanare server-side înainte de download.\n\nFișiere suspecte: blocate + log audit.\n\n3) Date trimise către AI (minimizare + interdicții)\n\nNU trimitem către servicii externe: email, telefon, adresă exactă, CNP/ID, coordonate exacte, conversații complete “în bloc” fără motiv.\n\nPentru matching: folosim doar datele necesare (tags, categorii, embeddings, locație aproximativă).\n\nPentru chat: moderarea e obligatorie (safety), dar păstrăm audit minim.\n\n4) Stocare rezultate AI (versionare + audit)\n\nOrice output AI salvat în DB trebuie să includă:\n\nprovider (ex: huggingface / openai / internal)\n\nmodel + model_version\n\ncreated_at\n\ninput_hash (ca să evităm recalculări)\n\nconfidence / scoruri\n\ntrace_id (pentru debugging)\n\nObligatoriu: păstrăm separat:\n\nai_suggested_* (titlu/categorie/tags/valoare)\n\nuser_final_* (ce a ales userul)\nCa să nu “rescriem realitatea” și să putem explica “de ce”.\n\n5) Control user (opt-in/opt-out unde are sens)\n\nÎn Setări / Info trebuie explicat clar:\n\nAuto-translate: ON/OFF (user choice)\n\nAI suggestions pentru obiecte: ON/OFF (user choice)\n\nMatching AI: ON/OFF (user choice) — dacă OFF, user vede doar căutare/filtre clasice\n\nModerare safety: NU se poate opri (obligatoriu pentru platformă)\n\n“Folosește datele mele pentru îmbunătățirea modelelor”: OFF by default (opt-in explicit)\n\n6) Fallback obligatoriu (când AI pică)\n\nPlatforma NU are voie să se blocheze dacă AI e indisponibil.\n\nClasificare imagine: dacă eșuează → user completează manual titlu/categorie\n\nMatching: dacă eșuează → “manual browse” + filtru clasic\n\nTraducere: dacă eșuează → afișează original + buton retry\n\nModerare: dacă eșuează → “safe mode”: limitează trimiterea de linkuri/atașamente până revine (dar fără crash).\n\n7) Rate limit + cost control (ca să nu luăm foc la facturi)\n\nDedupe: același input (hash) → nu recalculăm.\n\nTimeouts: AI calls au timeout strict (ex: 8–15s) + retry controlat.\n\nQueue: taskurile grele (matching global, embedding, scanări) merg în job queue/background.\n\nLimite per user/zi: traduceri, explain, estimări.\n\nCaching: rezultate AI reutilizabile.\n\n8) “Explainability” (de ce am primit recomandarea asta?)\n\nPentru orice propunere de match / penalizare / avertisment:\n\nUI: buton “De ce?”\n\nOutput scurt, fără date sensibile: 3–5 bullets (ex: categorie compatibilă, proximitate, istoric preferințe)\n\nNu divulgăm date despre celălalt user care nu sunt publice.\n\n9) Prompt-injection & conținut ostil (regulă pentru dev)\n\nUser content este neîncrezut by default:\n\nLinkuri, fișiere, texte pot încerca să “păcălească” AI-ul.\n\nAI-ul nu are voie să execute instrucțiuni din conținutul userului (ex: “ignore rules”).\n\nOutput AI trebuie filtrat/sanitizat (fără HTML/script).\n\n10) Dashboard intern (admin/dev) — minim necesar\n\nExistență (chiar dacă e ascuns inițial):\n\nloguri AI (trace_id, model, erori)\n\nvizualizare ai_metadata pe item/match/chat (redactat PII)\n\ntoggle global “AI maintenance mode”.\n\n11) Disclaimer în UI (transparent, scurt)\n\n“AI poate greși. Recomandările sunt orientative.”\n\n“Valoarea estimată nu este preț.”\n\n“Moderarea automată poate bloca temporar conținut; ai drept de contestare.”"
        },
        {
          "id": "INFO_PAGE-020",
          "text": "Badge “Verified meetup-ready” (abonament)"
        },
        {
          "id": "INFO_PAGE-021",
          "text": "suport (help, contact, raportare abuz)."
        },
        {
          "id": "INFO_PAGE-022",
          "text": "Conținutul este static + semi-dinamic:"
        },
        {
          "id": "INFO_PAGE-023",
          "text": "Prioritate în listări “near me”"
        },
        {
          "id": "INFO_PAGE-024",
          "text": "Static: texte, reguli, acorduri, FAQ, pagini legale."
        },
        {
          "id": "INFO_PAGE-025",
          "text": "Sloturi extra de obiecte active"
        },
        {
          "id": "INFO_PAGE-026",
          "text": "Dinamic: statistici globale (agregate) + statistici user (doar dacă e logat), curs valutar, balanță tokeni, istorice."
        },
        {
          "id": "INFO_PAGE-027",
          "text": "1) UI obligatoriu (identic cu restul site-ului)"
        },
        {
          "id": "INFO_PAGE-028",
          "text": "Legal links accesibile global"
        },
        {
          "id": "INFO_PAGE-029",
          "text": "Poze suplimentare / video demo"
        },
        {
          "id": "INFO_PAGE-030",
          "text": "Header: Navigație principală selector limbă RO ▼ + meniu contextual ⋮."
        },
        {
          "id": "INFO_PAGE-031",
          "text": "AI “suggested swap fairness” (analiză)"
        },
        {
          "id": "INFO_PAGE-032",
          "text": "Jos (footer persistent): navigația principală (Home/Objects/Match/Chat/Change/Info) — mereu vizibilă"
        },
        {
          "id": "INFO_PAGE-033",
          "text": "Footer: linkuri legale + contact + raportare + cookies + versiune / “last updated”."
        },
        {
          "id": "INFO_PAGE-034",
          "text": "Filtre avansate (brand/condiție/rang)"
        },
        {
          "id": "INFO_PAGE-035",
          "text": "Language: schimbarea limbii afectează texte UI +  Info (About, Reguli, T&C, GDPR, Cookies). (Exact cum apare în schemă.)"
        },
        {
          "id": "INFO_PAGE-036",
          "text": "“Hold slot” (rezervare obiect 24h)"
        },
        {
          "id": "INFO_PAGE-037",
          "text": "2) Structura paginii (layout)"
        },
        {
          "id": "INFO_PAGE-038",
          "text": "Raport reputație extins (analytics)"
        },
        {
          "id": "INFO_PAGE-039",
          "text": "Pagina e împărțită în tab-uri/accordion (ca să nu fie un “roman infinit”):"
        },
        {
          "id": "INFO_PAGE-040",
          "text": "Mesaje traduse nelimitat (pachet)"
        },
        {
          "id": "INFO_PAGE-041",
          "text": "Despre Swaply"
        },
        {
          "id": "INFO_PAGE-042",
          "text": "Cum funcționează schimburile (modalități)"
        },
        {
          "id": "INFO_PAGE-043",
          "text": "Template-uri de negociere (premium)"
        },
        {
          "id": "INFO_PAGE-044",
          "text": "Statistici globale"
        },
        {
          "id": "INFO_PAGE-045",
          "text": "“Safe meeting checklist” + reminders (premium)"
        },
        {
          "id": "INFO_PAGE-046",
          "text": "Statisticile mele (doar logat)"
        },
        {
          "id": "INFO_PAGE-047",
          "text": "Rang & reputație (cum se calculează + upgrade plătit)"
        },
        {
          "id": "INFO_PAGE-048",
          "text": "Acces la “facilitatori” (fee)"
        },
        {
          "id": "INFO_PAGE-049",
          "text": "Tokeni (ce sunt, cum se obțin, cum se cheltuie)"
        },
        {
          "id": "INFO_PAGE-050",
          "text": "Programare întâlnire integrată (calendar)"
        },
        {
          "id": "INFO_PAGE-051",
          "text": "Schimb valutar (conversie + reguli de afișare)"
        },
        {
          "id": "INFO_PAGE-052",
          "text": "Help & reguli (safety, moderare, acorduri)"
        },
        {
          "id": "INFO_PAGE-053",
          "text": "Confirmare schimb + “smart receipt” PDF (fee mic)"
        },
        {
          "id": "INFO_PAGE-054",
          "text": "Monetizare (matrice completă pe tipuri de schimb)"
        },
        {
          "id": "INFO_PAGE-055",
          "text": "Asigurare micro pentru întâlnire (partener)"
        },
        {
          "id": "INFO_PAGE-056",
          "text": "Legal & Contact (T&C, GDPR, Cookies, suport)"
        },
        {
          "id": "INFO_PAGE-057",
          "text": "Dacă user NU e logat: arată CTA clar: „Autentificare / Creează cont” + buton „→ Autentifică-te” (cum e deja desenat în schemă). Secțiunile 4–7 devin “preview” cu lock + explicație."
        },
        {
          "id": "INFO_PAGE-058",
          "text": "Verificare identitate (KYC opțional)"
        },
        {
          "id": "INFO_PAGE-059",
          "text": "“No-show protection” (sistem de depozit tokeni)"
        },
        {
          "id": "INFO_PAGE-060",
          "text": "3) Despre Swaply (About)"
        },
        {
          "id": "INFO_PAGE-061",
          "text": "Publicare în “Top swaps of week” (promo)"
        },
        {
          "id": "INFO_PAGE-062",
          "text": "Misiune: schimburi între oameni, cu încredere, claritate, reputație."
        },
        {
          "id": "INFO_PAGE-063",
          "text": "Comision mic pentru “premium matching queue”"
        },
        {
          "id": "INFO_PAGE-064",
          "text": "Ce NU e Swaply: nu e marketplace clasic (nu obligă la bani), nu garantează evaluări perfecte, nu e serviciu de curierat (doar integrează opțiuni)."
        },
        {
          "id": "INFO_PAGE-065",
          "text": "11.B Schimb local (cu logistică mică / curier local) — 20"
        },
        {
          "id": "INFO_PAGE-066",
          "text": "Principii: transparență, safety, privacy-first, anti-scam."
        },
        {
          "id": "INFO_PAGE-067",
          "text": "Integrare curieri locali (affiliate)"
        },
        {
          "id": "INFO_PAGE-068",
          "text": "“Last updated” (data ultimei revizii a regulilor)."
        },
        {
          "id": "INFO_PAGE-069",
          "text": "4) Cum funcționează schimburile (modalități + clarificări)"
        },
        {
          "id": "INFO_PAGE-070",
          "text": "Etichete de livrare generate în app (fee)"
        },
        {
          "id": "INFO_PAGE-071",
          "text": "4.1 Modalități de schimb (listă “de manual”)"
        },
        {
          "id": "INFO_PAGE-072",
          "text": "Pickup scheduling (fee)"
        },
        {
          "id": "INFO_PAGE-073",
          "text": "Direct (față în față)"
        },
        {
          "id": "INFO_PAGE-074",
          "text": "Ambalare recomandată + “kit” (partener)"
        },
        {
          "id": "INFO_PAGE-075",
          "text": "Local (același oraș / județ)"
        },
        {
          "id": "INFO_PAGE-076",
          "text": "Național (cu livrare)"
        },
        {
          "id": "INFO_PAGE-077",
          "text": "Insurance local (partener)"
        },
        {
          "id": "INFO_PAGE-078",
          "text": "Internațional (cu livrare + vamă)"
        },
        {
          "id": "INFO_PAGE-079",
          "text": "Tracking în app (premium)"
        },
        {
          "id": "INFO_PAGE-080",
          "text": "Vacanță / “hand-off” (întâlnire planificată în altă locație)"
        },
        {
          "id": "INFO_PAGE-081",
          "text": "Casă/locuință (schimburi mari / pe termen)"
        },
        {
          "id": "INFO_PAGE-082",
          "text": "Puncte de predare (lockers) — comision"
        },
        {
          "id": "INFO_PAGE-083",
          "text": "Servicii (timp/skill contra obiect/serviciu)"
        },
        {
          "id": "INFO_PAGE-084",
          "text": "- Despre Swaply"
        },
        {
          "id": "INFO_PAGE-085",
          "text": "“Same-day swap” boost (tokeni)"
        },
        {
          "id": "INFO_PAGE-086",
          "text": "4.2 Harta (obligatoriu, privacy-first)"
        },
        {
          "id": "INFO_PAGE-087",
          "text": "3 niveluri de locație:"
        },
        {
          "id": "INFO_PAGE-088",
          "text": "Verificare dimensiuni/greutate AI (premium)"
        },
        {
          "id": "INFO_PAGE-089",
          "text": "Aproximativ (pre-semnare): oraș + cerc/radius (fără adresă)"
        },
        {
          "id": "INFO_PAGE-090",
          "text": "Calcul cost livrare automat (premium)"
        },
        {
          "id": "INFO_PAGE-091",
          "text": "Confirmat (post-semnare + consimțământ): pin exact pentru întâlnire/adresă"
        },
        {
          "id": "INFO_PAGE-092",
          "text": "Traseu (opțional): “pe drum spre…” pentru vacanțe / livrări (linie/zonă, nu tracking live default)"
        },
        {
          "id": "INFO_PAGE-093",
          "text": "“Split cost” tool (premium)"
        },
        {
          "id": "INFO_PAGE-094",
          "text": "Filtre hartă: “lângă mine / lângă partener / în locul întâlnirii / pe traseu”."
        },
        {
          "id": "INFO_PAGE-095",
          "text": "Service de fotografiere (partener)"
        },
        {
          "id": "INFO_PAGE-096",
          "text": "5) Statistici globale (agregate, fără date personale)"
        },
        {
          "id": "INFO_PAGE-097",
          "text": "- Reguli de utilizare"
        },
        {
          "id": "INFO_PAGE-098",
          "text": "Scop: să arate “cât de viu e ecosistemul”."
        },
        {
          "id": "INFO_PAGE-099",
          "text": "Evaluare stare obiect (AI) (tokeni)"
        },
        {
          "id": "INFO_PAGE-100",
          "text": "Afișează:"
        },
        {
          "id": "INFO_PAGE-101",
          "text": "Protecție dispute (fee)"
        },
        {
          "id": "INFO_PAGE-102",
          "text": "Nr. total schimburi finalizate (overall + ultimele 30 zile)"
        },
        {
          "id": "INFO_PAGE-103",
          "text": "Nr. total obiecte listate / dorite"
        },
        {
          "id": "INFO_PAGE-104",
          "text": "Escrow light pentru livrare (fee)"
        },
        {
          "id": "INFO_PAGE-105",
          "text": "Nr. categorii + top categorii"
        },
        {
          "id": "INFO_PAGE-106",
          "text": "“Local trade guarantee” (abonament)"
        },
        {
          "id": "INFO_PAGE-107",
          "text": "Nr. țări + top țări / orașe"
        },
        {
          "id": "INFO_PAGE-108",
          "text": "Distribuție ranguri (ex: Bronze/Silver/Gold/Platinum sau alt sistem)"
        },
        {
          "id": "INFO_PAGE-109",
          "text": "Promo “hot deals local” (promo fee)"
        },
        {
          "id": "INFO_PAGE-110",
          "text": "- Informații legale și de contact"
        },
        {
          "id": "INFO_PAGE-111",
          "text": "Distribuție modalități de schimb (direct/local/internațional/vacanță/casă/servicii)"
        },
        {
          "id": "INFO_PAGE-112",
          "text": "“Priority support” (abonament)"
        },
        {
          "id": "INFO_PAGE-113",
          "text": "Nr. feedback-uri totale + scor mediu global (cu disclaimere)"
        },
        {
          "id": "INFO_PAGE-114",
          "text": "“Bulk swapping” (10 obiecte) (plan)"
        },
        {
          "id": "INFO_PAGE-115",
          "text": "Status sistem: uptime / “incidente recente” (minimal, tip “status page” light)"
        },
        {
          "id": "INFO_PAGE-116",
          "text": "Important: toate aceste statistici sunt agregate și anonimizate. Niciun username nu apare aici."
        },
        {
          "id": "INFO_PAGE-117",
          "text": "Comision pentru facilitatori locali"
        },
        {
          "id": "INFO_PAGE-118",
          "text": "6) Statisticile mele (doar logat)"
        },
        {
          "id": "INFO_PAGE-119",
          "text": "11.C Schimb internațional — 20"
        },
        {
          "id": "INFO_PAGE-120",
          "text": "Afișează dashboard personal:"
        },
        {
          "id": "INFO_PAGE-121",
          "text": "Obiecte expuse (active / arhivate / șterse)"
        },
        {
          "id": "INFO_PAGE-122",
          "text": "Calcul vamă/taxe orientativ (premium)"
        },
        {
          "id": "INFO_PAGE-123",
          "text": "Obiecte dorite (wishlist)"
        },
        {
          "id": "INFO_PAGE-124",
          "text": "Integrare shipping internațional (affiliate)"
        },
        {
          "id": "INFO_PAGE-125",
          "text": "Like-uri primite / like-uri oferite"
        },
        {
          "id": "INFO_PAGE-126",
          "text": "Sesiuni de chat: inițiate / primite / active / închise"
        },
        {
          "id": "INFO_PAGE-127",
          "text": "Documente vamale generate (fee)"
        },
        {
          "id": "INFO_PAGE-128",
          "text": "Schimburi finalizate (total + pe tip: direct/local/internațional/vacanță/casă/servicii)"
        },
        {
          "id": "INFO_PAGE-129",
          "text": "Insurance internațional (partener)"
        },
        {
          "id": "INFO_PAGE-130",
          "text": "Metode folosite (grafic mic)"
        },
        {
          "id": "INFO_PAGE-131",
          "text": "Feedback-uri oferite / primite + rata de răspuns la feedback"
        },
        {
          "id": "INFO_PAGE-132",
          "text": "Ambalare certificată (partener)"
        },
        {
          "id": "INFO_PAGE-133",
          "text": "Dispute / rapoarte (dacă există) + status"
        },
        {
          "id": "INFO_PAGE-134",
          "text": "Escrow complet (fee %)"
        },
        {
          "id": "INFO_PAGE-135",
          "text": "“Poveste”: câte schimburi au fost acceptate pentru “story” (doar cu acord explicit)"
        },
        {
          "id": "INFO_PAGE-136",
          "text": "7) Rang & reputație (clasificare + “plata rangului”)"
        },
        {
          "id": "INFO_PAGE-137",
          "text": "Verificare identitate obligatorie pentru anumite praguri"
        },
        {
          "id": "INFO_PAGE-138",
          "text": "7.1 Ce este rangul"
        },
        {
          "id": "INFO_PAGE-139",
          "text": "Verificare fraudă + scoring (premium)"
        },
        {
          "id": "INFO_PAGE-140",
          "text": "Rangul este o combinație de:"
        },
        {
          "id": "INFO_PAGE-141",
          "text": "vechime cont + verificări (email/telefon/ID dacă există ca opțiune),"
        },
        {
          "id": "INFO_PAGE-142",
          "text": "Traducere profesională (partener)"
        },
        {
          "id": "INFO_PAGE-143",
          "text": "comportament (rate de răspuns, abandon chat, no-show),"
        },
        {
          "id": "INFO_PAGE-144",
          "text": "“Time-zone scheduling” (premium)"
        },
        {
          "id": "INFO_PAGE-145",
          "text": "12) AI Safety & Ops (OBLIGATORIU PENTRU IMPLEMENTARE)"
        },
        {
          "id": "INFO_PAGE-146",
          "text": "schimburi finalizate,"
        },
        {
          "id": "INFO_PAGE-147",
          "text": "12.1 Chei & apeluri către AI (security)"
        },
        {
          "id": "INFO_PAGE-148",
          "text": "“International priority matching” (tokeni)"
        },
        {
          "id": "INFO_PAGE-149",
          "text": "feedback primit (calitate + consistență),"
        },
        {
          "id": "INFO_PAGE-150",
          "text": "respectarea regulilor (moderare limbaj, raportări validate),"
        },
        {
          "id": "INFO_PAGE-151",
          "text": "Toate apelurile către Hugging Face / orice model extern se fac DOAR server-side (API route / server actions)."
        },
        {
          "id": "INFO_PAGE-152",
          "text": "Tracking avansat multi-curier (premium)"
        },
        {
          "id": "INFO_PAGE-153",
          "text": "“tranzacții sigure” (ex: confirmări complete, locație oferită doar după acord, etc)."
        },
        {
          "id": "INFO_PAGE-154",
          "text": "Nicio cheie / token nu ajunge în client (nici în bundle, nici în request-uri directe)."
        },
        {
          "id": "INFO_PAGE-155",
          "text": "“Return handling” (partener)"
        },
        {
          "id": "INFO_PAGE-156",
          "text": "7.2 Upgrade plătit (atenție: să nu pară “pay-to-win”)"
        },
        {
          "id": "INFO_PAGE-157",
          "text": "Permite “rang plătit” ca beneficii de vizibilitate și confort, NU ca ștergere de istoric:"
        },
        {
          "id": "INFO_PAGE-158",
          "text": "Pentru upload imagini/fișiere: linkuri semnate / permisiuni minime, fără expunere publică by default."
        },
        {
          "id": "INFO_PAGE-159",
          "text": "“Damage claim assistant” (AI premium)"
        },
        {
          "id": "INFO_PAGE-160",
          "text": "badge vizual + prioritate în liste"
        },
        {
          "id": "INFO_PAGE-161",
          "text": "12.2 Moderare imagini înainte de clasificare"
        },
        {
          "id": "INFO_PAGE-162",
          "text": "Conversie valutară + recomandări (premium)"
        },
        {
          "id": "INFO_PAGE-163",
          "text": "filtre avansate"
        },
        {
          "id": "INFO_PAGE-164",
          "text": "Orice imagine uploadată trece printr-un filtru de siguranță (NSFW/violent/illegal policy) înainte să fie trimisă la clasificare."
        },
        {
          "id": "INFO_PAGE-165",
          "text": "suport prioritar"
        },
        {
          "id": "INFO_PAGE-166",
          "text": "Depozite/lockers internaționale (partener)"
        },
        {
          "id": "INFO_PAGE-167",
          "text": "mai multe “boost-uri” / lună"
        },
        {
          "id": "INFO_PAGE-168",
          "text": "Dacă e suspectă: se blochează procesarea + se oferă mesaj clar userului + opțiune de contestare."
        },
        {
          "id": "INFO_PAGE-169",
          "text": "Pachete “global trader” (abonament)"
        },
        {
          "id": "INFO_PAGE-170",
          "text": "limite crescute (anunțuri, poze, chat-uri simultane)"
        },
        {
          "id": "INFO_PAGE-171",
          "text": "rapoarte/analytics personale extinse"
        },
        {
          "id": "INFO_PAGE-172",
          "text": "12.3 Retenție date (GDPR-ready)"
        },
        {
          "id": "INFO_PAGE-173",
          "text": "Comision pentru “verified international” badge"
        },
        {
          "id": "INFO_PAGE-174",
          "text": "Regulă: dacă user primește penalizări (ban/mute/strike), rangul plătit NU îl salvează. Poate doar fi “înghețat”."
        },
        {
          "id": "INFO_PAGE-175",
          "text": "Definim o politică de retenție per tip de date (mesaje chat, fișiere, loguri moderare, rezultate AI, istorice tokeni)."
        },
        {
          "id": "INFO_PAGE-176",
          "text": "Compliance rules by country (premium access)"
        },
        {
          "id": "INFO_PAGE-177",
          "text": "7.3 Ecran în Info: “Cum urci în rang”"
        },
        {
          "id": "INFO_PAGE-178",
          "text": "La cerere “delete account”: se șterg/anonimizează datele personale + se păstrează doar ce e obligatoriu legal (ex: ledger tranzacții) în formă minimă."
        },
        {
          "id": "INFO_PAGE-179",
          "text": "O mini-legendă clară + exemple: “dacă finalizezi 3 schimburi și primești 3 feedback-uri → urci”."
        },
        {
          "id": "INFO_PAGE-180",
          "text": "Protecție dispute extinsă (fee)"
        },
        {
          "id": "INFO_PAGE-181",
          "text": "8) Tokeni (gestionare completă)"
        },
        {
          "id": "INFO_PAGE-182",
          "text": "12.4 Contestare & human review"
        },
        {
          "id": "INFO_PAGE-183",
          "text": "11.D Schimb în vacanță / hand-off — 20"
        },
        {
          "id": "INFO_PAGE-184",
          "text": "8.1 Ce sunt tokenii"
        },
        {
          "id": "INFO_PAGE-185",
          "text": "Tokenii sunt “monedă internă” pentru funcții premium (boost, traduceri AI extra, verificări, etc)."
        },
        {
          "id": "INFO_PAGE-186",
          "text": "Orice block/warn automat are buton “Contestă”."
        },
        {
          "id": "INFO_PAGE-187",
          "text": "Pin/zonă întâlnire avansată pe hartă (premium)"
        },
        {
          "id": "INFO_PAGE-188",
          "text": "8.2 Cum îi obții"
        },
        {
          "id": "INFO_PAGE-189",
          "text": "Există coadă de review (admin/moderator) + log audit (trace_id) redactat de PII."
        },
        {
          "id": "INFO_PAGE-190",
          "text": "“Route-based matching” (premium)"
        },
        {
          "id": "INFO_PAGE-191",
          "text": "cumpărare (pachete)"
        },
        {
          "id": "INFO_PAGE-192",
          "text": "12.5 Model updates, versionare, rollback"
        },
        {
          "id": "INFO_PAGE-193",
          "text": "câștig prin comportament bun (feedback oferit la timp, schimb finalizat, verificări)"
        },
        {
          "id": "INFO_PAGE-194",
          "text": "“Travel window” listing (abonament)"
        },
        {
          "id": "INFO_PAGE-195",
          "text": "bonusuri (campanii)"
        },
        {
          "id": "INFO_PAGE-196",
          "text": "Orice schimbare model = bump de versiune + notă în changelog + posibilitate de rollback."
        },
        {
          "id": "INFO_PAGE-197",
          "text": "Confirmare întâlnire cu reminders (premium)"
        },
        {
          "id": "INFO_PAGE-198",
          "text": "recompense de la facilitatori (dacă există rol)"
        },
        {
          "id": "INFO_PAGE-199",
          "text": "Rezultatele AI salvate păstrează model_version, ca să explicăm diferențe între vechi/nou."
        },
        {
          "id": "INFO_PAGE-200",
          "text": "“Meet halfway” suggestion AI (tokeni)"
        },
        {
          "id": "INFO_PAGE-201",
          "text": "8.3 Cum îi cheltui"
        },
        {
          "id": "INFO_PAGE-202",
          "text": "boost vizibilitate obiect"
        },
        {
          "id": "INFO_PAGE-203",
          "text": "Facilitatori (ghid/local) (fee)"
        },
        {
          "id": "INFO_PAGE-204",
          "text": "deblocare contacte / locație (în condiții controlate)"
        },
        {
          "id": "INFO_PAGE-205",
          "text": "Puncte de predare partenere (hotel/cafenea) (comision)"
        },
        {
          "id": "INFO_PAGE-206",
          "text": "traducere AI în chat (peste limita gratuită)"
        },
        {
          "id": "INFO_PAGE-207",
          "text": "“evaluare AI” / clasificare / sugestii matching extra"
        },
        {
          "id": "INFO_PAGE-208",
          "text": "“Trip swap insurance” (partener)"
        },
        {
          "id": "INFO_PAGE-209",
          "text": "escrow/garanții (dacă se implementează)"
        },
        {
          "id": "INFO_PAGE-210",
          "text": "Verificare seriozitate (depozit tokeni)"
        },
        {
          "id": "INFO_PAGE-211",
          "text": "8.4 Istoric & transparență"
        },
        {
          "id": "INFO_PAGE-212",
          "text": "sold curent"
        },
        {
          "id": "INFO_PAGE-213",
          "text": "Calendar + itinerary share (premium)"
        },
        {
          "id": "INFO_PAGE-214",
          "text": "istoric tranzacții (câștigat / cheltuit / rambursat)"
        },
        {
          "id": "INFO_PAGE-215",
          "text": "Chat traducere nelimitată în călătorie (pachet)"
        },
        {
          "id": "INFO_PAGE-216",
          "text": "reguli de expirare (dacă există)"
        },
        {
          "id": "INFO_PAGE-217",
          "text": "anti-fraudă: limitări, verificări, chargeback policy"
        },
        {
          "id": "INFO_PAGE-218",
          "text": "“Backup plan” (lockers/curier) (fee)"
        },
        {
          "id": "INFO_PAGE-219",
          "text": "9) Schimb valutar (curs + afișare prețuri aproximative)"
        },
        {
          "id": "INFO_PAGE-220",
          "text": "“Group swaps” (familie/grup) (plan)"
        },
        {
          "id": "INFO_PAGE-221",
          "text": "Scop: obiectele pot avea “valoare aproximativă” în monede diferite, ca să negocieze mai ușor."
        },
        {
          "id": "INFO_PAGE-222",
          "text": "Afișează:"
        },
        {
          "id": "INFO_PAGE-223",
          "text": "QR handoff receipt (fee)"
        },
        {
          "id": "INFO_PAGE-224",
          "text": "Autentificare\nCreează cont"
        },
        {
          "id": "INFO_PAGE-225",
          "text": "convertor simplu (moneda de bază = setarea userului)"
        },
        {
          "id": "INFO_PAGE-226",
          "text": "Confirmare locație exactă cu permisiuni temporare (premium)"
        },
        {
          "id": "INFO_PAGE-227",
          "text": "curs “azi” + sursa cursului + “last updated”"
        },
        {
          "id": "INFO_PAGE-228",
          "text": "reguli: valoarea e orientativă, nu e ofertă comercială, Swaply nu garantează prețuri."
        },
        {
          "id": "INFO_PAGE-229",
          "text": "“No-show penalty” automat (token rules)"
        },
        {
          "id": "INFO_PAGE-230",
          "text": "setări: “afișează automat în moneda mea” (toggle)"
        },
        {
          "id": "INFO_PAGE-231",
          "text": "“Travel badge” (abonament)"
        },
        {
          "id": "INFO_PAGE-232",
          "text": "10) Help & reguli (safety + acorduri)"
        },
        {
          "id": "INFO_PAGE-233",
          "text": "10.1 Reguli de utilizare (core)"
        },
        {
          "id": "INFO_PAGE-234",
          "text": "Promo “Vacation swaps” list (promo fee)"
        },
        {
          "id": "INFO_PAGE-235",
          "text": "anti-scam: fără linkuri suspecte, fără cereri de bani în afara mecanismelor acceptate"
        },
        {
          "id": "INFO_PAGE-236",
          "text": "Recomandări locale (partener turism) (affiliate)"
        },
        {
          "id": "INFO_PAGE-237",
          "text": "întâlnire safe: loc public, zi, confirmare, fără presiune"
        },
        {
          "id": "INFO_PAGE-238",
          "text": "Comision pentru pachete “vacation swap”"
        },
        {
          "id": "INFO_PAGE-239",
          "text": "interdicții: hate speech, amenințări, doxxing"
        },
        {
          "id": "INFO_PAGE-240",
          "text": "moderare: limbaj agresiv → avertisment → mute → ban + impact rang"
        },
        {
          "id": "INFO_PAGE-241",
          "text": "11.E Schimb casă/locuință (mare, complex) — 20"
        },
        {
          "id": "INFO_PAGE-242",
          "text": "raportare: “Report user / item / message” + status tichete"
        },
        {
          "id": "INFO_PAGE-243",
          "text": "Verificare identitate avansată (KYC)"
        },
        {
          "id": "INFO_PAGE-244",
          "text": "10.2 Acorduri importante"
        },
        {
          "id": "INFO_PAGE-245",
          "text": "Termeni & Condiții"
        },
        {
          "id": "INFO_PAGE-246",
          "text": "Contract template (premium)"
        },
        {
          "id": "INFO_PAGE-247",
          "text": "Politica de confidențialitate (GDPR)"
        },
        {
          "id": "INFO_PAGE-248",
          "text": "Escrow / garanție (fee %)"
        },
        {
          "id": "INFO_PAGE-249",
          "text": "Cookies (banner + setări)"
        },
        {
          "id": "INFO_PAGE-250",
          "text": "→ Autentifică-te"
        },
        {
          "id": "INFO_PAGE-251",
          "text": "Acord pentru “poveste” (opt-in explicit după schimb): “Accept ca schimbul să fie inclus într-o poveste / testimonial (anonim sau cu nume)”"
        },
        {
          "id": "INFO_PAGE-252",
          "text": "Asigurare (partener)"
        },
        {
          "id": "INFO_PAGE-253",
          "text": "Inventar digital + foto/video (premium)"
        },
        {
          "id": "INFO_PAGE-254",
          "text": "Acord pentru locație exactă (post-confirmare)"
        },
        {
          "id": "INFO_PAGE-255",
          "text": "10.3 FAQ / sfaturi"
        },
        {
          "id": "INFO_PAGE-256",
          "text": "Checklist predare/primire (premium)"
        },
        {
          "id": "INFO_PAGE-257",
          "text": "“Cum fac un schimb corect”"
        },
        {
          "id": "INFO_PAGE-258",
          "text": "“Inspection assistant” (AI premium)"
        },
        {
          "id": "INFO_PAGE-259",
          "text": "“Cum negociez”"
        },
        {
          "id": "INFO_PAGE-260",
          "text": "“Ce fac dacă nu răspunde”"
        },
        {
          "id": "INFO_PAGE-261",
          "text": "Calendar predare/primire (premium)"
        },
        {
          "id": "INFO_PAGE-262",
          "text": "“Ce fac dacă nu apare la întâlnire”"
        },
        {
          "id": "INFO_PAGE-263",
          "text": "Semnătură electronică (fee)"
        },
        {
          "id": "INFO_PAGE-264",
          "text": "“Ce fac dacă produsul nu e cum a fost descris”"
        },
        {
          "id": "INFO_PAGE-265",
          "text": "“Cum funcționează facilitarea”"
        },
        {
          "id": "INFO_PAGE-266",
          "text": "Facilitatori / mediator (fee)"
        },
        {
          "id": "INFO_PAGE-267",
          "text": "Depozit tokeni ca garanție (rules)"
        },
        {
          "id": "INFO_PAGE-268",
          "text": "“Damage dispute package” (fee)"
        },
        {
          "id": "INFO_PAGE-269",
          "text": "Servicii curățenie partenere (affiliate)"
        },
        {
          "id": "INFO_PAGE-270",
          "text": "Lock smart / access window (partener)"
        },
        {
          "id": "INFO_PAGE-271",
          "text": "Verificare documente (partener)"
        },
        {
          "id": "INFO_PAGE-272",
          "text": "Rating special pentru “home swapper” (abonament)"
        },
        {
          "id": "INFO_PAGE-273",
          "text": "Limită de vizualizări + boost (premium)"
        },
        {
          "id": "INFO_PAGE-274",
          "text": "“Neighborhood guide” (premium)"
        },
        {
          "id": "INFO_PAGE-275",
          "text": "Comision pentru listări premium"
        },
        {
          "id": "INFO_PAGE-276",
          "text": "Suport 24/7 (plan premium)"
        },
        {
          "id": "INFO_PAGE-277",
          "text": "11.F Schimb servicii — 20"
        },
        {
          "id": "INFO_PAGE-278",
          "text": "Badge “verified skill” (fee)"
        },
        {
          "id": "INFO_PAGE-279",
          "text": "Portofoliu extins (abonament)"
        },
        {
          "id": "INFO_PAGE-280",
          "text": "Booking/calendar (premium)"
        },
        {
          "id": "INFO_PAGE-281",
          "text": "Contract template servicii (premium)"
        },
        {
          "id": "INFO_PAGE-282",
          "text": "Escrow pe etape (fee %)"
        },
        {
          "id": "INFO_PAGE-283",
          "text": "Asigurare profesională (partener)"
        },
        {
          "id": "INFO_PAGE-284",
          "text": "Mediere dispute (fee)"
        },
        {
          "id": "INFO_PAGE-285",
          "text": "Review verificat (premium)"
        },
        {
          "id": "INFO_PAGE-286",
          "text": "“Service bundles” (plan)"
        },
        {
          "id": "INFO_PAGE-287",
          "text": "Matching AI skill-to-need (tokeni)"
        },
        {
          "id": "INFO_PAGE-288",
          "text": "Traducere chat (pachet)"
        },
        {
          "id": "INFO_PAGE-289",
          "text": "Video-call integrat (premium)"
        },
        {
          "id": "INFO_PAGE-290",
          "text": "“No-show rules” (depozit tokeni)"
        },
        {
          "id": "INFO_PAGE-291",
          "text": "Verificare identitate (KYC)"
        },
        {
          "id": "INFO_PAGE-292",
          "text": "Niveluri de acces (public/privat) (plan)"
        },
        {
          "id": "INFO_PAGE-293",
          "text": "Promo “featured services” (promo fee)"
        },
        {
          "id": "INFO_PAGE-294",
          "text": "Comision pentru plăți procesate (dacă există)"
        },
        {
          "id": "INFO_PAGE-295",
          "text": "“Time tracking” (premium)"
        },
        {
          "id": "INFO_PAGE-296",
          "text": "Certificate uploads (premium)"
        },
        {
          "id": "INFO_PAGE-297",
          "text": "Suport prioritar (abonament)"
        },
        {
          "id": "INFO_PAGE-298",
          "text": "12) Legal & Contact (obligatoriu)"
        },
        {
          "id": "INFO_PAGE-299",
          "text": "Termeni & Condiții"
        },
        {
          "id": "INFO_PAGE-300",
          "text": "GDPR / Privacy Policy (download data + delete account)"
        },
        {
          "id": "INFO_PAGE-301",
          "text": "Cookies: banner + “manage preferences”"
        },
        {
          "id": "INFO_PAGE-302",
          "text": "Contact: suport, feedback, raportare abuz, solicitări legale"
        },
        {
          "id": "INFO_PAGE-303",
          "text": "Notă: Swaply e intermediar de platformă, nu garantează calitatea obiectelor; responsabilitatea finală e la părți (formulat juridic corect în T&C)."
        },
        {
          "id": "INFO_PAGE-304",
          "text": "13) Notă separată (de pus și la Home): Cookies"
        },
        {
          "id": "INFO_PAGE-305",
          "text": "Pe Home trebuie banner cookies + link “Manage cookies” în footer și în Info > Legal. (Crosslink obligatoriu.)"
        },
        {
          "id": "INFO_PAGE-306",
          "text": "Map provider (TBD) — privacy-first + cost control"
        },
        {
          "id": "INFO_PAGE-307",
          "text": "Info Page"
        }
      ]
    }
  ],
  "notes": {
    "meaning": "Verbatim text export from Excalidraw, grouped by detected page rectangles. Each line has a stable ID for implementation/testing traceability. No summarization was applied."
  }
}
```

## Data model & DB contract

### Din DATA_MODEL_RLS_BLUEPRINT.md
# Swaply — Data Model & RLS Blueprint (Contract DB)

## 0) Principiu
Baza de date nu e un “detaliu”: e contractul care previne haosul.
Orice dev trebuie să pornească de la tabelele canonice existente + RLS activ + grants minime.

## 1) Tabele canonice (schema public)
- categories
- items
- messages
- notifications
- profiles
- swap_intents
- swaps

Regulă: Nu se adaugă tabele “fake_*”. Nu se dublează structura în tabele paralele.

## 2) RLS (Row Level Security)
- RLS trebuie să fie ON pe toate tabelele de mai sus.
- Politicile trebuie să fie explicite, de preferat `TO authenticated` (defense-in-depth).
- Niciun policy “USING true” care expune date mai mult decât trebuie.

## 3) Grants (least privilege)
- `anon` trebuie să aibă doar ce e strict necesar pentru browse public (ex: SELECT pe categories, SELECT pe items pentru feed public).
- `authenticated` are CRUD doar acolo unde RLS îl limitează corect.
- `public` role: ideal fără privilegii directe pe tabelele aplicației.

## 4) Reguli specifice (hard rules)
### items
- Coloana `is_demo` există (demo data controlată).
- Public vede doar `is_active=true` (feed public).
- Owner vede propriile items inclusiv inactive.
- Insert/Update: owner_id = auth.uid() și `is_demo=false` pentru useri normali.
- Demo items (`is_demo=true`) se creează doar cu rol administrativ/service (nu din client).

### messages
- Insert: `sender_id = auth.uid()` obligatoriu.
- Dacă există `swap_id`, userul trebuie să fie participant la swap.
- Update/Delete: recomandat “no” (immutabil). Dacă există, doar sender-ul.

### notifications
- User poate SELECT + UPDATE (mark read).
- User NU creează notificări din client (no INSERT); server-side only.

### profiles
- Acces public (anon/public) nu trebuie să existe.
- `authenticated` poate lucra cu propriul profil (RLS decide).
- Evită să ții câmpuri sensibile în profiles dacă nu sunt absolut necesare.

## 5) Migrații (regula de aur)
- Orice schimbare de schema/policies/grants se face prin migrare versionată în repo.
- Nu se “repară” manual doar în dashboard fără commit.

## 6) Audit SQL (minimal, înainte de PR)
- Tables + RLS: pg_class.relrowsecurity
- Policies: pg_policies
- Grants: information_schema.role_table_grants
- Functions security definer: pg_proc.prosecdef

## 7) Interdicții
- Nu se expun secrete din DB (vault) prin funcții SECURITY DEFINER fără review.
- Nu se dau grants largi către anon/public “că merge mai repede”.


### Din DB_BASELINE.md
# Swaply — DB Baseline (Contract tehnic)

Data: 2025-12-25  
Sursă: Supabase audit snapshot (tables + RLS)

## 1) Tabele canonice în schema `public` (RLS = ON)
Aceste tabele sunt “source of truth” pentru aplicație. Nu se creează “fake_*” și nu se dublează structura în alte tabele fără motiv.

- public.categories — RLS: ON
- public.items — RLS: ON
- public.messages — RLS: ON
- public.notifications — RLS: ON
- public.profiles — RLS: ON
- public.swap_intents — RLS: ON
- public.swaps — RLS: ON

## 2) Regula de aur pentru orice developer (Max/Devin/Oricine)
- Orice schimbare de DB se face DOAR prin **migrare** (SQL migration) versionată în repo.
- Nu se modifică schema direct “din dashboard” fără ca schimbarea să fie adăugată ca migrare în repo.
- Orice PR care atinge DB trebuie să includă:
  1) migrarea,
  2) update la acest baseline (dacă se schimbă),
  3) verificare RLS + grants + policies.

## 3) Audit minim obligatoriu înainte de PR (checklist)
- RLS enabled pe tabelele afectate
- Grants: anon/public minim (principle of least privilege)
- Policies: TO authenticated unde e cazul; fără `USING true` care scapă date
- Nicio funcție SECURITY DEFINER nouă fără review

## 4) Fișiere asociate
- /docs/db/audit/2025-12-25-rls-tables.csv  (dovada snapshot-ului)


## RLS/Policies/Grants (explicite)

- RLS ON pentru toate tabelele canonice (vezi secțiunea Data model & DB contract pentru lista completă).
- Politici și grants conforme cu DATA_MODEL_RLS_BLUEPRINT.md și DB_BASELINE.md (incluse integral mai sus). Nu există alte detalii în repo; orice altă policy/grant necesită definire nouă.

## API contract

- NEDEFINIT ÎN DOCS — nu există fișiere în repo care să definească rute API/server endpoints, payloads sau semnături. Întrebări de clarificat: "Care sunt rutele API server-side și payload-urile exacte pentru fiecare feature descris în Programmatic Spec?" și "Există contracte pentru server actions sau webhooks?".

## AI contract (apeluri, input/output, moderare, audit/log)

- Reguli generale, din ARCHITECTURE_BLUEPRINT.md secțiunea 7 și din Programmatic Spec (vezi IDs relevante pentru AI, moderare, fallback, versionare, log, input/output). Textul complet este inclus integral în secțiunea UI Pages & Routes — Programmatic Spec (verbatim) și în secțiunea Scope & Principii de mai sus.
- Nu există alte fișiere dedicate; dacă sunt necesare clarificări suplimentare (ex: modele, payload), marchează ca NEDEFINIT ÎN DOCS.

## Media/Cloudinary

- Conform ARCHITECTURE_BLUEPRINT.md (Cloudinary ca serviciu media, chei doar server-side). Nu există alte preset-uri/transformări în repo. Dacă sunt necesare preset-uri sau politici de upload, acestea sunt NEDEFINIT ÎN DOCS.

## Maps/Location

- Regulile complete și fallback-urile sunt incluse în Programmatic Spec (IDs pentru hartă, vizibilitate, niveluri locație, privacy-first). Map provider este TBD conform ARCHITECTURE_BLUEPRINT.md. Nu există configurări suplimentare în repo.

## Notifications

- Detalii de afișare și tipuri sunt în Programmatic Spec (IDs pentru notificări, pagini, setări). Din DATA_MODEL_RLS_BLUEPRINT.md: tabele notifications cu RLS, user poate SELECT + UPDATE (mark read), fără INSERT din client.

## Security & Abuse

- Principii anti-abuz, moderare, rate-limit, RLS/grants sunt acoperite în ARCHITECTURE_BLUEPRINT.md, DATA_MODEL_RLS_BLUEPRINT.md, ACCEPTANCE_MATRIX.md și Programmatic Spec (IDs pentru moderare, raportare, AI safety). Toate textele sunt incluse integral în secțiunile dedicate.

## i18n / traduceri / fallback

- Instrucțiunile privind limbile și fallback-urile sunt prezente în Programmatic Spec (IDs pentru language selector, traduceri chat, Info page etc.). Nu există fișiere suplimentare.

## Acceptance Matrix & criterii de test

### Din ACCEPTANCE_MATRIX.md
# Swaply — Acceptance Matrix (Done = verificabil)

## 0) Scop
Nu acceptăm “aproape făcut”.
Acceptăm doar ce poate fi verificat, bifat și demonstrat.

## 1) Sursa de acceptanță
- Programmatic spec export (verbatim, cu ID-uri): fiecare linie = cerință.
- Excalidraw: layout + navigație + texte.

Regulă: Nicio cerință nu se “omite” pe motiv că e mică.

## 2) Metodă de lucru (pentru Max/Devin)
Pentru fiecare PR:
- listează ID-urile implementate (ex: INFO_PAGE-001 … INFO_PAGE-0XX)
- atașează screenshot/clip scurt pentru UI changes
- confirmă gating/empty states
- confirmă RLS/grants dacă s-a atins DB
- confirmă fallback (AI down / no data / logged out)

## 3) Checklist global (trebuie să fie adevărat peste tot)
- Bottom nav persistent (Home/Objects/Match/Chat/Change/Info)
- Language selector + context menu
- Info accesibil de oriunde
- Niciun “dead button”
- Fără crash la lipsă date / AI indisponibil
- Nicio cheie în client
- Respectă DB Baseline (RLS ON + grants minime)

## 4) Checklist pe pagini (minim)
### Home
- CTA login/explore + cookie banner + link manage cookies

### Login
- email login + redirect corect (return-to)

### Profile
- setări AI + locație aproximativă + preferințe + empty states

### Objects
- list + filtre + create/edit/delete + empty state

### Object subpage
- detalii + acțiuni + metadata AI ca sugestii (nu suprascrie user_final)

### Matching
- recomandări + “De ce?” + manual mode

### Chat
- traducere (dacă e on) + moderare + atașamente scanate + CTA spre Swaply

### Swaply
- confirmare + logistică + hartă (niveluri) + notificări + fereastră feedback

### Info
- stats globale + stats user + rang + tokeni + curs + help/legal + monetizare + AI contract

## 5) “Stop the line”
Orice PR se oprește dacă:
- introduce grants largi la anon/public
- scoate RLS de pe un tabel canonic
- bagă “fake_*” sau duplicate de date
- expune chei / tokenuri


## Gaps & Questions (explicit)

- docs/design/ (Excalidraw UX/UI flows) — menționat în docs/README.md ca sursă canonică, dar folderul lipsește din repo. NEDEFINIT ÎN DOCS: furnizați fișierele Excalidraw sau textualele corespunzătoare.
- API contract — NEDEFINIT ÎN DOCS: specificați rutele/endpoint-urile, payload-urile, metodele și codurile de eroare.
- Preset/transformări Cloudinary — NEDEFINIT ÎN DOCS: descrieți preset-urile, limitele, tipurile de fișiere și pipeline-ul de moderare media dacă există.
- Map provider/config — NEDEFINIT ÎN DOCS: furnizați provider-ul, cheile, tarifele și parametrii tehnici dacă sunt stabilite.
- Orice altă entitate/feature neenumerată în fișierele de mai sus trebuie clarificată explicit într-un document nou.
