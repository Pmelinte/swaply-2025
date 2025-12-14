# Swaply Repo Index (Source of Truth)

Acest fișier este indexul oficial al repo-ului Swaply.
Scop: să evităm verificarea în cerc a acelorași fișiere și să avem o hartă clară a proiectului.

Reguli:
- Orice modul nou adăugat în cod trebuie trecut aici.
- Orice fișier mutat/șters trebuie actualizat aici.
- În chat, când lucrăm pe un modul, referința primară este acest index.

---

## 0) Quick Map (rute UI principale)

- `/items` -> `src/app/(app)/items/page.tsx`
- `/items/[id]` -> `src/app/(app)/items/[id]/page.tsx`
- `/items/add` -> `src/app/(app)/items/add/page.tsx`
- `/wishlist` -> `src/app/(app)/wishlist/page.tsx`
- `/notifications` -> `src/app/(app)/notifications/page.tsx`
- `/matches` -> `src/app/(app)/matches/page.tsx`
- `/settings/profile` -> `src/app/(app)/settings/profile/page.tsx` (și/sau ProfileClient)

---

## 1) API Map (rute Next.js App Router)

### Wishlist
- `src/app/api/wishlist/route.ts` (GET, POST)
- `src/app/api/wishlist/[itemId]/route.ts` (DELETE)

### Items
- `src/app/api/items/route.ts` (GET list)
- `src/app/api/items/[id]/route.ts` (GET by id)

### Categories
- `src/app/api/categories/route.ts` (GET)

### Notifications
- `src/app/api/notifications/route.ts` (GET)
- `src/app/api/notifications/read/route.ts` (POST)

### Matches & Messages
- `src/app/api/matches/[id]/summary/route.ts` (GET)
- `src/app/api/matches/[id]/messages/route.ts` (GET, POST)

### Gamification
- `src/app/api/gamification/me/route.ts` (GET)

### AI
- `src/app/api/ai/items/classify/route.ts` (POST)  ← verifică path-ul real dacă diferă

---

## 2) Feature Modules (src/features)

### Profile (✅)
- (lista completă a fișierelor modulului profile aici)

### Items (✅/🔄)
- `src/features/items/components/item-form.tsx`
- `src/features/items/hooks/use-item-form.ts`
- `src/features/items/server/items-actions.ts` (dacă există)
- `src/features/items/types.ts`
- `src/features/items/validation.ts`

### Wishlist (✅)
- `src/features/wishlist/types.ts`
- `src/features/wishlist/hooks/use-wishlist.ts`
- `src/features/wishlist/components/WishlistButton.tsx`
- `src/features/wishlist/server/wishlist-repository.ts` (dacă e folosit)

### Notifications (✅)
- `src/features/notifications/types.ts`
- `src/features/notifications/hooks/use-notifications.ts`

### Gamification (MVP ✅)
- `src/features/gamification/types.ts`
- `src/features/gamification/server/gamification-service.ts`
- `src/features/gamification/hooks/use-gamification.ts`

### Matches / Chat (🔄)
- `src/features/matches/components/MatchList.tsx`
- `src/features/matches/components/MatchCard.tsx`
- `src/features/matches/server/matches-repository.ts` (dacă există)
- `src/features/chat/types.ts` (dacă există)

---

## 3) Shared / Lib

### Supabase
- `src/lib/supabase/server.ts` (createServerClient)
- `src/lib/supabase/client.ts` (dacă există)

### Categories helpers
- `src/lib/categories/get-categories.ts` (dacă există)
- `src/lib/categories/get-category-tree.ts` (dacă există)
- `src/lib/categories/build-category-tree.ts` (dacă există)
- `src/lib/categories/ai-label-mapper.ts` (dacă există)

---

## 4) UI Shell

- Navbar: `src/components/Navbar.tsx`
- App layout: `src/app/(app)/layout.tsx`

---

## 5) Backlog (următorii “capete de pod”)

1) Chat UI minimal: pagină `/chat` + listă match-uri + intrare conversație  
2) Categories UI: pagină listă categorii + navigare în arbore  
3) AI: auto-run la upload imagine + mapping categorie/subcategorie fără click manual  
4) Gamification: UI vizibil pentru user (badge/mini card)  
5) Notifications: UX mai bun (mark one read, deep-link)

---

## 6) Last update
- Updated at: (completează manual data când modifici)
- Notes: (ce s-a schimbat)