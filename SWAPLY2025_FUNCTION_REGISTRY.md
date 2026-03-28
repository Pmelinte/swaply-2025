# SWAPLY2025_FUNCTION_REGISTRY.md

## 0. Scop

Acest document este registrul funcțional al proiectului `swaply-2025`.

Rolul lui este:
- să inventarieze funcționalitățile deja existente sau confirmate,
- să prevină pierderea lor în migrare,
- să ofere lui Claude Code și oricărui agent o bază clară pentru ce trebuie preluat, refactorizat și reorchestrat în `Swaply26`.

Acest document NU decide ce se aruncă.
Acest document decide ce există, ce trebuie păstrat și cum se mapează spre noua curgere.

---

## 1. Reguli de utilizare

### 1.1. Orice task de migrare trebuie să consulte acest registru
Înainte de a muta, rescrie sau ascunde o funcție:
- verifică dacă există în acest registru,
- actualizează statusul ei,
- și documentează noua mapare.

### 1.2. Nicio funcționalitate importantă nu se pierde
Orice funcționalitate importantă trebuie:
- preluată,
- refactorizată,
- reorchestrată,
- sau marcată explicit cu justificare.

### 1.3. Confirmarea poate veni din 4 surse
- Vercel build / production routes
- audit tehnic / audit funcțional
- documente strategice / operaționale
- repo / fișiere reale

### 1.4. „Există” nu înseamnă neapărat „complet funcțional”
O rută sau un API poate exista:
- complet funcțional,
- parțial,
- schelet,
- greșit protejat,
- greșit poziționat în UX.

---

## 2. Statusuri permise

### 2.1. Status existență
- `confirmat`
- `parțial confirmat`
- `documentat`
- `de verificat în repo`

### 2.2. Status funcțional
- `funcțional`
- `parțial funcțional`
- `incomplet`
- `problematic`
- `necunoscut`

### 2.3. Acțiune de migrare
- `preluare directă`
- `refactorizare`
- `repoziționare în flux`
- `securizare`
- `traducere / i18n cleanup`
- `validare tehnică`
- `integrare growth / monetizare`
- `integrare admin / backoffice`

---

## 3. Structura registrului

Pentru fiecare intrare trebuie urmărite:
- Nume funcționalitate
- Tip
- Confirmare
- Status funcțional
- Sursă actuală
- Ce face acum
- Acțiune de migrare
- Loc nou în Swaply26
- Observație

---

## 4. Registrul funcțional

---

# A. HOME / DISCOVERY / PUBLIC PAGES

## A1. Homepage localizat
- **Tip:** pagină publică principală
- **Confirmare:** confirmat
- **Status funcțional:** parțial funcțional
- **Sursă actuală:** rute Vercel `/[locale]`
- **Ce face acum:** homepage public cu conținut, stats, hărți, obiecte, CTA-uri
- **Acțiune de migrare:** refactorizare + repoziționare în flux
- **Loc nou în Swaply26:** intrare în flux
- **Observație:** trebuie simplificat și reorchestrat ca ecran de intrare, nu ca agregat de widgeturi

## A2. About
- **Tip:** pagină publică
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/about`
- **Ce face acum:** pagină de prezentare
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** meniu discret / trust layer
- **Observație:** rămâne activ de brand

## A3. Contact
- **Tip:** pagină publică
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/contact`
- **Ce face acum:** contact / suport
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** meniu discret / suport
- **Observație:** util, dar nu în prim-plan

## A4. Info
- **Tip:** pagină publică / stats
- **Confirmare:** confirmat
- **Status funcțional:** parțial funcțional
- **Sursă actuală:** `/[locale]/info`
- **Ce face acum:** info public / stats / explicații platformă
- **Acțiune de migrare:** refactorizare
- **Loc nou în Swaply26:** public discovery + trust layer
- **Observație:** păstrat ca activ public, eventual împărțit în stats + help

## A5. Pricing
- **Tip:** pagină publică / business
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/pricing`
- **Ce face acum:** prezentare prețuri / premium
- **Acțiune de migrare:** preluare directă + repoziționare
- **Loc nou în Swaply26:** meniu discret / monetizare
- **Observație:** nu trebuie să concureze cu fluxul principal

## A6. Safety
- **Tip:** pagină publică / trust
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/safety`
- **Ce face acum:** siguranță / anti-fraudă / reguli
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** trust layer / ajutor contextual
- **Observație:** importantă pentru schimburi cu risc

