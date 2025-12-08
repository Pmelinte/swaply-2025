## CONTEXT SWAPLY – MEMORIE COMPACTĂ (versiune actualizată)

Swaply este o platformă globală pentru schimb de obiecte, servicii și locuințe. Stack-ul tehnic este:
- Next.js App Router
- Supabase (Auth, DB, RLS)
- Cloudinary (imagini)
- Hugging Face (sau alt AI) pentru clasificare imagine + generare titluri
- Vercel pentru deploy
- GitHub + Devin pentru development asistat

### REGULI DE COLABORARE CU AI
- Un singur pas la un moment dat.
- AI-ul trimite **un fișier complet** per pas, nu patch-uri.
- După fiecare pas, confirm cu **„gata”**.
- AI-ul nu inventează fișiere și nu schimbă alte fișiere decât cel cerut.
- Explicațiile trebuie să fie clare, scurte, fără abateri de la subiect.
- Debugging: AI-ul explică **cauza exactă** + soluția, fără să sară peste pași.

### MODULE PRINCIPALE EXISTENTE / DEFINITE

1. **Profile Module**
   - Structură fixată (fișiere 1–14):
     - types, validation, repository, actions, ensure-profile
     - UI: profile-view, profile-form, profile-section
     - API: `/api/profile` cu GET/POST autentificat
   - Profilul se autocreează la primul acces (ensure-profile).
   - Include limbă, locație, avatar (Cloudinary).

2. **Add Item + AI Classify**
   - Formular de adăugare obiect cu upload imagine (Cloudinary).
   - AI clasifică imaginea și generează titlul (și eventual descrierea).
   - Endpoint dedicat: `POST /api/ai/items/classify`
   - Folosește env:
     - `HF_ITEM_CLASSIFIER_URL` / `HF_IMAGE_CLASSIFIER_URL`
     - `HF_API_TOKEN` / `HUGGINGFACE_API_KEY`
   - Normalizează răspunsul la tipul `ItemClassificationResult` folosit în client.

3. **Categorii & Taxonomie (STATUS: DE IMPLEMENTAT COMPLET)**
   - Există cerință clară pentru:
     - o **bază de date de categorii și subcategorii** (obiecte, servicii, locuințe),
     - structuri reutilizabile în UI (selecte, filtre, AI classify).
   - Deocamdată:
     - modelul conceptual există,
     - integrarea efectivă (tabele Supabase / seed cu multe categorii) este **parțială sau de făcut**.
   - Orice AI care lucrează aici trebuie să propună:
     - structură de tabel(e) pentru categorii/subcategorii,
     - legarea la Item,
     - mecanism de populare inițială (seed).

4. **Swipe / Match (Modul 9)**
   - Tabele: `swipes_supply` / `fake_swipes_supply` pentru teste.
   - RLS: user poate INSERT/SELECT/UPDATE/DELETE doar propriile rânduri (`user_id = auth.uid()`).
   - Endpoint: `/api/swipe/supply`
     - protejat (401 dacă nu e logat),
     - inserează swipe (desired_item_id + note),
     - folosit pentru tracking interes item.
   - Testare standard:
     - smoke test fără autentificare → 401,
     - apoi test cu user logat → inserție reușită.

5. **Notificări**
   - Evenimente: `new_message`, `offer_proposed`, `swap_confirmed`, `swap_status_changed` etc.
   - Canale:
     - intern (badge notificări / mesaje),
     - email (pentru evenimente importante),
     - SMS doar pentru cazuri speciale (ex. schimb de locuințe).
   - Logica exactă se poate rafina ulterior, dar evenimentele-cheie sunt deja definite.

6. **Gamificare & Ranguri**
   - Ranguri: Bronze / Silver / Gold / Platinum.
   - Beneficii:
     - vizibilitate crescută în feed,
     - limite mai mari la conversații,
     - filtre speciale („doar Gold/Platinum”),
     - badge-uri vizuale.
   - Monetizare: abonamente / pachete pentru ranguri + promovare obiecte.

### LOCALIZARE, HARTĂ & GOOGLE MAPS (STATUS: ÎN VIZIUNE / PARȚIAL)
- Cerințe clare:
  - **hartă cu utilizatori + obiecte** (Google Maps sau similar),
  - modul „InfoCity / Localizare” cu:
    - localități, povești, obiecte, servicii în zonă,
    - suport pentru turism local (Delta, rural etc.).
- La nivel de implementare:
  - conceptul este definit,
  - integrarea efectivă (cheie Maps, componente hartă, tabele pentru localități/zone) este **de implementat** sau doar parțial începută.
- Orice AI care lucrează aici trebuie să propună:
  - arhitectura componentelor de hartă,
  - legarea item-urilor și userilor de coordonate,
  - eventual un modul separat „InfoCity”.

### REGULI DE WORKFLOW & CHAT
- Chat-uri multiple:
  - fiecare tab / fereastră = sesiune separată,
  - AI-ul nu vede alte sesiuni.
- Documentația extinsă este în `SWAPLY_MEMORY.md`.
- În fiecare chat nou se furnizează AI-ului:
  - **această versiune compactă** +
  - eventual secțiunile detaliate relevante pentru task (Profile, AI classify, Modul 9, Categorii, Hartă).
- După context, se specifică TASK-ul clar și se folosește protocolul:
  - 1 pas,
  - fișier complet,
  - confirmare „gata”.

### OBIECTIV GENERAL
- Swaply trebuie să fie:
  - rapid,
  - simplu de folosit,
  - inteligent (AI),
  - multilingv,
  - ancorat geografic (hartă + localizare),
  - cu un sistem sănătos de încredere (ranguri + profil + istoric).
- AI-ul este central pentru:
  - clasificare,
  - generare text,
  - matchmaking,
  - suport multilingv.
- Toate endpoint-urile sunt autentificate și RLS este strict configurat în Supabase.
