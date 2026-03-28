# SWAPLY26_IMPLEMENTATION_RULES.md

## 0. Scop

Acest document definește regulile concrete de lucru pentru Claude Code și pentru orice agent sau dezvoltator care implementează migrarea din `swaply-2025` spre `Swaply26`.

Acest fișier trebuie citit împreună cu:
- `SWAPLY26_MIGRATION_MASTER.md`
- `SWAPLY2025_FUNCTION_REGISTRY.md`

---

## 1. Regula supremă

Nu construi `Swaply26` ca produs nou în orb.

Construiește-l ca:
- migrare exhaustivă,
- refactorizare controlată,
- reorchestrare flow-first,
- a lui `swaply-2025`.

---

## 2. Reguli de execuție

### 2.1. Un task = un commit
Nu combina mai multe direcții mari în același commit.

### 2.2. Orice task trebuie să declare explicit:
- ce funcție existentă atinge,
- unde există în `swaply-2025`,
- ce preia,
- ce refactorizează,
- unde intră în noua curgere.

### 2.3. Build obligatoriu
După orice task semnificativ:
- `npm run build`
- zero erori
- zero regresii evidente

### 2.4. Dacă apar blocaje mari
Dacă apar:
- >3 erori de build,
- regresii mari,
- confuzii de arhitectură,
taskul se oprește și se raportează clar problema.

---

## 3. Reguli de non-pierdere

### 3.1. Nu elimina funcții fără mapare
Nicio funcționalitate importantă din `swaply-2025` nu se elimină fără:
- identificare,
- justificare,
- remapare,
- documentare.

### 3.2. Nu elimina rută fără analiză
O rută poate părea secundară, dar poate susține:
- SEO,
- monetizare,
- trust,
- business,
- admin,
- growth,
- legal,
- onboarding.

### 3.3. Nu elimina API fără audit
Un API poate fi:
- folosit în UI,
- documentat strategic,
- folosit de admin,
- folosit de workflows,
- pregătit pentru integrare ulterioară.

---

## 4. Reguli i18n

### 4.1. Nu rupe sistemul existent
`next-intl` și traducerile existente în 43 de limbi trebuie păstrate.

### 4.2. Nu arunca fișierele actuale de locale
Orice fișier sau namespace existent trebuie:
- inventariat,
- refolosit,
- curățat,
- completat.

### 4.3. Nu introduce texte hardcodate
Orice text nou din UI trebuie:
- introdus în sistemul i18n existent,
- în toate limbile necesare sau prin mecanism de completare controlată.

### 4.4. Nu accepta mixed language
Niciun ecran nu trebuie să conțină:
- fallback-uri engleză,
- texte sistem netraduse,
- bucăți amestecate.

### 4.5. Separă UI-ul de conținutul user-generated
- UI = i18n controlat
- content dinamic = translation pipeline persistent

---

## 5. Reguli pentru translation pipeline

### 5.1. Nu traduce UI cu AI la runtime
UI-ul sistemului rămâne în fișierele de locale.

### 5.2. Conținutul user-generated trebuie tradus automat și persistat
Acest lucru se aplică la:
- titluri,
- descrieri,
- wanted,
- servicii,
- proprietăți,
- evenimente,
- chat.

### 5.3. Nu retraduce inutil
Folosește:
- `source_hash`
- `provider`
- `model`
- `status`
- caching persistent

### 5.4. Providerii trebuie să fie schimbabili
Nu construi pipeline-ul astfel încât să depindă rigid de un singur vendor.

### 5.5. Păstrează originalul
Originalul user-generated se salvează întotdeauna.

---

## 6. Reguli de produs

### 6.1. Totul trebuie mapat pe flux
Orice funcție nouă sau existentă trebuie asociată explicit unuia dintre:
- intrare,
- alegere ramură,
- vreau/ofer,
- metodă,
- rezultate,
- AI,
- chat,
- confirmare,
- execuție,
- profil,
- growth/public,
- monetizare,
- admin.

