# Swaply agentic ladder — next 50 points

This document keeps the next work visible, reviewable, and CI-gated. Each batch should stay small enough to be reverted independently and must pass GitHub CI, Next build, Vitest, and Playwright public visual audit before the next batch continues.

## Batch 3 — Public pages proof

1. Create a dedicated Batch 3 branch from the green Batch 2 commit.
2. Add a central public route audit contract.
3. Drive Playwright public route coverage from that shared contract.
4. Add unit tests for public route audit coverage.
5. Add global-first guest proof examples for major public pages.
6. Add unit tests proving guest examples exist before login.
7. Add focused login-wall guard patterns.
8. Make Playwright reject blank public login walls.
9. Keep context-only pages like Chat/Profile documented without forcing brittle screenshots.
10. Open a stacked PR over Batch 2 and keep it draft until CI is green.

## Batch 4 — Public page UI integration

11. Create a reusable GuestExperienceSection component.
12. Render public proof examples on Home without hardcoding page-specific logic.
13. Render object guest proof examples on Objects.
14. Render property guest proof examples on Properties.
15. Render service guest proof examples on Services.
16. Render event guest proof examples on Events.
17. Add contextual CTA cards that distinguish preview from real actions.
18. Ensure real actions open auth gating only when the user acts.
19. Extend Playwright screenshots to verify guest proof sections are visible.
20. Keep logged-in behavior unchanged.

## Batch 5 — AI Gateway integration skeleton

21. Add a typed server-side AI action facade for item metadata.
22. Add classify-item request/result types.
23. Add generate-description request/result types.
24. Add estimate-value request/result types.
25. Add translate request/result types.
26. Add match-explanation request/result types.
27. Add safe fallback responses for every AI task.
28. Add tests proving UI can operate without providers.
29. Add logging-safe task metadata without storing sensitive raw input.
30. Do not connect paid providers yet.

## Batch 6 — Blog and Stories surfaces

31. Add route audit coverage for Stories if the route exists.
32. Add story preview contract with consent flags.
33. Add story anonymization proof helpers.
34. Add tests preventing exact address exposure in stories.
35. Add blog guide relation contract for public pages.
36. Add tests keeping Blog and Stories separate.
37. Add public story CTA rules: read before login, publish only after consent.
38. Add Playwright coverage for Blog drawer and guide cards.
39. Add story-ready placeholders without fake testimonials.
40. Keep moderation and publishing decisions out of unsupervised code.

## Batch 7 — Stabilization and release readiness

41. Add CI artifact naming conventions per batch.
42. Add PR checklist template for stacked agentic PRs.
43. Add route inventory docs generated from current audit contracts.
44. Add lightweight smoke tests for locale prefixes beyond English.
45. Add screenshot review notes for desktop and mobile artifacts.
46. Add Vercel runtime error check notes to PR bodies.
47. Add rule that migrations are documented but not assumed applied.
48. Add dependency notes for stacked PR order.
49. Add final review gate before marking PRs ready.
50. Keep every batch reversible and mergeable independently.
