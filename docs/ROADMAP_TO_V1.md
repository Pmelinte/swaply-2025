# Swaply — Roadmap canonic până la v1.0

**Document ID:** `SWAPLY-ROADMAP-TO-V1`  
**Schema version:** `1.0.2`  
**Last updated:** 2026-07-16  
**Status:** canonical  
**Repository:** `Pmelinte/swaply-2025`  
**Production:** `https://www.swaply.world`

> **Regula terminală:** Train E se închide cu **Swaply v1.0 General Availability**. Nu există Train F. După v1.0 se folosesc versiuni semantice `v1.1`, `v1.2` etc.

## 1. Rolul documentului

Acest fișier este harta finită și executabilă până la Swaply v1.0. Nu înlocuiește memoria completă de produs, ci transformă viziunea în Trains, deliverables, gates și milestone-uri verificabile.

Ordinea surselor de adevăr:

1. codul curent, migrațiile, testele și dovezile din Production;
2. `docs/SWAPLY_CURRENT_HANDOFF.md`;
3. acest roadmap;
4. `docs/SWAPLY_PRODUCT_MEMORY.md`;
5. documente și conversații mai vechi, numai ca istoric.

Când două surse se contrazic, sursa mai sus în listă are prioritate. O afirmație din chat nu poate suprascrie repository-ul sau dovezile de runtime.

## 2. Vocabular obligatoriu

| Status | Semnificație |
|---|---|
| `idea` | Concept strategic, fără contract tehnic obligatoriu. |
| `foundation` | Tipuri, reguli sau teste pregătitoare; nu dovedește funcționalitate live. |
| `implemented` | Codul există, dar validarea completă poate lipsi. |
| `verified` | Funcția este demonstrată prin autorizare, persistență și testele aplicabile. |
| `closed` | Train sau deliverable închis formal prin dovezile aplicabile. |
| `post_v1` | Idee validă care nu blochează lansarea v1.0. |

## 3. Reguli permanente

- Swaply este global-first, nu RO/EN-first.
- Domeniile sunt Objects, Properties, Services și Events.
- Navigația globală rămâne Home, Explore, Matching, Messages și Exchange.
- Drawer-ul contextual nu dublează navigația globală.
- Blog și Stories rămân sisteme separate.
- Swapleni și trust rank rămân sisteme separate.
- AI recomandă și explică; omul decide.
- Orice flux AI are fallback non-AI.
- Profilurile private, mesajele, locația exactă, consimțământul Stories și ledger-ele sunt protejate.
- Orice modificare DB este versionată prin migrare și verificată în Production.
- Nu există merge fără comanda explicită a lui Petru: `Merge #...`.
- Fiecare Batch este mic, reversibil și demonstrat prin evidence real.
- Un defect ulterior nu redeschide automat un Train închis; este tratat ca regresie sau datorie controlată.

## 4. Harta finită A–E

| Train | Scop | Status | Ieșire |
|---|---|---|---|
| A | Public shell și navigație | `closed` | Cadrul public stabil |
| B | Conținut public, SEO, legal și trust | `closed` | Suprafața publică auditabilă |
| C | Motor real 1-la-1 pentru Objects | `active` | Closed Beta Ready |
| D | Produs complet pe toate cele patru domenii | `planned` | Public Beta Ready |
| E | AI, schimburi avansate, comercializare și lansare | `planned` | Swaply v1.0 GA |

## 5. Train A — Public shell și navigație

**Status:** `closed`  
**Closure batch:** 40

Exit criteria demonstrate:

- closure report existent;
- public shell smoke verde;
- Production verificată.

Nu se redeschide pentru funcții noi. Orice defect ulterior este regresie.

## 6. Train B — Conținut public, SEO, legal și trust

**Status:** `closed`  
**Closure batch:** 47

Exit criteria demonstrate:

- closure report existent;
- contract SEO testabil;
- Production verificată.

Revizia juridică calificată, revizia nativă a limbilor și mentenanța SEO sunt activități operaționale sau datorii de închidere v1, nu motive de redeschidere.

## 7. Train C — Motorul real 1-la-1 pentru Objects

**Status:** `active`  
**Validated Production checkpoint:** `44d20dbac30d2ce481d99a8510abb218afe39811`  
**Latest closed deliverable:** C3 / Batch 62.3  
**Current deliverable:** C4 / Batch 63.4 integration closure  
**Next deliverable:** C5 / final Train C closure audit

### Scop

Doi utilizatori reali pot parcurge în siguranță:

`Profil → Obiect → Wanted/Favorite → Express Interest → Match → Chat → Acord bilateral → Create Exchange → Logistică → Primire → Finalizare bilaterală → Feedback`, cu ramuri controlate pentru anulare, dispută, report și block.

