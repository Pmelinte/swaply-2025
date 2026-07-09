# Global-first language fallback foundation

Batch 16 adds a safe foundation for language fallback behavior.

## Product rule

Swaply is global-first. A public page should not break only because an exact translation is missing.

## Fallback order

1. Exact requested locale.
2. User preferred locale.
3. Same language family.
4. Global default locale.
5. First available locale.
6. Original content fallback.

## Public page rule

Missing translation must not block public rendering. A page can render with fallback content while making the fallback state explicit.

## Chat rule

Chat translation must preserve the original message. A translated message is helper content, not a replacement for the original.

## Legal rule

Legal surfaces require human review. Machine translation is not enough for final legal content.

## Covered surfaces

- public page;
- item listing;
- matching;
- chat;
- exchange;
- blog;
- story;
- legal.

## What this batch does not do

- It does not change Next.js routing.
- It does not add new locale files.
- It does not claim all languages are translated.
- It does not connect machine translation.
- It does not change live UI.
- It does not create Supabase tables.

## Next safe step

A later batch can connect this contract to route rendering and public page audits so missing translations become warnings instead of broken pages.
