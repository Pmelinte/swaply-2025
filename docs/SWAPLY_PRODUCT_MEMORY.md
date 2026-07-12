# Swaply — document de memorie pentru chat-uri ulterioare

**Scopul documentului:** acest document sintetizează direcția stabilită în chat despre Swaply și poate fi încărcat sau copiat în chat-uri viitoare, pentru ca orice asistent/agent AI să înțeleagă contextul fără să reluăm discuția de la zero.

**Principiu major:** Swaply trebuie construit ca platformă globală de schimburi, nu ca site regional românesc/englezesc tradus ulterior.

---

## 1. Rezumat scurt de pus la începutul unui chat nou

Lucrăm la Swaply, o platformă globală de schimburi între oameni, construită pe patru domenii principale: **Objects, Properties, Services, Events**. Proiectul trebuie gândit **global-first**, pentru toate limbile active ale site-ului, nu RO/EN-first. Româna și engleza sunt doar două locale dintre cele suportate, nu limbile centrale ale produsului.

Userul vrea specificații complete, nu reduceri de tip MVP. Nu trebuie tăiate cerințe doar pentru simplificare; implementarea poate fi etapizată ulterior, dar arhitectura trebuie să prevadă produsul final.

Navigația globală există și nu trebuie duplicată: bara de jos rămâne pentru Home / Explore / Matching / Messages / Exchange, iar domeniile principale sunt Objects / Properties / Services / Events. Ce lipsește este **hamburgerul contextual**: fiecare pagină trebuie să aibă un buton hamburger care deschide un drawer specific acelei pagini, cu filtre, acțiuni rapide, status, recomandări AI și conținut contextual. Drawer-ul nu este meniu generic.

Paginile pentru user nelogat trebuie să fie vii, internaționale și ademenitoare, nu goale sau blocate brutal de login. Ele trebuie să afișeze preview-uri, demo-uri, explicații, ghiduri, povești, CTA-uri și exemple globale. Login-ul se cere doar la acțiuni reale.

Blogul există deja în proiect, cu Supabase/cache/traduceri și componente dedicate. Nu trebuie refăcut. Blogul trebuie integrat în Home și în paginile publice ca zonă de ghiduri/educație. Blogul este diferit de Stories. Pentru bloguri noi poate exista sursă editorială hardcodată, dar publicarea trebuie să treacă prin traducere în toate limbile active, salvare în Supabase și cache.

Stories reprezintă povești reale ale obiectelor, oamenilor și schimburilor, cu consimțământ, anonimizare, moderare și recompense. Blogul educă; Stories inspiră și demonstrează că Swaply funcționează.

Swaply nu trebuie să fie doar schimb obiect contra obiect. Trebuie să accepte schimburi 1 la 1, 1 la mai multe, mai multe contra unul, obiect contra serviciu, obiect contra proprietate, obiect contra eveniment, diferență compensată cu swapleni și schimburi circulare cu 3–5 useri.

O direcție centrală este **human-centered swapping**: omul nu este doar user, iar obiectul nu este doar item. Obiectele pot avea valoare economică și valoare sentimentală. Userul poate alege subiectiv cu ce fel de om vrea să schimbe un obiect, de ce îl dă mai departe și ce poveste are. AI-ul recomandă și explică, dar omul decide.

AI-ul trebuie tratat ca **strat transversal al platformei**, nu ca funcție izolată. El asistă recunoașterea obiectelor, clasificarea, descrierea, traducerile, matchingul, moderarea, sumarizarea chatului, finalizarea schimbului, stories, blogul, auditul global-first și protecția anti-abuz. AI-ul recomandă, explică și protejează, dar nu decide în locul omului.


---

## 2. Reguli fundamentale de produs

1. Swaply este global-first.
2. RO și EN nu sunt limbile produsului; sunt doar două locale.
3. Orice pagină publică trebuie proiectată pentru toate limbile active.
4. Nu se introduc texte publice hardcodate direct în componente.
5. Orice text nou trebuie să treacă prin sistemul de traduceri/conținut/cache.
6. Userul trebuie să aibă în profil: limba principală, a doua limbă, a treia limbă.
7. Fallbackul vizibil nu trebuie să fie direct engleză pentru toată lumea.
8. Ordinea recomandată pentru user logat: limba principală → a doua limbă → a treia limbă → limba browserului/rutei → limba sursă → engleză doar ca fallback tehnic final.
9. Pentru user nelogat: limba din URL → limba browserului → limba regiunii dacă se poate deduce → engleză ca fallback final.
10. Navigația globală nu se dublează în drawer.
11. Fiecare pagină majoră are drawer contextual propriu.
12. Drawer-ul este centrul de control al paginii curente.
13. Paginile nelogate trebuie să fie vii, utile, globale și ademenitoare.
14. Blogul și Stories sunt sisteme diferite.
15. Tokenii/swaplenii și rangul de încredere sunt sisteme diferite.
16. AI-ul nu decide schimburi; AI-ul explică și recomandă.
17. Omul decide cu cine schimbă, în ce condiții și de ce.
18. Valoarea sentimentală trebuie separată de valoarea economică.
19. Confidențialitatea, locația exactă, mesajele private, story consent și token ledger trebuie protejate.
20. Nu se elimină funcționalități existente fără cerere explicită.
21. AI-ul este facilitator transversal, nu feature decorativ.
22. AI-ul ajută la recunoaștere, clasificare, traducere, matching, moderare, sumarizare, stories, blog și audit.
23. AI-ul trebuie implementat printr-un AI gateway modular, nu prin apeluri împrăștiate direct în componente.
24. Alegerea modelelor AI se face pe benchmark intern Swaply, pe cost, calitate, limbi, latență, siguranță, privacy și fallback, nu pe entuziasm pentru un singur furnizor.
25. Orice funcție AI trebuie să aibă fallback non-AI și să nu blocheze fluxurile de bază.
26. Prompturile, modelele, costurile, cache-ul și erorile AI trebuie versionate și auditate.

---

## 3. Direcția global-first și limbile userului

Engleza este utilă ca limbă universală tehnică, dar nu trebuie să sperie userii care nu o vorbesc. Swaply trebuie să vorbească mai întâi limba userului. În profil trebuie adăugate:

- limba principală;
- a doua limbă;
- a treia limbă;
- opțiune de traducere automată a mesajelor;
- opțiune de afișare a textului original.

Exemplu:

```json
{
  "primary": "ro",
  "secondary": "fr",
  "tertiary": "it",
  "autoTranslateMessages": true,
  "showOriginal": false
}
```

Pentru bloguri, stories, notificări, UI și chat, sistemul trebuie să caute conținutul în ordinea preferințelor userului. Dacă userul are română, franceză și italiană, nu trebuie să vadă engleză doar pentru că traducerea română lipsește. Sistemul trebuie să încerce franceză, apoi italiană, apoi fallback final.

Această regulă trebuie aplicată de la început. Repararea traducerilor după implementare costă mult mai mult decât proiectarea corectă inițială.

---

## 4. Hamburger contextual și drawer per pagină

Userul nu cere încă un meniu de navigație. Cere un **hamburger contextual** pe fiecare pagină.

- Hamburger = butonul cu trei linii orizontale.
- Drawer = panoul lateral sau bottom sheet deschis de hamburger.
- Drawer contextual = drawer-ul se schimbă în funcție de pagina curentă.

Poziție recomandată:

- Desktop/laptop: lângă titlul paginii, de obicei în stânga sus a zonei de conținut; drawer lateral de 360–420 px.
- Mobil: lângă titlul paginii, preferabil în dreapta sus, ca să nu concureze cu bara de jos sau cu gestul de back; drawer ca bottom sheet sau panou full-screen.

Drawer-ul nu trebuie să conțină Home / Explore / Matching / Messages / Exchange ca navigație duplicată. El trebuie să conțină filtre, acțiuni rapide, status și recomandări specifice paginii.

### Exemple de drawer contextual

**Home:** onboarding, profil complet/incomplet, notificări, tokeni, rang, obiecte active, schimburi active, recomandări AI, ghiduri/blog, povești.

**Objects:** căutare text, căutare după fotografie, categorie, subcategorie, brand, model, stare, valoare, distanță, curier, schimb internațional, schimb circular, obiectele mele, cererile altora, AI găsește cine vrea obiectul meu.

**Properties:** tip proprietate, locație, perioadă, calendar, camere, oaspeți, facilități, reguli, garanție, asigurare, verificare, schimb simultan/non-simultan/vacanță.

**Services:** categorie, subcategorie, remote/fizic/hibrid, disponibilitate, ore oferite, valoare/oră, experiență, certificări, portofoliu, serviciu contra obiect/proprietate/eveniment.

**Events:** tip eveniment, dată, locație, număr bilete, transferabilitate, termen limită, reguli emitent, cazare, transport, pachete bilet+cazare+transport.

**Matching:** sloturi, tip schimb, scor minim, filtre AI, rang partener, hartă, match-uri directe/circulare, match-uri salvate/respinse.

**Messages/Chat:** conversații, agenda schimbului, fișiere, traducere, rezumat AI, checklist, profil partener, buton spre Exchange, refuz politicos.

**Exchange:** status schimb, logistică, curier, ambalare, escrow/asigurare, confirmări, feedback, story, dispute.

---

## 5. Paginile pentru user nelogat

Paginile nelogate sunt vitrina globală a Swaply. Ele nu trebuie să pară goale, regionale sau blocate de login. Trebuie să explice ce se poate face, ce se deblochează după login și de ce platforma este utilă.

Reguli:

1. Userul nelogat poate explora și înțelege platforma.
2. Login-ul se cere la acțiuni reale: salvează, propune schimb, trimite mesaj, finalizează.
3. Fiecare pagină nelogată are conținut demo/preview relevant.
4. Exemplele trebuie să fie globale: țări, orașe, monede, nume și contexte diverse.
5. Home nelogat trebuie să explice în 3 pași: oferă, găsește potrivire, finalizează.
6. Objects nelogat trebuie să arate obiecte demo atractive.
7. Properties nelogat trebuie să arate schimburi de cazare/proprietate.
8. Services nelogat trebuie să arate barter între servicii.
9. Events nelogat trebuie să arate bilete/rezervări/transport/cazare.
10. Matching nelogat trebuie să arate simulări de matching AI.
11. Messages/Chat nelogat trebuie să arate conversație demo, traducere și checklist.
12. Exchange nelogat trebuie să arate pașii finalizării unui schimb.
13. Paginile nelogate trebuie să includă ghiduri/blog și povești/stories.
14. CTA-urile trebuie să fie contextuale: Adaugă primul obiect, Caută după poză, Vezi potriviri demo, Completează profilul.

---

## 6. Blog: sistem editorial, nu Stories

Blogul există deja în proiect și nu trebuie refăcut de la zero. Au fost identificate:

- `src/app/[locale]/blog/page.tsx`
- `src/lib/blog-db.ts`
- `src/lib/blog.ts`
- `scripts/translate-blog.mjs`
- `scripts/migrate-blog-to-supabase.mjs`
- `src/scripts/populate-blog-translations.ts`
- componente precum `BlogSearch`, `RelatedPosts`, `AuthorCard`, `BlogShareButtons`
- conținut MDX și fișiere de mesaje pentru multe limbi

Blogul trebuie păstrat ca sistem editorial/cache-uit. Poate exista sursă hardcodată pentru bloguri noi, dar doar ca **draft editorial**. Afișarea publică trebuie să vină din Supabase/cache după traduceri.

Flux recomandat pentru blog nou:

1. Admin sau contributor propune articol.
2. Articolul intră în `draft`.
3. AI verifică structură, limbaj, risc legal, duplicare, claritate și traductibilitate.
4. Editorul aprobă sau cere modificări.
5. Articolul devine `approved`.
6. Sistemul îl traduce în toate limbile active.
7. Traducerile se salvează în Supabase.
8. Pagina îl servește din cache.
9. Userii pot da feedback structurat.
10. Autorul primește swapleni doar după aprobare/publicare.

Statusuri posibile:

- `draft`
- `submitted`
- `needs_review`
- `needs_changes`
- `approved`
- `translated`
- `published`
- `archived`
- `rejected`

### Comentarii sau sugestii la blog?

Recomandare: nu comentarii libere la început. Începem cu:

- reacții simple: util / nu mi-a fost util / vreau mai multe exemple / prea complicat / incomplet;
- sugestii de articole;
- contribuții aprobate editorial;
- comentarii libere doar mai târziu, cu moderare AI, raportare, rate limit și verificare.

### Recompense pentru blog

- feedback util: recompensă mică;
- sugestie acceptată: recompensă moderată;
- contribuție folosită parțial: recompensă mai mare;
- articol complet aprobat: recompensă mare;
- articol featured: recompensă specială;
- badge-uri: Contributor, Guide Maker, Community Educator.

Important: blogurile aprobate pot da swapleni și badge-uri editoriale, dar nu trebuie să crească direct rangul de încredere pentru schimburi.

---

## 7. Stories: comunitate, schimburi reale, consimțământ

Stories sunt diferite de Blog.

**Blogul învață. Stories inspiră.**

Stories includ:

- povestea obiectului;
- povestea schimbului;
- povestea oamenilor implicați;
- poze reale;
- feedback;
- validare de ambii participanți;
- consimțământ de publicare;
- anonimizare;
- traducere;
- moderare;
- recompense cu swapleni.

Story nu se publică niciodată fără acord. Nu se publică locația exactă. AI-ul poate ajuta la reformulare, dar nu inventează povestea omului.

Statusuri recomandate:

- `draft`
- `pending_partner_consent`
- `pending_moderation`
- `published`
- `hidden`
- `disputed`
- `rejected`

Stories pot apărea:

- în Exchange după feedback;
- în profil;
- în Home ca dovadă socială;
- pe pagini publice nelogate;
- pe o rută dedicată `/stories`, dacă se decide.

---

## 8. Human-centered swapping: omul, obiectul, sensul

Swaply nu trebuie să fie doar „item contra item”. Trebuie să fie o platformă în care oamenii, obiectele și poveștile au context.

Omul nu este doar user. „User” este doar rolul lui temporar în platformă. Obiectul nu este doar item. Poate avea valoare economică și valoare sentimentală.

La adăugarea unui obiect trebuie să existe un bloc opțional:

**Ce înseamnă acest obiect pentru tine?**

Câmpuri posibile:

- are valoare sentimentală?
- este primit cadou?
- este moștenit?
- este legat de o etapă de viață?
- vrei să ajungă la cineva care îl folosește?
- vrei să spui povestea noului proprietar?
- preferi să nu fie revândut imediat?
- preferi colecționar / familie / student / profesionist / comunitate locală?
- vrei poveste privată sau publică?

Valori diferite:

- valoare estimată/financiară;
- valoare sentimentală/personală;
- intenția schimbului;
- preferința subiectivă privind primitorul.

Userul care vrea un obiect poate fi întrebat:

**De ce vrei acest obiect?**

Exemple:

- îmi trebuie pentru copilul meu;
- colecționez aparate foto vechi;
- îl pot repara;
- îmi trebuie pentru cabinet;
- îl voi folosi într-un proiect;
- îl caut de mult timp.

AI Matching trebuie să arate nu doar scor financiar, ci și:

- potrivire economică;
- potrivire logistică;
- potrivire de categorie;
- potrivire de intenție;
- potrivire sentimentală;
- compatibilitate de limbă;
- compatibilitate de încredere;
- risc;
- explicație.

Un schimb poate avea:

- Financial Match: 62%
- Logistics Match: 85%
- Category Match: 70%
- Meaning Match: 94%

Uneori „meaning match” poate fi mai important decât valoarea financiară.

---

## 9. Tipuri de schimburi

Swaply trebuie să accepte mai multe moduri de schimb:

1. schimb 1 la 1;
2. schimb 1 la mai multe obiecte;
3. schimb mai multe obiecte contra unul;
4. obiect contra serviciu;
5. obiect contra proprietate/cazare;
6. obiect contra eveniment/bilet/rezervare;
7. serviciu contra serviciu;
8. proprietate contra proprietate;
9. pachet eveniment: bilet + cazare + transport;
10. schimb cu diferență valorică compensată prin swapleni;
11. schimb circular cu 3 useri;
12. lanț de schimb cu 4–5 useri.

Schimb circular exemplu:

- A are bicicletă și vrea laptop.
- B are laptop și vrea aparat foto.
- C are aparat foto și vrea bicicletă.
- AI descoperă ciclul A → B → C → A.

AI poate propune, dar finalizarea cere consimțământul tuturor participanților.

---

## 10. Căutare după fotografie și AI discovery

Trebuie introdusă funcția:

**Caută după fotografie**

Userul poate încărca o poză cu obiectul dorit, iar AI:

- detectează obiectul;
- detectează categoria și subcategoria;
- detectează culoare/material/brand probabil;
- caută obiecte similare;
- caută alternative compatibile;
- caută useri care oferă sau caută acel obiect.

Funcție inversă:

**Am acest obiect, cine îl vrea?**

Userul fotografiază obiectul, iar AI spune:

- ce este;
- ce valoare aproximativă are;
- cine caută ceva similar;
- ce schimburi directe există;
- ce schimburi circulare sunt posibile;
- dacă ar trebui fotografiat mai bine;
- cum ar trebui ambalat.

AI nu trebuie să blocheze adăugarea obiectului. Dacă AI pică, userul trebuie să poată continua manual.

---

## 11. Chat și interacțiunea între oameni

Chatul trebuie să fie mai mult decât un text liber. Trebuie să ghideze schimbul, fără să blocheze conversația.

Etape recomandate:

1. Salut/interes.
2. De ce vrei obiectul?
3. Ce oferi în schimb?
4. Clarificări despre stare.
5. Clarificări despre livrare.
6. Acord sumarizat.
7. Trecere la Exchange.
8. Feedback.
9. Poveste.

Funcții:

- traducere automată după limba principală/a doua/a treia;
- păstrarea mesajului original;
- opțiune „arată originalul”;
- rezumat AI;
- atașamente foto/documente;
- refuz politicos;
- raportare/blocare;
- protecția locației exacte până la acord.

Exemple de refuz politicos:

- Mulțumesc, dar nu este potrivit pentru mine.
- Obiectul tău e interesant, dar caut altceva.
- Prefer să îl dau cuiva care îl va folosi direct.
- Nu accept curier pentru acest obiect.
- Poate mai târziu.

---

## 12. Exchange, feedback, stories, recompense

Exchange este centrul finalizării schimbului.

Statusuri recomandate:

- `proposed`
- `accepted`
- `in_progress`
- `shipped`
- `received`
- `completed`
- `cancelled`
- `disputed`

Moduri logistice:

- predare locală;
- curier național;
- curier internațional;
- predare în vacanță;
- schimb proprietăți;
- schimb servicii;
- transfer eveniment/rezervare.

Checklist:

- stare confirmată;
- ambalare confirmată;
- expediere/predare confirmată;
- primire confirmată;
- feedback cerut;
- story propus.

