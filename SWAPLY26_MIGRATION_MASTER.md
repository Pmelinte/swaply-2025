# SWAPLY26_MIGRATION_MASTER.md

## 0. Scopul documentului

Acest document este sursa canonică pentru migrarea controlată a proiectului `swaply-2025` către noua generație de produs, numită `Swaply26`.

### Principiul de bază
`Swaply26` NU este un produs inventat separat de `swaply-2025`.
`Swaply26` este:
- reorganizarea,
- curățarea,
- reorchestrarea,
- securizarea,
- unificarea lingvistică,
- și dinamizarea

a tot ce există valoros deja în `swaply-2025`, fără pierdere de funcționalități importante.

### Obiectiv central
Să transformăm `swaply-2025` dintr-un ecosistem mare de pagini și funcții într-un produs:
- flow-first,
- mobile-first,
- fully translated,
- mai clar pentru utilizator,
- mai coerent pentru business,
- mai ușor de dus spre PWA / iOS / Android,
- fără să aruncăm la gunoi activele deja construite:
  - i18n în 43 de limbi,
  - pagini publice,
  - blog,
  - SEO,
  - monetizare,
  - sponsori,
  - 52 Weeks,
  - API-uri,
  - email,
  - push,
  - admin,
  - audit,
  - infrastructură.

---

## 1. Reguli obligatorii de migrare

### 1.1. Nu se pornește de la zero
Orice funcție, pagină, API, integrare sau sistem deja existent în `swaply-2025` trebuie:
1. identificat,
2. inventariat,
3. clasificat,
4. și abia apoi refactorizat, mutat sau reorchestrat.

### 1.2. Nu se elimină nimic important fără mapare explicită
Nicio funcționalitate importantă nu se șterge sau abandonează fără:
- identificarea locului actual în `swaply-2025`,
- justificare clară,
- și mapare către locul nou din `Swaply26`.

### 1.3. Sistemul i18n existent se păstrează
`swaply-2025` are deja o bază valoroasă de traduceri UI în 43 de limbi.
Aceasta NU se aruncă.
Se păstrează, se inventariază, se curăță și se completează.

### 1.4. Tot conținutul vizibil trebuie să fie în limba userului
Nu se acceptă mixed language.
Asta se aplică la:
- meniuri,
- etichete,
- butoane,
- mesaje sistem,
- validări,
- notificări,
- chat,
- titluri și descrieri de listinguri,
- wanted,
- servicii,
- proprietăți,
- evenimente,
- conținut editorial vizibil.

### 1.5. Fluxul este mai important decât pagina
Noul produs nu se organizează în jurul unei colecții de pagini egale.
Se organizează în jurul unei curgeri principale.

### 1.6. Funcțiile avansate apar contextual
Escrow, dispute, travel, insurance, sponsors, packaging, tokens, monetizare, ads, logistics etc. nu trebuie să sufoce începutul experienței.
Ele trebuie să apară când au sens.

### 1.7. Audit de build și integritate după fiecare schimbare majoră
După orice task major:
- build curat,
- fără erori,
- fără regresii evidente pe i18n,
- fără ruperea rutelor critice.

### 1.8. Securitatea critică este fundație, nu polish
Trebuie tratate ca bază:
- middleware server-side pentru protecție,
- rate limiting persistent,
- webhook signature validation,
- logging structurat,
- protecție API reală,
- separare clară public/auth/admin.

---

## 2. Sursa de adevăr de pornire

Migrarea trebuie să pornească din următoarele surse:

### 2.1. Proiectul existent
- `swaply-2025`
- GitHub repo principal
- deploymenturi Vercel
- build logs
- rute și API-uri expuse

### 2.2. Documente strategice și operaționale
Se preiau și se integrează, nu se ignoră:
- Master Prompt Book
- Audit Complet Martie 2026
- Faza 1 Specificații Complete
- Master Ghid de Promovare
- Master Strategy Book
- Plan Lansare 90 Zile
- 52 Weeks Calendar
- Ghiduri de conținut / email / legal / onboarding / admin
- modelele financiare și sponsor DB

### 2.3. Auditul tehnic și funcțional deja făcut
Tot ce a fost deja descoperit în:
- Vercel build routes,
- Playwright audit public,
- capturi și audit vizual,
- audit documentat

