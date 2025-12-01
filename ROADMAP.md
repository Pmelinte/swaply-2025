# Swaply – Roadmap de dezvoltare

Acest document descrie etapele principale de dezvoltare pentru proiectul Swaply. Scopul este să existe o hartă clară pentru dezvoltare, testare și prioritizare, atât pentru lucru manual, cât și pentru agenți automatizați (ex. Devin).

---

## Etapa 0 – Infrastructură, codebase și calitate

**Obiectiv:** Proiect stabil, configurat corect, care se poate construi și deploy-a fără erori critice.

**Livrabile principale:**
- Repo GitHub configurat (branch principal, PR-uri, protecții de branch de bază).
- Integrare cu Vercel pentru build & preview automată la fiecare PR.
- Integrare Supabase (bază de date, autentificare, RLS de bază).
- Integrare Cloudinary pentru stocare imagini.
- Configurare corectă a variabilelor de mediu:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Scripturi de rulare locală (ex. `npm run dev`, `npm run lint`, `npm run test` – pe măsură ce testele sunt adăugate).

**Criteriu de „gata”:**
- Build reușit local și pe Vercel.
- Devin poate rula un health check complet fără blocaje de configurare.

---

## Etapa 1 – MVP de bază: Autentificare, profil, obiecte

**Obiectiv:** Utilizatorul se poate înregistra, autentifica, edita profilul și adăuga obiecte de schimb.

**Funcționalități:**
- Autentificare cu email/parolă (Supabase Auth).
- Pagina de profil utilizator:
  - Date de bază (nume, localitate, limbă preferată).
  - Avatar (imagine) încărcat în Cloudinary.
- CRUD pentru obiecte:
  - Adăugare obiect (titlu, descriere, categorie, țară/oraș, stare, poze).
  - Editare și ștergere obiect propriu.
  - Listare obiecte proprii.
- Listare publică:
  - Pagină cu listă de obiecte (grid / listă).
  - Filtrare simplă: categorie, locație, text.

**Tehnic:**
- Modele și tabele Supabase pentru `profiles` și `items` (sau echivalent).
- RLS de bază: utilizatorul poate modifica doar propriile date și obiecte.
- Validări minime pe formular (front-end + back-end).

**Criteriu de „gata”:**
- Un utilizator nou poate parcurge întreg fluxul: signup → login → completare profil → adăugare obiect → vizualizare obiect în listă publică.

---

## Etapa 2 – Media & AI v1 (clasificare imagine, titlu automat)

**Obiectiv:** Simplificarea introducerii obiectelor prin asistență AI la upload de imagini.

**Funcționalități:**
- Upload imagini obiect în Cloudinary (deja configurat).
- Integrare model de clasificare imagine (de ex. Hugging Face):
  - După upload, imaginea este trimisă către API.
  - Modelul întoarce categoria / etichete.
  - Formularul de „Titlu” este completat automat cu o sugestie (editabilă de utilizator).
- Salvarea etichetelor AI în baza de date pentru viitoare căutări și recomandări.

**Tehnic (planificat):**
- Adăugare variabilă de mediu (când se implementează efectiv):
  - `HUGGINGFACE_API_KEY` sau `HF_API_KEY`
- Endpoint server-side sau apel direct din Edge Function pentru clasificare.
- Log simplu al erorilor AI în Supabase (ex. tabel `ai_logs`).

**Criteriu de „gata”:**
- Pentru un obiect nou, după ce se încarcă poza, titlul se propune automat.
- În caz de eroare AI, fluxul de adăugare obiect funcționează în continuare manual.

---

## Etapa 3 – Match, swipe și comunicare

**Obiectiv:** Utilizatorii pot descoperi și potrivi obiecte între ei, cu un mecanism de tip „swipe” și un canal de comunicare.

**Funcționalități:**
- Mecanism de match:
  - UI de tip „card” pentru obiecte.
  - Swipe/like/dislike sau slider 0–100% interes.
- Algoritm simplu de potrivire:
  - În primă fază, reguli simple: categorie, locație, stare, cuvinte cheie.
- Sistem de chat sau mesaj:
  - Fie chat în timp real (Supabase Realtime / altă soluție),
  - Fie mesaje asincrone tip „conversație la nivel de tranzacție”.
- Notificări în aplicație (badge-uri, liste de „conversații noi”).

**Tehnic:**
- Tabele pentru `matches`, `conversations`, `messages`.
- Politici RLS stricte pentru acces doar la propriile conversații.
- UI cu componente reutilizabile (de ex. shadcn).

