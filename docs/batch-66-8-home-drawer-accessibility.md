# Batch 66.8 — Home drawer accessibility, semantics and keyboard/focus contract

## Classification

`FAST` — isolated UI semantics, keyboard behavior, localization reuse, deterministic tests and documentation only.

## Scope

This batch closes the measured accessibility debt in the shared contextual drawer without changing its visual design, routing contract or data authority.

Delivered contract:

- the contextual drawer trigger uses the existing localized `nav.contextMenu` label;
- the trigger exposes `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`;
- the drawer has one stable ID and a localized dialog name;
- opening the drawer stores the current opener and moves focus to the first available control;
- `Tab` and `Shift+Tab` remain inside the modal drawer;
- `Escape`, the close control and the backdrop close the drawer;
- closing restores focus to the original opener when it still exists;
- decorative menu and close icons are hidden from assistive technology;
- Home drawer groups use labeled section headings and list semantics instead of repeated unlabeled navigation landmarks;
- every active locale must provide non-empty `nav.contextMenu` and `common.close` values;
- deterministic contract coverage prevents hardcoded trigger copy, broken focus restoration and semantic regression.

## Preserved behavior

- existing drawer width, placement, animation, dark mode and responsive layout;
- contextual route-to-drawer selection;
- mouse, touch-edge and keyboard entry points;
- link navigation and automatic close behavior;
- all existing localized Home drawer content;
- bottom navigation and top domain navigation.

## Security and data impact

- no Supabase migration;
- no Auth, RLS, grants, storage, profile projection or private-data change;
- no lifecycle, dispute, reward, ledger or destructive change;
- no external AI or translation provider enabled;
- no new paid service, subscription or cost;
- no historical content rewrite;
- no Train C scope reopened.

## Verification gates

- focused Batch 66.8 accessibility contract;
- all active locale labels present;
- lint and typecheck;
- unit tests;
- production build;
- desktop, mobile and representative RTL E2E/visual checks;
- exact-head Vercel Preview;
- post-merge Production smoke and runtime-log review.
