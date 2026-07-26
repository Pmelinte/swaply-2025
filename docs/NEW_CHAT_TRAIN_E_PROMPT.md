# Prompt pentru chat nou — Swaply Train E

Lucrăm la proiectul Swaply.

Repository:
`Pmelinte/swaply-2025`

Branch principal:
`main`

Production:
`https://www.swaply.world`

Stare canonică:

- Train A — CLOSED
- Train B — CLOSED
- Train C — CLOSED
- Train D — CLOSED
- Train E — ACTIVE
- Train E este ultimul train înainte de Swaply `v1.0.0`; nu există Train F.

Documente de citit în această ordine:

1. repository-ul actual, migrațiile, testele și dovezile Production;
2. `docs/CURRENT_TRAIN_STATUS.md`;
3. `docs/TRAIN_E_HANDOFF.md`;
4. `docs/TRAIN_D_CLOSURE_REPORT.md`;
5. `docs/ROADMAP_TO_V1.md`;
6. `docs/SWAPLY_CURRENT_HANDOFF.md` doar pentru istoric care nu contrazice sursele mai noi;
7. memoria global-first de produs.

Reguli obligatorii:

- răspunsuri în română;
- pași mici și clari;
- un singur batch și un singur PR activ;
- fără merge fără comanda explicită `Merge #...`;
- după fiecare merge: GitHub CI, Vercel Production, rute critice, runtime logs și paritate migrații;
- nu se redeschid etapele închise pentru defecte ulterioare; acestea sunt regresii sau mentenanță;
- nu se activează servicii AI plătite, abonamente sau costuri fără acord explicit;
- nu se modifică destructiv Supabase/Auth/RLS/API/business logic;
- orice migrare este forward-only;
- AI recomandă și explică, omul decide;
- orice flux AI are fallback non-AI;
- Swaply rămâne global-first pentru toate limbile active;
- Blog și Stories rămân separate;
- Swapleni și trust rank rămân separate.

Sarcina inițială:

Începe **E1.1 — audit read-only al arhitecturii AI existente și matrice completă de gap-uri**.

Nu modifica nimic în prima etapă.

Inventariază:

1. `src/lib/ai`, gateway, task router, model registry și providers;
2. toate rutele API și server actions care folosesc AI;
3. orice apel direct către furnizori în afara gateway-ului;
4. prompturile, schemele de validare, timeouturile și fallback-urile;
5. cache-ul, logging-ul, cost tracking-ul, latența și error tracking-ul;
6. implementările existente pentru vision, traducere, moderare și matching;
7. testele și evaluation cases existente;
8. dependențele de servicii externe și eventualele costuri;
9. riscurile de privacy, securitate, vendor lock-in și lipsă de fallback;
10. ce este deja reutilizabil, ce trebuie reparat și ce lipsește pentru închiderea E1.

Livrează:

- inventar de fișiere și componente;
- matrice `EXISTĂ / PARȚIAL / LIPSEȘTE / RISC`;
- diferența dintre starea actuală și criteriile E1;
- un plan finit în batch-uri mici;
- primul batch recomandat, fără implementare până la clarificarea completă a scopului.

Nu relua audituri istorice fără motiv și nu discuta etapele deja închise decât dacă repository-ul demonstrează o regresie reală relevantă pentru Train E.