## A7. Partners
- **Tip:** pagină publică / business
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/partners`
- **Ce face acum:** parteneri / afiliați / sponsor layer
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** meniu discret / monetizare / B2B
- **Observație:** activ de business, nu flux principal

## A8. Integrations
- **Tip:** pagină publică / business / technical
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/integrations`
- **Ce face acum:** integrații / posibil prezentare API / servicii
- **Acțiune de migrare:** validare tehnică + repoziționare
- **Loc nou în Swaply26:** meniu discret / business layer
- **Observație:** trebuie clarificat dacă este produs real sau doar prezentare

## A9. Eco
- **Tip:** pagină publică / positioning
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/eco`
- **Ce face acum:** mesaj eco / reuse / sustainability
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** branding / trust / SEO
- **Observație:** bun pentru positioning și parteneriate

## A10. Events
- **Tip:** pagină publică / produs / growth
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/events`
- **Ce face acum:** evenimente / activări / posibil 52 weeks
- **Acțiune de migrare:** refactorizare + integrare growth
- **Loc nou în Swaply26:** ramura Evenimente + 52 Weeks ecosystem
- **Observație:** critic de conectat la modelul nou

## A11. Leaderboard
- **Tip:** pagină publică / community
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/leaderboard`
- **Ce face acum:** clasamente / comunitate / reputație
- **Acțiune de migrare:** repoziționare
- **Loc nou în Swaply26:** meniu discret / reputation layer
- **Observație:** utilă, dar nu trebuie să sufoce începutul

## A12. Feedback
- **Tip:** pagină publică / user
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/feedback`
- **Ce face acum:** colectare feedback
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** meniu discret / suport / trust
- **Observație:** utilă pentru bucla de îmbunătățire

---

# B. BLOG / SEO / CONTENT

## B1. Blog index
- **Tip:** conținut public
- **Confirmare:** confirmat
- **Status funcțional:** funcțional
- **Sursă actuală:** `/[locale]/blog`
- **Ce face acum:** listare articole
- **Acțiune de migrare:** preluare directă + optimizare arhitecturală
- **Loc nou în Swaply26:** SEO/public discovery
- **Observație:** asset valoros, nu se pierde

## B2. Blog article
- **Tip:** conținut public SEO
- **Confirmare:** confirmat
- **Status funcțional:** funcțional
- **Sursă actuală:** `/[locale]/blog/[slug]`
- **Ce face acum:** articole publice, multe slugs
- **Acțiune de migrare:** preluare directă + control build strategy
- **Loc nou în Swaply26:** SEO/public discovery
- **Observație:** unul dintre contributorii mari la build time

## B3. Blog category
- **Tip:** SEO/content taxonomy
- **Confirmare:** confirmat
- **Status funcțional:** funcțional
- **Sursă actuală:** `/[locale]/blog/category/[cat]`
- **Ce face acum:** taxonomie articole
- **Acțiune de migrare:** preluare directă + optimizare
- **Loc nou în Swaply26:** SEO/content
- **Observație:** păstrat, dar controlat mai bine ca volum

## B4. SEO pages by category/city/region/long-tail
- **Tip:** public discovery / SEO
- **Confirmare:** documentat + parțial confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** documente SEO + rute objects by category/city
- **Ce face acum:** pagini destinate traficului organic
- **Acțiune de migrare:** preluare + refactorizare
- **Loc nou în Swaply26:** SEO/public discovery
- **Observație:** trebuie păstrate fără a recrea explozia de build static

---

# C. AUTH / ONBOARDING

## C1. Login
- **Tip:** auth
- **Confirmare:** confirmat
- **Status funcțional:** funcțional
- **Sursă actuală:** `/[locale]/login`
- **Ce face acum:** autentificare
- **Acțiune de migrare:** preluare directă + UX cleanup
- **Loc nou în Swaply26:** intrare auth contextuală
- **Observație:** trebuie să rămână accesibil și clar

## C2. Register
- **Tip:** auth
- **Confirmare:** confirmat
- **Status funcțional:** funcțional / cu buguri istorice
- **Sursă actuală:** `/[locale]/register`
- **Ce face acum:** creare cont
- **Acțiune de migrare:** preluare directă + verificare CTA
- **Loc nou în Swaply26:** auth contextuală
- **Observație:** critică pentru conversie

