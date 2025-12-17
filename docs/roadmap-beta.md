# Swaply — Plan complet până la o versiune validă și stabilă de test (Public Beta)

Acest document definește *clar* ce înseamnă „beta testabilă”, etapele până acolo, criterii de „gata”, și ce task‑uri pot fi delegate către agenți (Devin / Copilot / etc.).  
Scopul este să evităm spirala de „1000 de erori” și să construim incremental, cu contracte stabile.

---

## 0) Definiția „versiunii valide și stabile de test”

Un tester (prieten / coleg / user random) trebuie să poată, pe un link public:

1. Să-și facă cont / login.
2. Să-și completeze profil minim (nume + avatar opțional).
3. Să adauge un item (titlu, descriere, poze opțional).
4. Să vadă listă items + detaliu item.
5. Să aibă un mecanism minim de „match” (poate fi manual/temporar pentru beta).
6. Să poată scrie într-un chat asociat unui match.
7. Să pornească un exchange și să vadă un status flow minim (pending → accepted → completed).
8. Să nu se rupă aplicația dacă Stripe / AI / shipping nu sunt gata (dezactivate elegant).

**Stabil** = nu crash, nu 500 în flow‑urile de mai sus, pagini coerente, erori tratate.

---

## 1) Principii de lucru (anti‑haos)

### Regula 1 — Contractele primele
Înainte de UI „frumos”: tipuri + API + DB + repository.  
Orice componentă care se plânge de props = contract nealiniat.

### Regula 2 — Feature flags pentru ce nu e gata
Stripe/AI/shipping → ori instalate complet, ori **dezactivate elegant** (fără compile errors).

### Regula 3 — 1 flux complet pe rând
Nu atingem Chat până Items nu e complet, etc.

---

## 2) Plan pe etape până la beta stabilă

### Etapa 0 — Stabilizare build & curățenie (0.5–1 zi)
**Obiectiv:** build verde constant, fără “Cannot find export/member”.

**Checklist:**
- un singur client Supabase (browser) și un singur server client (SSR) folosite peste tot
- eliminat importurile din `@supabase/auth-helpers-nextjs` (dacă nu e instalat)
- endpoints Stripe: ori instalezi `stripe`, ori pui feature flag + returnezi „disabled”, dar **să compileze**
- normalizezi naming: `createServerClient`, `createClient`, `itemsRepository` etc. (un singur standard)

**Gata când:**
- Vercel build OK de 3 ori consecutiv la commits separate
- fără erori TypeScript care blochează build-ul (warnings sunt ok)

---

### Etapa 1 — Auth + Profile minim (1 zi)
**Obiectiv:** user poate intra și are un profil minim.

**Funcțional:**
- /login (sau flow existent)
- /settings/profile (funcțional, minim)
- profile auto‑create la primul fetch (dacă există `ensure-profile`)

**Gata când:**
- user logat vede Settings Profile
- update nume + avatar_url merge și persistă în Supabase
- RLS corect: user își vede/editează doar profilul

---

### Etapa 2 — Items: CRUD util (2 zile)
**Obiectiv:** Swaply fără items e doar filosofie.

**Minim obligatoriu (beta):**
- `/items` listă
- `/items/[id]` detalii
- `/add` (create)
- `/items/[id]/edit` (update)
- `/my/items` (active + archived) — **doar dacă** `archived` există end‑to‑end; altfel se scoate din beta

**Model minim recomandat:**
- id, owner_id, title, description, images[], created_at
- category/subcategory/tags = opțional (nu bloca beta pe taxonomie)

**Gata când:**
- flow: Add → apare în listă → detail → edit → vezi schimbarea
- imagini: Cloudinary dacă e gata; altfel fallback fără upload (dar fără crash)

---

### Etapa 3 — Matches minim (1 zi)
**Obiectiv:** „match” = container pentru chat & exchange. Nu trebuie matching AI.

**Implementare pragmatică:**
- action temporară: „Create match with user X” (dev/admin)
- list matches for user
- check membership server‑side

**Gata când:**
- user vede lista de matches
- intră în match detail fără redirect aiurea

---

### Etapa 4 — Chat funcțional (1–2 zile)
**Obiectiv:** conversație reală, fără realtime obligatoriu.

