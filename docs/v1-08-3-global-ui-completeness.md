# V1-08.3 — Global UI completeness, RTL and long-text evidence

## Control header

| Field | Value |
|---|---|
| Roadmap package | `V1-08` |
| Batch ID | `V1-08.3` |
| Status | `PR_OPEN` |
| Application base SHA | `68e85cbb6eb5e4023da177c7bf4c08f7e5d872e7` |
| Working branch | `v1-08-3-global-ui-completeness` |
| Production target | `https://www.swaply.world` |

## Objective

Închide partea deterministă și fără provider a cerințelor global-first pentru suprafețele publice Blog și Stories:

- verificarea contractului celor 43 de cataloage;
- inventarul exact al conținutului Blog sursă și localizat;
- detectarea traducerilor Blog fără articol sursă;
- scanarea stringurilor UI hardcodate pe suprafețele publice incluse;
- protecția conținutului Stories pentru RTL și texte foarte lungi;
- evidence repetabil, executabil în CI.

## Factual boundary

Acest batch nu declară că fiecare articol Blog este tradus integral în toate cele 43 de limbi. Scannerul raportează exact acoperirea existentă pe fiecare director localizat și blochează numai inconsistențele structurale:

- cataloage lipsă sau incompatibile cu contractul englez;
- traduceri Blog orfane;
- stringuri UI hardcodate neclasificate în Blog/Stories;
- lipsa protecțiilor RTL și long-text în Stories.

Conținutul Stories este conținut publicat de utilizatori. El nu este rescris și nu este presupus tradus. Randarea folosește `dir="auto"` și containere rezistente la șiruri lungi, astfel încât limba și direcția originală să fie păstrate.

## Files

### Modified

- `src/app/[locale]/stories/page.tsx`

### Added

- `scripts/check-global-ui-completeness.mjs`
- `src/__tests__/v1-08-3-global-ui-completeness.test.ts`
- `docs/v1-08-3-global-ui-completeness.md`

### Migrations

`NONE`

## Scanner evidence

Scannerul produce JSON cu:

- numărul cataloagelor și al cheilor engleze;
- chei lipsă sau suplimentare pe locale;
- numărul articolelor Blog sursă;
- directoarele localizate și numărul traducerilor;
- traduceri orfane;
- stringuri publice hardcodate neclasificate;
- prezența `dir="auto"`, `overflow-wrap:anywhere`, `min-w-0` și `overflow-hidden`.

## PASS

- exact 43 de cataloage;
- zero chei lipsă față de contractul englez;
- zero inconsistențe structurale ale cataloagelor;
- zero traduceri Blog orfane;
- zero stringuri UI hardcodate neclasificate în suprafețele incluse;
- Stories păstrează direcția automată pentru titlu și corp;
- Stories rezistă la cuvinte, URL-uri și secvențe foarte lungi;
- CI, AI Evaluation și Vercel Preview sunt verzi;
- zero P0/P1 în review.

## FAIL

- un catalog lipsește sau nu respectă contractul;
- un articol localizat nu are articol sursă;
- text public UI este introdus direct fără traducere sau clasificare explicită;
- conținutul Stories poate forța overflow orizontal ori direcție greșită;
- apare migrare, provider, cost sau date Production persistente;
- apare defect P0/P1.

## Non-scope

- traducerea automată a tuturor articolelor Blog;
- traducerea sau rescrierea conținutului Stories;
- activarea unui provider AI;
- benchmarkul multilingual cu cost și latență;
- modificări DB, RLS, RPC sau business logic;
- tag, GitHub Release sau `v1.0.0`.
