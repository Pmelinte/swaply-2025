# Profile module

This folder contains the reusable building blocks for the authenticated user profile experience. It includes:

- `components/` — UI elements for viewing and editing profile details (view, form, sections).
- `hooks/` — client hooks such as `useProfileForm` for state and submission handling.
- `server/` — server-side helpers (`profile-actions`, `profile-repository`, `ensure-profile`) that read and write the `public.profiles` table.
- `types.ts` and `validation.ts` — shared schema and validation definitions aligned with the Supabase `profiles` table.

Pages under `app/settings/profile` import these exports to provide the `/settings/profile` route.
