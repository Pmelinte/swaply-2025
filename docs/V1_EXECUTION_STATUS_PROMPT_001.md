# V1 Prompt 001 — Registration

Status: PR_OPEN

Scope: registration input contract and email-confirmation callback safety.

Implemented:
- reusable registration input normalization/validation contract;
- same-origin callback redirect allowlist;
- confirmation callback fails closed for missing/invalid codes;
- welcome email remains non-blocking and is sent only after a valid confirmed user is available;
- focused Vitest coverage for validation and unsafe redirect rejection.

Migrations: none.

Production: pending merge and deployment verification.
