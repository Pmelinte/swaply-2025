# Swaply – Blueprint 2025 (versiune extinsă)

## 0. Scopul documentului

Acesta este blueprint-ul “mamă” pentru Swaply.  
Tot ce facem (cod, API, testare, monetizare) derivă din el.

După acest document vor exista fișiere separate pentru:
- specificații tehnice detaliate (API, DB, integrare AI)
- plan de testare (test cases, criterii de acceptanță)
- monetizare și pricing
- documentație pentru Devin / alți agenți AI

---

## 1. Viziune & concept

**Swaply** este o platformă globală de schimb de obiecte (și în viitor servicii / spații), cu:
- **AI** pentru clasificare imagine, titlu, descriere și estimare de preț
- **sistem de matchmaking** între ce ai și ce vrei
- **multi-limbă** de la început: Română, Engleză, Franceză, Spaniolă, Germană
- **logistică**: recomandări de transport / curier
- **monetizare**: servicii premium + API public (monetizabil)

Userul nu doar postează anunțuri, ci e ghidat:
- să-și descrie obiectul inteligent
- să găsească rapid schimburi relevante
- să îl ambaleze și să îl trimită fără stres

---

## 2. Actori principali

1. **Vizitator neautentificat**
   - poate vedea listări publice
   - poate filtra / căuta
   - nu poate iniția schimb sau chat

2. **User autenticat standard**
   - poate crea / edita / șterge anunțuri
   - poate iniția și accepta schimburi
   - poate folosi chat-ul
   - poate primi recomandări AI

3. **User premium**
   - toate drepturile userului standard
   - listări evidențiate (boost)
   - acces la statistici basic / estimări mai avansate
   - poate folosi mai mult API-ul intern (dacă activăm și pentru end-user)

4. **Admin**
   - moderează conținut
   - poate bloca useri / anunțuri
   - vede log-uri și status sistem

5. **Client API extern (monetizabil)**
   - aplicație / site terț care folosește API-ul Swaply
   - consumă servicii: clasificare, estimare preț, matching, etc.

---

## 3. Obiecte core (în sens de concepte)

1. **User**
   - profil, limbă preferată, locație generală
   - reputație / trust score
   - statut (standard / premium)

2. **Item (Obiect)**
   - titlu, descriere, imagini
   - categorie, subcategorie
   - stare (nou, foarte bun, bun, uzat)
   - estimare preț (AI + manuală)
   - disponibil pentru: schimb, donare, eventual vânzare (în viitor)

3. **Wish (Dorință)**
   - ce își dorește userul (categorie, tip, brand, buget)

4. **Swap (Schimb)**
   - discuție concretă între 2 useri
   - care obiecte sunt schimbate
   - status: propus, acceptat, în curs, finalizat, anulat

5. **Message (Chat)**
   - mesaje între doi useri legate de un schimb sau de un anunț

6. **Transaction / Payment (pentru monetizare)**
   - nu este tranzacția de swap în sine, ci plata serviciilor Swaply:
     - abonament premium
     - taxă de procesare
     - acces suplimentar la API

7. **API Key / Client extern**
   - pentru monetizarea API-ului Swaply

---

## 4. Funcționalități de bază (MVP extins)

### 4.1 Autentificare & profil

- Signup / login cu:
  - email + parolă
  - posibil, ulterior: Google / Apple
- Profil cu:
  - nume, avatar, descriere scurtă
  - locație (oraș + țară, fără adresă exactă)
  - limbă preferată
  - trust score

### 4.2 Multi-limbă (i18n)

- UI disponibil inițial în:
  - Română, Engleză, Franceză, Spaniolă, Germană
- Conținut generat de user:
  - salvat în limba originală
  - tradus la cerere pentru alți useri (cu AI sau API de traducere)

### 4.3 Creare anunț (Item)

Flow de creare:
1. Userul încarcă una sau mai multe poze.
2. Sistemul cheamă AI:
   - clasificare imagine (categorie + subcategorie)
   - titlu propus (auto-completat)
   - descriere propusă
   - stare obiect (estimare)
   - estimare de preț (în EUR și RON)
3. Userul poate edita sau accepta propunerile.
4. Userul setează:
   - disponibilitate (schimb / donare / altceva)
   - locația de unde se poate preda / trimite

### 4.4 Căutare & filtrare

- Căutare după:
  - titlu, descriere
  - categorie / subcategorie
  - stare
  - locație (aprox.)
