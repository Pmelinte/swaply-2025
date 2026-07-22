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
