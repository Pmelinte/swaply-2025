# Swaply – Inventar fișiere (sursa unică de adevăr)

Scop: lista completă a fișierelor relevante din proiect, cu status clar:
- ✅ există și e OK
- 🟡 există dar e incomplet / de revizuit
- ❌ lipsește (trebuie creat)
- ⚠️ există dar probabil greșit / duplicat / inconsistent

Reguli:
- Nu discutăm build aici.
- Nu discutăm DB/RLS aici.
- Doar inventar + status.
- Dacă există două variante ale aceluiași fișier (ex: route.ts “vechi” vs “nou”), marcăm ambele și notăm care e “oficial”.

---

## 0) Repo housekeeping

- ✅/🟡/❌ README.md
- ✅/🟡/❌ SWAPLY_STATUS.md
- ✅/🟡/❌ SWAPLY_MEMORY_COMPACT.md
- ✅/🟡/❌ SWAPLY_FILES_INVENTORY.md (acest fișier)

---

## 1) App Router – pagini (UI)

### 1.1 Root / layout / globale
- ✅/🟡/❌ src/app/layout.tsx
- ✅/🟡/❌ src/app/page.tsx
- ✅/🟡/❌ src/app/globals.css
- ✅/🟡/❌ src/app/(app)/layout.tsx

### 1.2 Profile
- ✅/🟡/❌ src/app/(app)/settings/profile/page.tsx
- ✅/🟡/❌ src/app/(app)/settings/profile/ProfileClient.tsx

### 1.3 Items
- ✅/🟡/❌ src/app/(app)/items/page.tsx
- ✅/🟡/❌ src/app/(app)/items/[id]/page.tsx
- ✅/🟡/❌ src/app/(app)/my/items/page.tsx
- ✅/🟡/❌ src/app/(app)/items/add/page.tsx

### 1.4 Chat
- ✅/🟡/❌ src/app/(app)/chat/page.tsx
- ✅/🟡/❌ src/app/(app)/chat/[id]/page.tsx

### 1.5 Wishlist
- ✅/🟡/❌ src/app/(app)/wishlist/page.tsx

### 1.6 Map
- ✅/🟡/❌ src/app/(app)/map/page.tsx

---

## 2) API Routes (Next.js)

### 2.1 Auth / user
- ✅/🟡/❌ src/app/api/auth/me/route.ts

### 2.2 Profile
- ✅/🟡/❌ src/app/api/profile/route.ts

### 2.3 Categories
- ✅/🟡/❌ src/app/api/categories/route.ts

### 2.4 Items
- ✅/🟡/❌ src/app/api/items/route.ts
- ✅/🟡/❌ src/app/api/items/[id]/route.ts

### 2.5 AI classify
- ✅/🟡/❌ src/app/api/ai/items/classify/route.ts

### 2.6 Swipe / Match (Modul 9)
- ✅/🟡/❌ src/app/api/swipe/supply/route.ts
- ✅/🟡/❌ src/app/api/swipe/offered-items/route.ts

### 2.7 Matches
- ✅/🟡/❌ src/app/api/matches/route.ts
- ✅/🟡/❌ src/app/api/matches/[id]/messages/route.ts
- ✅/🟡/❌ src/app/api/matches/[id]/read/route.ts
- ✅/🟡/❌ src/app/api/matches/[id]/context/route.ts
- ✅/🟡/❌ src/app/api/matches/[id]/summary/route.ts

### 2.8 Wishlist
- ✅/🟡/❌ src/app/api/wishlist/route.ts
- ✅/🟡/❌ src/app/api/wishlist/[itemId]/route.ts

### 2.9 Notifications (dacă există)
- ✅/🟡/❌ src/app/api/notifications/route.ts
- ✅/🟡/❌ src/app/api/notifications/[id]/route.ts

---

## 3) Features – Profile

- ✅/🟡/❌ src/features/profile/index.ts
- ✅/🟡/❌ src/features/profile/types.ts
- ✅/🟡/❌ src/features/profile/validation.ts
- ✅/🟡/❌ src/features/profile/server/profile-repository.ts
- ✅/🟡/❌ src/features/profile/server/profile-actions.ts
- ✅/🟡/❌ src/features/profile/server/ensure-profile.ts
- ✅/🟡/❌ src/features/profile/components/profile-view.tsx
- ✅/🟡/❌ src/features/profile/components/profile-form.tsx
- ✅/🟡/❌ src/features/profile/components/profile-section.tsx
- ✅/🟡/❌ src/features/profile/hooks/use-profile-form.ts

---

## 4) Features – Items

- ✅/🟡/❌ src/features/items/types.ts
- ✅/🟡/❌ src/features/items/validation.ts
- ✅/🟡/❌ src/features/items/hooks/use-item-form.ts
- ✅/🟡/❌ src/features/items/components/item-form.tsx
- ✅/🟡/❌ src/features/items/server/items-repository.ts
- ✅/🟡/❌ src/features/items/server/items-actions.ts

Note (duplicații):
- ⚠️ item-form.tsx poate exista în 2 variante (cu input text vs select tree). Marchează aici care e oficială.

---

## 5) Features – Chat

- ✅/🟡/❌ src/features/chat/types.ts
- ✅/🟡/❌ src/features/chat/server/chat-repository.ts
- ✅/🟡/❌ src/features/chat/components/ChatClient.tsx

---

## 6) Features – Wishlist

- ✅/🟡/❌ src/features/wishlist/types.ts
- ✅/🟡/❌ src/features/wishlist/server/wishlist-repository.ts
- ✅/🟡/❌ src/features/wishlist/server/wishlist-actions.ts (dacă există)

---

## 7) Categories & Tree utilities

- ✅/🟡/❌ src/types/category.ts
- ✅/🟡/❌ src/lib/api/get-categories.ts
- ✅/🟡/❌ src/lib/categories/build-tree.ts
- ✅/🟡/❌ src/lib/categories/get-category-tree.ts

---

## 8) Supabase / Auth helpers

- ✅/🟡/❌ src/lib/supabase/server.ts
- ✅/🟡/❌ src/lib/supabase/client.ts
- ✅/🟡/❌ middleware.ts

---

## 9) DB / migrations / SQL (dacă există în repo)

- ✅/🟡/❌ supabase/migrations/*
- ✅/🟡/❌ sql/*

---

## 10) Lista de conflicte / duplicări cunoscute (manual)

1) [Fișier] ______________________
   - Variante: ___________________
   - Oficial: ____________________
   - Motiv: ______________________

2) [Fișier] ______________________
   - Variante: ___________________
   - Oficial: ____________________
   - Motiv: ______________________

---

## 11) Ultima actualizare

- Data: ____________
- Autor: ___________
- Observații: ______________________