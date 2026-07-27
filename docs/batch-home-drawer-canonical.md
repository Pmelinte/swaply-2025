# Home drawer canonical correction

## Scope

- replaces the generic Home navigation menu with a dedicated contextual Home drawer;
- separates guest onboarding from the authenticated dashboard;
- removes duplicate global branch links from Home;
- preserves profile, object creation, notifications, matching, exchange, history, reputation, guidance and legal access;
- adds stable `data-drawer-*` audit hooks and a contract test.

## Constraints

- no Supabase, Auth, RLS, payment or AI changes;
- no merge without explicit command.