Dacă schimbul pică înainte de finalizare, obiectele trebuie reactivate unde este cazul. Dacă apare dispută, story-ul trebuie ascuns/suspendat.

---

## 13. Swapleni, tokeni, ranguri, anti-abuz

Tokenii/swaplenii sunt recompense cheltuibile. Rangul este încredere/reputație și nu trebuie cumpărat direct.

Token ledger recomandat:

- id;
- user_id;
- amount;
- reason;
- source_type;
- source_id;
- created_at;
- unique anti-duplication key.

Rewarduri posibile:

- completare profil;
- primul obiect adăugat;
- schimb finalizat;
- feedback trimis;
- story validat;
- contribuție blog aprobată.

Anti-abuz:

- un reward per sursă;
- cap lunar;
- fără reward înainte de moderare/aprobare;
- fără creștere directă de rang prin bloguri;
- rangul depinde de schimburi finalizate, feedback, verificări, dispute reduse, stories validate și comportament serios.

Badge-uri posibile:

- Contributor;
- Guide Maker;
- Storyteller;
- Trusted Swapper;
- Ambassador.

---

## 14. Siguranță, legal, moderare

Trebuie protejate:

- profilurile private;
- mesajele;
- token ledger;
- story drafts;
- consimțământul pentru stories;
- locația exactă;
- datele personale;
- sugestiile de blog nepublicate;
- feedbackul intern.

Reguli:

1. Nu se publică stories fără consimțământ.
2. Nu se publică locația exactă.
3. Nu se cer date sensibile inutil.
4. Nu se forțează povestea personală.
5. Nu se transformă valoarea sentimentală în manipulare.
6. Nu se permit obiecte/interacțiuni interzise.
7. Se permite raportare user, obiect, mesaj, story.
8. Se permite blocare user.
9. Se păstrează dovezi pentru dispute.
10. RLS Supabase trebuie să fie strict pentru tabele private.

---

# 15. Prompt master pentru agent overnight

```text
You are an autonomous coding agent working overnight on Swaply.

Important rules:
1. Swaply is global-first. Do not implement RO/EN-only solutions.
2. Do not remove existing features.
3. Do not reduce requirements to MVP.
4. Do not duplicate existing global navigation.
5. Do not hardcode public UI text directly into components.
6. Preserve Supabase, translation, cache, auth and navigation behavior unless the task explicitly requires change.
7. Work in small commits or clear file groups.
8. After each implementation step, run audit checks.
9. If checks fail, repair before moving on.
10. Stop after 3 repair loops for the same failure and report the blocker honestly.
11. Do not claim success unless build/typecheck/lint/tests pass.
12. Keep Blog and Stories separate.
13. Keep tokens and trust rank separate.
14. AI should advise and explain, not decide swaps automatically.
15. Protect user privacy, exact location, private messages, story consent and token ledger.

Your overnight task list:
[PASTE ONLY 2-4 PROMPTS HERE, NOT THE WHOLE PROJECT]

At the end, produce:
- files changed
- commits created
- tests run
- tests passed/failed
- screenshots/artifacts if any
- remaining risks
- next recommended step
```

---

# 16. Prompt 1 — Global-first, limbi și fallback

## Implementare

```text
Analyze the Swaply repository for all current internationalization and localization logic.

Goal:
Make Swaply global-first, not RO/EN-first.

Tasks:
1. Inspect locale configuration, supported locales, next-intl setup, message files, middleware, route structure and language switcher.
2. Inspect profile data model and identify where language preferences are stored.
3. Propose and implement support for:
   - primary_language
   - secondary_language
   - tertiary_language
   - auto_translate_messages
   - show_original_language
4. Do not use English as automatic visible fallback for all users.
5. Implement or prepare a reusable language fallback resolver:
   user primary language -> secondary language -> tertiary language -> browser/route locale -> source locale -> English as last technical fallback.
6. Apply this resolver where safe, without breaking existing pages.
7. Do not remove existing locale support.
8. Do not hardcode RO/EN-only logic.

Acceptance criteria:
- Build passes.
- Existing routes still work.
- Language fallback function is reusable.
- Profile model can store three language preferences.
- No public page is made RO/EN-only.
```

## Audit

```text
Audit the previous implementation.

Check:
1. Are all active locales still supported?
2. Did the implementation introduce any RO/EN-only assumption?
3. Does the user language fallback chain exist and is it reusable?
4. Does profile support primary, secondary and tertiary language?
5. Are public-facing texts still translated through the existing translation system?
6. Does build/typecheck/lint pass?
7. Are there any hardcoded strings introduced in page components?
8. Are logged-out pages still reachable?

Produce a concise audit report with:
- PASS/FAIL per item
- files changed
- risks
- exact errors if any
```

## Reparare

```text
Repair any issue found in the audit.

Rules:
- Do not rewrite unrelated files.
- Do not delete existing translations.
- Do not simplify to RO/EN.
- Fix build/typecheck/lint errors.
- If a fallback creates visible English too early, change it to use the user language chain.
- If profile migration is needed, add a safe Supabase migration.

After repair, rerun the same checks and report final status.
```

---

# 17. Prompt 2 — Hamburger contextual / Drawer arhitectural

## Implementare

```text
Implement the architectural foundation for contextual page drawers in Swaply.

Goal:
Each major page must have a contextual hamburger button that opens a page-specific drawer. This drawer must not duplicate global navigation.

Pages:
- Home
- Objects
- Properties
- Services
- Events
- Matching
- Messages
- Chat
- Exchange
- Blog/Learn section if currently exposed
- Stories if route exists or is planned

Requirements:
1. Inspect existing layout/navigation components.
2. Preserve bottom navigation.
3. Preserve top domain navigation.
4. Add a reusable ContextualDrawer component.
5. Add a ContextualDrawerTrigger/hamburger button.
6. Add per-page drawer configuration.
7. Desktop behavior:
   - trigger near page title
   - drawer opens as side panel
8. Mobile behavior:
   - trigger near page title, preferably right side
   - drawer opens as mobile-friendly sheet/panel
   - must not conflict with bottom nav
9. Drawer must include sections:
   - page context
   - filters
   - quick actions
   - AI recommendations
   - status/current selection
10. Do not implement every final filter yet if too large; create the architecture and representative content for each page.

Acceptance criteria:
- Every major page can expose a contextual drawer trigger.
- Drawer content differs by page.
- Drawer does not duplicate Home/Explore/Matching/Messages/Exchange navigation.
- Mobile and desktop layouts remain usable.
- Build passes.
```

## Audit

```text
Audit the contextual drawer implementation.

Check:
1. Is there a reusable ContextualDrawer component?
2. Is drawer content page-specific?
3. Is global navigation duplicated inside the drawer?
4. Does desktop placement make sense?
5. Does mobile placement avoid bottom navigation conflict?
6. Does every major page have a plan/config for its contextual drawer?
7. Are accessibility basics present: aria-label, close button, Escape/focus behavior if applicable?
8. Does build pass?
9. Are there visual regressions in layout width or bottom navigation?

Report PASS/FAIL and list missing pages or weak drawer configurations.
```

## Reparare

```text
Repair the contextual drawer implementation based on the audit.

Rules:
- Do not remove bottom navigation.
- Do not replace existing domain navigation.
- Do not make one generic drawer for all pages.
- Fix accessibility issues.
- Fix mobile overlap.
- Fix build errors.
- Keep changes localized to drawer/layout/page header files where possible.

Rerun build and report final status.
```

---

# 18. Prompt 3 — Paginile nelogate mai vii

## Implementare

```text
Improve logged-out public pages so Swaply feels global, alive and inviting.

Goal:
No major public page should look empty, regional, or blocked by login.

Pages to inspect and improve:
- Home
- Objects
- Explore
- Properties
- Services
- Events
- Matching
- Messages
- Chat
- Exchange
- Profile if visited logged out

Requirements:
1. Preserve authentication rules: real actions still require login.
2. Public pages should show previews, demos, explanations, trust blocks, and CTA.
3. Use globally diverse demo examples, not mainly Romanian examples.
4. Use all active locale infrastructure; do not hardcode RO/EN.
5. Add sections explaining:
   - what this page does
   - what unlocks after login
   - why Swaply is safe/useful
6. Link relevant blog/guide content where available.
7. Link stories or story previews if available or add placeholder architecture.
8. Make CTA contextual:
   - Add first object
   - Search by photo
   - See AI matches
   - Complete profile
   - Start exchange
9. Avoid empty states that look broken.
10. Keep page performance reasonable.

Acceptance criteria:
- Logged-out user can browse and understand each major page.
- CTA appears but does not force login too early.
- No page feels RO/EN regional.
- Build passes.
```

## Audit

```text
Audit logged-out page experience.

Check each major page:
1. Does it show meaningful content when logged out?
2. Does it explain what the page is for?
3. Does it include contextual CTA?
4. Does it avoid empty/broken appearance?
5. Does it use globally diverse examples?
6. Does it avoid hardcoded RO/EN text?
7. Does it link guides/blog/stories where relevant?
8. Does it preserve login requirement for real actions?
9. Does mobile layout work?
10. Does build pass?

Return a page-by-page PASS/FAIL table.
```

## Reparare

```text
Repair the logged-out page experience based on the audit.

Rules:
- Do not bypass authentication for real actions.
- Do not add fake functionality that claims to be real.
- Demo content must be clearly preview/demo if not real.
- Do not hardcode texts outside translation/content system.
- Fix broken layouts and build errors.

Rerun audit and report final status.
```

---

# 19. Prompt 4 — Blog existent + bloguri noi traduse/cache-uite

## Implementare