### 6.2. Funcțiile avansate apar contextual
Nu aduce în prim-plan:
- escrow,
- packaging,
- travel,
- insurance,
- disputes,
- tokens,
- sponsors,
- ads,
decât când chiar au sens.

### 6.3. Browsing public nu se rupe
Vizitatorii trebuie să poată vedea conținutul fără login.

### 6.4. Chain / Bulk / Mixed sunt native
Nu trata aceste tipuri ca excepții.

---

## 7. Reguli UI / UX

### 7.1. Respectă modelul flow-first
Nu reintroduce haosul actual sub altă formă.

### 7.2. Respectă structura principală
- sus = orientare
- centru = flux
- jos = acțiuni

### 7.3. Respectă întoarcerea în flux
Trebuie să existe:
- back,
- progress map,
- edit previous choice,
- pause/resume.

### 7.4. Nu pune totul în prim-plan
Blog, legal, integrations, monetization, leaderboard, admin, etc. trebuie repoziționate coerent.

---

## 8. Reguli tehnice

### 8.1. Middleware și auth
Verifică protecția server-side reală.
Nu te baza exclusiv pe client auth.

### 8.2. Webhooks
Semnăturile Stripe / PayPal trebuie validate.

### 8.3. Rate limiting
Nu păstra doar in-memory pentru lucruri sensibile.

### 8.4. Logging
Înlocuiește `console.log` de producție cu logging structurat.

### 8.5. Rendering strategy
Nu repeta modelul de SSG exploziv pentru tot universul și toate limbile.
Alege dinamic/ISR/cache acolo unde se potrivește.

---

## 9. Reguli pentru growth / SEO / monetizare

### 9.1. Nu pierde activele de creștere
Păstrează și remapează:
- blog,
- pagini SEO,
- public discovery,
- onboarding,
- email,
- push,
- social proof,
- social links,
- sponsors,
- 52 Weeks,
- partnerships.

### 9.2. Nu pierde monetizarea
Păstrează și remapează:
- payments,
- premium,
- boosts,
- ads,
- sponsored search,
- sponsor placements,
- newsletters,
- partner monetization,
- business pages.

### 9.3. Nu lăsa monetizarea să sufoce fluxul principal
Business-ul trebuie păstrat, dar UX-ul simplificat.

---

## 10. Reguli de documentare

### 10.1. După orice schimbare mare, actualizează documentele
Minim:
- registrul funcțional,
- migrarea master,
- regulile, dacă s-a schimbat vreo convenție.

### 10.2. Orice funcție mutată trebuie documentată
Trebuie să fie clar:
- unde era,
- unde este acum,
- de ce a fost mutată.

### 10.3. Orice funcție ascunsă trebuie să rămână accesibilă logic
Dacă ceva iese din prim-plan, nu trebuie să dispară arbitrar.

---

## 11. Reguli de lucru pe task

Orice task propus pentru Claude Code trebuie formulat astfel:

1. Ce funcție / sistem atinge
2. Unde există acum în `swaply-2025`
3. Ce preluăm exact
4. Ce refactorizăm
5. Cum se mapează în noul flux
6. Ce reguli i18n afectează
7. Ce build / test trebuie rulat
8. Care este mesajul de commit

---

## 12. Interdicții

Nu face:
- rebuild complet fără inventar
- ștergere de i18n existent
- rescriere de provider global fără justificare
- introducere de mixed language
- eliminare de rută fără analiză
- eliminare de API fără registru
- păstrarea haosului actual sub alt layout
- expunerea prematură a funcțiilor contextuale
- ignoranță față de SEO / monetizare / growth / 52 Weeks

---

## 13. Regula finală

Claude Code trebuie să trateze `swaply-2025` ca:
- bază reală de produs,
- cu multe funcții deja existente,
- și `Swaply26` ca:
- reorganizare,
- clarificare,
- migrare,
- consolidare,
- nu ca invenție complet nouă.

Orice implementare trebuie să poată răspunde clar la întrebarea:

**Ce din `swaply-2025` am păstrat, ce am refactorizat și unde am mutat?**