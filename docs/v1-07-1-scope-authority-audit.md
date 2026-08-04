# V1-07.1 — Audit predictiv de scope și autoritate

## Baseline

```text
Application main: 8256b30ca4b5d32e33b576c7eca1990a7f3b9de0
Vercel Production: dpl_C95fcc6EGyou19178NY4NDCcbxvN — READY
Supabase Production: keaejxlwqtjjglijiplh
Migration head: 20260803102015
V1-06: CLOSED
V1-07: ACTIVE
```

## Scope canonic

V1-07 acoperă cinci sisteme distincte:

1. Stories;
2. Blog;
3. feedback post-exchange;
4. trust și rank;
5. Swapleni.

Blog și Stories rămân sisteme separate. Trust rank și Swapleni rămân sisteme separate.

## Inventar verificat

### Stories

Repository și Production conțin:

- `stories`;
- `story_participants`;
- `story_revisions`;
- `story_consents`;
- `story_moderation`;
- `story_publications`;
- RLS pe toate cele șase relații;
- RPC-uri pentru draft, revisionare, consimțământ, moderare și publicare;
- trigger de suprimare după dispute;
- filtrare pentru contact, coordonate și adresă exactă;
- snapshot public imuabil pe revizie.

Goluri confirmate:

- vocabularul TypeScript și vocabularul DB nu sunt identice;
- produsul cere `private / community / public`, dar DB oferă `private / participants / public`;
- nu există încă autoritate pentru vizibilitatea `community`;
- nu există dovadă cumulativă V1-07 pentru participant, outsider, moderator, stale revision, retragere, dispute, re-publicare, concurență și cleanup;
- nu există contract complet de traducere Story;
- nu există legătură demonstrată Story aprobat → reward Swapleni unic.

### Blog

Repository conține:

- pagini publice Blog;
- sursă Supabase;
- conținut MDX;
- componente editoriale și SEO;
- un model TypeScript pentru workflow editorial;
- traducere la cerere cu fallback la original în pagina articolului.

Production conține doar `blog_posts`, cu `published boolean` și RLS de citire publică pentru rândurile publicate.

Goluri confirmate:

- workflow-ul `draft → review → approved → translated → published` nu este persistat în schema Production;
- pagina publică interoghează numai rândurile englezești;
- MDX există în repository, dar nu este conectat ca fallback la indisponibilitatea Supabase;
- nu există relații Production pentru feedback sau sugestii Blog;
- nu există moderare persistată pentru sugestii;
- nu există reward Blog aprobat → Swapleni demonstrat.

### Feedback

Production conține:

- `reviews` cu RLS;
- RPC `submit_swap_review_v1`;
- idempotency key și request hash;
- RPC de răspuns;
- refresh de reputație.

Goluri confirmate:

- replay cumulativ V1-07 lipsește;
- concurența cu două trimiteri simultane nu este încă evidence V1-07;
- efectul exact asupra trustului trebuie reconciliat cu autoritatea canonică unică.

### Trust

Production conține în `profiles`:

- `trust_level`;
- `trust_score`;
- contoare pentru schimburi finalizate, anulate și disputate;
- funcții și triggere de recalculare.

Repository conține și un model TypeScript separat de evaluare a rankului.

Gol confirmat:

- există mai multe căi de calcul și nu este încă demonstrată o singură autoritate deterministă DB → UI;
- rankul nu trebuie derivat din Swapleni și nu poate fi cumpărat.

### Swapleni

Production conține:

- `swapleni_accounts`;
- `swapleni_ledger` append-only;
- idempotency key unic;
- reversări;
- RPC-uri service-only pentru creditare și reversare;
- RLS owner-read;
- trigger de actualizare a contului.

Goluri confirmate:

- reward-urile pentru Story și Blog nu sunt conectate la evenimente aprobate;
- caps și anti-farming trebuie definite pe fiecare sursă;
- replay, concurență, reversare și rollback trebuie demonstrate cumulativ.

## Contradicții documentare

`99_PROJECT_MEMORY/PROJECT_MEMORY.md` din repository-ul canonic păstrează baseline-ul V1-06 anterior (`f729fb4`), în timp ce `CURRENT_VERSION.md`, `SWAPLY_INDEX.md`, aplicația și Production folosesc `8256b30c`. Aceasta este o memorie operațională rămasă în urmă, nu o contradicție de produs.

## Structura finită V1-07

1. `V1-07.1` — scope, IDs și contractul de autoritate;
2. `V1-07.2` — Stories authority și community visibility;
3. `V1-07.3` — Stories moderation, traduceri, publicare și dispute;
4. `V1-07.4` — feedback post-exchange și trust authority;
5. `V1-07.5` — Blog editorial persistence și fallback MDX;
6. `V1-07.6` — Blog feedback/suggestions și moderare;
7. `V1-07.7` — Swapleni source rules, caps și anti-farming;
8. `V1-07.8` — E2E cumulativ, Preview/Production și closure.

Estimare realistă: 8 PR-uri, cu reducere numai dacă auditul fiecărei subetape demonstrează că o fundație existentă este completă.

## Primul batch

Acest batch adaugă:

- IDs executabile pentru toate familiile V1-07;
- contract explicit produs–storage pentru Stories;
- fail-closed pentru `community` până la existența autorității;
- inventar programatic al golurilor confirmate;
- teste care împiedică declararea prematură a capabilităților drept implementate.

## PASS / FAIL

### PASS

- IDs unice pentru Stories, Blog, feedback, trust și Swapleni;
- diferențele produs–DB sunt explicite;
- `community` nu este mapat artificial la `participants`;
- auditul păstrează stări `absent`, `partial`, `unknown` unde dovada lipsește;
- CI, AI Evaluation și Vercel Preview sunt verzi.

### FAIL

- un ID duplicat;
- echivalarea `community = participants` fără decizie canonică;
- marcarea unei fundații drept Production verified fără E2E;
- activarea unui provider, a plăților sau a paid AI;
- migrare Production ori fixture persistentă.
