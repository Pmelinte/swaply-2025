-- Migrate items.category from Romanian display names to English slugs.
-- This is a data-only migration; no RLS policies are changed.

BEGIN;

-- ── Top-level categories (user-specified mappings) ──
UPDATE items SET category = 'books_media'           WHERE category = 'Cărți & Media';
UPDATE items SET category = 'electronics'           WHERE category IN ('Electronică', 'Electronice');
UPDATE items SET category = 'sports_outdoor'        WHERE category = 'Sport & Outdoor';
UPDATE items SET category = 'hobby_games'           WHERE category = 'Hobby & Jocuri';
UPDATE items SET category = 'fashion_accessories'   WHERE category = 'Modă & Accesorii';
UPDATE items SET category = 'home_garden'           WHERE category = 'Casă & Grădină';

-- ── Additional top-level categories ──
UPDATE items SET category = 'auto_moto'             WHERE category = 'Auto & Moto';
UPDATE items SET category = 'music_audio'           WHERE category = 'Muzică & Audio';
UPDATE items SET category = 'gardening_outdoor'     WHERE category = 'Grădinărit & Exterior';
UPDATE items SET category = 'toys_kids'             WHERE category = 'Jucării & Copii';
UPDATE items SET category = 'tools_diy'             WHERE category = 'Unelte & Bricolaj';
UPDATE items SET category = 'vehicles'              WHERE category = 'Vehicule';
UPDATE items SET category = 'experiences'           WHERE category = 'Experiențe';
UPDATE items SET category = 'other'                 WHERE category = 'Altele';

-- ── Empty string → NULL ──
UPDATE items SET category = NULL WHERE category = '';

COMMIT;
