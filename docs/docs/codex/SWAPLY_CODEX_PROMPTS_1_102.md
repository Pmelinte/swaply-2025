# SWAPLY — TOATE PROMPTURILE CODEX PENTRU FUNCȚIONALITĂȚILE 1–102


---

Folosește prompturile strict în ordine. Nu trece la următorul până când promptul curent a produs rezultatul final și PR-ul aferent a fost revizuit/merge-uit explicit. Fiecare prompt este autonom și interzice audituri generale repetate.


---

# PROMPT 1 — ÎNREGISTRARE UTILIZATOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează înregistrarea prin email și parolă, validarea, mesajele de eroare, confirmarea și redirecționarea coerentă.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Înregistrare utilizator”. Finalizează înregistrarea prin email și parolă, validarea, mesajele de eroare, confirmarea și redirecționarea coerentă.


---

# PROMPT 2 — AUTENTIFICARE, LOGOUT ȘI SESIUNE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează login, logout, restaurarea sesiunii, expirarea sesiunii și evitarea buclelor de redirect.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Autentificare, logout și sesiune”. Finalizează login, logout, restaurarea sesiunii, expirarea sesiunii și evitarea buclelor de redirect.


---

# PROMPT 3 — RECUPERARE ȘI SCHIMBARE PAROLĂ

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează cererea de resetare, callback-ul, setarea parolei noi și tratarea linkurilor invalide sau expirate.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Recuperare și schimbare parolă”. Finalizează cererea de resetare, callback-ul, setarea parolei noi și tratarea linkurilor invalide sau expirate.


---

# PROMPT 4 — PROTECȚIA RUTELOR PRIVATE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Aplică protecția coerentă a rutelor private și redirecționarea către login fără a bloca paginile publice.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Protecția rutelor private”. Aplică protecția coerentă a rutelor private și redirecționarea către login fără a bloca paginile publice.


---

# PROMPT 5 — ONBOARDING UTILIZATOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează onboarding-ul reluabil după reload, validarea datelor obligatorii și marcarea sigură a finalizării.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Onboarding utilizator”. Finalizează onboarding-ul reluabil după reload, validarea datelor obligatorii și marcarea sigură a finalizării.


---

# PROMPT 6 — PROFIL PUBLIC ȘI PROFIL PRIVAT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Separă clar datele publice de cele private și asigură că outsiderii nu pot citi câmpuri private.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Profil public și profil privat”. Separă clar datele publice de cele private și asigură că outsiderii nu pot citi câmpuri private.


---

# PROMPT 7 — EDITAREA ȘI PERSISTENȚA PROFILULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează încărcarea, editarea, salvarea, rehidratarea și protecția owner-only a profilului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Editarea și persistența profilului”. Finalizează încărcarea, editarea, salvarea, rehidratarea și protecția owner-only a profilului.


---

# PROMPT 8 — PREFERINȚE LINGVISTICE GLOBALE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează limba principală, secundară și terțiară, fallback-ul și persistența fără bucle de locale.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Preferințe lingvistice globale”. Finalizează limba principală, secundară și terțiară, fallback-ul și persistența fără bucle de locale.


---

# PROMPT 9 — LOCAȚIE APROXIMATIVĂ ȘI CONFIDENȚIALITATE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Separă coordonatele exacte private de locația publică aproximativă și elimină expunerile accidentale.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Locație aproximativă și confidențialitate”. Separă coordonatele exacte private de locația publică aproximativă și elimină expunerile accidentale.


---

# PROMPT 10 — AVATAR ȘI MEDIA DE PROFIL

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează uploadul, validarea, înlocuirea, fallback-ul și afișarea persistentă a avatarului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Avatar și media de profil”. Finalizează uploadul, validarea, înlocuirea, fallback-ul și afișarea persistentă a avatarului.


---

# PROMPT 11 — SETĂRI PERSONALE ȘI DE CONFIDENȚIALITATE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează pagina de setări, persistența preferințelor și accesul exclusiv al proprietarului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Setări personale și de confidențialitate”. Finalizează pagina de setări, persistența preferințelor și accesul exclusiv al proprietarului.


---

# PROMPT 12 — PREFERINȚE DE NOTIFICARE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează preferințele pentru notificări în aplicație și email, cu valori implicite sigure.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Preferințe de notificare”. Finalizează preferințele pentru notificări în aplicație și email, cu valori implicite sigure.


