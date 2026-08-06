# V1-09.2.1 — Audit automatizat de accesibilitate

## Baseline

- Repository: `Pmelinte/swaply-2025`
- Branch canonic: `main`
- Baseline SHA: `2cccd4b918721d751d3f15b141e369854399926a`
- V1-08: `CLOSED`
- V1-09.1: `MERGED`
- V1-09.2.1: audit automatizat, fără sign-off
- `SWAPLY_V1_GA`: `BLOCKED / NOT AUTHORISED`

## Scope

Acest batch adaugă infrastructura reproductibilă pentru inventarul de accesibilitate guest, desktop și mobil.

Sunt verificate:

- reguli automate WCAG 2 A/AA, 2.1 A/AA și 2.2 AA prin `axe-core`;
- navigare keyboard-only prin eșantionarea secvenței Tab;
- existența unui indicator vizibil pentru primul element focalizat;
- aplicarea preferinței `prefers-reduced-motion: reduce`;
- detectarea triggerelor de dialog/drawer/modal;
- focusul inițial în dialog și închiderea cu Escape, când există un trigger sigur;
- erorile de consolă și erorile fatale de încărcare;
- rute publice principale în profil desktop și profil mobil.

## Rute guest

- `/en/home`
- `/en/explore`
- `/en/objects`
- `/en/properties`
- `/en/services`
- `/en/events`
- `/en/blog`
- `/en/stories`
- `/en/about`
- `/en/contact`
- `/en/login`
- `/en/register`

## Evidence

Workflow-ul `V1-09.2.1 automated accessibility audit` generează:

- `audit-results/v1-09-2-1/accessibility-audit.json`;
- `audit-results/v1-09-2-1/accessibility-audit.md`;
- artifact GitHub Actions păstrat 90 de zile;
- runtime log separat dacă execuția eșuează.

## PASS pentru acest PR

- runnerul pornește și finalizează toate cele 24 de execuții planificate;
- fiecare execuție păstrează rezultatele axe și dovezile keyboard/focus;
- artifactul este publicat;
- CI, testele contractului și Build sunt verzi;
- nu se modifică runtime-ul aplicației, DB, Supabase, RLS sau providerii AI.

## FAIL pentru acest PR

- o rută nu poate fi auditată din cauza unei erori fatale;
- `axe-core` nu este încărcat;
- evidence-ul nu este generat sau nu este publicat;
- secretul ori date Production sunt introduse în audit;
- auditul este prezentat ca sign-off final.

## Boundary

Rezultatele axe, keyboard, focus și dialog reprezintă inventar automatizat. Ele nu înlocuiesc:

- verificarea manuală cu screen reader;
- validarea profesională a contrastului contextual;
- testele authenticated;
- remedierea defectelor;
- replay-ul final desktop și mobil;
- sign-off-ul de accesibilitate din V1-09.2.3.

Acest PR nu modifică UI sau UX. Defectele găsite vor fi prioritizate separat în V1-09.2.2.
