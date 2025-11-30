# TASK_01_AUTH – Basic email/password authentication for Swaply 2025

## 0. Context

Project: **Swaply 2025**  
Stack: **Next.js App Router + TypeScript + Tailwind + Vercel**  
Root repo: `swaply-2025`

Core documentation already present in repo root:

- BLUEPRINT_SWAPLY.md
- API_SPEC_SWAPLY.md
- ARCHITECTURE_SWAPLY.md
- TEST_PLAN_SWAPLY.md
- PAYMENTS_MONETIZATION.md
- DEVIN_INSTRUCTIONS.md

This task focuses ONLY on **basic email/password authentication**, using **Supabase Auth**, without implementing profile management or OAuth yet.

---

## 1. Goal

Implement minimal authentication:

- User registration (email/password)
- User login (email/password)
- User logout
- Simple protected route (`/dashboard`)
- Build and lint must pass with **zero errors**

Respect architectural rules from `ARCHITECTURE_SWAPLY.md` and testing rules from `TEST_PLAN_SWAPLY.md`.

---

## 2. Technical constraints & rules

1. Do **not** break existing content in `app/page.tsx`.
2. Use **Supabase Auth** with email/password only.
3. Use environment variables:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Create documentation file: `docs/ENV_SUPABASE.md` with placeholders.

4. Use **TypeScript** everywhere.
5. Use **Next.js App Router** (`app/` directory).
6. UI must be simple, clean, functional.
7. Error handling must show human-friendly messages in UI.
8. Follow `DEVIN_INSTRUCTIONS.md`:
   - run npm commands
   - fix errors
   - do not stop until build is green

---

## 3. Features to implement

### 3.1 Supabase Client

Create:  
`lib/supabase/client.ts`

Requirements:

- use `@supabase/supabase-js`
- export `getSupabaseBrowserClient()`
- read env vars from `process.env.*`
- throw clear error if env vars are missing (only in dev)
- must be typed

Install dependency:

npm install @supabase/supabase-js

yaml
Copy code

---

### 3.2 Login & Register Pages

Create route group:

app/(auth)/login/page.tsx
app/(auth)/register/page.tsx

markdown
Copy code

Page requirements:

- Server components for page shells
- Client components for forms:
  - `components/auth/LoginForm.tsx`
  - `components/auth/RegisterForm.tsx`
- Email field
- Password field
- Submit button
- Error message area
- Link between login/register

Behavior:

**Register page**
- submit → `supabase.auth.signUp({ email, password })`
- on success → redirect `/login` or `/dashboard`

**Login page**
- submit → `supabase.auth.signInWithPassword({ email, password })`
- on success → redirect `/dashboard`

Server Actions are preferred, but client-only is acceptable if build stays green.

---

### 3.3 Protected Route: `/dashboard`

Create:

`app/dashboard/page.tsx`

Requirements:

- If user NOT logged in → redirect `/login`
- If logged in → show greeting (e.g. “Bun venit, email@example.com”)

Preferred implementation:
- server-side session check with Supabase

But client-side fallback is allowed if typed correctly.

---

### 3.4 Logout

Add logout functionality on `/dashboard`:

- button “Logout”
- calls `supabase.auth.signOut()`
- redirect `/`

---

## 4. Files to create or modify

### New files:

- `lib/supabase/client.ts`
- `docs/ENV_SUPABASE.md`
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/dashboard/page.tsx`
- `components/auth/LoginForm.tsx`
- `components/auth/RegisterForm.tsx`

### Existing files touched:

- `package.json` (add supabase dependency)
- `app/page.tsx` (optional: add links, but keep original text)

---

## 5. Commands you MUST run and fix until green

npm install
npm install @supabase/supabase-js
npm run lint
npm run build

markdown
Copy code

If any command fails:

1. Inspect error  
2. Fix  
3. Re-run  
4. Repeat until **all pass**  

Do NOT consider task finished until both lint & build are green.

---

## 6. Testing & acceptance criteria

### A. Build & Lint
- `npm run lint` passes with 0 errors
- `npm run build` passes with 0 errors

### B. Functional tests

1. `/register`  
   - fill email & password  
   - submit  
   - user appears in Supabase Auth  
   - redirect OK  

2. `/login`  
   - correct credentials → redirect `/dashboard`  
   - wrong credentials → error message  

3. `/dashboard`  
   - if logged out → redirect `/login`  
   - if logged in → show email  

4. Logout  
   - clears session  
   - redirect to `/`  
   - accessing `/dashboard` again redirects to `/login`

### C. Code quality
- No leftover console logs (except dev-only env-var warnings)
- No commented-out huge blocks
- No `any` unless absolutely required

---

## 7. Completion conditions

Task is done only when:

1. All files created/updated as required  
2. All commands (`npm install`, `npm run lint`, `npm run build`) pass  
3. Auth flow works end-to-end  
4. Commit & push are completed to `swaply-2025`  
5. Final summary of changes is provided in PR or final message  

END.