---

# PROMPT 13 — EXPORT ȘI ÎNCHIDERE CONT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Implementează exportul datelor și fluxul sigur de închidere/dezactivare a contului, fără ștergeri accidentale.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Export și închidere cont”. Implementează exportul datelor și fluxul sigur de închidere/dezactivare a contului, fără ștergeri accidentale.


---

# PROMPT 14 — CREAREA UNUI OBIECT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează wizard-ul de creare obiect, validarea, salvarea reală și revenirea corectă după publicare.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Crearea unui obiect”. Finalizează wizard-ul de creare obiect, validarea, salvarea reală și revenirea corectă după publicare.


---

# PROMPT 15 — FOTOGRAFII ȘI MEDIA PENTRU OBIECTE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează uploadul, ordonarea, eliminarea, validarea și fallback-ul imaginilor obiectelor.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Fotografii și media pentru obiecte”. Finalizează uploadul, ordonarea, eliminarea, validarea și fallback-ul imaginilor obiectelor.


---

# PROMPT 16 — ASISTENȚĂ AI LA DESCRIEREA OBIECTULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează clasificarea, titlul și descrierea asistate de AI cu fallback non-AI și fără blocarea publicării.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Asistență AI la descrierea obiectului”. Finalizează clasificarea, titlul și descrierea asistate de AI cu fallback non-AI și fără blocarea publicării.


---

# PROMPT 17 — EDITAREA UNUI OBIECT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează editarea owner-only, validarea, salvarea și rehidratarea după reload.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Editarea unui obiect”. Finalizează editarea owner-only, validarea, salvarea și rehidratarea după reload.


---

# PROMPT 18 — ACTIVARE, DEZACTIVARE ȘI ARHIVARE OBIECT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează lifecycle-ul obiectului fără ștergeri neintenționate și cu impact corect asupra matching-ului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Activare, dezactivare și arhivare obiect”. Finalizează lifecycle-ul obiectului fără ștergeri neintenționate și cu impact corect asupra matching-ului.


---

# PROMPT 19 — PAGINA DETALIATĂ A OBIECTULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează pagina publică, datele proprietarului permise, imaginile, CTA-urile și stările lipsă/eroare.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Pagina detaliată a obiectului”. Finalizează pagina publică, datele proprietarului permise, imaginile, CTA-urile și stările lipsă/eroare.


---

# PROMPT 20 — EXPLORAREA OBIECTELOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează listarea publică a obiectelor active, paginarea sau infinite scroll și stările loading/empty/error.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Explorarea obiectelor”. Finalizează listarea publică a obiectelor active, paginarea sau infinite scroll și stările loading/empty/error.


---

# PROMPT 21 — CĂUTARE ȘI FILTRE PENTRU OBIECTE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează căutarea, categoria, starea, valoarea, locația și sortarea cu URL/state coerent.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Căutare și filtre pentru obiecte”. Finalizează căutarea, categoria, starea, valoarea, locația și sortarea cu URL/state coerent.


---

# PROMPT 22 — WANTED ȘI WISHLIST PENTRU OBIECTE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează creare, editare, ștergere și folosirea cererilor în matching, cu RLS owner-only.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Wanted și wishlist pentru obiecte”. Finalizează creare, editare, ștergere și folosirea cererilor în matching, cu RLS owner-only.


---

# PROMPT 23 — ADMINISTRAREA OBIECTELOR PROPRII

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează pagina My Objects, acțiunile rapide, statusurile și accesul exclusiv al proprietarului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Administrarea obiectelor proprii”. Finalizează pagina My Objects, acțiunile rapide, statusurile și accesul exclusiv al proprietarului.


---

# PROMPT 24 — CREAREA UNEI PROPRIETĂȚI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează wizard-ul Properties, validarea datelor specifice și salvarea reală în modelul canonic.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Crearea unei proprietăți”. Finalizează wizard-ul Properties, validarea datelor specifice și salvarea reală în modelul canonic.


---

# PROMPT 25 — CALENDAR ȘI DISPONIBILITATE PROPRIETĂȚI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează perioadele disponibile, excluderile, fusurile orare și prevenirea suprapunerilor invalide.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Calendar și disponibilitate proprietăți”. Finalizează perioadele disponibile, excluderile, fusurile orare și prevenirea suprapunerilor invalide.


---

