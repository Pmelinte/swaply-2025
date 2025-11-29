DEVIN_INSTRUCTIONS.md

(manual oficial pentru Devin / LLM Development Agents)

# Swaply – Instructions for Devin / AI IDE Agents (2025)

Acest document definește protocolul complet pentru dezvoltarea Swaply folosind Devin sau alți agenți AI.  
Include ordine, reguli, limitări, pași de implementare, testare și validare.

Documentul trebuie urmat *strict*, fără improvizații.

---

# 1. Misiunea agentului AI

Agentul AI trebuie să:
1. implementeze Swaply strict după documentele:
   - BLUEPRINT_SWAPLY.md
   - API_SPEC_SWAPLY.md
   - ARCHITECTURE_SWAPLY.md
   - TEST_PLAN_SWAPLY.md
   - PAYMENTS_MONETIZATION.md
2. nu inventeze funcționalități noi
3. nu modifice structuri existente fără aprobare explicită
4. ruleze testele pentru fiecare modul înainte de finalizare
5. genereze cod stabil, fără warnings și fără dependințe inutile

---

# 2. Ordinea dezvoltării

Agentul trebuie să urmeze exact ordinea de mai jos:

## Pas 1 – Setup
- initializează proiect Next.js (App Router)
- instalează:
  - Supabase client
  - Cloudinary
  - Stripe
  - i18n
  - Tailwind
- configurează folderele conform `ARCHITECTURE_SWAPLY.md`

## Pas 2 – Database
- implementează tabelele exact din `schema.sql`
- aplică RLS conform documentului

## Pas 3 – Auth
- implementează signup → login → user session
- testează toate scenariile din `TEST_PLAN_SWAPLY.md`

## Pas 4 – Items & Upload
- upload → Cloudinary
- clasificare imagine → AI
- titlu + descriere → LLM
- salvează în DB

## Pas 5 – Căutare și filtrare  
## Pas 6 – Wishlist  
## Pas 7 – Matching Engine  
## Pas 8 – Swap flow complet  
## Pas 9 – Chat real-time  
## Pas 10 – Packaging helper  
## Pas 11 – Payments (Stripe)  
## Pas 12 – API public monetizabil

---

# 3. Reguli stricte pentru agent

## 3.1 Nu ignora nimic din documentație
Nicio funcție din blueprint nu trebuie să lipsească.

## 3.2 Nu modifica schema DB fără aprobare explicită
Structura este definită în:
- ARCHITECTURE_SWAPLY.md

## 3.3 Fără librării experimentale
Permise:
- Next.js
- React
- Supabase JS
- Cloudinary
- Stripe
- OpenAI / HuggingFace
- Tailwind / shadcn

Interzise:
- ORM-uri grele noi fără motiv
- tool-uri AI nestabile

## 3.4 Erori JSON standardizate
Toate error responses trebuie să fie:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Description..."
  }
}

4. Implementarea fiecarei funcționalități

Pentru fiecare modul implementat:

Creează codul

Scrie testele automatizate

Rulează testele

Validare manuală a pașilor principali

Marchează modul ca “PASSED”

5. Obligații AI pentru testare

Testele de implementat:

5.1 Unit tests

Pentru:

AI utils

filtering

matching

item validation

5.2 Integration tests

Exemple:

upload imagine → clasificare AI → DB save

swap propose → swap accept → chat

5.3 E2E tests

Flow test 15.1 din TEST_PLAN_SWAPLY.md trebuie să treacă obligatoriu.

5.4 API public tests

Verifică:

API key

rate limiting

endpoint corect

6. Output final cerut agentului

Agentul trebuie să livreze:

6.1 Tot codul aplicatiei

Next.js folder complet

supabase migrations

route handlers

frontend components

runtime configs

6.2 Document tehnic generat automat

lista tuturor fișierelor create

rezumat al testelor trecute

log erori remediate

versiune finală API

6.3 Un build rulabil fără erori

Agentul trebuie să livreze:

ZERO erori

ZERO warnings

ZERO skip la teste

ZERO endpoint-uri lipsă

7. Reguli pentru actualizări & regresii

Agentul nu are voie să:

modifice cod existent fără justificare

introducă regresii în funcționalitățile testate

sări peste teste doar pentru a accelera implementarea

Dacă apare un regres:

agentul trebuie să-l repare înainte de a continua

8. Comportament în caz de erori

La orice eroare:

agentul generează log complet

identifică sursa

propune o soluție

aplică și retestează automat

9. Standard de completare

Finalizarea Swaply este acceptată doar dacă:

toate tabelele respectă structura oficială

API trece toate testele

UI este complet funcțional

Stripe funcționează la test mode

AI returnează rezultate valide

API public are rate limits active

verificările RLS sunt corecte

build-ul rulează local + producție

10. Concluzie

Acest fișier este ghidul oficial pentru Devin sau orice alt agent AI responsabil de construcția Swaply.
Documentul are prioritate absolută peste orice altă formă de interpretare.

END.