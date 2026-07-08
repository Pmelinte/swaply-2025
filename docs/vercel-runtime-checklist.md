# Vercel runtime checklist

Use this checklist after a stacked PR is green in GitHub Actions and before treating the deployment as review-ready.

## Public routes to spot-check

- `/en`
- `/en/objects`
- `/en/explore`
- `/en/matching`
- `/en/messages`
- `/en/exchange`
- `/en/blog`
- `/ro`
- `/fr/objects`
- `/fil/matching`

## Look for

- Next.js runtime errors
- blank white pages
- cache mismatch between normal and incognito browser sessions
- duplicate bottom navigation labels
- drawer opening wrong contextual content
- public pages that became login walls
- missing `Guest experience` blocks
- broken cookie consent overlay
- mobile bottom nav overlap

## Do not approve release if

- the Vercel deployment differs materially from the Playwright screenshots without explanation
- any public route returns 404/500
- auth redirects trap a public page
- a page exposes private profile data, exact location, messages, token ledger or unapproved story content