# PROMPT 26 — MEDIA ȘI FACILITĂȚI PROPRIETĂȚI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează fotografiile, facilitățile, regulile și datele relevante pentru o ofertă completă.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Media și facilități proprietăți”. Finalizează fotografiile, facilitățile, regulile și datele relevante pentru o ofertă completă.


---

# PROMPT 27 — EDITAREA ȘI ADMINISTRAREA PROPRIETĂȚILOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează editarea, activarea, dezactivarea și administrarea owner-only.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Editarea și administrarea proprietăților”. Finalizează editarea, activarea, dezactivarea și administrarea owner-only.


---

# PROMPT 28 — PAGINA DETALIATĂ A PROPRIETĂȚII

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează afișarea publică, calendarul, facilitățile, locația aproximativă și CTA-urile.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Pagina detaliată a proprietății”. Finalizează afișarea publică, calendarul, facilitățile, locația aproximativă și CTA-urile.


---

# PROMPT 29 — EXPLORAREA PROPRIETĂȚILOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează listarea, căutarea și stările reale pentru proprietăți active.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Explorarea proprietăților”. Finalizează listarea, căutarea și stările reale pentru proprietăți active.


---

# PROMPT 30 — FILTRE ȘI HARTĂ PENTRU PROPRIETĂȚI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează filtrele de locație, perioadă, capacitate, facilități și harta fără coordonate exacte publice.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Filtre și hartă pentru proprietăți”. Finalizează filtrele de locație, perioadă, capacitate, facilități și harta fără coordonate exacte publice.


---

# PROMPT 31 — PROPUNERE DE SCHIMB DE PROPRIETĂȚI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează exprimarea interesului și crearea unui match pentru schimb de proprietăți.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Propunere de schimb de proprietăți”. Finalizează exprimarea interesului și crearea unui match pentru schimb de proprietăți.


---

# PROMPT 32 — EXCHANGE COMPLET PENTRU PROPRIETĂȚI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Leagă Properties de Chat și Exchange, inclusiv acord, anulare, finalizare și feedback.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Exchange complet pentru proprietăți”. Leagă Properties de Chat și Exchange, inclusiv acord, anulare, finalizare și feedback.


---

# PROMPT 33 — CREAREA UNUI SERVICIU

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează wizard-ul Services, tipul de livrare, disponibilitatea și salvarea reală.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Crearea unui serviciu”. Finalizează wizard-ul Services, tipul de livrare, disponibilitatea și salvarea reală.


---

# PROMPT 34 — DISPONIBILITATE ȘI TARIF ORIENTATIV SERVICII

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează programul, durata, valoarea orientativă și fusurile orare fără a transforma schimbul în vânzare.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Disponibilitate și tarif orientativ servicii”. Finalizează programul, durata, valoarea orientativă și fusurile orare fără a transforma schimbul în vânzare.


---

# PROMPT 35 — PORTOFOLIU ȘI CERTIFICĂRI SERVICII

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează media, portofoliul și certificările cu reguli clare de afișare și verificare.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Portofoliu și certificări servicii”. Finalizează media, portofoliul și certificările cu reguli clare de afișare și verificare.


---

# PROMPT 36 — EDITAREA ȘI ADMINISTRAREA SERVICIILOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează editarea, activarea, dezactivarea și accesul owner-only.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Editarea și administrarea serviciilor”. Finalizează editarea, activarea, dezactivarea și accesul owner-only.


---

# PROMPT 37 — PAGINA DETALIATĂ A SERVICIULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează descrierea, livrarea remote/fizic/hibrid, disponibilitatea și CTA-urile.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Pagina detaliată a serviciului”. Finalizează descrierea, livrarea remote/fizic/hibrid, disponibilitatea și CTA-urile.


---

# PROMPT 38 — EXPLORAREA SERVICIILOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează listarea și stările reale ale serviciilor active.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Explorarea serviciilor”. Finalizează listarea și stările reale ale serviciilor active.


---

# PROMPT 39 — CĂUTARE ȘI FILTRE PENTRU SERVICII

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează categoria, livrarea, disponibilitatea, locația și sortarea.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Căutare și filtre pentru servicii”. Finalizează categoria, livrarea, disponibilitatea, locația și sortarea.


---

# PROMPT 40 — PROPUNERE DE SCHIMB DE SERVICII

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează exprimarea interesului și crearea unui match pentru servicii.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Propunere de schimb de servicii”. Finalizează exprimarea interesului și crearea unui match pentru servicii.


