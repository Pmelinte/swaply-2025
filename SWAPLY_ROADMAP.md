# Swaply Roadmap (Previziune minimă + ordine de lucru)

Scopul acestui fișier:
- să evităm ciclurile de verificat aceleași fișiere
- să avem previziune minimă: ce urmează, ce atinge, ce fișiere/endpoint-uri apar
- să nu mai apară “fișiere din aer” fără să fie trecut aici

Regula de aur:
- Nicio funcționalitate nouă nu intră în repo dacă nu e listată aici (ca “Planificat” sau “În lucru”).
- Când adăugăm o funcționalitate: completăm aici “ce fișiere” + “ce endpoint-uri” + “DB”.
- Debugging-ul build-ului e separat de livrarea funcționalităților (poate fi făcut după).

---

## 0) Status actual (rezumat)

Implementat (MVP-level):
- Auth + Profile (Supabase, Cloudinary avatar)
- Items (list + detail) + API
- Wishlist (API + UI + WishlistButton)
- Chat (API + UI)
- Notifications (API + UI + mark read)
- Categories (API + tree utils + pagină items by category)
- Gamification (types + service + API me)
- Map (Google Maps MVP page)

Notă:
- Unele părți pot avea inconsistențe snake_case/camelCase între DB și API (se repară în “Hardening”, nu blochează roadmap-ul).

---

## 1) Principiul de “previziune minimă”

Pentru fiecare modul nou, definim:
1) DB (tabele/coloane/policies) – dacă e cazul
2) API routes (path-uri) – clar, finit
3) UI routes (pagini) – clar, finit
4) Componente/hooks – doar dacă sunt necesare să folosești UI-ul

---

## 2) Backlog pe epics (ordine recomandată)

### Epic A — Navigație + “descoperire” (să nu fie funcțiile ascunse)
Motiv: dacă există funcții dar nu sunt ușor accesibile, MVP-ul pare “gol”.

Planificat:
- A1. Navbar global (cu badge notifications + wishlist count)
  - UI: componentă Navbar
  - Integrare: layout App Router
  - Fișiere:
    - src/components/Navbar.tsx
    - src/app/(app)/layout.tsx (sau layout relevant)

- A2. Home page simplu: intrări către Items / Categories / Map
  - UI: page / (app)/page.tsx sau existentă
  - Fișiere:
    - src/app/(app)/page.tsx (dacă nu există sau e goală)

---

### Epic B — Integrări “AI în Add Item” (să fie magie vizibilă, nu doar endpoint)
Motiv: ai endpoint-ul, dar câștigul vine când UI se auto-completează.

Planificat:
- B1. Hook/funcție “applyAiMetadata” în Add Item page (auto-title)
- B2. Category mapping (label -> category slug)
- B3. Salvare în items: category/subcategory/tags (stabile)

Atinge:
- UI Add Item: când urci imaginea -> call /api/ai/items/classify -> update form

Fișiere probabile (în funcție de structura ta curentă):
- src/app/(app)/add/page.tsx sau src/app/(app)/items/add/page.tsx (unde e Add Item)
- src/features/items/hooks/use-item-form.ts (dacă există)
- src/features/ai/* (dacă ai separat)
- (opțional) src/lib/ai/map-category.ts

API folosit:
- POST /api/ai/items/classify (existent)

---

### Epic C — “Offers / Swap flow” (adevăratul Swaply, nu doar chat)
Motiv: chat fără tranzacție = messenger. Swaply trebuie să aibă ofertare + acceptare.

Planificat (MVP tranzacție):
- C1. Offer create (din item page / match page)
- C2. Offer accept / decline
- C3. Swap status transitions (pending -> accepted -> completed / cancelled)

DB:
- offers (id, match_id, proposer_id, payload, status, created_at)
- (sau direct în matches: status + last_offer_json)

API:
- POST /api/offers
- POST /api/offers/[id]/accept
- POST /api/offers/[id]/decline

UI:
- Pagina în match/chat să arate oferta curentă
- Un “OfferCard” în chat thread

Fișiere:
- src/app/api/offers/route.ts
- src/app/api/offers/[id]/accept/route.ts
- src/app/api/offers/[id]/decline/route.ts
- src/features/offers/types.ts
- src/features/offers/components/OfferCard.tsx
- (update) src/app/(app)/chat/[id]/page.tsx (sau ChatClient)

---

### Epic D — Notificări “realiste” (event-driven)
Motiv: notificările devin utile când se trimit automat la evenimente (mesaj, ofertă, accept etc).

Planificat:
- D1. “createNotification” helper server-side
- D2. Trigger din:
  - POST messages (ai deja best-effort insert)
  - offers create/accept/decline
  - match created
- D3. Badge în Navbar (deja concept)

Fișiere:
- src/features/notifications/server/notifications-service.ts (nou)
- (update) endpoints care emit notificări

---

### Epic E — Gamificare folosită în UI (nu doar types/service)
Motiv: rangurile trebuie să apară undeva ca să aibă sens.

Planificat:
- E1. UI mini widget (rank + points)
- E2. Event endpoint de test (opțional, dev-only)
  - POST /api/gamification/event

API:
- GET /api/gamification/me (existent)
- POST /api/gamification/event (nou)

UI:
- Profil sau Navbar dropdown: “Bronze/Silver/Gold/Platinum”

Fișiere:
- src/app/api/gamification/event/route.ts (nou)
- src/features/gamification/components/RankBadge.tsx (nou)
- (update) Profile UI / Navbar

---

### Epic F — Maps: items + users on map
Motiv: harta nu trebuie să fie doar “pin”. Trebuie să arate valoare: obiecte în jur.

Planificat:
- F1. items cu coordonate (lat/lng) + afișare markers
- F2. filters (category)
- F3. click marker -> open item

DB:
- items: lat, lng (sau location_json)

API:
- GET /api/map/items?bbox=...&category=...

UI:
- src/app/(app)/map/page.tsx (update)

---

## 3) “Hardening” (curățenie după ce avem funcțiile)
Aici intră:
- snake_case/camelCase inconsistencies
- N+1 queries (ex: matches route care face query per match)
- RLS strict, public read policy pentru items feed dacă vrei public
- build errors

Important:
- Hardening NU se amestecă cu “livrare funcționalitate”.
- Se face în blocuri dedicate.

---

## 4) Regulă anti-cerc
Dacă un fișier este verificat și “nu necesită modificări”, îl marcăm aici:

Fișiere verificate (OK):
- (completăm manual când confirmăm)

Scop:
- să nu ne întoarcem la ele în loop.

---

## 5) Următorul pas recomandat (din Epic A)
A1: Navbar global + integrare în layout.