```text
Improve the existing Swaply blog system without replacing it.

Context:
Swaply already has:
- src/app/[locale]/blog/page.tsx
- src/lib/blog-db.ts
- src/lib/blog.ts
- Supabase blog_posts access
- MDX fallback
- blog translation scripts
- BlogSearch and related components

Goal:
Keep the existing blog infrastructure, but prepare a clean editorial workflow for new blog posts that can be translated into all active locales and cached.

Tasks:
1. Inspect current blog DB and MDX flow.
2. Confirm how blog_posts, locale, published, title, description and content_md are used.
3. Create or propose a source-draft format for new editorial blog posts.
4. Add status fields or code-level support for:
   - draft
   - submitted
   - needs_review
   - approved
   - translated
   - published
   - archived
   - rejected
5. Ensure new posts can be translated for all active locales and stored in Supabase/cache.
6. Do not make blog RO/EN-only.
7. Add or document a translation completeness audit.
8. Integrate blog/guide cards into Home or logged-out pages if safe.
9. Blog must remain conceptually separate from Stories.

Acceptance criteria:
- Existing blog pages still work.
- New blog workflow is documented or partially implemented.
- Translation/cache strategy is clear.
- No duplicate hardcoded blog page is created.
- Build passes.
```

## Audit

```text
Audit the blog implementation.

Check:
1. Is existing blog functionality preserved?
2. Are Supabase-backed posts still used?
3. Are MDX/local fallback posts still safe?
4. Is there a clear workflow for new blog drafts?
5. Is there a plan or mechanism for translating new blog posts to all active locales?
6. Is cache/revalidate preserved?
7. Is blog kept separate from Stories?
8. Are blog cards integrated into Home/public pages without breaking navigation?
9. Does build pass?

Report exact gaps and risky assumptions.
```

## Reparare

```text
Repair the blog implementation based on the audit.

Rules:
- Do not delete existing blog posts.
- Do not remove Supabase-backed blog loading.
- Do not publish new source drafts as RO/EN-only.
- Do not mix Stories into Blog tables.
- Fix type/build errors.
- Preserve cache/revalidate.

Rerun checks and report final status.
```

---

# 20. Prompt 5 — Blog feedback, sugestii și recompense

## Implementare

```text
Implement or design the first safe version of blog interaction.

Goal:
Allow users to react to blog articles and suggest new blog topics, without enabling unmoderated comments yet.

Requirements:
1. Add support for simple blog feedback:
   - useful
   - not useful
   - needs more examples
   - too complicated
   - incomplete
2. Add support for blog topic suggestions:
   - suggested title
   - question/problem
   - suggested category
   - source language
   - optional note
3. Suggestions require logged-in user.
4. Free comments should not be enabled yet unless fully moderated.
5. Add moderation status:
   - pending
   - reviewed
   - accepted
   - rejected
6. Add reward hooks for approved contributions:
   - feedback useful
   - suggestion accepted
   - contribution used
   - full article approved
7. Rewards must use token ledger, not direct rank manipulation.
8. Add abuse protection:
   - one feedback per user per post
   - rate limit suggestions
   - no reward until approval

Acceptance criteria:
- User can submit structured blog feedback.
- User can suggest blog topics.
- No public unmoderated comments are shown.
- Rewards are approval-based.
- Build passes.
```

## Audit

```text
Audit blog interaction.

Check:
1. Are comments still disabled or safely moderated?
2. Can users submit structured feedback?
3. Can logged-in users submit suggestions?
4. Is there moderation status?
5. Are rewards approval-based?
6. Is rank not directly increased by blog contributions?
7. Are duplicate feedback and spam considered?
8. Are translations/locales considered?
9. Does build pass?

Report PASS/FAIL and security risks.
```

## Reparare

```text
Repair blog feedback/suggestion implementation.

Rules:
- Disable free public comments if moderation is incomplete.
- Do not award tokens before approval.
- Do not increase trust rank directly from blog writing.
- Add missing RLS or server-side checks.
- Fix build errors.

Rerun audit and report final status.
```

---

# 21. Prompt 6 — Stories separate de Blog

## Implementare

```text
Design and implement the foundation for Swaply Stories.

Goal:
Stories are not Blog. Stories are community/user/exchange narratives connected to real objects and completed swaps.

Requirements:
1. Create or prepare data model for stories:
   - story id
   - swap/exchange id
   - author id
   - co-author/partner id
   - domain: objects/properties/services/events
   - title
   - body
   - media
   - visibility: private/community/public
   - anonymous option
   - consent_author
   - consent_partner
   - language/sourceLocale
   - translated versions or translation cache link
   - moderation_status
   - published_at
2. Story statuses:
   - draft
   - pending_partner_consent
   - pending_moderation
   - published
   - hidden
   - disputed
   - rejected
3. Stories can be created after exchange completion/feedback.
4. No story is public without consent.
5. No exact location is published.
6. Add or prepare /stories and /stories/[id] if appropriate.
7. Add story previews to Home/logged-out pages where safe.
8. Add rewards only after validation/moderation.

Acceptance criteria:
- Blog and Stories are separate.
- Story consent is explicit.
- Story visibility is respected.
- Story rewards cannot be farmed easily.
- Build passes.
```

## Audit

```text
Audit Stories foundation.

Check:
1. Are Stories separate from Blog?
2. Are stories linked to real swaps/exchanges?
3. Is consent required before publication?
4. Is anonymization supported?
5. Is moderation status present?
6. Are exact locations protected?
7. Are rewards delayed until validation?
8. Are stories translatable/global-first?
9. Does build pass?

Report risks and missing safeguards.
```

## Reparare

```text
Repair Stories implementation.

Rules:
- Do not publish without consent.
- Do not expose exact location.
- Do not mix Blog and Stories data.
- Do not award tokens before moderation/validation.
- Fix RLS/server-side access problems.
- Fix build errors.

Rerun audit and report final status.
```

---

# 22. Prompt 7 — Valoare sentimentală și alegere subiectivă

## Implementare

```text
Implement the foundation for human-centered swapping.

Goal:
Swaply must support not only financial value, but also sentimental value, subjective intention and human context.

Tasks:
1. Extend item model/form/display to include optional sentimental/context fields:
   - sentimental_value_level
   - object_story
   - why_i_swap_it
   - preferred_recipient_intent
   - not_for_resellers preference
   - wants_recipient_message
   - story_visibility
2. Add user-facing section:
   "What does this object mean to you?"
3. Add recipient interest message:
   "Why do you want this object?"
4. Add swap intention:
   - balanced value
   - quick practical swap
   - meaningful swap
   - give it a second life
   - local community swap
   - repair/reuse/collector
5. Add "Second life item" tag support.
6. AI matching should not decide; it should explain why a match may be meaningful.
7. Do not force users to add personal stories.
8. Protect privacy and avoid sensitive personal data.

Acceptance criteria:
- Item can have optional sentimental/context fields.
- Interested user can explain why they want the item.
- Matching/display can show meaning-related context.
- No required oversharing.
- Build passes.
```

## Audit

```text
Audit human-centered swapping.

Check:
1. Are sentimental fields optional?
2. Are privacy protections respected?
3. Is user encouraged but not forced to share personal details?
4. Can owner express subjective preferences safely?
5. Can interested user explain intention?
6. Does the UI avoid discriminatory or abusive wording?
7. Does AI remain advisory, not decisive?
8. Does build pass?

Report risks, especially privacy/discrimination/manipulation risks.
```

## Reparare

```text
Repair human-centered swapping implementation.

Rules:
- Remove or soften any discriminatory wording.
- Do not require personal story fields.
- Add privacy notes where needed.
- Keep sentimental value separate from financial value.
- Keep AI advisory.
- Fix build/type errors.

Rerun audit and report final status.
```

---

# 23. Prompt 8 — Schimburi avansate și circulare

## Implementare

```text
Implement the architecture for advanced swap modes.

Goal:
Swaply must support more than 1-to-1 object swaps.

Swap modes:
1. one_to_one
2. one_to_many
3. many_to_one
4. object_for_service
5. object_for_property
6. object_for_event
7. service_for_service
8. property_for_property
9. event_bundle_swap
10. circular_swap_3_users
11. swap_chain_4_or_5_users
12. token_adjusted_swap

Tasks:
1. Inspect current match/swap data model.
2. Add safe enum/types for swap modes.
3. Add UI support in item/object preferences.
4. Add Matching drawer filters for swap mode.
5. Add initial data structure for swap chains:
   - chain id
   - participants
   - offered assets
   - requested assets
   - status
   - AI explanation
6. AI should propose circular swaps but not auto-confirm them.
7. Exchange flow must require confirmation from all participants.

Acceptance criteria:
- Existing 1-to-1 swaps still work.
- Swap mode is represented in types/data.
- Matching can filter or display advanced mode.
- Circular swaps have architecture but no unsafe auto-finalization.
- Build passes.
```

## Audit

```text
Audit advanced swap modes.

Check:
1. Existing simple swaps are not broken.
2. Swap mode enum/types are clear.
3. Circular swap data model requires all participants.
4. No swap chain can be finalized without consent.
5. Matching explains direct vs circular suggestions.
6. UI does not pretend unfinished modes are fully operational.
7. Does build pass?

Report missing pieces and unsafe assumptions.
```

## Reparare

```text
Repair advanced swap mode implementation.

Rules:
- Do not break 1-to-1 swap.
- Disable unfinished advanced actions gracefully.
- Do not auto-confirm multi-user swaps.
- Require all participants for circular swap progression.
- Fix build/type errors.

Rerun audit and report final status.
```

---

# 24. Prompt 9 — Căutare după fotografie și AI item discovery

## Implementare

