# STATUS — Swaply (Etapă de testare)

## Pagini

**DONE**
- / (Home)
- /browse (browse + căutare + filtre)
- /items (my items list + activate/deactivate)
- /items/add (create item + AI)
- /items/[id] (public item detail + swap propose)
- /items/[id]/edit
- /wishlist (CRUD preferințe)
- /matches (recomandări/matching)
- /swaps (listă swap-uri)
- /swaps/[id] (accept/reject/confirm)
- /chat (inbox swaps acceptate)
- /chat/[swapId] (swap chat)
- /map (Nearby swaps map + listă)
- /premium (Stripe checkout)
- /api-docs (public API overview)
- /admin (admin view minimal)
- /route-map (harta completă a paginilor)
- /login, /register
- /settings/profile (view/edit)
- /profile/[id] (public profile)

**PARTIAL**
- /swipe/* (legacy flow păstrat, nefolosit în fluxul principal)
- /notifications (prezent dar neconectat la fluxurile principale)

**BROKEN**
- None known

## Endpoint-uri

**Auth**
- GET /api/auth/me
- GET/PATCH /api/profile

**Items**
- GET/POST /api/items
- GET/PUT/DELETE /api/items/[id]
- GET /api/items/public
- GET /api/items/public/[id]

**Wishlist**
- GET/POST /api/wishlist
- DELETE /api/wishlist/[id]

**Matching**
- GET /api/matches

**Swaps & Chat**
- GET/POST /api/swaps
- GET/PATCH /api/swaps/[id]
- GET/POST /api/swaps/[id]/messages

**AI**
- POST /api/ai/classify-image
- POST /api/ai/items/classify
- POST /api/ai/price-estimate

**Payments**
- POST /api/billing/checkout
- POST /api/billing/webhook

**Public API (monetizare)**
- POST /api/public/ai/image-category
- POST /api/public/ai/metadata
- POST /api/public/ai/price
- POST /api/public/matching

## Known Issues
- Stripe webhook nu verifică semnătura (MVP).
- Matching folosește euristici simple (scoring minim).
- Harta nu plasează marker-e reale pe items (doar listă + marker demo).

## Next
- Consolidare UI + polish pentru chat/swaps.
- Semnătură webhook Stripe + gestionare abonamente recurente.
- Admin: management API clients + reports.
