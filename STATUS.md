# Swaply Status (Etapă de testare)

## Pagini
**DONE**
- Home `/`
- Browse `/browse`
- Item detail `/items/[id]`
- Match-uri `/matches`, `/matches/[id]`
- Chat `/chat`, `/chat/[id]`, `/chat/[matchId]`
- Wishlist `/wishlist`
- Swaps / Exchanges `/exchanges`, `/exchanges/[id]`
- Map `/map`
- Categories `/categories`, `/categories/[slug]`
- Items CRUD `/items`, `/items/add`, `/items/[id]/edit`
- Profile view `/profile`, public profile `/profile/[id]`
- Profile settings `/settings/profile`
- Auth `/login`, `/register`, `/logout`
- Admin `/admin`
- Premium `/premium`
- Route map `/routes`

**PARTIAL**
- Notifications `/notifications` (UI există, depinde de date)
- Swipe flows `/swipe/supply`, `/swipe/demand`
- Items `/items/new` (formular simplu, păstrat pentru compat)

**BROKEN**
- N/A (dacă apare, trece aici)

## Endpoints (API)
**Core**
- `/api/items`, `/api/items/[id]`
- `/api/items/public`, `/api/items/public/[id]`
- `/api/wishlist`, `/api/wishlist/[itemId]`
- `/api/matches`, `/api/matches/[id]/messages`, `/api/matches/[id]/context`
- `/api/chat` (via `/api/matches/...`)
- `/api/exchange/*`
- `/api/swipe/supply`, `/api/swipe/demand`
- `/api/profile`
- `/api/notifications`

**AI**
- `/api/ai/items/classify`
- `/api/ai/classify-image`

**Payments**
- `/api/billing/checkout`
- `/api/billing/webhook`

**Public API**
- `/api/public/image/category`
- `/api/public/image/metadata`
- `/api/public/price`
- `/api/public/matching`

## Known Issues
- Stripe checkout este dezactivat până se instalează `stripe` și se configurează env-urile.
- AI classification depinde de chei HuggingFace; fără env, returnează erori.
- RLS poate bloca unele liste dacă politicile nu sunt aplicate complet.

## Următorii pași (imediat)
- Verificare RLS în Supabase pentru `api_clients` + `api_usage_logs`.
- Testare E2E pentru flow-ul complet swap + trust score.
- Curățare pagină `/items/new` dacă nu mai e necesară.
