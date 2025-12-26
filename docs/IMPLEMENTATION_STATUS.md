# Swaply — IMPLEMENTATION_STATUS

Contract bifat conform `docs/design/ROUTE_MAP.md` + Excalidraw `Swaply-2025-12-25-1702.excalidraw`. Pagini/rute nu au fost redenumite.

## Convenții globale
- [x] Header global pe toate paginile (selector limbă, meniu contextual, badge Premium/Platinum).
- [x] Footer global pe toate paginile (Home / Obiecte / Match / Chat / Change / Info).
- [x] Meniu contextual: notificări (stub vizibil), setări, profil, logout, termeni & GDPR.
- [x] Stări vizibile loading / empty / error pe fiecare pagină (StateShowcase + fallback-uri dedicate).
- [x] Funcționalități neterminate marcate ca stub/disabled (upload local, subcategorii disable, notificări simulate).
- [x] Nicio rută canonică returnează 404 în navigație normală.

## Route checklist

### /
- [x] Card „Descoperă oportunități…”
- [x] Zonă hartă cu fallback pin disabled dacă provider off.
- [x] Anunțuri + Stări & mesaje obligatorii.
- [x] Ghid rapid + CTA-uri către /objects, /match, /chat, /change.
- [x] Neautentificat: CTA către /login; profil incomplet: mesaj + link /profile.

### /login
- [x] Login email + parolă + checkbox acceptare Termeni & GDPR (obligatoriu).
- [x] Link Termeni & GDPR.
- [x] CTA Login + Resetare parolă (stub vizibil).
- [x] State invalid creds → eroare UI; loading explicit pe procesare.

### /profile
- [x] Date profil (nume, bio, limbi) + badge vizibilitate.
- [x] Setări vizibilitate, notificări, preferințe limbă/badge.
- [x] CTA Salvează (cu simulare eroare) + avertisment lipsă locație.
- [x] State loading/empty/error documentate.

### /objects
- [x] Listă carduri obiect + filtre (categorie/subcategorie stub) + search.
- [x] CTA creare /objects/new, vezi /objects/[id], editează /objects/[id]/edit.
- [x] Ștergere cu confirmare; empty state vizibil.
- [x] Niciun /objects/[id] 404 pe flux canonic (fallback mesaj).

### /objects/new
- [x] Upload imagine cu preview (stub local), titlu/descriere, stare obiect, categorie, locație.
- [x] CTA Salvează cu validare minimă; cancel spre /objects.
- [x] State loading/empty/error documentate.

### /objects/[id]
- [x] Galerie imagini (fallback fără imagine), detalii obiect, CTA chat/match/change.
- [x] id inexistent → mesaj + link înapoi.
- [x] State loading/empty/error documentate.

### /objects/[id]/edit
- [x] Formular preumplut identic cu creare; CTA Salvează modificări.
- [x] State loading inițial + empty/error documentate.

### /match
- [x] Listă match-uri recomandate + secțiune „De ce acest match?”.
- [x] Buton „mod manual” (fallback) și mesaj AI down.
- [x] CTA „Vezi detalii match” și „Inițiază chat”.
- [x] State loading/empty/error documentate.

### /chat
- [x] Listă conversații + panel mesaje + toggle traducere + atașamente safe indicator.
- [x] CTA Trimite mesaj + CTA către /change.
- [x] Empty state pentru lipsă conversații + state loading/error documentate.

### /change
- [x] Timeline pași swap + selectare locație/curier (stub clar), notificări automate (stub).
- [x] CTA Marchează în desfășurare / Confirmă finalizarea / Anulează swap.
- [x] State loading/empty/error documentate.

### /info
- [x] Statistici, help & legal (Termeni/GDPR/Cookies), monetizare & tokeni, contract AI.
- [x] Link Termeni, GDPR, manage cookies (stub).
- [x] Toate secțiunile vizibile + state loading/empty/error documentate.

## Ce lipsește pentru „real integrations”
- Autentificare reală (email/parolă, OTP, SSO) și persistarea sesiunilor/tokenilor.
- Upload imagini către storage (Cloudinary/Supabase) + validare conținut.
- Provider hartă (token), geocodare și pini reali pentru Premium/Platinum.
- Match/chat/change conectate la servicii AI, moderare și backend de mesagerie/logistică.
- Persistență pentru obiecte/profil/swap-uri (API/DB), notificări push/email live.
