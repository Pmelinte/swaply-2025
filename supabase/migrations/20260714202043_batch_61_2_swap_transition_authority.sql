begin;

-- Historical reconciliation marker.
--
-- This Production migration version was created by a parallel Batch 61.2
-- implementation while PR #462 was under validation. Its transient second
-- transition authority was removed by
-- 20260714202934_batch_61_2_parallel_authority_reconciliation.sql.
--
-- A fresh database must not recreate that unsafe transient authority. The
-- following reconciliation migration establishes the intended final identity
-- guard, proposal-entry policy and single transition authority.

select 1;

commit;
