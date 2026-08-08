# Swaply — Secret rotation runbook

## 1. Scope

Applies to GitHub Actions, Vercel, Supabase, Cloudinary, Resend/email, AI providers and any future commercial provider. Never record secret values in issues, PRs, screenshots, logs or evidence artifacts.

## 2. Trigger

Rotate after suspected exposure, staff/access change, provider recommendation, cryptographic deprecation, failed audit or planned maintenance. Suspected exposure starts as `SEV-1`.

## 3. Safe sequence

1. Inventory the secret by **name, owner, environment and consumers**, not value.
2. Identify whether the provider supports overlapping old/new credentials.
3. Create the new credential with least privilege.
4. Update non-Production consumers first and verify.
5. Update Production consumers atomically or in a documented order.
6. Verify health, authentication and negative rejection behavior.
7. Revoke the old credential only after new-path verification.
8. Monitor logs and provider audit events.
9. Record completion, approver and rollback status.

For providers without overlap, schedule a controlled maintenance window and prepare immediate rollback before cutover.

## 4. Negative verification

A rotation is incomplete unless:

- the new credential succeeds only in intended environments;
- the old credential is rejected after revocation;
- no client bundle or public environment variable contains a secret credential;
- no logs/artifacts contain either value;
- service-role or signing credentials retain least privilege;
- application runtime and applicable webhook signatures remain valid.

## 5. Rollback

If the new credential fails before old-key revocation, restore the prior configuration and investigate. If the old credential was exposed, do not reactivate it; issue another credential and keep the affected integration disabled until verified.

## 6. Provider notes

- **Supabase:** publishable/anon credentials are not service-role credentials; never expose service role. Rotate dependent server environments and revoke sessions when the incident requires it.
- **Vercel:** update environment-scoped values, redeploy an immutable build and verify exact SHA.
- **GitHub:** use repository/environment secrets; workflows must not echo values.
- **AI/Cloudinary/Resend/commercial providers:** update server-only consumers, verify quota/webhook/signature behavior and retain fail-closed fallback.

## 7. V1-10 evidence boundary

V1-10.2 executes an ephemeral HMAC cutover simulation proving the sequence and old-key rejection. It reads or rotates no real credential. Real rotation remains an operator action when triggered and must produce a private incident record.
