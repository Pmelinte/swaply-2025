# Swaply — Current Project Handoff

**Recommended repository path:** `docs/SWAPLY_CURRENT_HANDOFF.md`  
**Last updated:** 2026-07-12  
**Purpose:** operational checkpoint for new chats, coding agents, and future Train C batches.

> This file is intentionally short and operational. It does **not** replace the full product-memory document:
> `Swaply_memorie_global_first_drawer_blog_stories_prompturi_agentice_AI_actualizat`.
> Read the full memory document for permanent product principles; use this file for the current technical state and next action.

---

## 1. Source-of-truth order

When instructions or assumptions conflict, use this order:

1. Current repository code, migrations, tests, and production evidence.
2. This operational handoff for the latest completed checkpoint.
3. The full Swaply product-memory document for long-term product rules.
4. Older chat summaries only as historical context.

Never treat an old chat statement as more reliable than the current repository or verified runtime behavior.

---

## 2. Permanent product rules

- Swaply is **global-first**, not RO/EN-first.
- Do not reduce requirements to an MVP without explicit approval.
- Do not remove existing functionality without explicit approval.
- Do not duplicate global navigation inside contextual drawers.
- Blog and Stories remain separate systems.
- Tokens/swapleni and trust rank remain separate systems.
- AI recommends, explains, translates, moderates, and protects; the human decides.
- Every AI-assisted flow must retain a usable non-AI fallback.
- Public UI text must use the translation/content system, not new hardcoded strings.
- Protect private profiles, messages, exact location, story consent, and token ledgers.
- Do not change Auth, RLS, policies, secrets, or Supabase schema without an explicit audit and justification.
- Work in small, reviewable batches and require real evidence before merge.

---

## 3. Current Train C checkpoint

Train C is complete through **Batch 52**, inclusive.

| Batch | Scope | Result |
|---|---|---|
| 49 | Two-user authenticated Playwright harness | Merged |
| 50 | Authenticated baseline and guest protection | Merged |
| 51 | Authenticated profile edit, persistence, and restoration | Merged |
| 52 | Authenticated Objects CRUD and owner isolation | Merged |

### Batch 52 final state

- PR: **#446 — Batch 52: authenticated objects CRUD validation**
- Status: **merged into `main`**
- Merge commit: `58ea66879a487036561b98f1301047dd0a7d3f44`
- Final validated branch commit: `47a69be4edbeb9db965be82336d097877a96ffa2`
- Final authenticated Preview run: **Preview 7 — green**
- Playwright result: **8 passed, 0 failed, 0 flaky, 0 skipped**
- Test object cleanup was verified by ID: final state `archived`, `is_active=false`

### Batch 52 verified contract

The authenticated flow now validates:

1. User A and User B receive distinct, valid sessions.
2. Logout testing restores the reusable User B fixture.
3. User A creates an object through the production wizard.
4. The object detail page persists after reload.
5. User B can read a public object.
6. User B remains authenticated but cannot access owner edit controls.
7. User A can edit title and description.
8. The update persists after reload.
9. Cleanup archives the exact object by ID and verifies that it is no longer public.

Do not reopen Batch 52 unless a reproducible regression is demonstrated.

---

## 4. Authenticated E2E architecture now in place

The Train C Playwright suite uses a deterministic dependency graph:

```text
setup-user-a + setup-user-b
             ↓
two-user baseline, including logout + session restoration
             ↓
profile mutation + restoration
             ↓
objects CRUD + owner isolation + ID-based cleanup
```

Stability rules already established:

- `workers: 1`
- `fullyParallel: false`
- terminal project execution through project dependencies
- authentication checked through an authenticated API before dependent flows
- reusable User B session restored after logout testing
- auxiliary AI, translation, and embedding calls neutralized where they are not the subject of the test
- form fields targeted by stable structural selectors rather than punctuation-sensitive placeholders
- Supabase writes correlated to the exact resource ID
- cleanup must fail loudly if the exact test record cannot be found

Preserve these safeguards in subsequent authenticated batches.

---

## 5. Next objective: Batch 53

Batch 53 has not been implemented in this checkpoint.

Before writing code, the next agent must:

1. Verify the current `main` head and confirm that merge commit `58ea66879a487036561b98f1301047dd0a7d3f44` is present in history.
2. Read the full Swaply memory document.
3. Identify the exact Batch 53 scope from current Train C documentation and repository evidence.
4. Inventory affected routes, components, state hooks, API routes, Supabase tables, RLS policies, fixtures, and tests.
5. Model the complete user flow before implementation.
6. Predict likely failure classes before the first E2E run:
   - session invalidation or test interference;
   - stale storage-state fixtures;
   - locale-prefixed route duplication;
   - translation or placeholder mismatches;
   - wrong Supabase method or response correlation;
   - stale client state after mutation;
   - non-owner authorization behavior;
   - cleanup that searches by mutable text instead of immutable ID;
   - auxiliary AI/network calls affecting the primary contract;
   - test data left public after failure.
7. Present the implementation plan, acceptance criteria, cleanup strategy, and risks before changing code.

Do not start Batch 53 by guessing from an old chat label. Confirm its exact scope from current project documentation.

---

## 6. Required validation for every new authenticated batch

A batch is not complete until all applicable checks pass:

1. Unit Tests
2. ESLint
3. TypeScript
4. Next.js Build
5. Public Visual Audit
6. Vercel Preview deployment
7. Authenticated E2E against the Preview URL
8. Authorization check with the second user where ownership is relevant
9. Persistence check after reload
10. Cleanup by immutable record ID
11. Database verification that no public test data remains
12. PR merge only after explicit approval

A green build alone is not sufficient evidence for an authenticated business flow.

---

## 7. Predictive E2E design checklist

Before the first remote run, verify:

### Authentication

- Are User A and User B sessions both valid through a protected API?
- Does any earlier test call `signOut()` and invalidate a reusable fixture?
- Is a session restored before downstream projects start?

### Routing and localization

- Is the router already locale-aware?
- Could a route become `/en/en/...`?
- Are URL assertions checking exact pathname rather than loose substring matches?

### Selectors

- Prefer stable roles, names, field `name` attributes, test IDs, and scoped `<main>` queries.
- Avoid punctuation-sensitive placeholders and globally duplicated text.
- Scope detail-page assertions to visible content rather than `<title>` or hidden elements.

### Network writes

- Match the real HTTP method used by Supabase.
- Correlate update/archive responses to the exact record ID.
- Assert response status and include response body in the failure message.

### State and persistence

- Verify the mutation in UI immediately after save.
- Reload and verify again.
- Where appropriate, confirm final database state separately.

### Cleanup

- Track the immutable ID returned by insert.
- Cleanup must run even when the primary assertion fails.
- Cleanup must not silently return when the record is missing.
- Confirm `archived`/inactive or deletion according to the business contract.

---

## 8. Ready-to-use prompt for a new chat

```text
Continuăm proiectul Swaply — Train C. Începem Batch 53.

Citește integral:
1. documentul de memorie globală Swaply;
2. docs/SWAPLY_CURRENT_HANDOFF.md;
3. documentația Train C și codul curent din main.

Checkpoint verificat:
- Train C este complet până la Batch 52 inclusiv.
- PR #446 a fost merged în main.
- Merge commit: 58ea66879a487036561b98f1301047dd0a7d3f44.
- Preview 7 a fost verde: 8 teste trecute, 0 eșuate.
- Objects CRUD este validat cap-coadă, inclusiv izolarea User B și cleanup după ID.

Nu implementa imediat.

Primul pas obligatoriu:
1. verifică main și documentația actuală;
2. confirmă scopul exact al Batch 53;
3. inventariază toate dependențele și contractele afectate;
4. analizează predictiv întregul flux, inclusiv auth, RLS, locale, stare client, răspunsuri Supabase și cleanup;
5. prezintă planul, criteriile de acceptare, riscurile și strategia E2E;
6. nu modifica nimic până când planul este clar.

După implementare, cere dovezi reale pentru Unit Tests, ESLint, TypeScript, Build, Public Visual Audit, Vercel Preview, E2E autentificat și cleanup verificat după ID.
```

---

## 9. Maintenance rule

Update this file after each merged batch:

- replace the current checkpoint with the latest merged state;
- record PR number and merge commit;
- record the final remote E2E result;
- document newly discovered systemic safeguards;
- identify the next batch without guessing its scope;
- keep the file concise—history belongs in dedicated closure reports.

