# Swaply V1 Execution Status

| Prompt | Functionalitate | Status | PR | Teste | Dovadă |
|---|---|---|---|---|---|
| 1 | Înregistrare utilizator | CLOSED | #492 | CI PASS | Flux email/parolă integrat și merge-uit. |
| 2 | Autentificare, logout și sesiune | CLOSED | #493 | CI PASS | Restaurare sesiune și logout integrate. |
| 3 | Recuperare și schimbare parolă | BLOCKED | NONE | NOT RUN | Branch inițial existent, fără PR și fără închidere. |
| 4 | Protecția rutelor private | CLOSED | #494 | CI PASS | Protecție coerentă și verificare production. |
| 5 | Onboarding utilizator | IMPLEMENTED | PENDING | PENDING | Stare reluabilă server-side, validare obligatorie și finalizare autorizată. |
| 6 | Profil public și profil privat | IMPLEMENTED | PENDING | PENDING | Proiecția publică minimizată și accesul privat owner/participant sunt integrate cu teste de migrație. |
| 7 | Editarea și persistența profilului | IMPLEMENTED | PENDING | PENDING | Profilul owner-only se salvează prin RPC revisionat/idempotent și se rehidratează după reload. |
| 8 | Preferințe lingvistice globale | IMPLEMENTED | PENDING | PENDING | Limbile primară/secundară/terțiară și preferințele de traducere se hidratează și persistă canonic. |
| 9 | Locație aproximativă și confidențialitate | IMPLEMENTED | PENDING | PENDING | Proiecția publică expune doar oraș/țară și elimină coordonate exacte/date poștale. |
| 10 | Avatar și media de profil | IMPLEMENTED | PENDING | PENDING | Uploadul avatarului validează tip/mărime, persistă URL-ul și înlocuiește avatarul Supabase vechi. |
| 11 | Setări personale și de confidențialitate | IMPLEMENTED | PENDING | PENDING | Setările owner-only existente au fost reutilizate, cu persistare profil și acces privat prin sesiunea autentificată. |
| 12 | Preferințe de notificare | IMPLEMENTED | PENDING | PENDING | Preferințele de notificare au RLS owner-only, granturi autentificate și timestamp actualizat automat. |
| 13 | Export și închidere cont | IMPLEMENTED | PENDING | PENDING | Exportul JSON canonic autentificat, cererile GDPR owner-only și protecția CSRF pentru cereri sunt integrate. |
| 14 | Crearea unui obiect | IMPLEMENTED | PENDING | PENDING | Wizard-ul de obiect folosește normalizarea canonică, owner_id din sesiunea client autentificată și revenire după publicare. |
| 15 | Fotografii și media pentru obiecte | IMPLEMENTED | PENDING | PENDING | Uploadul media validează tip/mărime, folosește storage owner-folder și păstrează fallback-ul no-image. |
