# INSTRUCTIUNI_COPILOT.md
## Ghid pentru GitHub Copilot în proiectul Swaply

Acest fișier descrie cum trebuie să se comporte GitHub Copilot în proiectul **Swaply-2025**.  
Scop: Copilot să genereze cod coerent cu arhitectura, fără să strice nimic critic, și să respecte regulile de lucru ale proiectului.

---

## 1. Contextul proiectului

- Proiect: **Swaply** – platformă globală de schimb de obiecte, servicii și locuințe.
- Stack principal:
  - **Next.js App Router**
  - **Supabase** (Auth, DB, RLS)
  - **Cloudinary** (upload & management imagini)
  - **AI extern** (Hugging Face / OpenAI / alte modele) pentru:
    - clasificare imagine,
    - generare titluri și descrieri,
    - matchmaking.
  - Deploy pe **Vercel**.
- Documente-cheie:
  - `docs/SWAPLY_MEMORY_COMPACT.md` → contextul scurt al proiectului.
  - `docs/SWAPLY_STATUS.md` → ce este implementat vs. ce este în lucru.
  - `docs/history/*.html` → istoric de decizii, log-uri, debugging.

Copilot trebuie să trateze aceste fișiere ca „sursa de adevăr” pentru intențiile proiectului.

---

## 2. Reguli generale de comportament

1. **Respectă arhitectura existentă.**
   - Nu propune structuri complet noi de foldere fără motiv.
   - Respectă pattern-urile deja folosite în:
     - `src/features/profile/`
     - `src/app/api/...`
     - `src/lib/supabase/...`

2. **Nu inventa endpoint-uri sau tabele care nu există.**
   - Pentru orice API, verifică mai întâi:
     - ce există în `src/app/api/`
     - ce rute au fost deja definite.
   - Pentru DB, logica trebuie să fie coerentă cu:
     - `Supabase`,
     - tabelele documentate în `SWAPLY_MEMORY_COMPACT.md` și `SWAPLY_STATUS.md`.

3. **Propune cod complet, nu bucăți rupte din context.**
   - Pentru componente, acțiuni, hooks:
     - generează funcții complete, cu toate importurile necesare.
   - Evită să generezi cod care depinde de „helpers” inexistenți.

4. **Nu atinge fișiere sensibile fără o intenție clară.**
   - Fișiere considerate critice:
     - middleware,
     - config Supabase,
     - setup global (ex. `_app`, root layout),
     - config RLS și SQL scripts.
   - Orice schimbare majoră la ele trebuie făcută cu justificare clară în comentarii.

---

## 3. Ce trebuie să citească Copilot înainte să sugereze cod

Atunci când utilizatorul lucrează într-un fișier, Copilot trebuie „mental” să țină cont că proiectul are:

1. **Memorie de proiect:**
   - `docs/SWAPLY_MEMORY_COMPACT.md`
   - `docs/SWAPLY_STATUS.md`

2. **Arhitectură standardizată pe module:**
   - Modul **Profile**:
     - fișiere în `src/features/profile/…`
     - API `/api/profile`
   - Modul **Swipe / Modul 9**:
     - tabele `swipes_supply` / `fake_swipes_supply`,
     - endpoint `/api/swipe/supply`.
   - Modul **Add Item + AI classify**:
     - upload Cloudinary,
     - endpoint de clasificare AI (planificat: `/api/ai/items/classify`).

3. **Reguli de lucru cu AI:**
   - Fișierele și convențiile descrise în:
     - `docs/SWAPLY_MEMORY_COMPACT.md`
     - rezumatele din `docs/history/`

Copilot NU „vede” aceste fișiere în mod automat ca un om, dar sugestiile lui sunt mai bune dacă structura codului și a convențiilor este păstrată.

---

## 4. Stilul de generare cod în Swaply

Copilot ar trebui să:

1. **Urmeze pattern-urile existente.**
   - Pentru API routes:
     - folosește `NextRequest` / `NextResponse` conform App Router.
     - folosește client Supabase server-side acolo unde e necesară autentificarea.
   - Pentru componente:
     - folosește TypeScript.
     - menține importurile ordonate și clare.

2. **Mențină tiparea strictă (TypeScript).**
   - Fără `any` gratuit.
   - Preferă tipuri clare importate din:
     - `src/features/.../types.ts`,
     - modele comune.

3. **Trateze Supabase corect.**
   - Nu folosi random `supabase.auth` în client fără să verifici pattern-urile existente.
   - Respectă modul corect de a obține user-ul autentificat în API și UI.

4. **Respecte RLS și autentificarea.**
   - Orice operație de DB cu user trebuie:
     - să folosească `auth.uid()` (în SQL / policies),
     - să țină cont că accesul la rânduri este filtrat.

---

## 5. Ce NU ar trebui să facă Copilot în Swaply

1. **Să nu creeze fișiere noi cu nume arbitrare** în:
   - `src/app/`
   - `src/features/`
   - fără să urmeze pattern-ul existent.

2. **Să nu „refactorizeze” masiv codul** din:
   - modului Profile,
   - modulului Swipe,
   - zonele deja stabilizate,
   - fără motiv clar.

3. **Să nu propună schimbări de schemă DB** (tabele, coloane) fără a ține cont de:
   - ce este scris în `SWAPLY_STATUS.md`,
   - ce este deja implementat în SQL migrations / Supabase.

4. **Să nu sugereze cod care ignoră regulile de lucru step-by-step.**
   - Utilizatorul preferă:
     - fișier complet,
     - clar,
     - fără magie.

---

## 6. Integrarea cu Devin și alți agenți

Copilot trebuie să fie „compatibil” cu alte unelte AI folosite în proiect:

- Devin:
  - lucrează la nivel de task-uri mai mari.
  - citește `SWAPLY_MEMORY_COMPACT.md` și `SWAPLY_STATUS.md`.
- ChatGPT / Gemini:
  - generează cod și specificații pornind de la aceleași documente.

Pentru consistență:
- Copilot ar trebui să respecte aceleași convenții de nume, endpoint-uri și structuri ca în documentație.
- Orice cod generat de Copilot trebuie să poată fi înțeles ușor de un alt agent (Devin, ChatGPT etc.) doar prin citirea repo-ului.

---

## 7. Mesaje de commit (recomandare)

Când utilizatorul acceptă modificările sugerate de Copilot și face commit, mesajele de commit ar trebui să fie:

- scurte,
- clare,
- orientate pe o singură schimbare.

Exemple:
- `feat: add AI classify endpoint for items`
- `fix: adjust swipe supply RLS policies`
- `refactor: split profile form into smaller components`
- `docs: update SWAPLY_STATUS with chat module state`

---

## 8. Concluzie

GitHub Copilot, în Swaply, nu este un „magician” ci un **asistent disciplinat**.  
Trebuie să:

- respecte arhitectura existentă,
- urmeze documentația din `docs/`,
- evite schimbările haotice,
- genereze cod coerent cu ce există deja.

Acest fișier este contractul de lucru al lui Copilot în proiectul Swaply.
