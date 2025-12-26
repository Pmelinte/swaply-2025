# Swaply — ROUTE_MAP (canonical contract)
Acest fișier este contractul de implementare UI/UX pentru Swaply.
Sursa vizuală de adevăr: /docs/design/*.excalidraw (schema Excalidraw).
Regulă: implementarea este considerată corectă doar dacă TOATE checklist-urile de mai jos sunt bifate 100%.
Regulă: nu se inventează pagini/denumiri/fluxuri în afara a ceea ce este în Excalidraw + acest ROUTE_MAP.

---

## Convenții globale (obligatorii peste tot)
- [ ] Header global prezent pe toate paginile: Selector limbă + buton Meniu contextual + status Premium/Platinum (dacă e cazul)
- [ ] Footer global prezent pe toate paginile (navigație): Home / Obiecte / Match / Chat / Change / Info
- [ ] Meniul contextual include: Notificări (like/interes/solicitare chat/mesaj/swaply/facilitatori/feedback), Setări, Profil, Logout, Termeni & GDPR
- [ ] Toate paginile au stări: loading / empty / error (fără crash, fără 404 pe fluxurile canonice)
- [ ] Orice funcționalitate „neterminată” trebuie să fie vizibilă ca buton/zonă dar „disabled” + text clar (nu rupe build, nu rupe UX)
- [ ] Nicio rută nu este redenumită „după inspirație”. Numele din Excalidraw sunt canonice.

---

## ROUTE CONTRACTS

> Format (NU schimba formatul):
> Route:
> Ecran (nume din Excalidraw):
> Scop:
> Componente obligatorii:
> CTA-uri obligatorii:
> State obligatorii:
> Interdicții:
> DONE când:

---

### Route: /
Ecran (nume din Excalidraw): HOME
Scop: hub de orientare + acces rapid către fluxuri (nu execută swap)
Componente obligatorii:
- [ ] Card „Descoperă oportunități…”
- [ ] Zonă Hartă (cu fallback: pin disabled dacă map provider off)
- [ ] Anunțuri / Stări & mesaje obligatorii (sistem)
- [ ] Ghid rapid (linkuri către pagini canonice)
CTA-uri obligatorii:
- [ ] Vezi obiecte disponibile → /objects
- [ ] Vezi match-uri → /match
- [ ] Inițiază chat → /chat (sau CTA către login dacă neautentificat)
- [ ] Monitorizează schimburile → /change
State obligatorii:
- [ ] Neautentificat: CTA către /login (fără erori)
- [ ] Profil incomplet: mesaj + link către /profile
Interdicții:
- [ ] Nu implementa swipe aici
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /login
Ecran (nume din Excalidraw): LOGIN
Scop: autentificare + onboarding minim
Componente obligatorii:
- [ ] Login email + parolă
- [ ] Link către Termeni & GDPR
- [ ] Checkbox acceptare (nu permite submit fără)
CTA-uri obligatorii:
- [ ] Login
- [ ] Resetare parolă (poate fi stub)
State obligatorii:
- [ ] invalid creds → eroare UI
Interdicții:
- [ ] Nu „mock success” fără indicator clar
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /profile
Ecran (nume din Excalidraw): PROFIL
Scop: date user + locație + setări + vizibilitate
Componente obligatorii:
- [ ] Date profil (minim: nume display, locație)
- [ ] Setări vizibilitate / badge (Free/Premium/Platinum)
- [ ] Preferințe limbă (dacă există în schemă)
CTA-uri obligatorii:
- [ ] Salvează
State obligatorii:
- [ ] lipsă locație → avertisment (impact pe hartă/match)
Interdicții:
- [ ] Nu ascunde câmpuri cerute în schemă
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /objects
Ecran (nume din Excalidraw): OBIECTE (listare)
Scop: listare + filtrare + acces CRUD
Componente obligatorii:
- [ ] Listă cu carduri obiect
- [ ] Filtre (categorie/subcategorie dacă există în schemă; altfel stub clar)
- [ ] Search
- [ ] Link către creare /objects/new
CTA-uri obligatorii:
- [ ] Vezi → /objects/[id]
- [ ] Editează → /objects/[id]/edit
- [ ] Șterge (cu confirmare)
State obligatorii:
- [ ] empty list → empty state
Interdicții:
- [ ] Nu afișa 404 pe /objects/[id]
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /objects/new
Ecran (nume din Excalidraw): ADAUGĂ OBIECT
Scop: creare obiect cu toate câmpurile cerute de schemă
Componente obligatorii:
- [ ] Upload imagine (cu preview)
- [ ] Titlu / descriere
- [ ] Stare obiect (nou/puțin utilizat/utilizat/antichitate) dacă există în schemă
- [ ] Categorie/subcategorie dacă există în schemă
- [ ] Locație / zonă
CTA-uri obligatorii:
- [ ] Salvează
State obligatorii:
- [ ] validare minimă (nu permite submit gol)
Interdicții:
- [ ] Nu salva fără confirmări cerute (dacă schema cere)
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /objects/[id]
Ecran (nume din Excalidraw): DETALIU OBIECT
Scop: pagină completă obiect + acțiuni
Componente obligatorii:
- [ ] Galerie imagini (sau fallback)
- [ ] Detalii obiect
- [ ] CTA către Match/Chat/Swap
CTA-uri obligatorii:
- [ ] Inițiază chat → /chat
- [ ] Propune schimb → /change (sau flow intermediar dacă schema cere)
State obligatorii:
- [ ] id inexistent → mesaj + link înapoi (nu crash)
Interdicții:
- [ ] Nu „invent” fields care nu există în schemă
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /objects/[id]/edit
Ecran (nume din Excalidraw): EDITARE OBIECT
Scop: editare completă
Componente obligatorii:
- [ ] form ca la creare, cu valori preumplute
CTA-uri obligatorii:
- [ ] Salvează modificări
State obligatorii:
- [ ] loading inițial
Interdicții:
- [ ] Nu pierde imagini existente fără confirmare
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /match
Ecran (nume din Excalidraw): MATCHING
Scop: recomandări + explicabilitate + fallback manual
Componente obligatorii:
- [ ] Listă match-uri recomandate
- [ ] Secțiune „De ce acest match?” (traceability)
- [ ] Buton „mod manual” (fallback)
CTA-uri obligatorii:
- [ ] Vezi detalii match
- [ ] Inițiază chat
State obligatorii:
- [ ] AI down → fallback manual clar
Interdicții:
- [ ] Nu ascunde explicabilitatea
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /chat
Ecran (nume din Excalidraw): CHAT
Scop: chat cu moderare + traducere + atașamente safe
Componente obligatorii:
- [ ] Listă conversații
- [ ] Panel mesaje
- [ ] Toggle traducere
- [ ] Atașamente (cu scanare/fallback)
CTA-uri obligatorii:
- [ ] Trimite mesaj
- [ ] CTA către confirmare swap /change (dacă schema cere)
State obligatorii:
- [ ] fără conversații → empty state
Interdicții:
- [ ] Nu permite upload fără indicator „safe/unsafe”
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /change
Ecran (nume din Excalidraw): SCHIMB (Swaply flow)
Scop: confirmare + logistică + hartă + notificări + feedback
Componente obligatorii:
- [ ] Timeline pași swap
- [ ] Selectare locație întâlnire / curier (stub ok, dar clar)
- [ ] Notificări automate (stub ok, dar clar)
- [ ] Feedback & reputație după finalizare
CTA-uri obligatorii:
- [ ] Marchează în desfășurare
- [ ] Confirmă finalizarea
- [ ] Anulează swap
State obligatorii:
- [ ] neconfirmat → blocaje/logica clară
Interdicții:
- [ ] Nu marca finalizat fără pașii ceruți de schemă
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate

---

### Route: /info
Ecran (nume din Excalidraw): INFO
Scop: statistici + legal + monetizare + contract AI
Componente obligatorii:
- [ ] Statistici
- [ ] Help & legal (Termeni/GDPR/Cookies)
- [ ] Monetizare & tokeni
- [ ] Contract AI (reguli, fallback)
CTA-uri obligatorii:
- [ ] Link Termeni
- [ ] Link GDPR
- [ ] Manage cookies (stub ok)
State obligatorii:
- [ ] toate secțiunile vizibile
Interdicții:
- [ ] Nu omite partea legală
DONE când:
- [ ] toate checkbox-urile de mai sus sunt bifate