---

# PROMPT 41 — EXCHANGE COMPLET PENTRU SERVICII

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Leagă Services de Chat și Exchange, cu acord, livrare, confirmări, anulare și feedback.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Exchange complet pentru servicii”. Leagă Services de Chat și Exchange, cu acord, livrare, confirmări, anulare și feedback.


---

# PROMPT 42 — CREAREA UNUI EVENIMENT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează wizard-ul Events, datele, locația, biletele, locurile și salvarea reală.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Crearea unui eveniment”. Finalizează wizard-ul Events, datele, locația, biletele, locurile și salvarea reală.


---

# PROMPT 43 — TRANSFERABILITATE ȘI REGULI EVENIMENT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează regulile emitentului, termenul limită, eligibilitatea și avertismentele necesare.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Transferabilitate și reguli eveniment”. Finalizează regulile emitentului, termenul limită, eligibilitatea și avertismentele necesare.


---

# PROMPT 44 — PACHETE ASOCIATE EVENIMENTULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează asocierea opțională cu transport, cazare sau alte beneficii, fără servicii plătite obligatorii.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Pachete asociate evenimentului”. Finalizează asocierea opțională cu transport, cazare sau alte beneficii, fără servicii plătite obligatorii.


---

# PROMPT 45 — EDITAREA ȘI ADMINISTRAREA EVENIMENTELOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează editarea, activarea, expirarea și accesul owner-only.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Editarea și administrarea evenimentelor”. Finalizează editarea, activarea, expirarea și accesul owner-only.


---

# PROMPT 46 — PAGINA DETALIATĂ A EVENIMENTULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează data, locația aproximativă, biletele, regulile și CTA-urile.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Pagina detaliată a evenimentului”. Finalizează data, locația aproximativă, biletele, regulile și CTA-urile.


---

# PROMPT 47 — EXPLORAREA EVENIMENTELOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează listarea evenimentelor active și eliminarea automată a celor expirate.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Explorarea evenimentelor”. Finalizează listarea evenimentelor active și eliminarea automată a celor expirate.


---

# PROMPT 48 — CĂUTARE ȘI FILTRE PENTRU EVENIMENTE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează tipul, data, locația, numărul de locuri și sortarea.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Căutare și filtre pentru evenimente”. Finalizează tipul, data, locația, numărul de locuri și sortarea.


---

# PROMPT 49 — PROPUNERE DE SCHIMB PENTRU EVENIMENTE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează exprimarea interesului și crearea unui match pentru bilete sau rezervări.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Propunere de schimb pentru evenimente”. Finalizează exprimarea interesului și crearea unui match pentru bilete sau rezervări.


---

# PROMPT 50 — EXCHANGE COMPLET PENTRU EVENIMENTE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Leagă Events de Chat și Exchange, cu transfer, confirmări, anulare și feedback.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Exchange complet pentru evenimente”. Leagă Events de Chat și Exchange, cu transfer, confirmări, anulare și feedback.


---

# PROMPT 51 — EXPLORE GLOBAL CROSS-DOMAIN

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează Explore pentru Objects, Properties, Services și Events într-o experiență coerentă.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Explore global cross-domain”. Finalizează Explore pentru Objects, Properties, Services și Events într-o experiență coerentă.


---

# PROMPT 52 — CĂUTARE GLOBALĂ

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează o căutare unificată, sigură și performantă peste cele patru domenii.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Căutare globală”. Finalizează o căutare unificată, sigură și performantă peste cele patru domenii.


---

# PROMPT 53 — FILTRE GLOBALE ȘI DRAWER CONTEXTUAL

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează drawer-ul contextual fără duplicarea navigației globale și cu filtre specifice paginii.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Filtre globale și drawer contextual”. Finalizează drawer-ul contextual fără duplicarea navigației globale și cu filtre specifice paginii.


---

# PROMPT 54 — HARTĂ GLOBALĂ CU LOCAȚIE APROXIMATIVĂ

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează harta cross-domain fără expunerea coordonatelor exacte și cu fallback fără hartă.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Hartă globală cu locație aproximativă”. Finalizează harta cross-domain fără expunerea coordonatelor exacte și cu fallback fără hartă.


---