```text
Implement the foundation for AI photo-based item discovery.

Goal:
Users should be able to search for an item using a photo and also ask "I have this object, who wants it?"

Features:
1. Search by photo:
   - upload image
   - detect object/category/subcategory
   - search similar objects
   - search compatible alternatives
2. Reverse discovery:
   - "I have this object, who wants it?"
   - detect users/wishes/matches that may want it
3. AI item metadata:
   - title suggestion
   - description suggestion
   - category
   - subcategory
   - tags
   - estimated value
   - condition guess
   - fragility/packaging suggestion
4. Must handle AI failure gracefully.
5. Must not require AI to complete basic item creation.
6. Must support global locales in generated text.

Acceptance criteria:
- UI has entry point for search by photo.
- AI calls are isolated behind API/server functions.
- Fallback works if AI is unavailable.
- Generated text respects locale.
- Build passes.
```

## Audit

```text
Audit photo-based discovery.

Check:
1. Is there a clear Search by Photo entry point?
2. Is reverse discovery present or planned cleanly?
3. Are AI calls server-side or safely abstracted?
4. Does item creation still work without AI?
5. Are errors handled gracefully?
6. Are generated texts localizable?
7. Is upload security considered?
8. Does build pass?

Report failures and security risks.
```

## Reparare

```text
Repair photo discovery implementation.

Rules:
- Do not block item creation when AI fails.
- Do not expose API keys client-side.
- Validate uploads.
- Add graceful fallback UI.
- Keep generated text locale-aware.
- Fix build/type errors.

Rerun audit and report final status.
```

---

# 25. Prompt 10 — Chat uman, traducere și ghidaj de schimb

## Implementare

```text
Improve Swaply chat as a guided human exchange conversation.

Goal:
Chat should support negotiation, trust, translation and transition to Exchange.

Tasks:
1. Inspect current messages/chat implementation.
2. Add or prepare guided chat stages:
   - interest
   - why I want it
   - what I offer
   - condition clarification
   - logistics clarification
   - agreement summary
   - move to Exchange
3. Add polite decline templates.
4. Add translation support using user language fallback chain.
5. Store original message and translated view separately if architecture allows.
6. Add "show original" option.
7. Add AI summary of agreement if safe.
8. Add reporting/blocking entry points.
9. Protect exact location sharing until both users agree.
10. Chat must remain usable as normal chat.

Acceptance criteria:
- Chat supports guided exchange without blocking free conversation.
- Translation respects user language preferences.
- Original message can be preserved.
- Decline can be polite.
- Exchange transition is clearer.
- Build passes.
```

## Audit

```text
Audit chat improvements.

Check:
1. Is chat still usable?
2. Are guided stages optional or non-intrusive?
3. Does translation use user fallback chain?
4. Is original message preserved or planned?
5. Are decline templates polite?
6. Is location protected before agreement?
7. Are report/block options present?
8. Does build pass?

Report privacy and UX risks.
```

## Reparare

```text
Repair chat implementation.

Rules:
- Do not make chat rigid or unusable.
- Do not expose exact location prematurely.
- Do not lose original message text.
- Do not force English fallback.
- Fix build/type errors.

Rerun audit and report final status.
```

---

# 26. Prompt 11 — Exchange complet, feedback, story, tokeni

## Implementare

```text
Improve Exchange flow as the finalization center of Swaply.

Goal:
Exchange must handle logistics, confirmation, feedback, story creation and rewards.

Tasks:
1. Inspect current exchange pages/data.
2. Add/prepare statuses:
   - proposed
   - accepted
   - in_progress
   - shipped
   - received
   - completed
   - cancelled
   - disputed
3. Add logistics modes:
   - local handover
   - national courier
   - international courier
   - vacation handover
   - property exchange
   - service exchange
   - event/reservation transfer
4. Add checklist:
   - condition confirmed
   - packaging confirmed
   - shipment/pickup confirmed
   - received confirmed
   - feedback requested
5. Add feedback after completion.
6. Add story prompt after feedback.
7. Add rewards:
   - completed exchange
   - feedback submitted
   - validated story
8. Rewards must go through token ledger.
9. Reactivate items if exchange fails before completion.
10. Hide or suspend story if dispute starts.

Acceptance criteria:
- Exchange status is clear.
- Completion requires confirmations.
- Feedback appears after completion.
- Story prompt appears after feedback.
- Rewards are ledger-based and not duplicated.
- Build passes.
```

## Audit

```text
Audit Exchange flow.

Check:
1. Are exchange statuses clear?
2. Can an exchange be completed without required confirmation?
3. Does failed exchange reactivate items where appropriate?
4. Does feedback appear at correct time?
5. Does story prompt require feedback/completion?
6. Are rewards token-ledger based?
7. Is duplicate reward farming prevented?
8. Are disputed stories hidden/suspended?
9. Does build pass?

Report exact problems.
```

## Reparare

```text
Repair Exchange flow.

Rules:
- Do not finalize without confirmation.
- Do not award duplicate tokens.
- Do not publish stories from disputed exchanges.
- Do not leave items inactive after cancelled exchange unless intended.
- Fix build/type errors.

Rerun audit and report final status.
```

---

# 27. Prompt 12 — Tokeni, ranguri și anti-abuz

## Implementare

```text
Implement a clean separation between swapleni/tokens and trust rank.

Goal:
Tokens are spendable rewards. Rank is trust/reputation and must not be directly buyable.

Tasks:
1. Inspect current profile/rank/token logic.
2. Add or prepare token ledger:
   - id
   - user_id
   - amount
   - reason
   - source_type
   - source_id
   - created_at
   - unique anti-duplication key
3. Add reward events for:
   - profile completion
   - first item
   - completed exchange
   - feedback
   - validated story
   - approved blog contribution
4. Add anti-abuse:
   - monthly caps
   - one reward per source
   - no reward before moderation/approval
5. Rank should be calculated from:
   - completed exchanges
   - positive feedback
   - verified profile
   - low disputes
   - response reliability
   - validated stories
6. Blog contributions can give editorial badges/tokens, not direct swap trust.
7. Add badges:
   - Contributor
   - Guide Maker
   - Storyteller
   - Trusted Swapper
   - Ambassador

Acceptance criteria:
- Tokens and rank are separate.
- Token ledger prevents duplicates.
- Blog rewards do not directly inflate trust rank.
- Story/exchange rewards require validation.
- Build passes.
```

## Audit

```text
Audit token/rank implementation.

Check:
1. Are tokens spendable and separate from rank?
2. Is there a ledger?
3. Are duplicate rewards prevented?
4. Are rewards delayed until approval/validation where required?
5. Can rank be bought directly? This should be NO.
6. Are blog rewards separated from swap trust?
7. Are abuse caps considered?
8. Does build pass?

Report economic/abuse risks.
```

## Reparare

```text
Repair token/rank implementation.

Rules:
- Do not allow direct rank purchase.
- Do not award duplicate tokens.
- Do not award before moderation/validation.
- Keep blog contribution reputation separate from swap trust.
- Fix build/type errors.

Rerun audit and report final status.
```

---

# 28. Prompt 13 — Supabase/RLS audit

## Implementare

```text
Perform a Supabase security and RLS audit for Swaply.

Goal:
Ensure private user data, profiles, messages, swaps, stories, tokens and blog moderation data are protected.

Tasks:
1. Inspect migrations, Supabase client usage and table access patterns.
2. Identify tables that should be public, private or owner-only.
3. Pay special attention to:
   - profiles
   - items
   - messages
   - swaps/exchanges
   - stories
   - story consent
   - token_ledger
   - blog_suggestions
   - blog_feedback
   - notifications
4. Public profile views must not expose private data.
5. Messages must be visible only to participants.
6. Token ledger must be visible only to owner/admin.
7. Story drafts must be visible only to author/participants/admin.
8. Blog suggestions should not be public.
9. Add safe migrations only after understanding frontend needs.

Acceptance criteria:
- RLS risks are documented.
- Safe migrations are added where unambiguous.
- No frontend page breaks due to over-restrictive RLS.
- Build passes if code changes are made.
```

## Audit

```text
Audit Supabase/RLS changes.

Check:
1. Are public tables intentionally public?
2. Are private tables protected?
3. Are profiles split between public profile data and private profile data?
4. Are messages participant-only?
5. Are story drafts protected?
6. Are token ledgers protected?
7. Are blog suggestions/feedback protected appropriately?
8. Did any page break because of RLS?
9. Are migrations reversible or safe?

Report risks and exact tables.
```

## Reparare

```text
Repair Supabase/RLS issues.

Rules:
- Do not make all profiles public if private fields exist.
- Do not break item browsing.
- Do not expose messages, tokens, private profile fields or story drafts.
- If unsure, create public views instead of exposing raw tables.
- Fix frontend queries affected by stricter RLS.

Rerun audit and report final status.
```

---

# 29. Prompt 14 — Audit final Playwright / build / mobil

## Implementare

```text
Run a full implementation audit of Swaply after the previous changes.

Check:
1. npm install if needed
2. lint
3. typecheck
4. build
5. Playwright or available smoke tests
6. Public routes:
   - /en
   - /ro
   - /en/objects
   - /en/explore
   - /en/matching
   - /en/messages
   - /en/exchange
   - /en/chat
   - /en/properties
   - /en/services
   - /en/events
   - /en/blog
   - /en/about
   - /en/contact
7. Repeat a subset for a non-EN locale.
8. Check mobile screenshots.
9. Check contextual drawer presence.
10. Check logged-out public pages.
11. Check no RO/EN-only assumptions.
12. Check no obvious empty pages.
13. Check no broken footer/bottom nav.

Produce a clear report.
```

