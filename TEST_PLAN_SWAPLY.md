TEST_PLAN_SWAPLY.md

(versiune completă, profesională, all-in-one)

# Swaply – Plan de Testare Complet (2025)
Acest document definește toate testele necesare pentru a valida funcționalitățile Swaply.  
Include: testare manuală, testare automată, integrare, E2E, API public, AI și monetizare.

Fiecare test are:
- scop
- input
- pași
- rezultat așteptat
- condiții de test positiV / negativ
- status de trecere / eșec

---

# 1. Structura Planului de Testare

1. Teste pentru autentificare
2. Teste pentru profilul userului
3. Teste pentru Items (creare, editare, ștergere)
4. Teste pentru AI (imagini, titlu, descriere, preț)
5. Teste pentru căutare și filtrare
6. Teste pentru Wishlist
7. Teste pentru Matching Engine
8. Teste pentru Swaps
9. Teste pentru Chat
10. Teste pentru Packaging Helper
11. Teste pentru Payments (Stripe)
12. Teste pentru API-ul Public monetizabil
13. Teste pentru rate limiting
14. Teste E2E complete
15. Teste de stres
16. Teste de securitate & RLS
17. Teste multi-linguale

---

# 2. Autentificare

## Test 2.1 – Signup valid

**Input**
- email valid
- parolă > 6 caractere

**Așteptat**
- 201 CREATED
- user_id returnat

**Negativ**
- email invalid → VALIDATION_ERROR  
- email existent → 409 CONFLICT  
- parolă prea scurtă → VALIDATION_ERROR

---

## Test 2.2 – Login valid

**Input**
- email existent
- parolă corectă

**Așteptat**
- access_token + refresh_token

**Negativ**
- parolă greșită → UNAUTHORIZED  
- cont inexistent → NOT_FOUND

---

# 3. Profil User

## Test 3.1 – GET /user/me

**Așteptat**
- returnează profil complet

**Negativ**
- token expirat → UNAUTHORIZED

---

## Test 3.2 – PATCH /user/update

**Pozitiv**
- schimbare nume, avatar, limbă

**Negativ**
- date invalide → VALIDATION_ERROR  
- token invalid → UNAUTHORIZED

---

# 4. Items

## Test 4.1 – Creare Item cu AI

**Input**
imagen validă (JPG 2MB)

**Pași**
- apeși Create
- imagine → Cloudinary
- AI clasifică → HuggingFace
- LLM generează titlu și descriere

**Așteptat**
- ID generat
- câmpuri AI completate automat

**Negativ**
- imagine > 10MB → ERROR_IMAGE_TOO_LARGE  
- format invalid → ERROR_UNSUPPORTED_FORMAT  
- AI indisponibil → AI_SERVICE_ERROR

---

## Test 4.2 – Editare Item

## Test 4.3 – Ștergere Item

---

# 5. AI – Teste detaliate

## Test 5.1 – Clasificare imagine corectă

Input:  
- poză telefon  
- poză blender  
- poză haină  
- poză bicicletă

Așteptat: categorie + subcategorie corectă.

Negativ: imagine goală → AI_SERVICE_ERROR.

---

## Test 5.2 – Generare titlu & descriere

Titlu trebuie:
- să se potrivească obiectului
- să aibă 2–10 cuvinte
- să nu genereze brand fals

---

## Test 5.3 – Estimare preț

Testăm:  
- telefoane  
- laptopuri  
- televizoare  
- haine  
- electrocasnice  

Așteptat:  
- preț realist  
- interval logic (EUR, RON)

---

# 6. Căutare și filtrare

## Test 6.1 – Căutare după text

Input: “telefon”  
Așteptat: returnează obiecte relevante.

## Test 6.2 – Filtrare după categorie  
## Test 6.3 – Filtrare după distanță  
## Test 6.4 – Zero results

---

# 7. Wishlist

## Test 7.1 – Add wish  
## Test 7.2 – Remove wish  
## Test 7.3 – Get all wishes

Negativ: categorie invalidă.

---

# 8. Matching Engine

## Test 8.1 – Match direct

User A vrea obiectul lui User B, iar B vrea obiectul lui A.

Așteptat: `match_score > 0.8`

## Test 8.2 – Match unilateral  
## Test 8.3 – Fără matchuri

---

# 9. Swaps

## Test 9.1 – Propose swap  
## Test 9.2 – Accept swap  
## Test 9.3 – Reject swap  
## Test 9.4 – Complete swap  
## Test 9.5 – Cancel swap

Negativ:
- user încearcă să schimbe un item care nu îi aparține
- item deja în swap activ  
→ ERROR_NOT_ALLOWED

---

# 10. Chat

## Test 10.1 – Send message  
## Test 10.2 – Get conversation  
## Test 10.3 – Chat între useri fără swap → ERROR_FORBIDDEN

---

# 11. Packaging Helper

## Test 11.1 – Sugestii pentru fragile  
## Test 11.2 – Sugestii pentru voluminos  
## Test 11.3 – Tip invalid → VALIDATION_ERROR

---

# 12. Payments (Stripe)

## Test 12.1 – Create checkout session  
## Test 12.2 – Webhook receive event

Testăm evenimente:
- payment_intent.succeeded
- invoice.payment_succeeded
- customer.subscription.created

Negativ:
- semnătură webhook invalidă → ERROR_INVALID_SIGNATURE

---

# 13. API Public (Monetizabil)

## Test 13.1 – API key valid  
## Test 13.2 – API key invalid → INVALID_API_KEY  
## Test 13.3 – Rate limit depășit → RATE_LIMIT_EXCEEDED  
## Test 13.4 – Classify image  
## Test 13.5 – Generate metadata  
## Test 13.6 – Estimate price  
## Test 13.7 – Matching API

---

# 14. Rate limiting

Simulare 100 cereri / minut.

Așteptat:
- primele 60 → OK
- restul → RATE_LIMIT_EXCEEDED

---

# 15. Teste E2E

## Test complet 15.1 – Flow de bază

1. User creează cont  
2. Încarcă obiect  
3. AI generează titlu/descriere  
4. User caută obiecte  
5. Găsește match  
6. Propune swap  
7. Celălalt acceptă  
8. Chat între useri  
9. Ambalare  
10. Finalizare swap  
11. Feedback  
12. Trust score actualizat

Tot flow-ul trebuie să funcționeze fără eroare.

---

# 16. Teste de stres

## 16.1 – 1000 cereri de căutare în paralel  
## 16.2 – 100 cereri AI simultane  
## 16.3 – 10.000 request-uri API public (plătite)

---

# 17. Teste de securitate & RLS

## 17.1 – User accesează item altui user → FORBIDDEN  
## 17.2 – SQL injection tentativa → blocată  
## 17.3 – Acces neautorizat endpoint privat → UNAUTHORIZED  

---

# 18. Teste Multi-Limbă

## 18.1 – UI limba română  
## 18.2 – UI limba engleză  
## 18.3 – UI limba franceză  
## 18.4 – Traducere descriere generată AI la cerere  
## 18.5 – Căutare în limbi diferite

---

# Concluzie

Acest document definește toate testele obligatorii pentru Swaply.  
Orice versiune finală trebuie să treacă aceste teste fără eșec.

END.