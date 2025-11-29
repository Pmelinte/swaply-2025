API_SPEC_SWAPLY.md

(versiune completă, gata de utilizat)

# Swaply – API Specification (2025)

Acest document definește API-ul complet al platformei Swaply, împărțit în:
1. API intern (pentru frontend ↔ backend)
2. API public (monetizabil)
3. Structuri request/response
4. Coduri de eroare și standarde
5. Rate limiting
6. Note pentru testare automată (Devin / AI IDE)

Toate endpoint-urile sunt REST.  
Răspunsurile sunt în JSON.  
Autentificarea se face prin JWT generat de Supabase, respectat la fiecare request.

---

# 1. API INTERN (Frontend → Backend / Supabase)

## 1.1 Auth

### POST `/api/auth/signup`
Creare cont.

**Body**
```json
{
  "email": "user@example.com",
  "password": "******",
  "preferred_language": "ro"
}


Response

{
  "status": "ok",
  "user_id": "uuid"
}

POST /api/auth/login

Logare user existent.

Body

{
  "email": "user@example.com",
  "password": "******"
}


Response

{
  "access_token": "jwt",
  "refresh_token": "jwt"
}

1.2 User Profile
GET /api/user/me

Returnează profilul userului logat.

Response

{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Petru",
  "avatar_url": "https://...",
  "location": "Tulcea",
  "preferred_language": "ro",
  "trust_score": 82,
  "account_type": "standard"
}

PATCH /api/user/update

Actualizare date user.

1.3 Items (Obiecte)
POST /api/items/create

Se folosește pentru crearea unui obiect + integrarea cu AI (Cloudinary & Hugging Face).

Body

{
  "images": ["base64...", "base64..."],
  "title": "",
  "description": "",
  "category": "",
  "subcategory": "",
  "condition": "",
  "location": "Tulcea, RO",
  "ai_autofill": true
}


Response

{
  "item_id": "uuid",
  "ai": {
    "title": "Telefon mobil",
    "description": "Smartphone stare bună...",
    "category": "Electronics",
    "subcategory": "Mobile Phones",
    "price_estimate": {
      "eur": 230,
      "ron": 1150
    }
  }
}

GET /api/items/{id}
GET /api/items/by-user/{user_id}
GET /api/items/search?q=...&category=...&near=...
PATCH /api/items/{id}/update
DELETE /api/items/{id}/delete
1.4 Wishlist (Dorințe)
POST /api/wishlist/add
DELETE /api/wishlist/{id}
GET /api/wishlist/me
1.5 Matching Engine
GET /api/matching/recommendations

Recomandări pentru userul logat.

Response

{
  "matches": [
    {
      "your_item": "uuid_item1",
      "their_item": "uuid_item2",
      "match_score": 0.92,
      "user_id": "uuid"
    }
  ]
}

1.6 Swaps (Schimburi)
POST /api/swaps/propose

Propunere de schimb.

Body

{
  "to_user": "uuid",
  "your_item": "uuid",
  "their_item": "uuid",
  "message": "Schimbăm?"
}


Response

{ "swap_id": "uuid", "status": "pending" }

POST /api/swaps/{id}/accept
POST /api/swaps/{id}/reject
POST /api/swaps/{id}/complete
POST /api/swaps/{id}/cancel
1.7 Chat
GET /api/chat/{swap_id}
POST /api/chat/{swap_id}/send

Body

{
  "message": "Salut, când ne vedem?"
}

1.8 Packaging Helper (Ambalare)
GET /api/packaging/suggestions?type=fragile

Response

{
  "suggestions": [
    "Cutie carton 30x20x20",
    "Folie cu bule",
    "Banda adeziva"
  ]
}

1.9 Payments (Stripe)
POST /api/payments/create-checkout-session

Pentru abonament premium / boost listing.

POST /api/payments/webhook

Stripe trimite evenimente.

2. API PUBLIC (Monetizabil)

Toate endpoint-urile cer x-api-key, generată per client.

2.1 Clasificare imagine
POST /api/public/v1/classify-image

Body

{
  "image_base64": "..."
}


Response

{
  "category": "Electronics",
  "subcategory": "Mobile Phones",
  "tags": ["phone", "device", "smartphone"]
}

2.2 Generare titlu & descriere
POST /api/public/v1/generate-metadata

Body

{
  "image_base64": "...",
  "language": "en"
}


Response

{
  "title": "Samsung Galaxy S22",
  "description": "Well maintained smartphone..."
}

2.3 Estimare preț
POST /api/public/v1/estimate-price

Body

{
  "category": "Electronics",
  "brand": "Samsung",
  "condition": "very good",
  "image_base64": "optional"
}


Response

{
  "estimated_value": {
    "eur": 240,
    "ron": 1200
  }
}

2.4 Matching API
POST /api/public/v1/match

Body

{
  "items": [...],
  "wishlist": [...]
}

3. Coduri de eroare standard

Toate API-urile returnează:

{
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "The item does not exist."
  }
}

Coduri disponibile:

UNAUTHORIZED

INVALID_API_KEY

RATE_LIMIT_EXCEEDED

ITEM_NOT_FOUND

VALIDATION_ERROR

AI_SERVICE_ERROR

PAYMENT_REQUIRED

INTERNAL_ERROR

4. Rate limiting
API intern

60 requests / minut per user

API public (monetizat)

Free tier: 500 requests / lună

Paid:

Tier 1: 10.000 req/lună

Tier 2: 100.000 req/lună

Enterprise: custom

5. Note pentru testare (Devin / AI IDE)

Pentru fiecare endpoint trebuie testate obligatoriu:

5.1 Teste pozitive

răspuns HTTP corect (200 / 201)

structură JSON completă

validarea datelor

timp de răspuns sub 1.5 sec pentru AI calls

5.2 Teste negative

token invalid

input lipsă

imagine coruptă

categorie invalidă

API key falsă

depășire rate-limit

5.3 Teste de integrare

upload imagine → AI → salvare item

matching → creare swap

swap acceptat → chat → completare swap

plată premium → schimbare rol user

5.4 Teste de stres

100 cereri simultane de clasificare

1000 cereri de search

6. Note finale

Acest document este autoritatea absolută pentru API.
Orice modificare se sincronizează cu blueprint-ul principal.
Toate implementările trebuie să respecte strict structurile de aici.

END.


---

Când ai terminat de salvat fișierul `API_SPEC_SWAPLY.md`, scrie **gata** și trecem la următorul document major: **TEST_PLAN_SWAPLY.md** sau **ARCHITECTURE_SWAPLY.md** (tu alegi ordinea după).