## Audit

```text
Audit the audit itself.

Verify:
1. Were all required routes actually tested?
2. Were both desktop and mobile checked?
3. Was at least one non-EN/non-RO locale checked?
4. Were screenshots/artifacts generated if available?
5. Were failures clearly separated from warnings?
6. Were build/lint/type errors copied exactly?
7. Were fixes attempted only after identifying root cause?

Report whether the testing was complete enough.
```

## Reparare

```text
Repair all critical failures from the final audit.

Rules:
- Fix build/type/lint errors first.
- Fix broken public routes second.
- Fix mobile navigation/drawer overlap third.
- Fix missing translations/fallback fourth.
- Do not start new features during repair.
- Stop after all critical checks pass or after 3 repair loops, then report remaining blockers honestly.

Rerun final checks and report status.
```

---

## 30. Recomandare pentru lucrul agentic noaptea

Pentru lucru autonom peste noapte, nu se recomandă să fie dat tot proiectul odată. Se aleg 2–4 prompturi izolate, cu risc mic/mediu.

Pot fi lăsate noaptea:

1. Audit global-first + fallback limbi.
2. Contextual drawer foundation.
3. Paginile nelogate mai vii.
4. Integrare blog în Home/public pages.

Nu se recomandă nesupravegheat:

- RLS dur pe Supabase;
- token ledger complet;
- schimburi circulare reale;
- story publishing cu consimțământ;
- modificări mari de profil/auth;
- migrații complexe fără backup.

Pentru acestea se cere întâi audit și propunere, apoi implementare controlată.

---

## 31. Instrucțiuni de folosire în chat-uri viitoare

Într-un chat nou, Petru poate încărca acest document și poate spune:

```text
Te rog să citești documentul atașat. Este memoria de produs pentru Swaply. Respectă regulile global-first, nu reduce la MVP, nu duplica navigația, păstrează Blog și Stories separate, iar înainte de implementare fă auditul cerut în document.
```

Pentru un agent de cod, se poate folosi:

```text
Citește documentul Swaply atașat și execută doar Promptul [număr]. După implementare execută promptul de audit aferent. Dacă auditul eșuează, execută promptul de reparare. Nu continua la alt prompt până când verificările nu trec sau până când raportezi sincer blocajul.
```

---

## 32. Esența proiectului

Swaply poate fi mai mult decât un marketplace. Marketplace-urile conectează anunțuri. Swaply trebuie să conecteze oameni, obiecte, servicii, proprietăți, evenimente, povești și sens.

Un obiect nu este doar un item. Un om nu este doar un user. Un schimb nu este doar o tranzacție. Aceasta este diferența strategică a proiectului.

---

## 33. Capitol nou: AI ca strat transversal în Swaply

AI-ul în Swaply nu trebuie gândit ca un buton separat de tip „folosește AI”. AI-ul trebuie să fie un strat transversal care ajută fiecare etapă a platformei: onboarding, adăugare obiect, recunoaștere, categorii, subcategorii, căutare după fotografie, matching, chat, traducere, moderare, exchange, stories, blog, tokeni, ranguri, audit și admin.

Principiul central:

**AI-ul în Swaply este facilitator, nu proprietarul deciziilor. Ajută userii să descrie, traducă, clasifice, caute, potrivească, negocieze, modereze, finalizeze și povestească schimburile. Trebuie să păstreze întotdeauna alegerea omului, consimțământul, confidențialitatea, accesul multilingv și încrederea.**

Reguli de produs:

1. AI-ul nu decide schimburi în locul oamenilor.
2. AI-ul explică de ce recomandă ceva.
3. AI-ul trebuie să poată fi refuzat sau corectat de user.
4. Orice predicție AI importantă trebuie confirmată de om.
5. Formularul de adăugare obiect trebuie să funcționeze și fără AI.
6. Chatul trebuie să funcționeze și fără sumarizare/traducere AI, dar cu degradare elegantă.
7. AI-ul nu inventează povești personale.
8. AI-ul poate reformula, traduce, anonimiza și verifica, dar userul aprobă publicarea.
9. AI-ul nu aplică sancțiuni finale fără reguli clare și/sau review uman.
10. AI-ul trebuie să respecte lanțul de limbi al userului, nu să cadă vizibil direct în engleză.

## 34. Unde intervine AI-ul în produs

### 34.1 Profil și onboarding

AI-ul poate:

- sugera o bio scurtă pe baza preferințelor userului;
- detecta limba probabilă, dar cere confirmare;
- recomanda a doua și a treia limbă;
- explica de ce un profil complet crește șansa de schimb;
- avertiza dacă userul publică date personale excesive;
- sugera preferințe de schimb: local, curier, internațional, rapid, cu poveste, cu valori apropiate.

AI-ul nu trebuie să inventeze identitatea omului și nu trebuie să forțeze completarea datelor sensibile.

### 34.2 Adăugare obiect / item creation

Aceasta este una dintre cele mai importante zone AI:

- recunoașterea obiectului din fotografie;
- detectarea categoriei și subcategoriei;
- sugestie de titlu;
- sugestie de descriere;
- detectare stare: nou, foarte bun, utilizat, defect, antichitate;
- estimare valoare aproximativă;
- detectare brand/model, dacă se poate;
- generare taguri;
- avertizare dacă fotografia este neclară;
- sugestii pentru fotografii mai bune;
- detectare obiect fragil;
- sugestii de ambalare;
- avertizare pentru obiecte interzise sau sensibile;
- întrebare despre valoare sentimentală;
- ajutor la scrierea poveștii obiectului.

Regulă: AI-ul propune, userul confirmă. Câmpurile completate automat trebuie să fie editabile.

### 34.3 Căutare după fotografie

Swaply trebuie să aibă funcția:

**Caută după fotografie**

Userul încarcă o poză cu un obiect dorit. AI-ul identifică obiectul și caută:

- obiecte similare;
- obiecte compatibile, nu doar identice;
- alternative apropiate;
- useri care oferă ceva similar;
- useri care cer acel tip de obiect.

Funcția inversă:

**Am acest obiect. Cine îl vrea?**

AI-ul identifică obiectul oferit și caută dorințe, cereri sau lanțuri de schimb compatibile, chiar dacă userii au folosit termeni diferiți.

### 34.4 Explore / Objects / Properties / Services / Events

AI-ul trebuie să permită căutare semantică, nu doar filtre mecanice.

Exemple de căutări pe care AI-ul trebuie să le înțeleagă:

- „vreau ceva pentru copil de 10 ani”;
- „caut ceva util pentru cabinet”;
- „am nevoie de cazare 3 nopți în Italia”;
- „pot oferi reparații contra obiecte”;
- „am bilete și cazare, dar nu mai pot merge”.

AI-ul transformă intenția în filtre, categorii, subcategorii, propuneri de matching și explicații.

### 34.5 Matching

Matchingul trebuie să fie una dintre zonele principale AI. Nu ajunge un singur scor. AI-ul trebuie să poată calcula și explica mai multe scoruri:

- scor de valoare economică;
- scor de categorie/subcategorie;
- scor logistic: distanță, curier, țară, timp;
- scor de limbă;
- scor de încredere;
- scor de intenție;
- scor sentimental / meaning match;
- scor de risc;
- scor pentru schimb circular.

AI-ul trebuie să poată propune:

- schimb 1 la 1;
- schimb 1 la mai multe obiecte;
- mai multe obiecte contra unul;
- obiect contra serviciu;
- obiect contra proprietate/cazare;
- obiect contra eveniment;
- schimb circular cu 3 useri;
- lanț cu 4–5 useri;
- diferență compensată prin swapleni.

Regulă: AI-ul recomandă și explică. Omul decide.

### 34.6 Chat, traducere și moderare

AI-ul în chat trebuie să ajute conversația, nu să o controleze.

Funcții recomandate:

- traducere automată în limba principală a userului;
- fallback în a doua și a treia limbă;
- păstrarea mesajului original;
- buton „arată originalul”;
- rezumat de conversație;
- extragerea acordurilor importante;
- checklist: stare obiect, livrare, dată, loc, costuri;
- reformulare politicoasă;
- răspunsuri sugerate;
- refuz elegant;
- avertizare dacă cineva cere date personale prea devreme;
- avertizare dacă tonul devine agresiv;
- detectare scam, spam sau presiune;
- raportare și escaladare către review uman.

Moderarea trebuie să urmărească:

- injurii;
- amenințări;
- scam;
- cereri suspecte de bani;
- mutarea conversației prea devreme în afara platformei;
- date personale sensibile;
- adrese exacte trimise prea devreme;
- tentative de fraudă;
- presiune emoțională;
- obiecte interzise sau ilegale.

Acțiuni posibile:

- avertisment discret;
- cerere de reformulare;
- ascundere temporară până la confirmare;
- raportare către admin;
- blocare temporară;
- escaladare pentru review uman.

### 34.7 Exchange

AI-ul poate ghida finalizarea schimbului:

- verifică dacă pașii sunt clari;
- creează checklist de predare;
- sugerează ambalare;
- sugerează mod de curier/predare;
- explică riscuri la schimb internațional;
- verifică dacă un eveniment are termen-limită;
- verifică dacă o rezervare/bilet pare transferabil;
- rezumă acordul final;
- ajută la dispută prin extragerea cronologiei;
- recomandă pași de remediere.

AI-ul nu judecă definitiv o dispută. El pregătește informația pentru useri/admin.

### 34.8 Stories

AI-ul poate ajuta la Stories, dar nu inventează povestea.

Funcții:

- propune titlu;
- reformulează povestea userului;
- scurtează și clarifică;
- traduce în limbile active;
- anonimizează;
- elimină date personale;
- propune variantă publică și variantă privată;
- verifică tonul;
- verifică existența consimțământului;
- blochează publicarea dacă există adresă exactă sau date sensibile.

Regulă: povestea finală publică trebuie aprobată de om.

### 34.9 Blog

Blogul este diferit de Stories. AI-ul poate ajuta editorial:

- propune articole noi pe baza întrebărilor userilor;
- identifică subiecte lipsă;
- scrie draft editorial;
- verifică claritatea;
- traduce în toate limbile active;
- salvează traduceri în Supabase/cache;
- generează SEO title/description;
- recomandă articole relevante în drawer;
- detectează duplicate;
- verifică riscuri legale sau conținut nepermis.

Comentariile libere trebuie amânate până există moderare completă. Mai sigur: feedback structurat și sugestii de articole.

### 34.10 Admin, audit și anti-abuz

AI-ul poate ajuta adminii cu:

- coadă de moderare;
- sumar de rapoarte;
- traduceri lipsă;
- texte hardcodate;
- pagini goale;
- drawer lipsă;
- articole incomplete;
- stories în așteptare;
- sugestii de blog;
- dispute;
- useri cu risc;
- obiecte posibil interzise;
- audit global-first;
- audit SEO.

AI-ul poate detecta comportamente suspecte:

- farming de swapleni;
- povești false;
- feedback artificial;
- schimburi repetate între aceiași useri pentru puncte;
- spam de sugestii;
- conturi multiple;
- mesaje copiate;
- obiecte duplicate.

Sancțiunile definitive trebuie să fie bazate pe reguli clare și/sau review uman.

## 35. Cum alegem AI-ul pentru Swaply

Nu trebuie ales „un singur AI pentru tot”. Swaply trebuie să aibă o arhitectură cu **AI gateway** și **model registry**, astfel încât fiecare task să poată folosi cel mai bun model disponibil pentru acel scop, cu fallback.

Regulă:

**Nu alegem AI-ul după marketing sau entuziasm. Alegem AI-ul prin benchmark intern Swaply, pe date reale/similare cu Swaply, în toate limbile importante și cu măsurare de cost, calitate, latență, siguranță și fallback.**

Criterii de alegere:

1. Calitate pe taskul concret: vision, traducere, matching, moderare, sumarizare.
2. Acoperire multilingvă reală, nu doar RO/EN.
3. Capacitate de output structurat JSON/schema.
4. Cost pe 1.000 de operații reale Swaply.
5. Latență acceptabilă pe mobil.
6. Fiabilitate API și limite de rată.
7. Capacitate de fallback la alt model.
8. Privacy/GDPR și minimizarea datelor trimise.
9. Suport pentru imagini, embeddings, reranking, moderare.
10. Calitate la texte scurte de chat, nu doar la articole lungi.
11. Rezistență la prompt injection și abuz.
12. Observabilitate: loguri, cost, erori, versiuni.
13. Posibilitate de cache și batch processing.
14. Risc de vendor lock-in.
15. Capacitate de a lucra cu 43 de limbi fără reparații manuale constante.

Tipuri de modele necesare:

- model multimodal/vision pentru recunoașterea obiectelor;
- model de limbaj pentru descrieri, chat, stories, blog;
- model de traducere sau LLM foarte bun la traduceri;
- embeddings pentru căutare semantică și matching;
- reranker pentru ordonarea rezultatelor;
- model/modul de moderare;
- eventual model specializat pentru OCR/documente;
- eventual model local/ieftin pentru taskuri simple.

Strategie recomandată:

- provider principal per task;
- provider secundar fallback;
- fallback non-AI când nu merge niciun provider;
- cache agresiv pentru traduceri, blog, stories, descrieri și clasificări stabile;
- model registry în baza de date sau config;
- prompt registry cu versiuni;
- evaluări automate înainte de schimbarea modelului.

Benchmark intern minim:

1. 200–500 imagini de obiecte din categorii diferite.
2. 100 obiecte cu categorii/subcategorii corecte.
3. 100 cazuri de matching direct.
4. 50 cazuri de matching circular.
5. 200 mesaje chat în limbi diferite.
6. 100 mesaje problematice pentru moderare.
7. 30 articole blog de test.
8. 30 stories de test cu date sensibile de anonimizat.
9. Test pe cel puțin 10–15 limbi înainte de extindere completă la 43.
10. Raport: calitate, cost, latență, rate de eroare, fallback, cache hit.

## 36. Cum implementăm AI-ul

AI-ul nu trebuie apelat direct din componente React și nu trebuie împrăștiat în cod. Trebuie creat un strat separat.

Structură recomandată:

```text
src/lib/ai/
  gateway.ts
  model-registry.ts
  task-router.ts
  providers/
  tasks/
  schemas/
  prompts/
  cache.ts
  moderation.ts
  cost-tracking.ts
  evals/
```

API routes / server actions posibile:

```text
/api/ai/classify-item
/api/ai/search-by-photo
/api/ai/generate-item-description
/api/ai/estimate-value
/api/ai/match
/api/ai/translate
/api/ai/moderate-chat
/api/ai/summarize-chat
/api/ai/story-assist
/api/ai/blog-assist
/api/ai/audit-global-first
```

Tabele Supabase recomandate:

- `ai_model_registry`
- `ai_prompt_versions`
- `ai_requests`
- `ai_cache`
- `ai_translation_cache`
- `ai_moderation_events`
- `ai_eval_cases`
- `ai_eval_results`
- `ai_usage_budgets`
- `ai_user_feedback`

Câmpuri utile pentru `ai_requests`:

- id;
- user_id;
- task_type;
- provider;
- model;
- prompt_version;
- input_hash;
- output_hash;
- locale;
- source_locale;
- target_locale;
- status;
- latency_ms;
- estimated_cost;
- cache_hit;
- error_code;
- created_at.

Reguli de implementare:

1. Toate outputurile importante trebuie validate prin schema.
2. Prompturile trebuie versionate.
3. Fiecare task AI trebuie să aibă timeout.
4. Fiecare task AI trebuie să aibă fallback.
5. Fiecare task AI trebuie să aibă cost tracking.
6. Traducerile trebuie cache-uite prin hash.
7. Blogurile și stories se traduc preferabil în batch și se servesc din cache.
8. Chatul se traduce on-demand, dar cu cache pe mesaj.
9. Matchingul combină reguli + embeddings + AI explanation, nu doar LLM liber.
10. Moderarea trebuie să aibă praguri clare și review uman pentru cazuri grave.
11. Datele sensibile trebuie minimizate sau redactate înainte de trimiterea către AI.
12. Cheile API nu trebuie expuse în client.
13. Dacă AI-ul pică, UX-ul trebuie să spună clar ce funcționează manual.

## 37. Prompt 15 — Arhitectură AI Gateway

### Implementare

```text
Analyze the Swaply repository and implement the foundation for a modular AI gateway.

Goal:
Do not call AI providers directly from UI components. All AI tasks must pass through a reusable server-side AI gateway.

Tasks:
1. Inspect current AI usage, environment variables, API routes and server actions.
2. Create or prepare src/lib/ai/gateway.ts.
3. Create model registry and task router abstractions.
4. Define task types:
   - classify_item
   - search_by_photo
   - generate_item_description
   - estimate_value
   - translate
   - match
   - moderate_chat
   - summarize_chat
   - story_assist
   - blog_assist
   - global_first_audit
5. Add provider abstraction with primary/fallback support.
6. Add timeout/error handling.
7. Add cost and latency logging hooks.
8. Add schema validation for AI outputs.
9. Ensure no API keys are exposed client-side.
10. Preserve existing functionality.

Acceptance criteria:
- AI calls are routed through a gateway or clearly prepared for it.
- Task types are defined.
- Provider fallback is possible.
- Build passes.
```

### Audit

```text
Audit the AI gateway implementation.

Check:
1. Are AI calls centralized server-side?
2. Are task types clear?
3. Is provider fallback supported or planned?
4. Are API keys protected?
5. Is schema validation present for important outputs?
6. Are timeout/error states handled?
7. Is cost/latency logging possible?
8. Does build pass?

Report PASS/FAIL and risks.
```

### Reparare

```text
Repair the AI gateway implementation.

Rules:
- Do not expose API keys in client code.
- Do not scatter provider calls across UI components.
- Add fallback and graceful error handling.
- Add missing schema validation.
- Fix build/type errors.

Rerun audit and report final status.
```

## 38. Prompt 16 — Alegerea modelelor AI prin benchmark intern

### Implementare

```text
Design and implement a lightweight AI benchmark/evaluation framework for Swaply.

Goal:
Choose AI models per task using Swaply-specific test cases, not assumptions.

Tasks:
1. Create evaluation case format for:
   - item image classification
   - category/subcategory detection
   - translation quality
   - chat moderation
   - matching explanation
   - story anonymization
   - blog draft quality
2. Add a place for gold expected outputs where possible.
3. Add scoring dimensions:
   - quality
   - locale coverage
   - latency
   - cost
   - JSON/schema correctness
   - safety
   - fallback behavior
4. Add a script or documented process to run evaluations.
5. Do not hardcode one vendor as permanent.
6. Store or export evaluation results.

Acceptance criteria:
- There is a repeatable way to compare AI providers/models.
- Evaluation covers multilingual behavior.
- Evaluation includes cost and latency.
- Build passes if code is changed.
```

### Audit