# PROMPT 55 — FAVORITE ȘI COLECȚII CROSS-DOMAIN

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează salvarea, organizarea și eliminarea favoritelor din toate domeniile.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Favorite și colecții cross-domain”. Finalizează salvarea, organizarea și eliminarea favoritelor din toate domeniile.


---

# PROMPT 56 — EXPRESS INTEREST CANONIC

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează acțiunea server-side, participant-only, idempotentă și reutilizabilă în toate domeniile.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Express Interest canonic”. Finalizează acțiunea server-side, participant-only, idempotentă și reutilizabilă în toate domeniile.


---

# PROMPT 57 — CREAREA CANONICĂ A MATCH-ULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează match creation cu autoritate server-side, duplicate prevention și aceeași identitate pentru participanți.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Crearea canonică a match-ului”. Finalizează match creation cu autoritate server-side, duplicate prevention și aceeași identitate pentru participanți.


---

# PROMPT 58 — SCORUL DE MATCHING

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează scorul explicabil pe dorințe, locație, valoare, disponibilitate și compatibilitate.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Scorul de matching”. Finalizează scorul explicabil pe dorințe, locație, valoare, disponibilitate și compatibilitate.


---

# PROMPT 59 — MATCHING BILATERAL OBJECTS

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Închide fluxul de matching pentru Objects fără a rescrie componente deja demonstrate.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Matching bilateral Objects”. Închide fluxul de matching pentru Objects fără a rescrie componente deja demonstrate.


---

# PROMPT 60 — MATCHING PENTRU PROPERTIES

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Adaptează motorul canonic pentru proprietăți și perioade de disponibilitate.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Matching pentru Properties”. Adaptează motorul canonic pentru proprietăți și perioade de disponibilitate.


---

# PROMPT 61 — MATCHING PENTRU SERVICES

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Adaptează motorul canonic pentru servicii, competențe și disponibilitate.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Matching pentru Services”. Adaptează motorul canonic pentru servicii, competențe și disponibilitate.


---

# PROMPT 62 — MATCHING PENTRU EVENTS

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Adaptează motorul canonic pentru evenimente, date și transferabilitate.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Matching pentru Events”. Adaptează motorul canonic pentru evenimente, date și transferabilitate.


---

# PROMPT 63 — MATCHING CROSS-DOMAIN

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Implementează cel puțin un flux real obiect–serviciu, obiect–proprietate sau altă combinație permisă.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Matching cross-domain”. Implementează cel puțin un flux real obiect–serviciu, obiect–proprietate sau altă combinație permisă.


---

# PROMPT 64 — EXPLICAȚII ȘI FALLBACK PENTRU MATCHING AI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează explicațiile AI, transparența și fallback-ul deterministic non-AI.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Explicații și fallback pentru matching AI”. Finalizează explicațiile AI, transparența și fallback-ul deterministic non-AI.


---

# PROMPT 65 — LISTA CONVERSAȚIILOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează inbox-ul, ordonarea, unread state, stările goale și accesul participant-only.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Lista conversațiilor”. Finalizează inbox-ul, ordonarea, unread state, stările goale și accesul participant-only.


---

# PROMPT 66 — CHAT REALTIME

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează mesajele realtime, persistența, reload-ul și prevenirea accesului outsider.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Chat realtime”. Finalizează mesajele realtime, persistența, reload-ul și prevenirea accesului outsider.


---

# PROMPT 67 — ATAȘAMENTE ÎN CHAT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează uploadul sigur, tipurile permise, dimensiunea, preview-ul și controlul accesului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Atașamente în chat”. Finalizează uploadul sigur, tipurile permise, dimensiunea, preview-ul și controlul accesului.


---

# PROMPT 68 — TRADUCEREA MESAJELOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează traducerea la cerere sau automată, afișarea originalului și fallback-ul non-AI.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Traducerea mesajelor”. Finalizează traducerea la cerere sau automată, afișarea originalului și fallback-ul non-AI.


---

# PROMPT 69 — AGENDA ȘI CHECKLIST-UL SCHIMBULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează informațiile negociate, checklist-ul și legătura coerentă către Exchange.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Agenda și checklist-ul schimbului”. Finalizează informațiile negociate, checklist-ul și legătura coerentă către Exchange.


---

# PROMPT 70 — MODERAREA MESAJELOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează moderarea, raportarea, rate limit-ul și fallback-ul când AI nu este disponibil.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Moderarea mesajelor”. Finalizează moderarea, raportarea, rate limit-ul și fallback-ul când AI nu este disponibil.


