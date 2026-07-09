# Human-centered swapping foundation

Batch 8 adds the first safe foundation for human-centered swapping.

## Product idea

A Swaply object is not only an item. It can have economic value, practical value and meaning. The owner may optionally explain why they want to swap it, whether it deserves a second life and what kind of use would feel appropriate.

## Safety rules

- Sentimental/context fields are optional.
- Users must not be forced to share personal stories.
- The system should detect direct contact details, exact addresses and obvious coordinate pairs.
- Public stories still require later consent and moderation.
- AI match explanations are advisory only.
- Humans decide whether to exchange.

## Added concepts

- sentimental value level
- object story
- reason for swapping
- intended use preference
- second-life tag
- recipient interest reason
- meaning match explanation
- privacy warnings

## Not implemented in this batch

- No Supabase migration.
- No form field added to the live object form.
- No real matching algorithm change.
- No automatic ranking or filtering based on personal story.
- No enforcement that could discriminate between people.

## Next safe step

A later batch can add UI fields to the item form behind these types, with clear copy that the section is optional and should not contain private data.
