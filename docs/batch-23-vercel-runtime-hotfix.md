# Batch 23 — Vercel runtime hotfix

## Goal

Batch 23 fixes two production runtime warnings observed on the live Vercel deployment after the Batch 22 merge to `main`.

## Vercel evidence

The production deployment was `READY`, but runtime logs showed:

1. `MISSING_MESSAGE: about.blog (bg)` on `/bg/blog/how-to-price-items-for-swap`.
2. `TypeError: The "path" argument must be of type string. Received an instance of Object` on `/cs/objects/[id]`.

Both routes returned HTTP 200, but production logs were not clean.

## Fixes

1. The contextual drawer blog config no longer uses the missing key `about.blog`.
2. Blog drawer keys now use existing `blog.*` translation keys:
   - `blog.pageTitle`
   - `blog.allArticles`
3. Object detail metadata and JSON-LD now normalize item image records before passing them to Next metadata, OpenGraph, Twitter cards or JSON-LD.
4. `SafeImage` now guards against malformed object-shaped image sources before they reach `next/image`.
5. Tests cover the blog drawer key contract and image-source normalization.

## Safety boundaries

- No Supabase migration.
- No RLS change.
- No auth change.
- No payment change.
- No AI provider change.
- No route change.
- No new feature behavior.
- No merge.

## Required checks

- Unit Tests
- Lint & Type Check
- Build
- Public Visual Audit / Playwright
- Vercel production runtime logs after merge/deploy