---

# PROMPT 71 — BLOCAREA UNUI UTILIZATOR ÎN CHAT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează block/unblock și efectele asupra mesajelor, matching-ului și vizibilității.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Blocarea unui utilizator în chat”. Finalizează block/unblock și efectele asupra mesajelor, matching-ului și vizibilității.


---

# PROMPT 72 — NOTIFICĂRI PENTRU CHAT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează unread, realtime și email conform preferințelor utilizatorului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Notificări pentru chat”. Finalizează unread, realtime și email conform preferințelor utilizatorului.


---

# PROMPT 73 — CREAREA CANONICĂ A EXCHANGE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează crearea server-side, participant-only, idempotentă și legată de match-ul corect.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Crearea canonică a Exchange”. Finalizează crearea server-side, participant-only, idempotentă și legată de match-ul corect.


---

# PROMPT 74 — ACORD BILATERAL

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează termenii schimbului, acceptarea ambilor participanți și reviziile concurente.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Acord bilateral”. Finalizează termenii schimbului, acceptarea ambilor participanți și reviziile concurente.


---

# PROMPT 75 — LOGISTICĂ PENTRU PREDARE LOCALĂ

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează locul aproximativ, data, confirmările și protecția locației exacte.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Logistică pentru predare locală”. Finalizează locul aproximativ, data, confirmările și protecția locației exacte.


---

# PROMPT 76 — LOGISTICĂ PENTRU CURIER

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează opțiunile, tracking-ul manual, ambalarea și stările fără integrare plătită obligatorie.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Logistică pentru curier”. Finalizează opțiunile, tracking-ul manual, ambalarea și stările fără integrare plătită obligatorie.


---

# PROMPT 77 — LOGISTICĂ PENTRU PROPRIETĂȚI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează calendarul, check-in/check-out, reguli și confirmări pentru schimbul de proprietăți.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Logistică pentru proprietăți”. Finalizează calendarul, check-in/check-out, reguli și confirmări pentru schimbul de proprietăți.


---

# PROMPT 78 — LOGISTICĂ PENTRU SERVICII

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează livrabilele, termenele, confirmările și eventualele sesiuni.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Logistică pentru servicii”. Finalizează livrabilele, termenele, confirmările și eventualele sesiuni.


---

# PROMPT 79 — LOGISTICĂ PENTRU EVENIMENTE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează transferul, termenul limită, confirmările și dovada predării.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Logistică pentru evenimente”. Finalizează transferul, termenul limită, confirmările și dovada predării.


---

# PROMPT 80 — FINALIZARE BILATERALĂ

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează confirmarea ambilor participanți, idempotency și efectele corecte asupra ofertelor.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Finalizare bilaterală”. Finalizează confirmarea ambilor participanți, idempotency și efectele corecte asupra ofertelor.


---

# PROMPT 81 — ANULARE EXCHANGE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează anularea autorizată, motivele, notificările și zero efecte secundare neintenționate.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Anulare Exchange”. Finalizează anularea autorizată, motivele, notificările și zero efecte secundare neintenționate.


---

# PROMPT 82 — DISPUTE EXCHANGE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează deschiderea, dovezile, statusurile, accesul participanților și intervenția admin.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Dispute Exchange”. Finalizează deschiderea, dovezile, statusurile, accesul participanților și intervenția admin.


---

# PROMPT 83 — FEEDBACK DUPĂ SCHIMB

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează feedback participant-only, o singură evaluare aplicabilă și persistența după reload.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Feedback după schimb”. Finalizează feedback participant-only, o singură evaluare aplicabilă și persistența după reload.


---

# PROMPT 84 — REPUTAȚIE ȘI TRUST SCORE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează actualizarea server-side, explicabilă și rezistentă la manipulare.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Reputație și trust score”. Finalizează actualizarea server-side, explicabilă și rezistentă la manipulare.


---

# PROMPT 85 — RANGURILE DE ÎNCREDERE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează Free/Silver/Gold/Platinum fără cumpărarea directă a rangului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Rangurile de încredere”. Finalizează Free/Silver/Gold/Platinum fără cumpărarea directă a rangului.


---

# PROMPT 86 — SWAPLENI ȘI LEDGER

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează ledger-ul server-controlled, idempotent și separat de rangul de încredere.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Swapleni și ledger”. Finalizează ledger-ul server-controlled, idempotent și separat de rangul de încredere.