**Minim:**
- list messages for match (server action)
- create message (server action)
- UI client:
  - primește `initialMessages` (opțional)
  - trimite mesaj și re‑fetch ca fallback

**Gata când:**
- 2 useri pot vedea thread-ul și pot trimite mesaje
- mesajul apare în UI după send (instant sau la refresh)

---

### Etapa 5 — Exchange flow minim (2 zile)
**Obiectiv:** Swaply devine „schimb”, nu „chat app”.

**Minim (beta):**
- create exchange din match
- exchange page cu status + timeline simplu
- acțiuni:
  - accept (pending → accepted)
  - confirm received (accepted → completed)
- reviews: opțional; dacă rupe tipuri/DB, se scoate din beta

**Gata când:**
- flow complet: start exchange → accept → confirm received
- status persistă și se vede corect

---

### Etapa 6 — Polishing pentru test public (1 zi)
**Obiectiv:** să nu se simtă “dev only”.

**Must:**
- empty states (no items, no matches)
- loading states
- erori prietenoase (nu stack traces)
- nav clar (Home → Items → Add → Matches → Settings)
- „demo-safe”: fără pagini moarte în nav

**Gata când:**
- un user nou se descurcă fără să te sune la fiecare click

---

### Etapa 7 — Observabilitate și feedback loop (0.5–1 zi)
**Obiectiv:** când un tester spune „nu merge”, tu vezi de ce.

**Minim:**
- log-uri curate pe server actions (prefix per modul)
- link „Report issue” (chiar mailto)
- Sentry/Logtail opțional, dar util

**Gata când:**
- ai diag minim: userId, route, error code

---

## 3) Timeline realist
Cu lucru consistent + delegare către agenți: **7–10 zile** calendaristice pentru beta stabilă.  
Se poate în 5–6 zile, dar crește riscul de regresii.

---

## 4) Task‑uri clare pentru agenți (PR‑sized)

### Agent Task A — Export/Import Contract Cleanup
**Prompt:**
- „Search repo for TypeScript errors from missing exports/imports (createServerSupabaseClient, getSupabaseServerClient, createClientComponentClient, etc). Standardize on `createServerClient` from `@/lib/supabase/server` and `createClient` from `@/lib/supabase/client`. Remove `@supabase/auth-helpers-nextjs` usage. Make build pass.”

### Agent Task B — Items end‑to‑end contract
**Prompt:**
- „Unify ItemFormData + validation + actions + repository. Remove phantom fields: image_url/type unless DB has them. Ensure actions export: getItemAction, createItemAction, updateItemAction, archiveItemAction, deleteItemAction and are used consistently.”

### Agent Task C — Chat actions + repo
**Prompt:**
- „Implement chatRepository.listMessages(matchId). Ensure chat-actions exports listMessagesAction and createMessageAction with consistent input field (content or text). Update UI ChatClient props to match (initialMessages supported).”

### Agent Task D — Matches repo join shape
**Prompt:**
- „Fix matchesRepository so `otherUser` is object not array; ensure rating summary destructuring matches actual type. Add helper for membership check.”

### Agent Task E — Exchange minimal flow
**Prompt:**
- „Fix ReceiveConfirmation naming collision (confirm function). Align Exchange types and exchangeRepository mapping. Implement status updates pending/accepted/completed and UI reflects it.”

### Agent Task F — Stripe feature flag
**Prompt:**
- „If stripe package not installed, ensure billing routes compile by returning {ok:false,error:'billing_disabled'} with 501. Add simple flag `BILLING_ENABLED` env check; avoid dynamic import that still fails TypeScript.”

---

## 5) Următorul pas recomandat (ca să începem corect)
Alege „fluxul 1” pe care îl închidem cap‑coadă.

**Recomandare:** Etapa 2 — Items (CRUD).  
Motiv: îți stabilizează contractele de formă și scapă de multe rute „moarte”.

---

## Notițe (pentru întrebările tale viitoare)
- Orice „nu compilează” = mismatch de contract (types/exports/props)
- Orice „se vede la fel” = lipsă `page.tsx` sau layout înghite children
- Stripe/AI/shipping se bagă **după** ce beta e folosită de oameni reali
