# Swaply — Data Model & RLS Blueprint (Contract DB)

## 0) Principiu
Baza de date nu e un “detaliu”: e contractul care previne haosul.
Orice dev trebuie să pornească de la tabelele canonice existente + RLS activ + grants minime.

## 1) Tabele canonice (schema public)
- categories
- items
- messages
- notifications
- profiles
- swap_intents
- swaps

Regulă: Nu se adaugă tabele “fake_*”. Nu se dublează structura în tabele paralele.

## 2) RLS (Row Level Security)
- RLS trebuie să fie ON pe toate tabelele de mai sus.
- Politicile trebuie să fie explicite, de preferat `TO authenticated` (defense-in-depth).
- Niciun policy “USING true” care expune date mai mult decât trebuie.

## 3) Grants (least privilege)
- `anon` trebuie să aibă doar ce e strict necesar pentru browse public (ex: SELECT pe categories, SELECT pe items pentru feed public).
- `authenticated` are CRUD doar acolo unde RLS îl limitează corect.
- `public` role: ideal fără privilegii directe pe tabelele aplicației.

## 4) Reguli specifice (hard rules)
### items
- Coloana `is_demo` există (demo data controlată).
- Public vede doar `is_active=true` (feed public).
- Owner vede propriile items inclusiv inactive.
- Insert/Update: owner_id = auth.uid() și `is_demo=false` pentru useri normali.
- Demo items (`is_demo=true`) se creează doar cu rol administrativ/service (nu din client).

### messages
- Insert: `sender_id = auth.uid()` obligatoriu.
- Dacă există `swap_id`, userul trebuie să fie participant la swap.
- Update/Delete: recomandat “no” (immutabil). Dacă există, doar sender-ul.

### notifications
- User poate SELECT + UPDATE (mark read).
- User NU creează notificări din client (no INSERT); server-side only.

### profiles
- Acces public (anon/public) nu trebuie să existe.
- `authenticated` poate lucra cu propriul profil (RLS decide).
- Evită să ții câmpuri sensibile în profiles dacă nu sunt absolut necesare.

## 5) Migrații (regula de aur)
- Orice schimbare de schema/policies/grants se face prin migrare versionată în repo.
- Nu se “repară” manual doar în dashboard fără commit.

## 6) Audit SQL (minimal, înainte de PR)
- Tables + RLS: pg_class.relrowsecurity
- Policies: pg_policies
- Grants: information_schema.role_table_grants
- Functions security definer: pg_proc.prosecdef

## 7) Interdicții
- Nu se expun secrete din DB (vault) prin funcții SECURITY DEFINER fără review.
- Nu se dau grants largi către anon/public “că merge mai repede”.
