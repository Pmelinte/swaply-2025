#!/usr/bin/env python3
"""Prepare a disposable migration copy for the V1-05.4.4 replay gate.

The repository migrations and Supabase Production are never modified. The script
only normalizes known legacy statements inside `.ci-supabase`, where the full
migration history is replayed against the current local Supabase/PostgreSQL
image.
"""

from __future__ import annotations

import argparse
from pathlib import Path


LEGACY_JWT = "current_setting('request.jwt.claims', true)::json->>'sub'"
COMPATIBLE_JWT = "((current_setting('request.jwt.claims', true)::json)->>'sub')"

PARTICIPANT_POLICY_FILES = (
    "20260206170000_phase2_chat_rls.sql",
    "20260218000001_fix_rls.sql",
)
PARTICIPANT_POLICY_MARKER = (
    'CREATE POLICY "messages_select_participant" ON public.messages'
)
PARTICIPANT_POLICY_DROP = (
    'DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;\n'
)

LEGACY_FEATURED_INDEX = """CREATE INDEX IF NOT EXISTS idx_featured_expires ON public.featured_listings(expires_at)
  WHERE expires_at > now();"""
COMPATIBLE_FEATURED_INDEX = """CREATE INDEX IF NOT EXISTS idx_featured_expires ON public.featured_listings(expires_at);"""

PG_TRGM_EXTENSION = (
    "CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;\n\n"
)
LEGACY_TRGM_INDEX = (
    "CREATE INDEX IF NOT EXISTS idx_items_title_trgm ON public.items "
    "USING gin (title gin_trgm_ops);"
)
COMPATIBLE_TRGM_INDEX = (
    "CREATE INDEX IF NOT EXISTS idx_items_title_trgm ON public.items "
    "USING gin (title extensions.gin_trgm_ops);"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "migrations_dir",
        type=Path,
        help="Path to the disposable migration directory.",
    )
    return parser.parse_args()


def normalize_jwt_expressions(migrations_dir: Path) -> int:
    replacements = 0

    for migration in sorted(migrations_dir.glob("*.sql")):
        source = migration.read_text(encoding="utf-8")
        occurrences = source.count(LEGACY_JWT)
        if not occurrences:
            continue

        migration.write_text(
            source.replace(LEGACY_JWT, COMPATIBLE_JWT),
            encoding="utf-8",
        )
        replacements += occurrences

    if replacements < 2:
        raise RuntimeError(
            "Expected at least two legacy JWT expressions in the isolated "
            f"migration set; found {replacements}."
        )

    return replacements


def make_chat_policy_recreations_idempotent(migrations_dir: Path) -> int:
    updated = 0

    for file_name in PARTICIPANT_POLICY_FILES:
        migration = migrations_dir / file_name
        source = migration.read_text(encoding="utf-8")

        if source.count(PARTICIPANT_POLICY_MARKER) != 1:
            raise RuntimeError(
                f"Expected one participant policy marker in {file_name}."
            )

        if PARTICIPANT_POLICY_DROP in source:
            continue

        migration.write_text(
            source.replace(
                PARTICIPANT_POLICY_MARKER,
                PARTICIPANT_POLICY_DROP + PARTICIPANT_POLICY_MARKER,
                1,
            ),
            encoding="utf-8",
        )
        updated += 1

    if updated != len(PARTICIPANT_POLICY_FILES):
        raise RuntimeError(
            "Expected to normalize every known participant policy recreation; "
            f"updated {updated} of {len(PARTICIPANT_POLICY_FILES)}."
        )

    return updated


def normalize_legacy_featured_index(migrations_dir: Path) -> int:
    migration = migrations_dir / "20260219100000_monetization.sql"
    source = migration.read_text(encoding="utf-8")
    occurrences = source.count(LEGACY_FEATURED_INDEX)

    if occurrences != 1:
        raise RuntimeError(
            "Expected exactly one non-immutable featured-listing index in the "
            f"isolated copy; found {occurrences}."
        )

    migration.write_text(
        source.replace(
            LEGACY_FEATURED_INDEX,
            COMPATIBLE_FEATURED_INDEX,
            1,
        ),
        encoding="utf-8",
    )
    return occurrences


def enable_pg_trgm_for_legacy_search_index(migrations_dir: Path) -> int:
    migration = migrations_dir / "20260219300000_seven_features.sql"
    source = migration.read_text(encoding="utf-8")
    occurrences = source.count(LEGACY_TRGM_INDEX)

    if occurrences != 1:
        raise RuntimeError(
            "Expected exactly one legacy trigram index in the isolated copy; "
            f"found {occurrences}."
        )

    if PG_TRGM_EXTENSION in source:
        raise RuntimeError(
            "The isolated trigram migration unexpectedly already enables "
            "pg_trgm."
        )

    migration.write_text(
        PG_TRGM_EXTENSION
        + source.replace(
            LEGACY_TRGM_INDEX,
            COMPATIBLE_TRGM_INDEX,
            1,
        ),
        encoding="utf-8",
    )
    return occurrences


def main() -> None:
    args = parse_args()
    migrations_dir = args.migrations_dir.resolve()

    if not migrations_dir.is_dir():
        raise RuntimeError(f"Migration directory not found: {migrations_dir}")

    jwt_count = normalize_jwt_expressions(migrations_dir)
    policy_count = make_chat_policy_recreations_idempotent(migrations_dir)
    index_count = normalize_legacy_featured_index(migrations_dir)
    trigram_count = enable_pg_trgm_for_legacy_search_index(migrations_dir)

    print(
        "Prepared isolated migration copy: "
        f"JWT expressions={jwt_count}, "
        f"chat policy recreations={policy_count}, "
        f"non-immutable indexes={index_count}, "
        f"trigram extensions/indexes={trigram_count}. "
        "Repository migrations and Production remain unchanged."
    )


if __name__ == "__main__":
    main()