- Sortare:
  - recent adăugate
  - aproape de mine
  - potrivire bună cu dorințele mele

### 4.5 Wishlist (ce își dorește userul)

- Userul poate defini ce obiecte îl interesează:
  - categorie, brand, stare, gamă de preț
- Sistemul folosește aceste date pentru:
  - match-uri automate
  - notificări (“a apărut un obiect potrivit”)

### 4.6 Match / Recomandări de schimb

- Motor de matching:
  - compară: ce ai ↔ ce alții își doresc
  - compară: ce vrei ↔ ce alții au
- Generează:
  - match-uri directe (amândoi aveți ceva ce celălalt vrea)
  - match-uri unilaterale (tu vrei de la cineva, dar el nu vrea nimic de la tine – în viitor, posibil layout cu barter în lanț)

### 4.7 Flow de schimb (Swap)

1. User A propune schimb către User B:
   - “Îți ofer obiectul X pentru obiectul Y”
2. User B acceptă / negociază:
   - poate schimba obiectul oferit
3. Dacă ambii acceptă:
   - schimbul trece în status “în curs”
4. Sistemul recomandă:
   - modalitate de predare / transport
5. După realizarea schimbului:
   - ambii useri confirmă și se pot nota reciproc

### 4.8 Chat între useri

- Chat text basic, legat de:
  - un anunț
  - un schimb
- Funcții smart:
  - modele de mesaje predefinite (ex: “Unde ne întâlnim?”, “Când poți livra?”)
  - în viitor: traducere automată dacă userii au limbi diferite

---

## 5. Funcționalitate nouă: Monetizare & Plăți

### 5.1 Tipuri de venit (monetizare internă)

1. **Abonament premium user**
   - listări evidențiate în rezultate
   - acces mai rapid la noile funcții
   - creștere limită de anunțuri
   - rapoarte simple (ex: câți au văzut anunțul tău)

2. **Taxă mică pe schimb gestionat complet online**
   - dacă folosim curieri integrați / label-uri generate
   - ex: comision fix mic pentru folosirea infrastructurii

3. **Opțiuni promo: “Boost listing”**
   - userul plătește pentru a împinge anunțul în top cateva zile

4. **Acces avansat la AI**
   - pachet de “AI power user”
   - estimări de preț mai precise
   - generare de texte multi-limbă premium
   - raport de piață pentru un tip de produs

### 5.2 Plăți – integrare Stripe

- Implementare Stripe pentru:
  - plăți unice (boost, servicii unice)
  - abonamente (premium lunar / anual)
  - posibil, în viitor, Stripe Connect pentru marketplace complet

- Cerințe:
  - currency principal: EUR (cu afișare RON)
  - facturare simplă pentru useri din UE

---

## 6. Funcționalitate nouă: API Swaply (monetizabil)

Swaply va expune un **API public**, cu chei de acces și limitări (rate limit), pentru:

1. **API Image → Category**
   - Input: URL imagine / fișier
   - Output: categorie, subcategorie, tag-uri

2. **API Image → Title & Description**
   - Input: imagine + limbă cerută
   - Output: titlu + descriere sugestie

3. **API Price Estimation**
   - Input: categorie, brand, stare, eventual imagine
   - Output: estimare preț (interval + medie)

4. **API Matching**
   - Input: listă de obiecte și dorințe
   - Output: match-uri calculate după reguli Swaply

5. **API Packaging Recommendation (în viitor)**
   - Input: tip obiect (fragil / voluminos / greu)
   - Output: recomandare de ambalaj

Monetizare API:
- plan free cu X request-uri / lună
- plan plătit cu:
  - număr mai mare de request-uri
  - endpoint-uri avansate (de ex. matching)

---

## 7. Funcționalitate nouă: Testare & Plan de test

Se introduce un **sistem clar de testare**, definit în document separat: `TEST_PLAN_SWAPLY.md`.

Principii:
- fiecare funcționalitate definită aici are:
  - input clar
  - output așteptat
  - criteriu de success
  - scenarii negative

Tipuri de teste:
1. **Unit tests** – test pe funcții individuale
2. **Integration tests** – ex: upload imagine → AI → salvare DB
3. **End-to-end tests (E2E)** – flow complet user:
   - creează cont
   - postează obiect
   - găsește match
   - finalizează schimb

