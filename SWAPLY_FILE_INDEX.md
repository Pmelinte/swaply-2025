# Swaply – File Index (Source of Truth)

Scop: fișierul este harta persistentă a repo-ului. Când lucrăm la Swaply, verificăm aici ce există deja și cum se leagă modulele.

Reguli rapide:
- Orice fișier nou/mutat se trece aici (path + o linie “ce face”).
- Marcaje: ✅ gata / 🔄 work-in-progress / 📅 plan.
- Structura este grupată pe module principale: Items, Wishlist, Matches/Chat, Notifications, Gamification, Auth/Profile, AI.

---

## 0) Arhitectură și rute
- Next.js App Router principal: `src/app/*` (module Swaply 2025). Layout: `src/app/(app)/layout.tsx` include `src/components/Navbar.tsx`.
- Există și un spațiu legacy/paralel în `app/*` (vechi entrypoints + API); vezi secțiunea 4.

### UI rute principale (App Router nou)
- Items feed: `src/app/(app)/items/page.tsx`; detaliu: `src/app/(app)/items/[id]/page.tsx`; add: `src/app/(app)/items/add/page.tsx`; edit: `src/app/(app)/items/[id]/edit/page.tsx`; metadata helper: `src/app/(app)/items/[id]/metadata.ts`.
- Wishlist: `src/app/(app)/wishlist/page.tsx`.
- Matches & chat: listă `src/app/(app)/matches/page.tsx`; match detail/chat shell `src/app/(app)/matches/[id]/page.tsx` + client `ChatClient.tsx`; chat threads: `src/app/(app)/chat/page.tsx`, `src/app/(app)/chat/[id]/page.tsx`, `[matchId]/page.tsx`, și `[id]/layout.tsx`.
- Notifications: `src/app/(app)/notifications/page.tsx`.
- Gamification profile: `src/app/(app)/profile/gamification.tsx`; user profile page: `src/app/(app)/settings/profile/page.tsx`; public profile: `src/app/(app)/profile/[id]/page.tsx`.
- Categories & map: `src/app/(app)/categories/page.tsx`, `[slug]/page.tsx`, și `src/app/(app)/map/page.tsx`.
- Swipe flows: supply `src/app/(app)/swipe/supply/page.tsx` și demand `src/app/(app)/swipe/demand/page.tsx`.
- Exchanges: listă `src/app/(app)/exchanges/page.tsx`; detaliu `src/app/(app)/exchanges/[id]/page.tsx` + componente timeline/offers/shipping/rate/receive confirmation în același folder; `src/app/(app)/my/items/page.tsx` pentru inventarul personal.
- Misc: `/add` shortcut `src/app/(app)/add/page.tsx`.

### API routes (App Router nou)
- Items: `src/app/api/items/route.ts` (listare/filtre), `src/app/api/items/[id]/route.ts` (detaliu).
- Wishlist: `src/app/api/wishlist/route.ts` (GET/POST), `src/app/api/wishlist/[itemId]/route.ts` (DELETE).
- Matches & chat: `src/app/api/matches/route.ts` (list), `src/app/api/matches/[id]/summary.ts`, `[id]/messages.ts`, `[id]/read.ts`, `[id]/context.ts` (status/read/context helpers).
- Notifications: `src/app/api/notifications/route.ts` (list/unread), `[id]/route.ts` (fetch/update), `read/route.ts` (mark read).
- Gamification: `src/app/api/gamification/me/route.ts` (rank/stats current user).
- Categories: `src/app/api/categories/route.ts`, `categories/tree/route.ts`.
- Swipe: `src/app/api/swipe/supply/route.ts`, `swipe/demand/route.ts`.
- Exchanges: `src/app/api/exchange/[id]/items/route.ts` (exchange item list).
- Billing: `src/app/api/billing/checkout/route.ts`, `billing/webhook/route.ts`.
- Auth: `src/app/api/auth/me/route.ts` (profil user curent).
- AI: `src/app/api/ai/items/classify/route.ts`, `src/app/api/ai/classify-image/route.ts`.

