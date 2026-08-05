# V1-08.2 — Persistența global-first și utilizarea uniformă a fallbackului

## 0. Control header

| Field | Value |
|---|---|
| Roadmap package | `V1-08` |
| Batch ID | `V1-08.2` |
| Status | `PR_OPEN` |
| Application base SHA | `bcfbd0a51681e14ed97bf717c789c6c21a345a91` |
| Working branch | `v1-08-2-global-first-persistence-fallback` |
| Canonical product version | `v2.0.0` |
| Production target | `https://www.swaply.world` |

## 1. Objective

Demonstrează că preferințele global-first sunt persistate în profil și elimină alegerea ad-hoc a limbii din notificarea tranzacțională, folosind aceeași ordine canonică de fallback.

## 2. Initial factual state

### Persistance

Repository-ul conține deja:

- coloanele `primary_language`, `secondary_language`, `tertiary_language`;
- preferințele `auto_translate_messages` și `show_original_language`;
- migrarea valorii istorice `preferred_language` către limba principală;
- hidratarea profilului din coloanele canonice;
- salvarea prin `update_own_profile_v1`, cu revision check și idempotency.

Prin urmare, V1-08.2 nu introduce o migrare nouă și nu schimbă autoritatea de scriere a profilului.

### Confirmed gap

`src/app/api/email/swap-proposal/route.ts` selecta limba prin:

```text
primary_language || preferred_locale
```

Această alegere ignora `secondary_language` și `tertiary_language` și reprezenta o a doua implementare, nealiniată cu fallbackul canonic.

## 3. Included scope

- adapter reutilizabil pentru construirea fallbackului direct dintr-un profil persistat;
- ordinea `primary → secondary → tertiary → browser → route/preferred locale → source → English`;
- normalizarea variantelor regionale și eliminarea duplicatelor;
- compatibilitate cu `preferred_language` și `preferred_locale`, fără ca acestea să depășească limbile canonice;
- folosirea resolverului comun în emailul de propunere de schimb;
- teste de regresie pentru persistență și selecția limbii.

## 4. Explicit non-scope

- fără migrare Supabase;
- fără modificări RLS, granturi sau RPC;
- fără modificarea conținutului template-urilor email;
- fără activarea Resend sau a altui provider;
- fără traducere automată nouă;
- fără modificări Blog, Stories sau Chat;
- fără date Production persistente de test;
- fără tag, release sau `v1.0.0`.

## 5. Files

### Modified

- `src/lib/i18n/languageFallback.ts`
- `src/app/api/email/swap-proposal/route.ts`

### Added

- `src/__tests__/v1-08-2-global-first-persistence-fallback.test.ts`
- `docs/v1-08-2-global-first-persistence-fallback.md`

### Migrations

```text
NONE
```

## 6. Authority and privacy

- profilul continuă să fie citit server-side pentru notificarea tranzacțională;
- emailul este trimis numai după verificarea participantului și a statusului schimbului;
- browserul nu primește acces suplimentar la profilurile altor utilizatori;
- nu se expun limbi sau adrese de email în payloaduri publice;
- providerul rămâne fail-closed când cheia lipsește.

## 7. PASS

- cele trei coloane de limbă există în migrare și în payloadul autoritativ de profil;
- fallbackul profilului este unic și centralizat;
- limbile secundară și terțiară preced fallbackul tehnic englez;
- variantele regionale sunt normalizate;
- duplicatele sunt eliminate;
- notificarea tranzacțională nu mai folosește expresia ad-hoc veche;
- CI, AI Evaluation și Vercel Preview sunt verzi;
- review fără P0/P1;
- migration head Production rămâne `20260805133249`.

## 8. FAIL

- engleza apare înaintea unei limbi canonice valide;
- `preferred_locale` depășește secondary/tertiary;
- profilul este scris direct din browser în afara RPC-ului canonic;
- providerul este activat sau apare cost real;
- este introdusă o migrare nejustificată;
- apare un defect P0/P1 sau o regresie a notificărilor.

## 9. Remaining V1-08 boundary

Acest batch închide persistența profilului și primul consumator tranzacțional confirmat ca neuniform. Auditarea completă a stringurilor publice, Blog/Stories translation completeness și evidence RTL/long-text rămâne în V1-08.3. Benchmarkul cu provider real rămâne condiționat de aprobarea explicită ulterioară.
