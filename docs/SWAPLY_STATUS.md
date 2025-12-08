# Swaply – Status Implementare (high-level)

> Acest fișier rezumă ce este **implementat**, ce este **în lucru** și ce este doar **definit la nivel de concept** în proiectul Swaply.  
> Statusul trebuie actualizat manual ori de câte ori se schimbă ceva important în cod.

---

## 1. Status pe zone funcționale

- **Auth & Profile**
  - ✅ Implementat (cu Supabase Auth + modul Profile complet)
- **Items & Media (Inventory)**
  - ✅ Implementat (Add Item, upload imagini, salvare în DB)
- **AI – Clasificare & Titluri**
  - 🔄 Parțial (folosit în concept, endpoint dedicat de clasify încă de definit/confirmat în cod)
- **Swipe / Match (Modul 9)**
  - 🔄 Implementare de bază + RLS configurat, în curs de rafinare
- **Chat / Mesagerie**
  - 📅 Planificat / În lucru conceptual
- **Notificări**
  - 📅 Definite la nivel de evenimente & canale, neimplementate în cod
- **Gamificare & Ranguri**
  - 📅 Definite conceptual (Bronze/Silver/Gold/Platinum), neimplementate
- **Monetizare & Plăți**
  - 📅 Concept clar (Stripe, ranguri plătite, boosting), neimplementat
- **Categorii & Taxonomie**
  - 📅 Concept clar (categorii/subcategorii în DB), implementare de verificat
- **Hărți, Localizare, InfoCity**
  - 📅 Concept clar (hartă, utilizatori, obiecte, localități), neimplementat sau foarte incipient

---

## 2. Detaliu pe module

### 2.1. Auth & Profile

**Status:** ✅ Implementat

**Ce știm din memorie:**
- Folosește **Supabase Auth** (email + parolă).
- Există modul complet **Profile** cu:
  - types, validation, repository, actions, ensure-profile,
  - UI: `profile-view`, `profile-form`, `profile-section`,
  - API: `/api/profile` cu GET/POST, protejat.
- Profilul:
  - se autocreează la primul acces (ensure-profile),
  - include: limbă, locație, avatar (Cloudinary).

**Ce trebuie făcut pe viitor:**
- Extindere câmpuri profil (trust, rang, statistici).
- Integrare mai profundă cu AI (sugestii pentru completare profil).

---

### 2.2. Items & Media (Inventar)

**Status:** ✅ Implementat (MVP)

**Ce știm din memorie:**
- Există **formular de Add Item**:
  - upload de imagini (Cloudinary),
  - salvare obiecte în DB.
- Obiectele au:
  - titlu, descriere,
  - imagini, locație,
  - categorie/subcategorie (conceptual),
  - valoare estimată (AI – la nivel de idee),
  - status de disponibilitate.

**Ce trebuie verificat/clarificat:**
- Cât din câmpurile conceptuale există în schema reală din Supabase.
- Nivelul actual de integrare AI (titlu / descriere / categorie).

---

### 2.3. AI – Clasificare & Titluri

**Status:** 🔄 Parțial / de confirmat

**Ce spune memoria:**
- Endpoint planificat: `POST /api/ai/items/classify`
  - citește `imageUrl` + `locale` din body,
  - cheamă un model (Hugging Face sau alt API) folosind:
    - `HF_ITEM_CLASSIFIER_URL` / `HF_IMAGE_CLASSIFIER_URL`,
    - `HF_API_TOKEN` / `HUGGINGFACE_API_KEY`,
  - normalizează răspunsul la tipul `ItemClassificationResult`.
- AI trebuie să poată genera:
  - titlu,
  - descriere,
  - valoare estimată.

**Status estimat:**
- Conceptul este foarte clar.
- Codul pentru endpoint trebuie **confirmat** sau implementat (dacă lipsește).

---

### 2.4. Modul 9 – Swipe / Match

**Status:** 🔄 Implementare de bază + debugging ongoing

**Ce știm:**
- Există discuții detaliate și implementări pe:
  - tabele `swipes_supply` / `fake_swipes_supply`,
  - RLS (user vede și modifică doar propriile rânduri),
  - endpoint `/api/swipe/supply`:
    - protejat (401 dacă nu e logat),
    - inserează swipe (`desired_item_id`, `note`).
- Au fost lucrate:
  - politici RLS (INSERT, SELECT, UPDATE, DELETE),
  - debugging pentru erori de tip:
    - `relation does not exist`,
    - `column does not exist`,
    - probleme de policy.