---

## 1) Items (catalog + formulare)
- Feature types/validation: `src/features/items/types.ts`; `src/features/items/validation.ts` (schema form); AI metadata helpers: `src/features/items/lib/apply-ai-metadata.ts` și `src/features/items/ai/client.ts` (client AI classif.).
- Server actions/repo: `src/features/items/server/items-actions.ts` (create/update) și `src/features/items/server/items-repository.ts` (DB ops).
- Hooks & UI: `src/features/items/hooks/use-item-form.ts`; form component `src/features/items/components/item-form.tsx`; edit form `src/features/items/components/ItemEditForm.tsx`; my items list `src/features/items/components/my-items-list.tsx`; row actions `ItemRowActions.tsx`.
- Pages: vezi rutele din secțiunea 0 (add, feed, detail, edit, metadata helper). Metadata helper `metadata.ts` expune titluri/descriptions din item.

## 2) Wishlist
- API: `src/app/api/wishlist/...` (secțiunea 0). Client hook `src/features/wishlist/hooks/use-wishlist.ts` gestionează add/remove/load + expune state în UI.
- Server: `src/features/wishlist/server/wishlist-repository.ts` + `wishlist-actions.ts` (mutări server). Types in `src/features/wishlist/types.ts`.
- UI: toggle components `src/features/wishlist/components/WishlistButton.tsx`, `WishlistToggle.tsx`, `WishlistToggleButton.tsx`; aggregator export `src/features/wishlist/index.ts`.
- Page: `/wishlist` la `src/app/(app)/wishlist/page.tsx`.

## 3) Matches & Chat
- API: matches list/summary/messages/read/context la `src/app/api/matches/...`; chat UI rute la `src/app/(app)/matches/*` și `src/app/(app)/chat/*`.
- Feature server: `src/features/matches/server/matches-repository.ts` (listMatchesForUser etc.). Chat server actions: `src/features/chat/server/chat-actions.ts`; repo `src/features/chat/server/chat-repository.ts` (persist messages/match context). Types in `src/features/chat/types.ts`.
- UI: `src/features/matches/components/MatchList.tsx`, `MatchCard.tsx`; chat client `src/features/chat/components/ChatClient.tsx`; page-level client `src/app/(app)/matches/[id]/ChatClient.tsx` share logic.

## 4) Notifications
- API: notificări la `src/app/api/notifications/...` (list/mark read/single fetch).
- Feature: `src/features/notifications/types.ts`; hook `src/features/notifications/hooks/use-notifications.ts` (fetch/unread/mark read). Notification creation helper `src/lib/notifications/create-message-notification.ts` pentru mesaje noi.
- UI: pagina `/notifications` la `src/app/(app)/notifications/page.tsx`; badge în `src/components/Navbar.tsx`.

## 5) Gamification
- API: `src/app/api/gamification/me/route.ts` (rank/stats curente).
- Feature: `src/features/gamification/types.ts`; server service `src/features/gamification/server/gamification-service.ts` (ensure stats, apply event); hook `src/features/gamification/hooks/use-gamification.ts` pentru UI (navbar/rank). UI profile view la `src/app/(app)/profile/gamification.tsx`.

## 6) Auth & Profile
- Auth API check: `src/app/api/auth/me/route.ts` (server auth context).
- Profile feature: `src/features/profile/types.ts`, `validation.ts`; hooks `use-profile-form.ts`; server `ensure-profile.ts`, `profile-repository.ts`, `profile-actions.ts`; UI `components/profile-form.tsx`, `profile-section.tsx`, `profile-view.tsx`; index export `src/features/profile/index.ts`; doc `src/features/profile/README.md`.
- Settings/profile page: `src/app/(app)/settings/profile/page.tsx`; public profile view `src/app/(app)/profile/[id]/page.tsx`.
- Legacy auth (vechi): rute `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx` (vezi secțiunea 4).