## C3. Auth callback
- **Tip:** auth backend
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/auth/callback`
- **Ce face acum:** callback auth
- **Acțiune de migrare:** validare tehnică
- **Loc nou în Swaply26:** infrastructură auth
- **Observație:** critic pentru stabilitate

## C4. Welcome email
- **Tip:** onboarding
- **Confirmare:** confirmat/documentat
- **Status funcțional:** parțial funcțional
- **Sursă actuală:** `/api/email/welcome` + documente
- **Ce face acum:** email welcome
- **Acțiune de migrare:** validare + integrare
- **Loc nou în Swaply26:** onboarding
- **Observație:** important pentru first-time activation

## C5. Onboarding flow
- **Tip:** retenție/activation
- **Confirmare:** documentat
- **Status funcțional:** de verificat în repo
- **Sursă actuală:** documente
- **Ce face acum:** onboarding planificat / parțial implementat
- **Acțiune de migrare:** integrare
- **Loc nou în Swaply26:** onboarding în flux
- **Observație:** nu trebuie tratat ca pagină separată ruptă de produs

---

# D. CORE PRODUCT FLOWS

## D1. Objects list
- **Tip:** produs
- **Confirmare:** confirmat
- **Status funcțional:** funcțional
- **Sursă actuală:** `/[locale]/objects`
- **Ce face acum:** browse public / listări
- **Acțiune de migrare:** preluare + integrare în flux
- **Loc nou în Swaply26:** ramura Obiecte / public discovery / explorare
- **Observație:** asset central

## D2. Object detail
- **Tip:** produs
- **Confirmare:** confirmat
- **Status funcțional:** funcțional
- **Sursă actuală:** `/[locale]/objects/[id]`
- **Ce face acum:** detaliu listing
- **Acțiune de migrare:** preluare + integrare în noul flow
- **Loc nou în Swaply26:** rezultate / detaliu entitate
- **Observație:** păstrat

## D3. New object
- **Tip:** creare ofertă
- **Confirmare:** confirmat
- **Status funcțional:** funcțional/parțial
- **Sursă actuală:** `/[locale]/objects/new`
- **Ce face acum:** creare item nou
- **Acțiune de migrare:** refactorizare
- **Loc nou în Swaply26:** „Ce pot oferi” / flux de ofertă
- **Observație:** trebuie aliniat la noua curgere

## D4. Edit object
- **Tip:** user/product
- **Confirmare:** confirmat
- **Status funcțional:** funcțional/parțial
- **Sursă actuală:** `/[locale]/objects/[id]/edit`
- **Ce face acum:** edit item
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** gestionare ofertă
- **Observație:** important pentru continuitate

## D5. Wanted
- **Tip:** produs
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/wanted` + `/api/wanted`
- **Ce face acum:** exprimare dorințe / cereri
- **Acțiune de migrare:** preluare + integrare profundă
- **Loc nou în Swaply26:** „Ce îmi doresc”
- **Observație:** trebuie adus în centrul produsului, nu tratat periferic

## D6. Match
- **Tip:** flux principal
- **Confirmare:** confirmat
- **Status funcțional:** funcțional/parțial
- **Sursă actuală:** `/[locale]/match`
- **Ce face acum:** matching / sugestii
- **Acțiune de migrare:** refactorizare majoră
- **Loc nou în Swaply26:** rezultatele curgerii
- **Observație:** devine etapă, nu univers separat concurent

## D7. Chat
- **Tip:** flux principal
- **Confirmare:** confirmat
- **Status funcțional:** funcțional/parțial
- **Sursă actuală:** `/[locale]/chat`
- **Ce face acum:** conversații / negociere
- **Acțiune de migrare:** refactorizare + traducere automată
- **Loc nou în Swaply26:** negociere
- **Observație:** chat-ul trebuie tradus complet în limba userului

## D8. Change
- **Tip:** flux principal
- **Confirmare:** confirmat
- **Status funcțional:** funcțional/parțial
- **Sursă actuală:** `/[locale]/change`
- **Ce face acum:** etapă de schimb / finalizare
- **Acțiune de migrare:** repoziționare
- **Loc nou în Swaply26:** execuție/finalizare
- **Observație:** trebuie clar conectat după butonul Swaply