trebuie folosit ca material de migrare.

---

## 3. Definiția corectă a lui Swaply26

`Swaply26` este:
- aceeași platformă de schimb,
- cu aceleași active importante,
- dar reorganizată într-o experiență mult mai clară.

### Nu este:
- un „MVP nou”,
- o tăiere brutală,
- un produs separat făcut în orb.

### Este:
- migrarea controlată a lui `swaply-2025`
- într-un produs:
  - flow-first,
  - mobile-first,
  - multilingual clean,
  - more dynamic,
  - more secure,
  - easier to understand,
  - easier to monetize coherently.

---

## 4. Inventarul de funcționalități care trebuie preluate din swaply-2025

Acest inventar este minimul confirmat deja din Vercel, audit și documente. El trebuie rafinat continuu în timpul migrației.

### 4.1. Paginile și zonele deja confirmate
Trebuie considerate active reale ale proiectului:
- homepage localizat
- about
- blog
- blog article
- blog categories
- contact
- cookies
- copyright
- DMCA
- eco
- events
- favorites
- feedback
- history
- info
- integrations
- leaderboard
- login
- register
- match
- chat
- change
- monetization
- my-objects
- notifications
- objects
- object detail
- object edit
- objects by category
- objects by city
- new object
- partners
- pricing
- privacy
- profile
- profile analytics
- safety
- terms
- wanted
- admin
- admin items
- admin reports
- admin services
- admin users

