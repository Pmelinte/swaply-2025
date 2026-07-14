-- Historical Production marker for a superseded parallel Batch 61.2 migration.
--
-- This branch was not the canonical implementation. Its objects were removed by
-- 20260714204708_batch_61_2_late_parallel_reconciliation.sql. A fresh database
-- must receive only the canonical authority defined by the earlier 61.2 files.

begin;
commit;