## 7) AI
- API endpoints: `src/app/api/ai/items/classify/route.ts` și `src/app/api/ai/classify-image/route.ts` (image classification endpoint).
- Feature helpers: `src/features/items/ai/client.ts` (client wrapper) + `apply-ai-metadata.ts` (map predictions in form).
- Lib AI tools: `src/lib/ai/generate-item-title.ts`, `generate-item-description.ts`, `item-classification.ts`, `map-ai-label-to-category.ts`, `extract-item-tags.ts`.

---

## 8) Alte module conexe
- Swipe: types `src/features/swipe/types.ts`; server repo/actions `src/features/swipe/server/swipe-repository.ts`, `swipe-actions.ts`; UI deck `src/features/swipe/components/swipe-deck.tsx`; rute `/swipe/supply|demand` + API corespunzătoare.
- Exchanges: types `src/features/exchange/types.ts`; server repo/actions `src/features/exchange/server/exchange-repository.ts`, `exchange-actions.ts`; UI workflow în `src/app/(app)/exchanges/[id]/*` (timeline, offer, shipping, rating, receive confirmation) + list `exchanges/page.tsx`.
- Reviews: `src/features/reviews/types.ts`, `server/reviews-repository.ts`, `reviews-actions.ts`, component `UserRatingBadge.tsx`.
- Categories: config list `src/config/item-categories.ts`; lib: `src/lib/api/get-categories.ts`, `src/lib/categories/build-tree.ts`, `get-category-tree.ts`, `ai-label-mapper.ts`; pages `/categories` + API `categories/*`.
- Map: UI `src/app/(app)/map/page.tsx` (folosește item locations dacă există).
- Navbar & shared components: `src/components/Navbar.tsx`, `src/components/CategorySelect.tsx`.

## 9) Shared libraries & infrastructură
- Supabase (nou): `src/lib/supabase/server.ts` (server client). Cloudinary client `src/lib/cloudinary/client.ts`.
- Types shared: `src/types/category.ts` (category tree typing) plus feature-level types.
- i18n: `lib/i18n/config.ts` + translations `lib/i18n/translations/*.json`.
- Legacy shared: `lib/types/item.ts`, `lib/types/profile.ts`, `lib/types/swipe.ts`; supabase client/server în `lib/supabase/*.ts`; Cloudinary client `lib/cloudinary/client.ts` (legacy paths folosite de `app/*`).

## 10) Legacy/Paralel App (folder `app/` rădăcină)
- UI pages: root landing `app/page.tsx`; dashboard `app/dashboard/page.tsx`; profile `app/profile/page.tsx`; items index `app/items/page.tsx`; add item `app/items/add/page.tsx`; edit item `app/items/[id]/edit/page.tsx`; settings profile `app/settings/profile/page.tsx` + `ProfileClient.tsx`.
- Auth: login/register în `app/(auth)/*`.
- API (legacy): `app/api/items/route.ts` & `[id]/route.ts`; swipe endpoints `app/api/swipe/{supply,demand,desired-items,offered-items}/route.ts`; upload image `app/api/upload-image/route.ts`; health `app/api/health/route.ts`; profile `app/api/profile/route.ts`.
- Layout/Styles: `app/layout.tsx`, `app/globals.css`.

## 11) Docs și roadmap
- Documentație de produs/roadmap: `README.md`, `ROADMAP.md`, `SWAPLY_ROADMAP.md`, `ARCHITECTURE_SWAPLY.md`, `BLUEPRINT_SWAPLY.md`, `PAYMENTS_MONETIZATION.md`, `SWAPLY_FILES_INVENTORY.md`, `DEVIN_INSTRUCTIONS.md`, `REPO_INDEX.md`, `API_SPEC_SWAPLY.md`, `TEST_PLAN_SWAPLY.md`, plus fișiere HTML summary (în română) din rădăcină.
- Supabase migrations: `supabase/migrations/*` (schema DB). Config suplimentar: `tailwind.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `next.config.mjs`, `package.json`.

## 12) Ultima actualizare
- Actualizat la: 2025-02-09.
- Note: index complet repo grupat pe module + clarificare dual app router.