## D9. Favorites
- **Tip:** user/product
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/favorites`
- **Ce face acum:** salvare listări
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** user tools
- **Observație:** util în explorare

## D10. My Objects
- **Tip:** user/product
- **Confirmare:** confirmat
- **Status funcțional:** funcțional/parțial
- **Sursă actuală:** `/[locale]/my-objects`
- **Ce face acum:** listarea propriilor obiecte
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** cont / ofertele mele
- **Observație:** important în modelul „Ce pot oferi”

## D11. History
- **Tip:** user/history
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/history`
- **Ce face acum:** istoric
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** cont / istoric / audit personal
- **Observație:** util pentru încredere și control

## D12. Notifications
- **Tip:** user/system
- **Confirmare:** confirmat
- **Status funcțional:** parțial funcțional
- **Sursă actuală:** `/[locale]/notifications` + push APIs
- **Ce face acum:** notificări
- **Acțiune de migrare:** preluare + integrare
- **Loc nou în Swaply26:** notificări / retenție
- **Observație:** important pentru flow re-entry

---

# E. PROFILE / ACCOUNT / REPUTATION

## E1. Profile
- **Tip:** user/account
- **Confirmare:** confirmat
- **Status funcțional:** funcțional/parțial
- **Sursă actuală:** `/[locale]/profile`
- **Ce face acum:** profil user
- **Acțiune de migrare:** refactorizare majoră
- **Loc nou în Swaply26:** profil extins
- **Observație:** trebuie să includă ofer/caut/mix/preferințe

## E2. Profile analytics
- **Tip:** analytics/user
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/profile/analytics`
- **Ce face acum:** analitice profil
- **Acțiune de migrare:** preluare + repoziționare
- **Loc nou în Swaply26:** cont / analytics
- **Observație:** nu în prim-plan, dar util

## E3. Reviews
- **Tip:** trust/reputation
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/reviews` + documente
- **Ce face acum:** sistem recenzii / reputație
- **Acțiune de migrare:** integrare
- **Loc nou în Swaply26:** reputation layer
- **Observație:** important pentru schimburi cu risc

## E4. Tokens
- **Tip:** gamification/monetizare
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/tokens/balance`, `/api/tokens/history`
- **Ce face acum:** sistem tokens
- **Acțiune de migrare:** validare + integrare
- **Loc nou în Swaply26:** monetizare / user incentives
- **Observație:** nu trebuie să deranjeze curgerea principală

---

# F. SEARCH / AI / TRANSLATION

## F1. Search
- **Tip:** produs/core
- **Confirmare:** confirmat
- **Status funcțional:** funcțional/parțial
- **Sursă actuală:** `/api/search`
- **Ce face acum:** căutare
- **Acțiune de migrare:** preluare + centralizare
- **Loc nou în Swaply26:** metoda „Căutare liberă”
- **Observație:** devine una dintre cele 4 metode majore

## F2. AI image
- **Tip:** AI/classification
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/ai/image`
- **Ce face acum:** clasificare / asistență pe imagini
- **Acțiune de migrare:** preluare directă
- **Loc nou în Swaply26:** creare ofertă
- **Observație:** foarte utilă la listare

## F3. AI match
- **Tip:** AI/core
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/ai/match`, `/api/match-semantic`
- **Ce face acum:** matching AI
- **Acțiune de migrare:** preluare + explicabilitate
- **Loc nou în Swaply26:** rezultate / sugestii AI
- **Observație:** central în produsul nou

## F4. AI chat assist
- **Tip:** AI/support
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/ai/chat-assist`
- **Ce face acum:** asistență în conversații
- **Acțiune de migrare:** validare + integrare contextuală
- **Loc nou în Swaply26:** chat
- **Observație:** nu trebuie să încarce UX-ul dacă nu e matur

## F5. Translation endpoints
- **Tip:** translation
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/translate`, `/api/translate/item`, `/api/admin/translate-*`
- **Ce face acum:** traduceri / admin translate
- **Acțiune de migrare:** refactorizare majoră
- **Loc nou în Swaply26:** translation pipeline
- **Observație:** trebuie unificate cu regula de limbă unică și persistare

## F6. Embeddings
- **Tip:** AI/search
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/embeddings`
- **Ce face acum:** embeddings / semantic support
- **Acțiune de migrare:** validare tehnică
- **Loc nou în Swaply26:** AI layer
- **Observație:** util dacă susține semantic search și matching

---

# G. SPECIAL EXCHANGE TYPES