### Deliverables fixe

- **C1 — `closed`:** închiderea Batch 60 și reconcilierea documentației;
- **C2 — `closed`:** un singur lifecycle canonic, server-side, pentru Exchange;
- **C3 — `closed`:** feedback, notificări, reputație și hardening pentru ledger;
- **C4 — `authenticated pass / closure PR pending`:** anulare, dispute, report și block;
- **C5 — `planned`:** closure audit Train C.

### C1 — dovezi de închidere

Batch 60.1–60.2 a livrat explicit Exchange handoff și hardening contra migration drift. Validarea autentificată Production a demonstrat:

- zero Exchange înainte de click-ul explicit;
- exact un Exchange după click;
- același Exchange ID pentru ambii participanți;
- retry idempotent fără duplicate;
- snapshot înghețat la revizia bilateral confirmată;
- legături consistente Match–conversation–Exchange;
- zero efecte asupra itemelor, tokenurilor, reputației și notificărilor;
- cleanup prin ID-uri imutabile;
- zero orphan/broken links în starea finală inspectată.

Raport: `docs/batch-60-4-validation-closure.md`.

### C2 — dovezi de închidere

C2 a stabilit un singur contract server-side pentru stările și tranzițiile Exchange:

- o singură autoritate de tranziție;
- expected-state CAS și stale-state denial;
- participant-only authorization și outsider denial;
- identitate structurală imutabilă;
- finalizare bilaterală;
- exact-once structural effects;
- item locking și release controlate;
- persistență și cleanup prin ID-uri imutabile.

Rapoarte principale:

- `docs/batch-61-2-single-transition-authority.md`;
- `docs/batch-61-4-authenticated-completion-validation.md`.

### C3 — dovezi de închidere

C3 a livrat:

- o singură autoritate Review, participant-only;
- Review imutabil, idempotent și cu răspuns controlat de persoana evaluată;
- `+30` Swapleni per participant numai după finalizarea canonică;
- notificări deduplicate;
- counters și trust actualizate exact-once;
- Realtime pentru notificări;
- audit autentificat cu doi utilizatori și cleanup complet.

Rapoarte principale:

- `docs/batch-62-1-canonical-review-authority.md`;
- `docs/batch-62-2-post-completion-effects.md`;
- `docs/batch-62-3-authenticated-c3-closure.md`.

### C4 — dovezi și gate de închidere

Batch 63.1–63.3 au livrat autorități canonice pentru:

- cancellation participant-only, atomic și exactly-once;
- dispute opening și evidence participant-only;
- dispute resolution admin/moderator-only;
- report submission autentificat și fără sancțiune înainte de moderare;
- report resolution atomic;
- block/unblock privat, idempotent și bilateral ca barieră de contact;
- păstrarea istoricului și a drepturilor de safety pentru lifecycle existent.

Batch 63.4 a demonstrat în Production:

- `cancelled` și `disputed` sunt ramuri terminale mutual exclusive;
- încercarea celeilalte ramuri după terminalizare este respinsă cu `40001`;
- block oprește contactul nou, dar nu oprește cancel, dispute, evidence sau moderator resolution pe lifecycle existent;
- raw report nu schimbă Swap, trust, counters, suspendarea, block-ul, Swapleni sau Reviews;
- o cursă reală same-second `cancel` versus `dispute` produce un singur câștigător și zero efecte mixte;
- toate fixture-urile, profilele, itemele, trigger-ele și joburile cron sunt restaurate exact;
- Production și Vercel rămân sănătoase.

Rapoarte principale:

- `docs/batch-63-1-cancel-authority.md`;
- `docs/batch-63-2-dispute-authority.md`;
- `docs/batch-63-3-report-block-authority.md`;
- `docs/batch-63-4-c4-integration-closure.md`.

C4 devine `closed` numai după CI, Preview și merge-ul explicit al Batch 63.4.

### Gate de ieșire Train C

Train C se închide numai când sunt demonstrate cumulativ:

- C1–C4 închise;
- lifecycle unic și server-side;
- finalizare bilaterală;
- feedback participant-only;
- outsider denied;
- persistență după reload;
- Realtime între participanți;
- cleanup prin ID-uri imutabile;
- paritate repo–Supabase–Production pentru migrații;
- closure report Train C.

**Milestone:** `CLOSED_BETA_READY_OBJECTS_ONE_TO_ONE`.

## 8. Train D — Produs complet pe cele patru domenii

**Entry gate:** Train C este `closed`.

### Deliverables fixe

