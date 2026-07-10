# Batch 45A — AI image safe fallback test alignment

Date: 2026-07-10
Branch: `batch-45a-ai-image-safe-fallback`
Base: `main`

## Problem

The coordinated security rollout changed `/api/ai/image` so server-side image downloads are allowed only from explicitly trusted hosts.

The existing fallback test still used `https://example.com/...` without adding `example.com` to `AI_IMAGE_ALLOWED_HOSTS`. The request was therefore rejected correctly before `fetch`, and the test expected the wrong contract.

## Fix

Updated `src/__tests__/api-ai-image.test.ts` to:

- reset `AI_IMAGE_ALLOWED_HOSTS` between tests;
- verify that a public but non-allowlisted host returns HTTP 400;
- verify that no network fetch occurs for a non-allowlisted host;
- allowlist `example.com` in the filename-fallback test;
- simulate a failed image download;
- verify that the route returns `status: "fallback"` with a title derived from the filename.

## Security boundary

This batch does not weaken the SSRF protection and does not expand the production allowlist.

Private/internal URLs and public hosts that are not explicitly trusted remain blocked.

## Scope

No production API implementation changes.
No Supabase, RLS, Auth, payments, matching, SEO or AI-provider changes.