## G1. Bundles / Bulk
- **Tip:** schimb special
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/bundles`, `/api/bundles/lock`
- **Ce face acum:** bundle / bulk mechanics
- **Acțiune de migrare:** integrare nativă
- **Loc nou în Swaply26:** tip de schimb Bulk
- **Observație:** foarte important, explicit cerut

## G2. Chains
- **Tip:** schimb special
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/chains`, `/api/chains/confirm`, `/api/chains/detect`
- **Ce face acum:** detectare și confirmare lanțuri
- **Acțiune de migrare:** integrare nativă
- **Loc nou în Swaply26:** tip de schimb Chain
- **Observație:** trebuie tratat ca motor de produs, nu experiment

## G3. Mixed cross-category
- **Tip:** regulă de produs
- **Confirmare:** documentat + discutat explicit
- **Status funcțional:** de verificat
- **Sursă actuală:** logică distribuită / documente / produs
- **Ce face acum:** probabil posibil parțial prin matching general
- **Acțiune de migrare:** formalizare explicită
- **Loc nou în Swaply26:** tip Mixed
- **Observație:** critic pentru identitatea produsului

---

# H. EXECUTION / LOGISTICS / RISK HANDLING

## H1. Courier services
- **Tip:** logistică
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/courier/*`
- **Ce face acum:** AWB, estimate, tracking
- **Acțiune de migrare:** integrare contextuală
- **Loc nou în Swaply26:** finalizare
- **Observație:** să apară doar după confirmare

## H2. DHL services
- **Tip:** logistică
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/dhl/*`
- **Ce face acum:** rates, ship, track
- **Acțiune de migrare:** integrare contextuală
- **Loc nou în Swaply26:** finalizare / internațional
- **Observație:** foarte relevant pentru schimburi internaționale

## H3. Escrow
- **Tip:** protecție / plăți
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/escrow/*`, `/api/payments/escrow`
- **Ce face acum:** mecanisme escrow
- **Acțiune de migrare:** integrare contextuală + securizare
- **Loc nou în Swaply26:** finalizare / risc
- **Observație:** nu trebuie expus devreme

## H4. Insurance
- **Tip:** protecție
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/insurance/*`
- **Ce face acum:** quote / purchase
- **Acțiune de migrare:** integrare contextuală
- **Loc nou în Swaply26:** finalizare / risc
- **Observație:** util doar când are sens

## H5. Packaging
- **Tip:** logistică auxiliară
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/packaging/recommend`, `/api/services/packaging`
- **Ce face acum:** recomandări ambalare
- **Acțiune de migrare:** integrare contextuală
- **Loc nou în Swaply26:** finalizare
- **Observație:** nu în începutul fluxului

## H6. Travel services
- **Tip:** travel/context
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/travel/*`, `/api/services/accommodation`, `/api/services/transport`
- **Ce face acum:** flights, car rental, accommodation, transport
- **Acțiune de migrare:** integrare contextuală
- **Loc nou în Swaply26:** finalizare / vacanță / evenimente
- **Observație:** foarte important pentru ramura Evenimente și schimburi contextualizate

## H7. Disputes
- **Tip:** risc / governance
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/disputes/*`
- **Ce face acum:** dispute, evidence, resolve
- **Acțiune de migrare:** preluare + separare clară
- **Loc nou în Swaply26:** risk handling / support
- **Observație:** nu în prim-plan, dar absolut necesar

---

# I. MONETIZATION / BUSINESS / GROWTH

## I1. Monetization page
- **Tip:** business
- **Confirmare:** confirmat
- **Status funcțional:** necunoscut
- **Sursă actuală:** `/[locale]/monetization`
- **Ce face acum:** prezentare monetizare / premium / business
- **Acțiune de migrare:** preluare + repoziționare
- **Loc nou în Swaply26:** monetizare layer
- **Observație:** activ util, nu flux principal

## I2. Payments
- **Tip:** monetizare
- **Confirmare:** confirmat
- **Status funcțional:** parțial funcțional
- **Sursă actuală:** `/api/payments/*`
- **Ce face acum:** checkout, portal, boost, webhook
- **Acțiune de migrare:** securizare + integrare
- **Loc nou în Swaply26:** monetizare + contextual services
- **Observație:** critic să nu se piardă

## I3. PayPal
- **Tip:** monetizare
- **Confirmare:** confirmat
- **Status funcțional:** problematic
- **Sursă actuală:** `/api/payments/paypal/*` + audit Playwright
- **Ce face acum:** create/capture/webhook
- **Acțiune de migrare:** securizare + încărcare contextuală
- **Loc nou în Swaply26:** monetizare / finalizare contextuală
- **Observație:** în auditul public a fost blocat de CSP; nu trebuie încărcat peste tot

## I4. Sponsored content / ads / sponsored search
- **Tip:** monetizare/growth
- **Confirmare:** documentat
- **Status funcțional:** de verificat în repo
- **Sursă actuală:** documente de monetizare și promovare
- **Ce face acum:** model strategic
- **Acțiune de migrare:** integrare business
- **Loc nou în Swaply26:** monetizare layer
- **Observație:** să nu altereze fluxul principal

## I5. Partners / Sponsors / 52 Weeks
- **Tip:** monetizare/community
- **Confirmare:** documentat + parțial confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** pages + docs + sponsor DB
- **Ce face acum:** ecosistem de sponsori și activări
- **Acțiune de migrare:** integrare explicită
- **Loc nou în Swaply26:** growth + monetizare + events
- **Observație:** activ strategic de mare valoare

---

# J. SYSTEM / SECURITY / OPS

## J1. Middleware / proxy
- **Tip:** infrastructură
- **Confirmare:** confirmat
- **Status funcțional:** problematic / de verificat
- **Sursă actuală:** Vercel middleware
- **Ce face acum:** locale / routing / posibil auth gating
- **Acțiune de migrare:** audit + securizare
- **Loc nou în Swaply26:** infrastructură
- **Observație:** auditul a semnalat lipsa protecției server-side reale

## J2. Health check
- **Tip:** observabilitate
- **Confirmare:** confirmat
- **Status funcțional:** problematic
- **Sursă actuală:** `/api/health`
- **Ce face acum:** health/config exposure
- **Acțiune de migrare:** securizare
- **Loc nou în Swaply26:** ops/internal
- **Observație:** auditul a semnalat leakage

## J3. Push notifications
- **Tip:** retenție/system
- **Confirmare:** confirmat
- **Status funcțional:** parțial confirmat
- **Sursă actuală:** `/api/push/*` + docs
- **Ce face acum:** subscribe/send/unsubscribe
- **Acțiune de migrare:** integrare
- **Loc nou în Swaply26:** retention / notifications
- **Observație:** important pentru re-entry în flux

## J4. Stats
- **Tip:** analytics/public
- **Confirmare:** confirmat
- **Status funcțional:** de verificat
- **Sursă actuală:** `/api/stats`
- **Ce face acum:** stats publice sau interne
- **Acțiune de migrare:** integrare + real data governance
- **Loc nou în Swaply26:** social proof / analytics
- **Observație:** cifrele trebuie să fie reale, nu cosmetice

## J5. Audit system
- **Tip:** QA
- **Confirmare:** confirmat
- **Status funcțional:** funcțional
- **Sursă actuală:** audit Playwright + `.github/workflows/audit.yml`
- **Ce face acum:** public route audit
- **Acțiune de migrare:** preluare și extindere
- **Loc nou în Swaply26:** QA layer
- **Observație:** activ tehnic important

## J6. Admin panel
- **Tip:** operations
- **Confirmare:** confirmat
- **Status funcțional:** parțial confirmat
- **Sursă actuală:** `/[locale]/admin*`
- **Ce face acum:** users/items/reports/services/admin ops
- **Acțiune de migrare:** preluare directă + securizare
- **Loc nou în Swaply26:** backoffice
- **Observație:** complet separat de fluxul principal

---

## 5. Ce trebuie completat în continuare

Acest registru este versiunea 1.
El trebuie extins prin:
- audit pe repo real, fișier-cu-fișier,
- confirmare a statusului funcțional pentru fiecare rută și API,
- mapare DB/tabele,
- mapare i18n namespaces/keys,
- mapare providers externi,
- mapare exactă pentru ce preluăm și ce refactorizăm.

---

## 6. Regula pentru Claude Code

Înainte de orice schimbare:
1. găsește intrarea relevantă din registru
2. spune explicit ce preiei
3. spune ce refactorizezi
4. spune unde intră în curgerea Swaply26
5. verifică să nu pierzi nimic important
6. build curat
7. commit clar