**Ce mai trebuie:**
- Confirmat că:
  - tabelele finale (`swipes_*`) sunt create în Supabase,
  - RLS este activ și corect,
  - endpoint-ul funcționează în producție (Vercel).
- Extindere către:
  - wishlist,
  - match-uri reale (double opt-in),
  - statistici de interes.

---

### 2.5. Chat / Mesagerie

**Status:** 📅 Planificat / posibil incipient

**Ce spune memoria:**
- Chatul este prevăzut ca:
  - „Mesaje & Chat” în meniul global,
  - componentă centrală pentru match-uri.
- Modele de date planificate:
  - `Message`: id, conversation_id, sender_id, content, created_at, is_read.
  - `Conversation`: id, participants[], last_message, updated_at.
- Endpoint-uri propuse:
  - `GET /api/conversations`
  - `GET /api/conversations/[id]/messages`
  - `POST /api/conversations/[id]/messages`

**Realitate estimată:**
- Structura conceptuală există.
- Implementarea completă (DB + API + UI realtime) este **încă de făcut** sau doar începută.

---

### 2.6. Notificări

**Status:** 📅 Definite conceptual, neimplementate

**Definit în memorie:**
- Evenimente:
  - `new_message`,
  - `offer_proposed`,
  - `swap_confirmed`,
  - `swap_status_changed`.
- Canale:
  - intern (badge notificări & chat),
  - email (eventuri critice),
  - SMS (doar pentru cazuri speciale: ex. schimb de locuințe).

**Ce trebuie:**
- Tabele pentru notificări.
- Servicii pentru trimitere email.
- UI pentru centru de notificări.

---

### 2.7. Gamificare & Ranguri

**Status:** 📅 Concept clar, cod lipsă

**Definit în memorie:**
- Ranguri:
  - Bronze,
  - Silver,
  - Gold,
  - Platinum.
- Beneficii:
  - vizibilitate mai mare în feed,
  - limite conversații,
  - filtre speciale,
  - badge-uri vizuale.
- Legătură directă cu sistemul de monetizare.

**Ce trebuie:**
- Schema in DB pentru puncte și rang.
- Calcul puncte (tranzacții, activitate).
- UI pentru badge-uri și filtre.

---

### 2.8. Monetizare & Plăți

**Status:** 📅 Planificat

**Definit în memorie:**
- Stripe (favorit) pentru:
  - abonamente (ranguri premium),
  - boosting / promovare obiecte.
- Flux minim:
  - endpoint pentru creare sesiune checkout,
  - webhook pentru confirmare,
  - tabel `subscriptions` / `payments`,
  - activare rang/beneficiu după confirmare.

**Ce trebuie:**
- Integrare Stripe reală.
- Configurare chei, webhook-uri.
- UI pentru gestionare abonamente/offers.

---

### 2.9. Categorii & Taxonomie

**Status:** 📅 Concept bine definit, implementare de clarificat

**Definit în memorie:**
- Necesitate pentru:
  - categorii și subcategorii (obiecte, servicii, locuințe),
  - folosire în:
    - AI classify,
    - filtre,
    - UI (selecte, browsere de categorie).
- Plan pentru:
  - bază de date cu multe categorii,
  - seed masiv pentru testare.

**Ce trebuie:**
- Tabele `categories` / `subcategories`.
- Legături `item -> category`.
- Seed inițial.

---

### 2.10. Hărți, Localizare, InfoCity

**Status:** 📅 Concept definit, neimplementat

**Definit în memorie:**
- Modul „InfoCity & Localizare”:
  - hartă utilizatori,
  - obiecte & servicii pe zone,
  - localități din Delta și nu numai,
  - povești locale,
  - legături cu turism rural.
- Integrare planificată cu:
  - Google Maps (sau alternativă),
  - geolocație pentru useri și item-uri.

**Ce trebuie:**
- Alegerea providerului de hartă.
- Componente de UI pentru hartă.
- Tabele pentru localități / zone / POI.
- Legături cu item-urile și profilurile.

---

## 3. Reguli de lucru (legate de status)

- Acest fișier este **sursa oficială de adevăr** pentru:
  - ce module sunt gata,
  - ce este în lucru,
  - ce este doar concept.
- Orice AI (ChatGPT, Devin, Gemini, Copilot) care lucrează pe Swaply ar trebui:
  - să citească întâi `SWAPLY_MEMORY_COMPACT.md`,
  - apoi să consulte `SWAPLY_STATUS.md` pentru starea actuală.
- Orice modificare majoră de cod trebuie însoțită, ideal, de un update în acest fișier.

---

_Last manual update: de completat când se modifică._