Acest blueprint doar stabilește obligația de a exista un plan complet de testare.  
Detaliile (cazurile de test pe fiecare feature) vor fi descrise în `TEST_PLAN_SWAPLY.md`.

---

## 8. Funcționalitate nouă: Ambalare & protecție obiect

Scop: să reducem riscul ca obiectele să ajungă deteriorate și să stricăm experiența.

### 8.1 Asistent de ambalare la finalul schimbului

Când schimbul ajunge în status “acceptat”:
- se afișează un modul “Cum ambalăm corect obiectul tău?”
- userul selectează:
  - tip obiect: fragil / voluminos / greu / textil / electronic
- sistemul sugerează:
  - tip de cutie
  - folie cu bule / hârtie
  - bandă adezivă
  - eventual: etichetă “Fragil”

### 8.2 Sugestii discrete de ambalaje

- fără să pară că platforma e doar un magazin de pungi
- modul simplu:
  - listă de recomandări generice
  - eventual link-uri externe (ex: eMAG, Leroy Merlin etc.)
  - posibil afișate ca “recomandări utile”, nu reclamă agresivă

### 8.3 Impact în flow

- la finalizare schimb:
  - utilizatorul bifează că a ambalat corect
  - ulterior se poate adăuga un mic tutorial (poză / video / text)

---

## 9. Trust & reputație

- Fiecare schimb finalizat → ambii useri se notează.
- Trust score calculat din:
  - număr schimburi reușite
  - scoruri date de parteneri
  - reclamații / dispute (pe viitor)
- Trust score influențează:
  - poziționarea în recomandări
  - posibilitatea de a accesa anumite funcții

---

## 10. Hartă & “Nearby Swaps”

- Pagină cu hartă (ex: OpenStreetMap / alt provider).
- Userul vede:
  - obiecte disponibile în zona lui (la nivel de oraș / zonă, nu adrese exacte)
- Filtrare:
  - după categorie
  - după distanță
- Scop: încurajăm schimburile locale, fără curier.

---

## 11. Arhitectură (high-level)

- **Frontend**:
  - Next.js (App Router)
  - TypeScript
  - Tailwind + UI library
  - i18n integrat

- **Backend / Bază de date**:
  - Supabase (PostgreSQL)
  - autentificare
  - stocare date user / item / swap / message
  - RLS pentru securitate

- **Storage media**:
  - Cloudinary (imagini)

- **AI / ML**:
  - Hugging Face / alte modele pentru clasificare imagine
  - LLM pentru generare titlu / descriere
  - model intern sau API pentru estimare preț

- **Plăți**:
  - Stripe (checkout + billing)

- **API public**:
  - endpoint-uri REST (sau GraphQL) pentru clienți externi
  - chei API, rate limiting, log de utilizare

---

## 12. Roadmap (pe faze)

**Faza 1 – MVP solid (fără monetizare)**
- autentificare
- profil user
- upload imagine + AI titlu / descriere / categorie
- listare / căutare / filtrare
- flow de schimb basic
- chat basic

**Faza 2 – AI & logistică**
- estimare preț
- match-uri avansate
- harta “Nearby swaps”
- asistent de ambalare

**Faza 3 – Monetizare internă**
- abonament premium
- boost listing
- integrare Stripe

**Faza 4 – API public Swaply**
- API image → category
- API image → title/description
- API price estimation
- monetizare API

**Faza 5 – Testare avansată & optimizări**
- scriere `TEST_PLAN_SWAPLY.md`
- E2E tests
- îmbunătățiri UX / UI pe baza feedback-ului

---

## 13. Documente derivate (de creat după acest blueprint)

1. `ARCHITECTURE_SWAPLY.md`
   - structura exactă a tabelelor
   - diagrame de flux

2. `API_SPEC_SWAPLY.md`
   - endpoint-uri interne (frontend ↔ backend)
   - endpoint-uri API public

3. `PAYMENTS_MONETIZATION.md`
   - detalii Stripe
   - planuri de preț
   - limite / capete

4. `TEST_PLAN_SWAPLY.md`
   - test cases per funcționalitate
   - criterii clare de success/fail

5. Document dedicat Devin / AI IDE:
   - instrucțiuni pentru dezvoltare
   - modul de rulat teste
   - modul de raportat erori

Acest blueprint este punctul de referință.  
Dacă ceva nu este în blueprint, nu există oficial în proiect.
