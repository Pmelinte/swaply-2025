# V1-09 — Calitate transversală

## Baseline

- Repository: `Pmelinte/swaply-2025`
- Branch canonic: `main`
- Baseline SHA: `8fa6cc26b04464ec2f47e7cbcbcc42f4e01f10d5`
- V1-08: `CLOSED`
- V1-09: `ACTIVE` numai după deschiderea acestui PR
- `SWAPLY_V1_GA`: `BLOCKED / NOT AUTHORISED`

## Scop canonic

V1-09 cere sign-off separat pentru:

1. accesibilitate;
2. performanță;
3. privacy;
4. legal.

Existența unui fișier, a unui pattern sau a unui test izolat nu reprezintă sign-off.

## Audit predictiv read-only

### Accesibilitate

Trebuie verificate separat:

- keyboard-only;
- focus management;
- screen-reader labels;
- contrast;
- reduced motion;
- formulare și erori;
- drawer/modal/dialog;
- desktop și mobil.

### Performanță

Trebuie verificate separat:

- LCP, CLS și INP;
- imagini și cache;
- bundle;
- pagini guest și authenticated;
- conexiune slabă;
- dispozitive mai vechi;
- fallback la servicii externe lente.

### Privacy și legal

Trebuie verificate separat:

- date personale, locație și mesaje;
- disclosure pentru providerii AI;
- consimțământ Stories;
- retention;
- export și ștergere;
- Terms, Privacy Policy și cookie/analytics;
- obiecte și tranzacții interzise;
- dispute și raportare.

## Structură propusă în batch-uri

| Batch | Scope | Tip estimat | PR-uri estimate |
|---|---|---|---:|
| V1-09.1 | Inventar automatizat read-only și registru de goluri | tooling/evidence | 1 |
| V1-09.2 | Accesibilitate automată: axe, keyboard, focus, reduced-motion, formulare, dialoguri | tests + remedieri țintite | 2–3 |
| V1-09.3 | Performanță: Web Vitals, Lighthouse/bugete, bundle, imagini, guest/auth | tests + remedieri țintite | 2–3 |
| V1-09.4 | Privacy: data map, retention, export/delete, AI disclosure, cookie/analytics | audit + remedieri | 2–3 |
| V1-09.5 | Legal: termeni, politici, prohibited goods, dispute/reporting și reconciliere publică | audit + conținut/contracte | 1–2 |
| V1-09.6 | Replay cumulativ, excepții aprobate, evidence și closure | verification/docs | 1 |

Estimare realistă totală: **9–13 PR-uri**, în funcție de numărul defectelor reale. Estimarea nu transformă defectele încă necunoscute în scope confirmat.

## Primul batch sigur

V1-09.1 adaugă numai:

- un scanner static read-only;
- un workflow care publică artefactul inventarului;
- acest contract de execuție.

Nu modifică:

- UI sau UX;
- Supabase, migrații, RLS sau date;
- providerii AI;
- plăți, escrow sau integrări comerciale;
- Production runtime;
- taguri sau release-uri.

## Limitări explicite

Scannerul caută indicii în repository. Rezultatul `EVIDENCE_FOUND` înseamnă doar că există material de inspectat. Rezultatul `GAP_OR_NOT_PROVEN` înseamnă că auditul nu a găsit dovezi suficiente prin patternurile definite. Niciun rezultat nu este echivalent cu sign-off profesional juridic, privacy, accesibilitate sau performanță.
