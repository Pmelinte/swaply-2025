PAYMENTS_MONETIZATION.md

(structură completă, 100% utilizabilă)

# Swaply – Payments & Monetization (2025)

Acest document definește toate modalitățile de monetizare din Swaply:
- abonamente premium
- servicii individuale
- boost-uri pentru listări
- taxe de procesare schimb
- monetizarea API public
- planuri de tarifare
- integrare completă cu Stripe
- evenimente webhook și actualizarea DB

Este documentul oficial pentru dezvoltare și testare.

---

# 1. Metode de monetizare în Swaply

## 1.1 Abonament Premium (recurring)
Userul primește:
- listări evidențiate
- acces la statistici
- limite mai mari de anunțuri
- limite mai mari API intern (în viitor)
- prioritate în matching
- badge în profil

### Prețuri propuse:
- **Premium Lunar**: 3.99 EUR
- **Premium Anual**: 39.99 EUR

---

## 1.2 Boost de Listare (one-time)
Userul plătește pentru a evidenția un anunț pe 7 zile.

### Preț:
- **2.49 EUR / boost**

---

## 1.3 Taxă de Procesare – Schimb cu curier
Opțional — aplicată doar dacă:
- schimbul se finalizează cu transport generat prin platformă

### Taxă:
- **1 RON / schimb**

Această taxă este mică și generează venit stabil.

---

## 1.4 API Public (monetizabil)
Swaply oferă servicii AI prin API extern:

Endpoint-uri monetizate:
1. /classify-image  
2. /generate-metadata  
3. /estimate-price  
4. /match  

---

# 2. Pricing pentru API Public

## 2.1 Free Tier
- 500 req / lună
- acces doar la:
  - classify-image
  - generate-metadata
- limită 5MB / imagine

---

## 2.2 Tier 1 – Creator
- **9.99 EUR / lună**
- 10.000 req / lună
- acces la toate endpoint-urile
- max image size 10MB

---

## 2.3 Tier 2 – Business
- **49.99 EUR / lună**
- 100.000 req / lună
- prioritate procesare AI
- endpoint-uri rapide (cache)

---

## 2.4 Enterprise
- custom pricing
- SLA
- endpoint dedicat

---

# 3. Integrare Stripe

Stripe gestionează:
- plăți unice
- abonamente
- currency conversion
- payment methods (card, Apple Pay, Google Pay)
- webhook-uri

---

# 4. Fluxuri de plată

## 4.1 Creare checkout session (frontend → backend)

Endpoint:  
`POST /api/payments/create-checkout-session`

**Body**
```json
{
  "product_type": "premium_monthly", 
  "item_id": null
}


Răspuns

{
  "checkout_url": "https://checkout.stripe.com/..."
}

4.2 Rute produse în Stripe
Produse:

premium_monthly

premium_yearly

listing_boost

api_tier1

api_tier2

4.3 Webhook events

Stripe trimite evenimente către:
POST /api/payments/webhook

Evenimente obligatoriu suportate:

checkout.session.completed
→ user devine premium sau boost activat

invoice.payment_succeeded
→ abonament lunar plătit

invoice.payment_failed
→ trecem userul înapoi la standard

customer.subscription.deleted
→ anulare abonament

payment_intent.succeeded
→ tranzacție finalizată

5. Flow actualizare DB
5.1 Pentru abonamente premium

La checkout.session.completed:

UPDATE profiles
SET account_type = 'premium'
WHERE id = <user_id>;

5.2 Pentru boost de listare

Se adaugă în items:

UPDATE items
SET boosted_until = now() + interval '7 days'
WHERE id = <item_id>;

5.3 Pentru API tiers
UPDATE api_clients
SET plan = 'tier1', monthly_limit = 10000
WHERE id = <client_id>;


sau

UPDATE api_clients
SET plan = 'tier2', monthly_limit = 100000
WHERE id = <client_id>;

6. Erori & validări
Plată invalidă
{
  "error": "PAYMENT_REQUIRED",
  "message": "Payment failed or expired."
}

API key invalidă

INVALID_API_KEY

Plan insuficient

LIMIT_EXCEEDED

7. Rate limiting oficial

API intern:

60 req / minut / user

API public:

în funcție de plan

free tier: 500 / lună

tier1: 10.000 / lună

tier2: 100.000 / lună

enterprise: nelimitat / negociat

8. Note pentru testare (legate de plăți)
Test 1: create-checkout-session

→ returnează link valid

Test 2: webhook

→ verificăm semnătura Stripe

Test 3: upgrade premium

→ account_type = 'premium'

Test 4: expirare abonament

→ se revine la standard

Test 5: boost listing

→ boosted_until setat corect

Test 6: API monetizat

→ verificăm limitele lunare

9. Concluzie

Acest document reprezintă structura finală pentru monetizarea Swaply.
Orice implementare de plăți trebuie să respecte acest plan.
Stripe este singurul procesator oficial în această versiune.

END.