```text
Audit the AI benchmark design.

Check:
1. Does it compare models per task?
2. Does it include non-EN/non-RO languages?
3. Does it measure cost and latency?
4. Does it check schema correctness?
5. Does it include safety/moderation tests?
6. Does it avoid vendor lock-in?
7. Is it repeatable?

Report gaps.
```

### Reparare

```text
Repair the AI benchmark implementation.

Rules:
- Add missing multilingual cases.
- Add cost/latency fields.
- Add schema validation checks.
- Do not make a permanent one-model assumption.
- Fix build/type errors.

Rerun audit and report final status.
```

## 39. Prompt 17 — Recunoaștere obiect, categorie și subcategorie

### Implementare

```text
Implement the foundation for AI item recognition and classification.

Goal:
When a user uploads or photographs an object, AI should help identify it, suggest category/subcategory, title, description, tags, condition, value and packaging hints.

Tasks:
1. Inspect current item add/edit flow and image upload flow.
2. Add server-side AI task classify_item.
3. Output schema must include:
   - detected_object
   - category
   - subcategory
   - title_suggestions
   - description_suggestion
   - condition_guess
   - estimated_value_range
   - currency
   - tags
   - fragility
   - packaging_hint
   - confidence
   - safety_flags
4. All AI-filled fields must be editable by user.
5. Item creation must work if AI fails.
6. Generated text must use user locale/fallback chain.
7. Add clear UI state: analyzing, success, low confidence, failed.

Acceptance criteria:
- AI can propose item metadata.
- User confirms/edits everything.
- Non-AI fallback works.
- Build passes.
```

### Audit

```text
Audit item AI recognition.

Check:
1. Does item creation still work without AI?
2. Are suggestions editable?
3. Is confidence shown or handled?
4. Are category/subcategory outputs structured?
5. Are safety flags considered?
6. Are generated texts locale-aware?
7. Are API keys protected?
8. Does build pass?

Report failures.
```

### Reparare

```text
Repair item AI recognition.

Rules:
- Do not block manual item creation.
- Do not trust AI output without validation.
- Keep user confirmation/editing.
- Add graceful failure states.
- Fix build/type errors.

Rerun audit and report final status.
```

## 40. Prompt 18 — Traduceri AI, cache și chat moderation

### Implementare

```text
Implement the foundation for AI translation cache and chat moderation.

Goal:
Chat and content translations must respect the user language fallback chain and minimize cost through caching. Chat moderation must protect users without overblocking normal conversation.

Tasks:
1. Inspect existing translateOnDemand and translation cache logic.
2. Create or improve translation cache key:
   content_hash + source_locale + target_locale + domain + prompt_version.
3. Apply user fallback chain:
   primary -> secondary -> tertiary -> route/browser -> source -> English as last technical fallback.
4. Preserve original chat message.
5. Store/display translated message separately.
6. Add show original option.
7. Add moderate_chat task with structured output:
   - safe
   - warning_level
   - categories
   - suggested_action
   - user_message
8. Moderation categories must include scam, abuse, pressure, personal data, exact location too early, prohibited goods.
9. Serious cases go to review, not silent deletion.
10. Track cost/cache hits.

Acceptance criteria:
- Translations use cache.
- Chat respects user language preferences.
- Original messages are preserved.
- Moderation is structured and reviewable.
- Build passes.
```

### Audit

```text
Audit translation and moderation.

Check:
1. Is English only last technical fallback?
2. Are translations cached?
3. Is original chat text preserved?
4. Can user show original?
5. Is moderation structured?
6. Are false positives handled with review/escalation?
7. Are sensitive data and exact location protected?
8. Does build pass?

Report risks.
```

### Reparare

```text
Repair translation/moderation implementation.

Rules:
- Do not overwrite original messages.
- Do not fall back visibly to English too early.
- Do not silently delete messages without clear rules.
- Add cache where missing.
- Fix build/type errors.

Rerun audit and report final status.
```

## 41. Prompt 19 — AI Matching și explicații

### Implementare

```text
Implement the foundation for AI-assisted matching explanations.

Goal:
AI must help explain and rank matches, but not decide or auto-confirm swaps.

Tasks:
1. Inspect current matching logic.
2. Define match scoring dimensions:
   - financial_value
   - category_fit
   - logistics_fit
   - language_fit
   - trust_fit
   - intention_fit
   - sentimental_meaning_fit
   - risk_score
   - circular_swap_fit
3. Add structured AI explanation for each suggested match.
4. Matching must support future direct and circular swaps.
5. AI can propose swapleni adjustment but cannot force it.
6. AI explanation must be localizable.
7. User must choose, save, reject or start chat.
8. Unfinished advanced modes must be gracefully disabled or labeled as preview.

Acceptance criteria:
- Match explanation is structured.
- AI does not auto-confirm swaps.
- Human decision is explicit.
- Build passes.
```

### Audit

```text
Audit AI matching.

Check:
1. Are match dimensions separated?
2. Are explanations understandable?
3. Is AI prevented from deciding automatically?
4. Are circular swaps only proposed, not auto-finalized?
5. Is user choice explicit?
6. Is explanation localizable?
7. Does build pass?

Report issues.
```

### Reparare

```text
Repair AI matching.

Rules:
- Do not auto-confirm or auto-finalize any swap.
- Keep explanations advisory.
- Disable unfinished actions gracefully.
- Fix localizable text.
- Fix build/type errors.

Rerun audit and report final status.
```

## 42. Prompt 20 — AI observability, cost control și privacy

### Implementare

```text
Implement AI observability, cost control and privacy guardrails.

Goal:
AI usage must be measurable, controllable and safe.

Tasks:
1. Add or prepare ai_requests logging.
2. Track task_type, provider, model, prompt_version, locale, latency, cost estimate, cache_hit, error_code.
3. Do not store raw sensitive content unless required and protected.
4. Store hashes for cache/dedup where possible.
5. Add budget limits per task/user/day if feasible.
6. Add admin-visible summary metrics:
   - requests by task
   - cost estimate
   - cache hit rate
   - errors
   - slow tasks
7. Add privacy redaction before AI calls where practical.
8. Add failure modes visible to user.
9. Document what data is sent to AI providers.

Acceptance criteria:
- AI usage can be audited.
- Cost can be monitored.
- Cache hit rate can be measured.
- Sensitive data is minimized.
- Build passes.
```

### Audit

```text
Audit AI observability and privacy.

Check:
1. Are AI requests logged enough for audit?
2. Are raw sensitive messages avoided/minimized?
3. Are costs/latency/cache hits tracked?
4. Are budgets or caps planned?
5. Are failures visible and graceful?
6. Is provider data-sharing documented?
7. Does build pass?

Report privacy/cost risks.
```

### Reparare

```text
Repair AI observability and privacy.

Rules:
- Do not log sensitive raw content unnecessarily.
- Add hashes instead of full input where possible.
- Add missing cost/cache/error fields.
- Add graceful failure states.
- Fix build/type errors.

Rerun audit and report final status.
```

## 43. Prompt 21 — Audit AI global-first continuu

### Implementare

```text
Create an AI/global-first audit command or checklist for Swaply.

Goal:
Prevent future regression where new features become RO/EN-first, non-translated, non-cached or AI calls are scattered.

Audit should detect:
1. Hardcoded public strings in components.
2. Missing translations for active locales.
3. Visible English fallback before user language chain is exhausted.
4. Pages without contextual drawer.
5. Logged-out pages that are empty or regional.
6. Blog posts not translated/cached.
7. Stories without consent checks.
8. AI calls outside AI gateway.
9. Missing prompt version or model logging.
10. Missing graceful fallback when AI fails.

Acceptance criteria:
- There is a repeatable audit process.
- It reports exact files/routes where possible.
- It does not modify code unless explicitly asked.
```

### Audit

```text
Audit the audit process.

Check:
1. Does it detect hardcoded strings?
2. Does it check all active locales?
3. Does it check fallback chain problems?
4. Does it detect AI calls outside gateway?
5. Does it check drawer coverage?
6. Does it produce actionable output?

Report weaknesses.
```

### Reparare

```text
Repair the AI/global-first audit process.

Rules:
- Make reports actionable.
- Avoid noisy false positives where possible.
- Do not auto-edit production files during audit.
- Add missing checks for AI gateway and translations.

Rerun audit and report final status.
```

## 44. Recomandare practică pentru implementare AI în etape sigure

Pentru lucru agentic peste noapte, AI-ul trebuie implementat în ordine sigură:

1. Audit: unde există deja AI, traduceri, cache, HuggingFace, Supabase, prompts.
2. AI Gateway: centralizare fără schimbări mari de UX.
3. Translation cache: repară global-first înainte de funcții spectaculoase.
4. Item classification: recunoaștere obiect + categorie/subcategorie, cu fallback manual.
5. Chat translation + original message preservation.
6. Moderare chat cu avertismente și review, nu blocare agresivă.
7. Matching explanations, fără auto-confirmare.
8. Stories/blog AI assist, cu consimțământ și cache.
9. Observability/cost control.
10. Benchmark modele și provider fallback.

Nu se recomandă peste noapte, fără supraveghere:

- sancțiuni automate finale;
- schimburi circulare reale finalizabile;
- publicare automată stories;
- migrații RLS agresive;
- înlocuirea completă a furnizorului AI;
- rescrierea tuturor traducerilor.

Formula finală pentru agenți:

```text
AI in Swaply is a facilitator, not the owner of decisions. Implement AI through a modular server-side gateway, with task-specific model routing, fallback providers, schema validation, cache, cost tracking, privacy guardrails and global-first language fallback. Do not build RO/EN-only AI features. Do not block core user flows when AI fails. Human confirmation is required for item metadata, match decisions, story publication and dispute outcomes.
```