**Criteriu de „gata”:**
- Două conturi diferite se pot potrivi pe baza unui obiect și pot discuta într-un canal dedicat acelui schimb.

---

## Etapa 4 – Tranzacție, status și istoric

**Obiectiv:** Formalizarea procesului de schimb, cu stări clare și istoric vizibil.

**Funcționalități:**
- Inițiere tranzacție de către unul dintre utilizatori (din ecranul de chat/match).
- Stări tranzacție:
  - propusă → acceptată → în curs → finalizată / anulată.
- Posibilitatea de a adăuga mai multe obiecte într-o singură tranzacție („pachet de schimb”).
- Feedback post-tranzacție (rating simplu + comentariu).

**Tehnic:**
- Tabele `trades`, `trade_items`, `reviews`.
- RLS: doar participanții la tranzacție văd detaliile ei.
- Pagina „Istoricul meu de schimburi”.

**Criteriu de „gata”:**
- Flux complet: match → inițiere schimb → acceptare → marcare ca finalizat → review.

---

## Etapa 5 – Monetizare și plăți (Stripe)

**Obiectiv:** Introducerea unui mecanism de monetizare pentru platformă.

**Funcționalități posibile:**
- Planuri premium (abonamente) pentru:
  - mai multe obiecte active simultan,
  - boost la vizibilitate în listă/match,
  - filtre avansate și statistici.
- Comision mic pe anumite tipuri de schimb (opțional).
- Emitere facturi / chitanțe (Stripe Billing).

**Tehnic (planificat):**
- Integrare Stripe:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Pagini:
  - „Pricing / Abonamente”
  - „Billing / Subscriptions” în profilul utilizatorului.
- Webhook pentru sincronizarea statusului abonamentelor.

**Criteriu de „gata”:**
- Utilizatorul poate cumpăra un plan din interfață și platforma recunoaște corect drepturile lui.

---

## Etapa 6 – AI avansat și recomandări

**Obiectiv:** Folosirea AI pentru a îmbunătăți experiența de match, prețuri și descoperire.

**Funcționalități posibile:**
- Generarea de descrieri mai bune pentru obiecte (ex. OpenAI).
- Sugestii de preț estimativ (unde e cazul).
- Recomandări personalizate:
  - „Obiecte care te-ar putea interesa”
  - „Utilizatori compatibili cu tine”
- Similaritate semantică între obiecte (ex. embeddings + vector DB).

**Tehnic (planificat):**
- Integrare OpenAI (sau alt LLM):
  - `OPENAI_API_KEY`
- Introducere vector DB (pgvector, Qdrant sau alt serviciu).
- Joburi programate pentru recalcularea recomandărilor.

**Criteriu de „gata”:**
- Utilizatorul primește recomandări vizibil mai bune decât o listă sortată simplu după dată.

---

## Etapa 7 – Operațional, securitate și scalare

**Obiectiv:** Platformă sigură, monitorizată și pregătită de creștere.

**Lucruri de acoperit:**
- Audit RLS și permisiuni în Supabase.
- Rate limiting pentru API-uri sensibile.
- Observabilitate:
  - loguri centralizate,
  - monitorizare erori (ex. Sentry),
  - metrici (performanță, latență).
- Backup-uri regulate ale bazei de date și plan de recovery.
- Politici de moderație pentru conținut (imagini, descrieri).

**Criteriu de „gata”:**
- Dashboard minim de health (erori, trafic, utilizatori activi) și proceduri clare pentru incidente.

---

## Etapa 8 – Extinderi viitoare

**Direcții posibile:**
- Aplicații mobile dedicate (React Native / Expo).
- Integrare cu servicii de curierat / logistică.
- Sistem de puncte / gamificare.
- Integrare cu alte marketplace-uri sau rețele sociale.
- Localizare extinsă (mai multe limbi, formate locale, monede afișate).

---

## Utilizare cu agenți (ex. Devin)

Când este folosit un agent de tip Devin, recomandare de prompt inițial:

- „Respectă ROADMAP.md ca sursă principală de adevăr pentru priorități.”
- „Înainte de a adăuga un nou serviciu (Stripe, OpenAI etc.), verifică dacă etapa lui este activă.”
- „Orice modificare majoră de arhitectură trebuie adăugată și în ROADMAP.md sau într-un document dedicat din /docs.”

Acest roadmap poate fi actualizat pe măsură ce proiectul evoluează.
