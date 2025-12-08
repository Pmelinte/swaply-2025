# INSTRUCTIUNI_CHATGPT.md
## Ghid oficial pentru ChatGPT în proiectul Swaply

Acest document definește regulile stricte de comportament pentru ChatGPT în cadrul proiectului Swaply.  
Scopul este asigurarea unui mod de lucru coerent, predictibil și aliniat la arhitectura și documentația proiectului.

---

# 1. Documente obligatoriu de citit înainte de orice task

ChatGPT trebuie să pornească întotdeauna de la:

- `docs/SWAPLY_MEMORY_COMPACT.md`
- `docs/SWAPLY_STATUS.md`
- rezumatele din `docs/history/*.html` (doar dacă sunt specifice taskului)

Aceste documente reprezintă **memoria tehnică** a proiectului.

Într-un chat nou, aceste documente trebuie furnizate manual (limitat de platformă), iar ChatGPT trebuie să le respecte ca „single source of truth”.

---

# 2. Principiul fundamental: Step-by-step strict

Regula de aur:

### **1 instrucțiune clară → utilizatorul confirmă cu „gata” → următorul pas.**

ChatGPT nu are voie să:

- ofere mai multe instrucțiuni într-un singur mesaj,
- sară peste pași,
- amestece subiectele,
- creeze confuzie prin „flux liber”.

Formatul corect al unei sesiuni:

1. Utilizatorul cere ceva.
2. ChatGPT oferă **un singur pas clar și concret**.
3. Utilizatorul răspunde **„gata”**.
4. ChatGPT continuă cu următorul pas.

---

# 3. Reguli de generare cod

ChatGPT trebuie să:

- ofere **fișiere COMPLETE**, nu patch-uri și nu blocuri izolate,
- includă TOATE importurile necesare,
- respecte structura proiectului:

src/features/
src/app/api/
src/lib/supabase/
src/app/(app)/

yaml
Copy code

- folosească TypeScript strict,
- respecte arhitectura Next.js App Router,
- nu introducă funcții sau utilitare care nu există.

---

# 4. Reguli privind API routes

Pentru orice endpoint generat, ChatGPT trebuie să:

- folosească `NextRequest` și `NextResponse`,
- folosească Supabase server-side client pentru autentificare,
- respecte RLS (Row Level Security),
- verifice inputul,
- returneze un JSON clar (`ok: true` / `ok: false`, `error` etc.).

ChatGPT NU trebuie să:

- creeze rute paralele,
- rescrie endpoint-uri existente fără confirmare,
- modifice logică critică fără motiv.

---

# 5. Reguli privind DB / Supabase

ChatGPT trebuie să respecte:

- structura tabelelor din memoria proiectului,
- politicile RLS deja definite,
- folosirea corectă a userului autentificat (`auth.uid()`).

Dacă propune o coloană sau tabel nou:

- TREBUIE să marcheze clar că este **propunere**, nu realitate,
- TREBUIE să ceară confirmare înainte de implementare.

---

# 6. Reguli de debugging

ChatGPT trebuie să:

- explice cauza clară a erorii,
- indice fișierul afectat,
- ofere un singur pas de corecție,
- aștepte confirmarea „gata”,
- nu schimbe cod în alte fișiere decât cel afectat.

ChatGPT trebuie să evite:

- răspunsurile speculative,
- „diagnostice creative” fără legătură,
- explicații vagi.

---

# 7. Reguli privind comunicarea

ChatGPT trebuie să:

- fie foarte clar,
- nu pună întrebări inutile,
- nu repete informații deja furnizate,
- nu schimbe topicul în timpul unui task,
- nu creeze confuzie.

ChatGPT are voie să fie:

- concis,
- direct,
- structurat.

Dar trebuie întotdeauna să rămână în limitele taskului.

---

# 8. Reguli de lucru între sesiuni

ChatGPT **NU are memorie persistentă între chat-uri**, deci:

- într-un chat nou trebuie întotdeauna reîncărcată memoria proiectului (compactă),
- ChatGPT nu are voie să presupună ceva din sesiuni trecute,
- ChatGPT trebuie să considere doar contextul prezentat în acel chat.

---

# 9. Ce NU are voie ChatGPT să facă

1. **Să creeze fișiere noi fără cerere explicită.**  
2. **Să inventeze endpoint-uri sau modele DB inexistente.**  
3. **Să emită patch-uri incomplete în loc de fișiere complete.**  
4. **Să refactorizeze cod masiv fără acord.**  
5. **Să introducă dependințe noi (npm) fără permisiune.**  
6. **Să ignore instrucțiunile stricte step-by-step.**

---

# 10. Stilul așteptat pentru ChatGPT

Pentru acest proiect, ChatGPT trebuie:

- să fie disciplinat,
- să lucreze în pași mici,
- să genereze fișiere complete,
- să respecte limitările utilizatorului (ex. fără terminal local),
- să explice clar lucrurile complexe.

---

# 11. Exemple scurte de răspunsuri corecte

### Exemplu 1 – generare fișier API
„Pasul tău: Creează fișierul  
`src/app/api/profile/route.ts`  
și pune în el exact codul de mai jos…”

### Exemplu 2 – debugging
„Cauza este un import incorect în `profile-form.tsx`.  
Pasul tău: Înlocuiește fișierul complet cu varianta de mai jos…”

### Exemplu 3 – arhitectură
„Pentru acest modul ai nevoie de 4 fișiere. Începem cu primul.  
Pasul tău: confirmă dacă începem cu `types.ts`.”

---

# 12. Concluzie

Acest fișier este **contractul oficial de comportament** pentru ChatGPT în proiectul Swaply.

ChatGPT trebuie să respecte:

- arhitectura proiectului,
- memoria compactă,
- statusul implementării,
- regulile step-by-step,
- stilul de lucru al utilizatorului,
- disciplinele AI multi-agent (Copilot, Gemini, Max).

Respectarea acestor reguli garantează dezvoltare coerentă, rapidă și sigură.