- **D1:** profil global-first, limbi, fallback, media și locație aproximativă;
- **D2:** paritate funcțională pentru Properties, Services și Events;
- **D3:** schimburi cross-domain și human-centered swapping;
- **D4:** Stories, interacțiuni Blog, trust, token/rank și admin;
- **D5:** closure audit și Public Beta.

### Gate de ieșire

- fiecare domeniu are flux complet E2E;
- există cel puțin un flux cross-domain;
- Stories cer consimțământ și moderare;
- recompensele sunt server-controlled și idempotente;
- rangul nu poate fi cumpărat;
- report/block/dispute funcționează;
- RLS este verificat în Production;
- desktop, mobil și mai multe locale sunt verificate.

**Milestone:** `PUBLIC_BETA_READY_COMPLETE_PRODUCT`.

## 9. Train E — Ultimul Train

**Entry gate:** Train D este `closed`.

### Deliverables fixe

- **E1:** AI Gateway, model registry, evals și observabilitate;
- **E2:** AI pentru vision, traducere, moderare și semantic matching;
- **E3:** schimburi avansate și multi-user;
- **E4:** monetizare și integrări externe;
- **E5:** audit final pentru General Availability.

### Gate de ieșire

- toate apelurile AI sunt server-side și validate prin scheme;
- fiecare flux AI are fallback;
- benchmark pe minimum 10–15 limbi;
- schimburile multi-user cer consimțământul tuturor;
- plățile și webhook-urile sunt verificate;
- migrațiile sunt aliniate;
- backup, restore și rollback sunt testate;
- auditul de securitate, privacy, legal, accesibilitate și performanță este trecut;
- nu există P0/P1 deschise;
- se publică `v1.0.0` și closure report Train E.

**Milestone terminal:** `SWAPLY_V1_GA`.

## 10. Regula de triere a problemelor

Orice observație nouă primește una dintre aceste decizii:

### `FIX_NOW`

Se repară imediat numai dacă este P0/P1, securitate/privacy/Auth/RLS, risc de pierdere sau corupere de date, build/CI blocat, flux canonic blocat sau fundație greșită pentru dezvoltările următoare.

### `DEFER_TO_E5`

Se înregistrează în `docs/V1_DEFERRED_ISSUES.md` dacă este cosmetică, SEO minor, traducere imperfectă, refactorizare, curățenie, optimizare neblocantă sau regresie posibilă încă nedemonstrată.

### `POST_V1`

Merge în `v1.x` dacă extinde scopul și nu este necesară pentru gates A–E.

## 11. Definition of Done global

O funcție este `verified` numai dacă:

1. codul sau migrarea există;
2. autorizarea și RLS sunt corecte;
3. starea persistă după reload;
4. idempotency este demonstrată unde se aplică;
5. testele unitare, lint, typecheck, build, vizuale și E2E aplicabile sunt verzi;
6. cleanup-ul folosește ID-uri imutabile și nu lasă date publice de test;
7. Preview și Production runtime sunt verificate;
8. documentația și Current Handoff sunt actualizate.

## 12. Reguli anti-extindere

1. Există numai Train A–E.
2. Batch = PR mic, nu etapă strategică nouă.
3. Hotfix-ul nu redeschide un Train închis.
4. `foundation` nu înseamnă `feature done`.
5. O cerință nouă intră în Train-ul curent, înlocuiește explicit alt scope sau merge în Post-v1.
6. Ideile noi nu blochează automat v1.0.
7. După Train E se folosesc versiuni `v1.x`, nu litere noi.

## 13. Documente canonice

- `docs/ROADMAP_TO_V1.md`
- `docs/SWAPLY_CURRENT_HANDOFF.md`
- `docs/DOC_STATUS.md`
- `docs/V1_DEFERRED_ISSUES.md`
- `docs/SWAPLY_PRODUCT_MEMORY.md`
- `docs/db/DB_BASELINE.md`

## 14. Următoarea ordine obligatorie

1. Finalizează Batch 63.4 numai după CI, Preview și comanda explicită de merge.
2. După merge, execută C5 ca audit final al întregului Train C.
3. În C5 verifică cumulativ lifecycle, feedback, outsider denial, reload persistence, Realtime, immutable-ID cleanup și migration parity.
4. Închide Train C numai după closure report C5 și merge explicit.
5. Începe Train D numai după Train C `closed`.
6. După Train D, execută Train E inclusiv registrul de datorii și auditul final E5.

## 15. Post-v1

Growth, toate țările și providerii, calendarul de 52 de săptămâni, ideile extinse de monetizare și îmbunătățirile neblocante intră în `v1.x`. Ele nu creaază Train F.
