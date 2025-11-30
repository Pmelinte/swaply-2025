📄 TASK_02_ITEMS.md

Swaply 2025 – Implementarea sistemului de Items (CRUD + Upload imagini + Protecție RLS)
Status: Ready for Devin
Prereq: TASK_01_AUTH finalizat (AUTH OK)

🎯 Goal

Implementează sistemul complet de Items în Swaply 2025:

Creare obiect (with image upload)

Vizualizare listă obiecte ale userului logat

Editare obiect

Ștergere obiect

Protecție completă cu Supabase Row Level Security

API sigur cu validări

UI complet (Next.js App Router)

Integrare Cloudinary pentru images

IMPORTANT:
Implementarea trebuie să respecte structura proiectului din ARCHITECTURE_SWAPLY.md + API_SPEC_SWAPLY.md.

📚 Fișiere de citit înainte de implementare

BLUEPRINT_SWAPLY.md

ARCHITECTURE_SWAPLY.md

API_SPEC_SWAPLY.md

DEVIN_INSTRUCTIONS.md

docs/ENV_SUPABASE.md

🏗 Cerințe tehnice
1. Tabela în Supabase: items

Creează tabela items:

field	type	details
id	uuid	primary key, default uuid_generate_v4()
user_id	uuid	references auth.users.id
title	text	required
description	text	optional
image_url	text	required
created_at	timestamptz	default now()
updated_at	timestamptz	default now()
RLS

Activează RLS și adaugă polițe:

-- user can read own items
create policy "User can select own items"
on public.items
for select
using (auth.uid() = user_id);

-- user can insert own items
create policy "User can insert own items"
on public.items
for insert
with check (auth.uid() = user_id);

-- user can update own items
create policy "User can update own items"
on public.items
for update
using (auth.uid() = user_id);

-- user can delete own items
create policy "User can delete own items"
on public.items
for delete
using (auth.uid() = user_id);

🌩 Cloudinary Integration

Folosește:

un singur endpoint server-side pentru upload

folder: swaply/items/

Creează un API endpoint:

/app/api/upload-image/route.ts

Acesta trebuie să:

verifice autentificarea (folosind supabase server client)

accepte doar request POST cu fișier

trimită fișierul la Cloudinary

returneze image_url

🧩 API Endpoints (Next.js App Router)

Toate endpointurile în:

app/api/items/

POST /api/items — Create item

Body:

{
  "title": "string",
  "description": "string",
  "image_url": "string"
}


Cerinte:

validare title (>= 2 chars)

validare image_url

user_id = user din sesiune

GET /api/items — List user items

Returnează lista obiectelor userului curent.

PUT /api/items/[id] — Update item

Validări identice ca la create.

DELETE /api/items/[id] — Delete item
🖥 UI – Pagini și componente

Creează rutele:

app/items/page.tsx             -> list items
app/items/add/page.tsx         -> add item form
app/items/[id]/edit/page.tsx   -> edit item form

Pagina “My Items”

listează obiectele userului logat

card simplu cu imagine, titlu, butoane Edit/Delete

Add Item page

Form fields:

title (input text)

description (textarea)

image upload (drag-and-drop sau input type=file)

submit

workflow:

user selectează imagine → trimite la /api/upload-image

primește image_url

trimite create request către /api/items

Edit Item page

Preload data cu fetch din API:

/api/items/[id]

🧪 Test Plan
Devin must run:
npm install
npm run lint
npm run build

Manual tests (important):

Create item

Edit item

Delete item

Upload image works

User cannot see items of another user (RLS test)

Dashboard link to Items page works

Database updates correctly

✔ Deliverables

Devin trebuie să:

creeze tabela items + RLS în Supabase

creeze toate API endpoints

implementeze toate paginile UI

integreze Cloudinary

verifice lint + build

creeze PR către main

producă un scurt rezumat al implementării

🟢 READY FOR DEVIN

Task complet, final, fără pași lipsă. Devin îl poate executa integral.