---

# PROMPT 87 — RAPORTAREA CONȚINUTULUI ȘI UTILIZATORILOR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează report pentru profiluri, oferte, mesaje, stories și schimburi.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Raportarea conținutului și utilizatorilor”. Finalizează report pentru profiluri, oferte, mesaje, stories și schimburi.


---

# PROMPT 88 — BLOCK GLOBAL

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează efectele block asupra Explore, Matching, Chat și Exchange.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Block global”. Finalizează efectele block asupra Explore, Matching, Chat și Exchange.


---

# PROMPT 89 — MODERARE ȘI COADĂ DE REVIZUIRE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează coada admin, deciziile, istoricul și audit trail-ul.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Moderare și coadă de revizuire”. Finalizează coada admin, deciziile, istoricul și audit trail-ul.


---

# PROMPT 90 — PROTECȚIE ANTI-ABUZ

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează rate limits, duplicate prevention, validări și semnale de risc fără blocarea utilizatorilor legitimi.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Protecție anti-abuz”. Finalizează rate limits, duplicate prevention, validări și semnale de risc fără blocarea utilizatorilor legitimi.


---

# PROMPT 91 — NOTIFICĂRI GLOBALE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează notificările pentru interes, match, chat, exchange, feedback, dispute și moderare.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Notificări globale”. Finalizează notificările pentru interes, match, chat, exchange, feedback, dispute și moderare.


---

# PROMPT 92 — CREAREA UNEI STORY

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează draftul pornit dintr-un schimb real, fără inventarea conținutului de către AI.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Crearea unei Story”. Finalizează draftul pornit dintr-un schimb real, fără inventarea conținutului de către AI.


---

# PROMPT 93 — CONSIMȚĂMÂNT ȘI ANONIMIZARE STORIES

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează acordul tuturor participanților, anonimizarea și retragerea consimțământului.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Consimțământ și anonimizare Stories”. Finalizează acordul tuturor participanților, anonimizarea și retragerea consimțământului.


---

# PROMPT 94 — MODERARE ȘI PUBLICARE STORIES

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează statusurile, moderarea, traducerea și publicarea sigură.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Moderare și publicare Stories”. Finalizează statusurile, moderarea, traducerea și publicarea sigură.


---

# PROMPT 95 — BLOG EDITORIAL EXISTENT

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Integrează și finalizează fluxul editorial existent fără a reconstrui blogul de la zero.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Blog editorial existent”. Integrează și finalizează fluxul editorial existent fără a reconstrui blogul de la zero.


---

# PROMPT 96 — FEEDBACK ȘI CONTRIBUȚII PENTRU BLOG

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează reacțiile structurate, sugestiile și contribuțiile aprobate editorial.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Feedback și contribuții pentru Blog”. Finalizează reacțiile structurate, sugestiile și contribuțiile aprobate editorial.


---

# PROMPT 97 — ADMIN OPERAȚIONAL

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează dashboard-ul minim pentru utilizatori, rapoarte, dispute, stories și conținut.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Admin operațional”. Finalizează dashboard-ul minim pentru utilizatori, rapoarte, dispute, stories și conținut.


---

# PROMPT 98 — MONETIZARE FĂRĂ TAXAREA SCHIMBULUI

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează infrastructura V1 pentru servicii conexe și comisioane terțe, fără a taxa schimbul în sine.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Monetizare fără taxarea schimbului”. Finalizează infrastructura V1 pentru servicii conexe și comisioane terțe, fără a taxa schimbul în sine.


---

# PROMPT 99 — AI GATEWAY MODULAR

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează apelurile AI server-side, registry-ul de modele, schemele, cache-ul, costurile și fallback-ul.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „AI Gateway modular”. Finalizează apelurile AI server-side, registry-ul de modele, schemele, cache-ul, costurile și fallback-ul.


---

# PROMPT 100 — AI PENTRU VISION, TRADUCERE ȘI MODERARE

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Finalizează utilizările AI aprobate cu benchmark intern și fallback non-AI.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „AI pentru vision, traducere și moderare”. Finalizează utilizările AI aprobate cu benchmark intern și fallback non-AI.


---

