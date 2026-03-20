-- Fix: Remove duplicate BEFORE trigger that caused swap accepted emails to be sent twice
-- The function handle_swap_status_change() was being called by both:
--   on_swap_status_change (BEFORE UPDATE) - removed
--   on_swap_status_changed (AFTER UPDATE) - kept
-- This resulted in 4 emails instead of 2 on each swap acceptance.

DROP TRIGGER IF EXISTS on_swap_status_change ON public.swaps;
