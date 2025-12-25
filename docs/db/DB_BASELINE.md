# Swaply — DB Baseline (Contract tehnic)

Data: 2025-12-25  
Sursă: Supabase audit snapshot (tables + RLS)

## 1) Tabele canonice în schema `public` (RLS = ON)
Aceste tabele sunt “source of truth” pentru aplicație. Nu se creează “fake_*” și nu se dublează structura în alte tabele fără motiv.

- public.categories — RLS: ON
- public.items — RLS: ON
- public.messages — RLS: ON
- public.notifications — RLS: ON
- public.profiles — RLS: ON
- public.swap_intents — RLS: ON
- public.swaps — RLS: ON

## 2) Regula de aur pentru orice developer (Max/Devin/Oricine)
- Orice schimbare de DB se face DOAR prin **migrare** (SQL migration) versionată în repo.
- Nu se modifică schema direct “din dashboard” fără ca schimbarea să fie adăugată ca migrare în repo.
- Orice PR care atinge DB trebuie să includă:
  1) migrarea,
  2) update la acest baseline (dacă se schimbă),
  3) verificare RLS + grants + policies.

## 3) Audit minim obligatoriu înainte de PR (checklist)
- RLS enabled pe tabelele afectate
- Grants: anon/public minim (principle of least privilege)
- Policies: TO authenticated unde e cazul; fără `USING true` care scapă date
- Nicio funcție SECURITY DEFINER nouă fără review

## 4) Fișiere asociate
- /docs/db/audit/2025-12-25-rls-tables.csv  (dovada snapshot-ului)