# PROMPT 101 — SECURITATE, PERFORMANȚĂ, ACCESIBILITATE ȘI OBSERVABILITATE V1

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Închide defectele reale P0/P1, verifică runtime, accesibilitate, performanță și rollback fără audituri repetitive.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Securitate, performanță, accesibilitate și observabilitate V1”. Închide defectele reale P0/P1, verifică runtime, accesibilitate, performanță și rollback fără audituri repetitive.


---

# PROMPT 102 — LANSAREA SWAPLY V1.0

Repository: Pmelinte/swaply-2025
Branch principal: main
Production: https://www.swaply.world

Acesta este un task de IMPLEMENTARE focalizat, nu un audit general și nu un exercițiu de planificare.

REGULI:
- Pornește de pe ultimul main și citește `docs/V1_EXECUTION_STATUS.md` dacă există.
- Inspectează numai codul, schema, RLS și testele direct relevante acestui prompt.
- Reutilizează implementările corecte; nu rescrie funcționalități demonstrate.
- Implementează toate golurile reale din scop, inclusiv UI, persistență, autorizare, RLS, reload și stări loading/empty/error aplicabile.
- Autoritatea pentru user_id/owner_id/participant_id trebuie derivată server-side din sesiunea autentificată.
- Nu rescrie migrații istorice; adaugă doar migrații forward-only când sunt necesare.
- Nu folosi service role în browser, nu expune secrete și nu modifica Production direct.
- Nu introduce servicii sau AI plătite fără aprobare explicită; orice AI trebuie să aibă fallback non-AI.
- Rulează testele focalizate, apoi typecheck, lint și build dacă schimbarea le poate afecta.
- Nu declara PASS pentru teste neexecutate.
- Creează un singur branch și cel mult un PR pentru acest prompt. Nu face merge.
- Nu crea roadmap, master plan, audit predictiv, audit al auditului, batch sau sub-batch.
- Nu extinde scopul la alte funcționalități.
- Actualizează o singură sursă de progres: `docs/V1_EXECUTION_STATUS.md`. Creeaz-o numai la Promptul 1 dacă lipsește; ulterior doar actualizeaz-o.
- În registru marchează funcționalitatea: REUSED, IMPLEMENTED, BLOCKED sau CLOSED, cu PR, teste și dovadă scurtă.
- Dacă este deja completă și testele relevante trec, nu modifica artificial codul; actualizează registrul și creează PR numai dacă există o schimbare reală de urmărit.
- Oprește-te la final și așteaptă comanda explicită de merge.

OUTPUT FINAL OBLIGATORIU:
STATUS: READY FOR REVIEW / BLOCKED / ALREADY COMPLETE
FUNCȚIONALITATE: <număr și titlu>
REZULTAT: maximum 6 propoziții
FIȘIERE MODIFICATE: listă sau NONE
MIGRAȚII: listă sau NONE
TESTE: fiecare comandă cu PASS / FAIL / NOT RUN
PR: număr, titlu și URL sau NONE
VERIFICARE MANUALĂ: maximum 8 pași
RISCURI REZIDUALE: numai riscuri concrete sau NONE
OPRIRE: confirmă „no merge” și nu continua cu promptul următor.


SCOP:
Execută release readiness, verifică migrațiile, backup/restore, Production, publică v1.0.0 și closure report unic.

CRITERII MINIME DE ACCEPTARE:
- Fluxul canonic relevant funcționează cap-coadă pentru actorii autorizați.
- Datele persistă după reload și nu apar efecte secundare asupra altor domenii.
- Outsiderul este refuzat pentru operațiile private.
- RLS, grants, API/RPC/server actions și client calls sunt coerente.
- Există teste focalizate pentru happy path, denial și eroarea critică principală.
- UI-ul funcționează în desktop și mobil acolo unde este aplicabil.
- Textele noi folosesc mecanismul existent de localizare.
- Orice cleanup de test folosește identificatori imutabili.

CERINȚĂ SPECIALĂ:
Rezolvă exclusiv „Lansarea Swaply v1.0”. Execută release readiness, verifică migrațiile, backup/restore, Production, publică v1.0.0 și closure report unic.

REGULĂ TERMINALĂ:
Acesta este singurul closure cumulativ permis. Nu crea un alt audit după el.
Publică sau pregătește tag-ul `v1.0.0` numai după ce toate funcționalitățile blocante din registru sunt CLOSED și Petru a autorizat explicit merge/release.
Documentul final permis este unul singur: `docs/V1_0_CLOSURE_REPORT.md`.
