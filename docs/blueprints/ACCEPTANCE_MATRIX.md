# Swaply — Acceptance Matrix (Done = verificabil)

## 0) Scop
Nu acceptăm “aproape făcut”.
Acceptăm doar ce poate fi verificat, bifat și demonstrat.

## 1) Sursa de acceptanță
- Programmatic spec export (verbatim, cu ID-uri): fiecare linie = cerință.
- Excalidraw: layout + navigație + texte.

Regulă: Nicio cerință nu se “omite” pe motiv că e mică.

## 2) Metodă de lucru (pentru Max/Devin)
Pentru fiecare PR:
- listează ID-urile implementate (ex: INFO_PAGE-001 … INFO_PAGE-0XX)
- atașează screenshot/clip scurt pentru UI changes
- confirmă gating/empty states
- confirmă RLS/grants dacă s-a atins DB
- confirmă fallback (AI down / no data / logged out)

## 3) Checklist global (trebuie să fie adevărat peste tot)
- Bottom nav persistent (Home/Objects/Match/Chat/Change/Info)
- Language selector + context menu
- Info accesibil de oriunde
- Niciun “dead button”
- Fără crash la lipsă date / AI indisponibil
- Nicio cheie în client
- Respectă DB Baseline (RLS ON + grants minime)

## 4) Checklist pe pagini (minim)
### Home
- CTA login/explore + cookie banner + link manage cookies

### Login
- email login + redirect corect (return-to)

### Profile
- setări AI + locație aproximativă + preferințe + empty states

### Objects
- list + filtre + create/edit/delete + empty state

### Object subpage
- detalii + acțiuni + metadata AI ca sugestii (nu suprascrie user_final)

### Matching
- recomandări + “De ce?” + manual mode

### Chat
- traducere (dacă e on) + moderare + atașamente scanate + CTA spre Swaply

### Swaply
- confirmare + logistică + hartă (niveluri) + notificări + fereastră feedback

### Info
- stats globale + stats user + rang + tokeni + curs + help/legal + monetizare + AI contract

## 5) “Stop the line”
Orice PR se oprește dacă:
- introduce grants largi la anon/public
- scoate RLS de pe un tabel canonic
- bagă “fake_*” sau duplicate de date
- expune chei / tokenuri
