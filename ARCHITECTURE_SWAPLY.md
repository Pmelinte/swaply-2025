ARCHITECTURE_SWAPLY.md

(versiune completă, arhitectură finală Swaply 2025)

# Swaply – Arhitectură Tehnică (2025)

Acest document descrie arhitectura completă Swaply:
- structura bazei de date Supabase (PostgreSQL)
- relațiile între tabele
- modele backend
- fluxuri logice
- integrarea AI
- modulul de plăți (Stripe)
- API public
- principiile RLS (security)
- diagrame

Blueprint pentru Devin + orice AI IDE.

---

# 1. Overview arhitectură

Swaply este compus din 5 zone:

1. **Frontend** – Next.js (App Router, TypeScript, i18n)
2. **Backend API** – Server actions + route handlers
3. **Database** – Supabase PostgreSQL + RLS
4. **AI Layer** – HuggingFace, OpenAI/LLM, modele interne
5. **External services** – Cloudinary (imagini), Stripe (plăți)

---

# 2. Structura bazei de date

Tabele principale:

1. `users`
2. `profiles` (extensie pentru user tables Supabase)
3. `items`
4. `item_images`
5. `wishlist`
6. `swaps`
7. `swap_messages`
8. `payments`
9. `api_clients`
10. `api_usage_logs`

Toate ID-urile sunt **UUID v4**.

---

# 3. Definiția tabelelor

## 3.1 `profiles`
Profil extins pentru user.

```sql
id uuid primary key references auth.users(id);
name text;
avatar_url text;
location text;
preferred_language text;
trust_score integer default 50;
account_type text default 'standard'; -- 'standard', 'premium'
created_at timestamp default now();

3.2 items

Obiectele postate în Swaply.

id uuid primary key default gen_random_uuid();
user_id uuid references profiles(id) on delete cascade;
title text;
description text;
category text;
subcategory text;
condition text; -- new / very_good / good / used
price_estimate_eur numeric;
price_estimate_ron numeric;
location text;
is_active boolean default true;
created_at timestamp default now();
updated_at timestamp default now();

3.3 item_images

Pozele fiecărui obiect.

id uuid primary key default gen_random_uuid();
item_id uuid references items(id) on delete cascade;
image_url text;
sort_order integer default 1;

3.4 wishlist
id uuid primary key default gen_random_uuid();
user_id uuid references profiles(id) on delete cascade;
category text;
brand text;
condition text;
created_at timestamp default now();

3.5 swaps

Schimburile între useri.

id uuid primary key default gen_random_uuid();
from_user uuid references profiles(id);
to_user uuid references profiles(id);
from_item uuid references items(id);
to_item uuid references items(id);
status text default 'pending'; -- pending / accepted / rejected / complete / cancelled
created_at timestamp default now();
updated_at timestamp default now();

3.6 swap_messages
id uuid primary key default gen_random_uuid();
swap_id uuid references swaps(id) on delete cascade;
sender_id uuid references profiles(id);
message text;
created_at timestamp default now();

3.7 payments

Tranzacții Stripe.

id uuid primary key default gen_random_uuid();
user_id uuid references profiles(id);
stripe_customer_id text;
stripe_session_id text;
amount numeric;
currency text;
type text; -- subscription / boost / api
status text; -- pending / paid / failed
created_at timestamp default now();

3.8 api_clients

Chei API pentru clienți externi.

id uuid primary key default gen_random_uuid();
client_name text;
api_key text unique;
plan text; -- free / tier1 / tier2 / enterprise
monthly_limit integer;
requests_this_month integer default 0;
created_at timestamp default now();

3.9 api_usage_logs
id uuid primary key default gen_random_uuid();
api_key text references api_clients(api_key);
endpoint text;
status text;
created_at timestamp default now();

4. Relații între tabele
profiles 1---N items
items 1---N item_images

profiles 1---N wishlist

profiles 1---N swaps (from_user, to_user)
items 1---N swaps (from_item, to_item)

swaps 1---N swap_messages

profiles 1---N payments

api_clients 1---N api_usage_logs

5. Fluxuri logice principale
5.1 Creare anunț

User încarcă imagine

Backend → Cloudinary (upload)

Backend → AI classify

Backend → AI title/description

Backend → AI price estimation

Salvăm în DB (items + item_images)

5.2 Căutare

Frontend trimite query

Backend filtrează în supabase folosind:

ilike

categorie

subcategorie

location approx

Returnează lista

5.3 Matching Engine

Sistemul ia:

itemele userului

wishlist-ul userului

obiectele altor useri

Calculează match_score:

categorie (0.4)

subcategorie (0.3)

stare (0.1)

distanță (0.1)

popularitate (0.1)

Returnează top match-uri

5.4 Flow de Swap

A → B propune schimb

B acceptă / respinge

Dacă acceptă → se activează chat

Ambii confirmă schimbul

Trust score crește

Ambele items devin inactive

5.5 Flow de plăți (Stripe)

User cere acces premium

Swaply generează checkout session

Stripe redirect → user plătește

Stripe webhook → confirmare

actualizăm profilul:

account_type = "premium"

5.6 API Public

Client trimite request → cu x-api-key

Validăm cheia

Verificăm planul (free/paid)

Dacă depășește limit → RATE_LIMIT_EXCEEDED

Rulăm funcția (AI / matching etc.)

Inregistrăm în api_usage_logs

6. Integrare AI

AI-ul este împărțit în 3 componente:

6.1 Image Classification (HuggingFace)

returnează categorie/subcategorie

6.2 Metadata Generation (LLM)

titlu

descriere (în limba preferată a userului)

6.3 Price Estimation

model propriu (fine-tuned)

back-up API (OpenAI + euristică internă)

7. RLS (Row Level Security)

Pentru securitate, toate tabelele au reguli:

users / profiles

User poate vedea DOAR propriile date.

items

Public: poate vedea items active
User: poate modifica DOAR items proprii

swaps

User poate vedea DOAR:

swap-uri unde este from_user sau to_user

swap_messages

User poate vedea DOAR:

mesaje din swap-urile unde este implicat

payments

User vede doar plățile proprii

api_clients

Vizibile DOAR adminilor

8. Diagrame
8.1 Diagrama DB (textuală)
profiles
 ├── items
 │     └── item_images
 │
 ├── wishlist
 │
 ├── swaps (from_user)
 │     ├── swap_messages
 │     └── items (from_item)
 │
 ├── swaps (to_user)
 │     └── items (to_item)
 │
 ├── payments
 │
 └── api_clients
        └── api_usage_logs

9. Structura Foldere
/app
  /api
    /auth
    /items
    /wishlist
    /matching
    /swaps
    /payments
    /public-api
  /(pages)
  /components
  /lib
  /utils
  /ai
  /hooks

/supabase
  schema.sql
  policies.sql

/docs
  BLUEPRINT_SWAPLY.md
  API_SPEC_SWAPLY.md
  ARCHITECTURE_SWAPLY.md
  TEST_PLAN_SWAPLY.md


10. Standarde generale

Toate ID-urile: UUID v4

Date: ISO8601

Erori: JSON standardizat

Rate limit implementat la nivel:

API intern

API public

Logs pentru:

AI processing

payments

API usage

errors

11. Concluzie

Acest document este blueprint-ul final al arhitecturii Swaply.
Orice implementare trebuie să respecte structurile de aici STRICT.
Orice schimb în DB → se actualizează și acest fișier.

END.