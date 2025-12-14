# Swaply – File Index (sursa de adevăr)

Scop: acest fișier este “harta” repo-ului. Când lucrăm la Swaply, înainte să reinventăm roata,
verificăm aici dacă există deja fișierul și ce face.

Reguli:
- Când adăugăm un fișier nou, îl trecem aici (path + 1 linie “ce face”).
- Când mutăm/renumim, actualizăm aici.
- Când ceva e “în lucru”, marcăm cu 🔄.
- Când e “MVP gata”, marcăm cu ✅.
- Când e doar “plan”, marcăm cu 📅.

---

## 1) App Router – Pages (UI)

### Items
- ✅ `src/app/(app)/items/page.tsx` — listare items (feed) via `/api/items`
- ✅ `src/app/(app)/items/[id]/page.tsx` — detalii item + `WishlistButton`
- ✅ `src/app/(app)/items/add/page.tsx` — pagină Add Item (server) + `ItemForm`

### Wishlist
- ✅ `src/app/(app)/wishlist/page.tsx` — pagina Wishlist UI

### Notifications
- ✅ `src/app/(app)/notifications/page.tsx` — pagina Notificări UI

### Categories
- ✅ `src/app/(app)/categories/[slug]/page.tsx` — items filtrate pe categorie (slug)

### Matches / Chat
- ✅ `src/app/(app)/matches/page.tsx` — listă match-uri (server) via repo
- 📅 `src/app/(app)/chat/page.tsx` — (de creat) inbox/chat entry point
- 📅 `src/app/(app)/matches/[id]/page.tsx` — (de creat) ecran match/chat pentru un match

### Layout / Navigation
- ✅ `src/app/(app)/layout.tsx` — include `Navbar`
- ✅ `src/components/Navbar.tsx` — link-uri + badge (wishlist/notif) + rank (gamification)

---

## 2) API Routes

### Items
- ✅ `src/app/api/items/route.ts` — listare items (filtre simple)
- ✅ `src/app/api/items/[id]/route.ts` — item by id

### Wishlist
- ✅ `src/app/api/wishlist/route.ts` — GET preview list + POST add
- ✅ `src/app/api/wishlist/[itemId]/route.ts` — DELETE remove

### Notifications
- ✅ `src/app/api/notifications/route.ts` — listare + unreadCount (+ filtre)
- ✅ `src/app/api/notifications/read/route.ts` — mark one/all read

### Categories
- ✅ `src/app/api/categories/route.ts` — listare categorii (opțional type=object/service/home)

### Matches / Messages
- ✅ `src/app/api/matches/[id]/summary/route.ts` — match preview (other user + last msg)
- ✅ `src/app/api/matches/[id]/messages/route.ts` — GET/POST mesaje + best-effort notification insert

### Gamification
- ✅ `src/app/api/gamification/me/route.ts` — read-only: rank + stats

---

## 3) Features – Wishlist

- ✅ `src/features/wishlist/types.ts` — types Wishlist
- ✅ `src/features/wishlist/hooks/use-wishlist.ts` — hook load/add/remove
- ✅ `src/features/wishlist/components/WishlistButton.tsx` — buton toggle în pagina item
- ✅ `src/features/wishlist/server/wishlist-repository.ts` — list/add/remove (server)

---

## 4) Features – Notifications

- ✅ `src/features/notifications/types.ts` — types Notifications
- ✅ `src/features/notifications/hooks/use-notifications.ts` — hook (list + unread + mark read)

---

## 5) Features – Items

- ✅ `src/features/items/components/item-form.tsx` — formular complet + upload + AI call
- ✅ `src/features/items/hooks/use-item-form.ts` — state/validation + `applyAiMetadata`
- ✅ `src/features/items/server/items-actions.ts` — create item action (folosit în add/page.tsx)
- 📌 `src/features/items/types.ts` — (verifică existența) types Item / ItemFormData / ItemAiMetadata
- 📌 `src/features/items/validation.ts` — (verifică existența) schema + labels (condition etc.)

---

## 6) Features – Matches

- ✅ `src/features/matches/components/MatchList.tsx` — list component
- ✅ `src/features/matches/components/MatchCard.tsx` — card component (include rating badge)
- ✅ `src/features/matches/server/matches-repository.ts` — listMatchesForUser()
- 📌 `src/features/chat/types.ts` — (verifică existența) ChatMessage, MatchPreview etc.

---

## 7) Features – Gamification

- ✅ `src/features/gamification/types.ts` — ranks + points + stats types
- ✅ `src/features/gamification/server/gamification-service.ts` — ensure stats + apply event
- ✅ `src/features/gamification/hooks/use-gamification.ts` — hook pentru navbar/UI

---

## 8) Lib / Helpers

### Categories helpers
- ✅ `src/lib/categories/get-categories.ts` — fetch categories via `/api/categories`
- ✅ `src/lib/categories/get-category-tree.ts` — (verifică existența) build tree + fetch
- ✅ `src/lib/categories/build-category-tree.ts` — build tree din listă plată
- ✅ `src/lib/categories/ai-label-mapper.ts` — map labels -> category/subcategory slug

### Supabase
- ✅ `src/lib/supabase/server.ts` — server client (auth cookie)
- ✅ `src/lib/supabase/client.ts` — (dacă există) browser client

---

## 9) “De creat” ca să închidem MVP-ul fără cercuri

### 9.1 Chat entry point (minim)
- 📅 `src/app/(app)/chat/page.tsx` — redirect la `/matches` sau inbox simplu

### 9.2 Match chat UI (minim)
- 📅 `src/app/(app)/matches/[id]/page.tsx` — UI care folosește:
  - `/api/matches/[id]/summary`
  - `/api/matches/[id]/messages` (GET + POST)

---

## 10) Note / Decizii

- Ads (AdSense) – păstrăm ideea. Nu o implementăm încă în MVP UI.
  Motiv: evităm să blocăm layout-ul și politicile până nu avem trafic + pagini stabile.
  Când revenim: ad slots discrete pe `items/[id]` și `items/page` (componentă separată).

Ultima actualizare: manual (commit).