### 4.2. API-urile și sistemele deja confirmate
Trebuie considerate active reale:
- ai
- ai/chat-assist
- ai/image
- ai/match
- audit
- bundles
- bundles/lock
- chains
- chains/confirm
- chains/detect
- contact
- courier/*
- dhl/*
- disputes/*
- dmca/report
- email/*
- embeddings
- escrow/*
- events
- gdpr/*
- health
- insurance/*
- items/recent
- match-semantic
- moderate
- packaging/recommend
- payments/*
- paypal/*
- push/*
- reviews
- search
- services/*
- stats
- subcategories
- swaps/transition
- tokens/*
- translate/*
- travel/*
- verify
- wanted
- admin/translate-*

### 4.3. Infrastructura și sistemele de fundal deja confirmate sau documentate
- i18n cu 43 limbi
- PWA
- push notifications
- email onboarding / email tranzacțional
- blog/content
- SEO pages/content strategy
- analytics/stats
- payments Stripe + PayPal
- moderation
- admin panel
- sponsorship ecosystem
- monetization ecosystem
- 52 Weeks content/sponsor model
- audit runner Playwright

---

## 5. Principiile produsului nou

### 5.1. Flow-first
Experiența principală este construită ca flux, nu ca meniu de pagini egale.

### 5.2. Mobile-first
Designul și curgerea trebuie să fie excelente pe mobil.
Desktopul este o extensie aerisită a aceleiași logici.

### 5.3. Fully translated
Tot ce vede userul trebuie să fie în limba lui.

### 5.4. Public discovery fără login
Vizitatorul trebuie să vadă conținut real fără autentificare.
Interacțiunile pot fi blocate elegant, nu conținutul.

### 5.5. Contextual feature reveal
Funcțiile apar când sunt necesare.

### 5.6. Cross-category native
Sistemul trebuie să permită:
- direct swap,
- chain change,
- bulk change,
- mixed cross-category exchange.

### 5.7. Growth și monetizare integrate, nu ignorate
SEO, sponsori, 52 weeks, ads, onboarding, social growth, partnerships și business model nu se pierd.
Se repoziționează.

---

## 6. Fluxul canonic Swaply26

### 6.1. Intrarea în produs
Utilizatorul află imediat că platforma este pentru schimburi și că există 4 ramuri principale:

1. Obiecte
2. Proprietăți
3. Servicii
4. Evenimente

Aceste 4 ramuri sunt baza.

### 6.2. A doua ramificare
După alegerea ramurii:
- Ce îmi doresc
- Ce pot oferi

### 6.3. A treia ramificare: metoda
Pentru oricare dintre cele două:
1. Swipe
2. Alegere din ofertă
3. Alegere teritorială
4. Căutare liberă

### 6.4. Zona de rezultate
Rezultatele trebuie clasificate clar:
- potriviri directe
- propuneri AI
- chain
- bulk
- mixed

### 6.5. Chat
După intrarea într-o potrivire relevantă:
- chat modern,
- complet,
- tradus automat pentru utilizator,
- cu context clar de schimb.

### 6.6. Butonul Swaply
În chat trebuie să existe un buton / acțiune centrală:
`Swaply`
Acesta marchează:
- confirmarea intenției,
- trecerea din negociere în execuție.

### 6.7. Modul de schimb / finalizare
După confirmare:
- direct
- local
- internațional
- vacanță / contextual travel

Iar apoi apar, doar dacă e nevoie:
- escrow
- packaging
- curieri
- transport
- cazare
- asigurare
- tracking
- dispute handling

---

## 7. Tipurile de schimb care trebuie susținute nativ

### 7.1. Direct
Schimb standard între 2 participanți.

### 7.2. Chain change
Exemplu:
- A oferă lui B
- B oferă lui C
- C oferă lui A

Cerințe:
- detectare de lanț
- propuneri de lanț
- confirmare pentru toți
- coordonare clară

### 7.3. Bulk change
Schimb multiplu / bundle:
- mai multe itemuri / servicii / elemente într-un singur schimb

Cerințe:
- grupare
- lock
- evaluare per bundle
- chat și confirmare la nivel de bundle

### 7.4. Mixed cross-category
Exemple:
- proprietate ↔ eveniment
- serviciu ↔ obiect
- proprietate ↔ serviciu
- eveniment ↔ pachet mixt

Acestea trebuie tratate ca suport nativ, nu excepție.

---

## 8. Profilul nou

Profilul nu trebuie să fie doar cont și date personale.

Trebuie să conțină:

### 8.1. Date de cont
- nume
- contact
- avatar
- limbă
- securitate
- locație

### 8.2. Preferințe de schimb
- local / național / internațional
- direct / curier / vacanță
- alte preferințe logistice

### 8.3. Ce poate oferi
- obiecte
- proprietăți
- servicii
- evenimente

### 8.4. Ce caută
- obiecte
- proprietăți
- servicii
- evenimente

### 8.5. Reguli personale
- accept schimburi mixte
- accept bundle / bulk
- accept chain
- accept diferențe compensate
- preferințe geografice
- preferințe de risc / intermediere

### 8.6. Completare progresivă
Profilul nu trebuie să fie un formular monstruos obligatoriu din prima.
Poate fi completat treptat, dar modelul trebuie proiectat complet din start.

---

## 9. Traducerea

### 9.1. Ce se păstrează
Se păstrează sistemul existent de i18n al `swaply-2025`:
- `next-intl`
- fișierele existente
- cheile existente
- limbile deja traduse

### 9.2. Ce se curăță
- chei lipsă
- hardcodări rămase
- fallback-uri vizibile în altă limbă
- inconsistențe terminologice

### 9.3. UI static
UI-ul trebuie să rămână bazat pe i18n controlat:
- meniuri
- etichete
- butoane
- erori
- toasturi
- validări
- mesaje sistem

### 9.4. Conținut user-generated
Pentru:
- item titles
- item descriptions
- wanted
- services
- properties
- events
- chat messages

trebuie construit un sistem de traducere automată persistentă:
- se păstrează originalul
- se detectează limba sursă
- se generează traducerea pentru limba utilizatorului
- se salvează în DB
- se reutilizează
- se invalidează dacă sursa se schimbă

### 9.5. Regula de aur
Userul trebuie să citească exclusiv în limba lui.
Niciun cuvânt sistemic nu trebuie să apară în altă limbă.

---

## 10. Translation pipeline recomandat

### 10.1. UI
- `next-intl`
- fără AI runtime

### 10.2. User-generated content
Se recomandă provider routing, nu dependență de un singur furnizor.

### 10.3. Provider strategy recomandată
Exemplu:
- DeepL pentru listinguri / texte comerciale
- Google Translate ca fallback / volum / acoperire
- DeepSeek pentru chat și cleanup / normalizare
- Claude pentru texte premium / onboarding / editorial
- providerul trebuie să fie schimbabil

### 10.4. Persistare
Tabele separate pentru traduceri, cu:
- source_language
- target_language
- translated_text
- source_hash
- provider
- model
- status
- timestamps

### 10.5. Execuție
Se recomandă:
- Supabase Edge Functions
sau
- route handlers dedicate

### 10.6. Cost control
Reguli obligatorii:
- nu traduce UI cu AI
- nu traduce toate limbile în avans pentru toate entitățile
- traduce doar la nevoie
- persistă imediat
- retranslate doar când sursa se schimbă

---

## 11. Browsing public fără login

Acesta este un principiu obligatoriu.

### 11.1. Vizitatorul nelogat vede conținut real
Exemple:
- obiecte
- listări
- poze
- titluri
- descrieri
- localitate
- context
- parte din profil public relevantă

### 11.2. Interacțiunile sunt blocate elegant
Exemple:
- propune swap
- trimite mesaj
- confirmă
- favorite private
- acțiuni personale

Acestea pot duce la:
- login/register modal
- CTA contextual

### 11.3. Regula
Conținutul vinde.
Nu peretele de login.

---

## 12. Navigația și UI

### 12.1. Structura generală de culoare
- sus: albastru în degrade
- centru: alb
- jos: verde

Aceasta reflectă:
- orientare / cer / decizie
- claritate / flux
- acțiune / ofertă / concret

### 12.2. Zona de sus
Conține doar:
- logo
- limbă
- progres
- profil discret
- meniu discret

### 12.3. Zona centrală
Conține:
- întrebarea / pasul curent
- alegerea curentă
- rezultatele / cardurile / search-ul / swipe-ul
- CTA-ul principal

### 12.4. Zona de jos
Conține:
- Înapoi
- Pauză
- Continuă

### 12.5. Întoarcerea în flux
Nu trebuie să depindă exclusiv de pagini.
Trebuie să existe:
- buton back
- progress map
- edit chips pentru alegeri
- save/resume

---

## 13. Meniuri și zone discrete

### 13.1. Ce nu trebuie să conducă fluxul principal
Se mută în meniu discret / footer / layer de suport:
- blog
- legal
- GDPR
- terms
- privacy
- cookies
- DMCA
- about
- press
- careers
- integrations
- admin links
- audit / advanced ops

### 13.2. Ce rămâne foarte vizibil
- fluxul principal
- căutarea
- potrivirile
- mesajele
- profilul
- eventual acces la cont

---

## 14. SEO și public discovery

SEO NU trebuie pierdut.

Trebuie păstrate și reorganizate:
- category SEO
- city SEO
- regional SEO
- long-tail pages
- blog
- guides
- FAQ
- structured data
- public stats/info
- public object browsing

### Regula
SEO și paginile publice aduc utilizatori.
Nu trebuie să concureze vizual cu fluxul principal, dar trebuie să existe și să fie bine conectate.

### Important
Trebuie evitată explozia nesănătoasă de build static.
Refacerea trebuie gândită mai dinamic și mai inteligent.

---

## 15. Growth, marketing, promovare, social

Nu se neglijează:
- marketingul
- promovarea
- social proof
- racolarea de useri
- parteneriatele
- share mechanics
- onboardingul
- retention loops
- social links
- sponsor hooks

Acestea trebuie puse într-un growth layer coerent, nu ignorate.

### Trebuie integrate:
- onboarding flows
- welcome email
- push notifications
- public stats
- challenges
- social content
- partnerships pages
- ambassador / beta user mechanics
- real activity seeding, nu demo fake

---

## 16. 52 Weeks ecosystem

Sistemul 52 Weeks NU trebuie pierdut.
Este un activ strategic.

Trebuie păstrat și integrat ca:
- community calendar
- sponsor engine
- weekly activations
- content engine
- badge/challenge system
- partner visibility layer

### Nu trebuie să fie:
- doar o pagină moartă

### Trebuie să fie:
- sistem viu,
- legat de categorii,
- legat de events,
- legat de sponsori,
- legat de growth și monetizare.

---

## 17. Monetizarea

Monetizarea existentă în documente și posibil parțial în produs trebuie păstrată ca univers, nu ignorată.

### Zone de monetizare de păstrat
- ads
- native ads
- sponsored search
- partner placements
- newsletter sponsor
- category/city sponsorship
- premium layers
- boosts
- service commissions / affiliate structures
- sponsor events
- B2B layers
- partner recommendations
- travel / logistics / insurance monetization
- token-related mechanics
- monetization pages and business logic

### Regula
Monetizarea trebuie să existe,
dar fără să sufoce începutul experienței.

---

## 18. Securitate și infrastructură

### 18.1. Middleware server-side
Rutele și API-urile sensibile trebuie protejate corect.

### 18.2. Rate limiting persistent
Nu in-memory only.

### 18.3. Webhook signatures
Stripe / PayPal și orice sistem sensibil trebuie validate corect.

### 18.4. Logging
`console.log` în producție trebuie înlocuit cu logging structurat.

### 18.5. Public vs auth vs admin
Separare clară.

### 18.6. Rendering strategy
Swaply26 trebuie să fie mai dinamic și mai puțin dependent de SSG masiv pe toate limbile și toate combinațiile.

---

## 19. Reguli de implementare pentru Claude Code

### 19.1. Un task = un commit
Nu combina funcționalități diferite în același commit.

### 19.2. Build obligatoriu
`npm run build` după fiecare modificare semnificativă.

### 19.3. Nu modifica i18n existent fără inventariere
Înainte de a schimba structura i18n:
- inventariază cheile și fișierele existente
- păstrează ce există
- completează doar ce lipsește

### 19.4. Nu șterge funcții fără mapare
Orice funcție eliminată sau ascunsă trebuie:
- identificată,
- documentată,
- repoziționată.

### 19.5. Nu reconstrui ce poate fi refactorizat
Prioritatea este:
- refactorizare,
- reorganizare,
- extragere,
- unificare,
- securizare.

### 19.6. Orice funcție nou mutată trebuie testată în contextul fluxului
Nu doar tehnic, ci și ca poziție în curgere.

### 19.7. Respectă limba unică per user
Nu introduce mixed language.
Orice text nou trebuie să respecte sistemul i18n existent sau pipeline-ul de traducere pentru conținut dinamic.

### 19.8. Nu rupe browsingul public
Rutele și conținutul public vizibil trebuie protejate ca activ de creștere.

---

## 20. Registrul de migrare — format obligatoriu

Pentru fiecare funcție / pagină / API / sistem din `swaply-2025`, registrul de migrare trebuie să includă:

- Funcționalitate
- Tip
- Există în `swaply-2025`?
- Unde există acum
- Ce face acum
- Ce preluăm exact
- Ce refactorizăm
- Unde intră în noua curgere
- Cum apare în produs
- Dependențe
- Observație de migrare

Acest registru trebuie completat continuu pe măsură ce repo-ul este inventariat.

---

## 21. Interdicții conceptuale

Nu se face:
- rebuild de la zero fără inventar
- aruncarea traducerilor existente
- pierderea monetizării și growth assets
- pierderea browsingului public
- adăugarea de mixed language
- păstrarea haosului de navigație actuală sub alt nume
- păstrarea unor funcții avansate în prim-plan fără context
- tratamentul chain / bulk / mixed ca excepții

---

## 22. Rezultatul urmărit

La finalul migrației, `Swaply26` trebuie să fie:
- același univers valoros ca `swaply-2025`,
- dar mult mai clar,
- mai ușor de înțeles,
- mai ușor de folosit,
- mai ușor de extins,
- mai coerent pentru business,
- mai corect lingvistic,
- mai sigur,
- mai bun pentru mobil,
- mai bun pentru PWA,
- mai bun pentru monetizare și growth,
- fără pierderea activelor deja construite.

---

## 23. Rezumat executiv pentru Claude Code

### Regula cea mai importantă
Nu construi `Swaply26` ca produs nou în orb.

Construiește-l ca:
- migrare exhaustivă,
- refactorizare controlată,
- reorchestrare flow-first,
- a lui `swaply-2025`.

### Prioritatea în implementare
Pentru orice task:
1. identifică funcția în `swaply-2025`
2. spune ce preiei
3. spune ce refactorizezi
4. spune unde intră în fluxul nou
5. păstrează i18n existent
6. păstrează growth, SEO, monetizare, sponsori, 52 Weeks
7. nu rupe public discovery
8. securizează fundația
9. build curat
10. commit clar