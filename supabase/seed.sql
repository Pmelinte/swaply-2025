-- Swaply Demo Seed: 1000 conturi demo + items asociate
-- Rulează cu: psql sau Supabase SQL Editor
-- Toate datele au is_demo = true pentru a fi ușor de identificat / șters

BEGIN;

-- ============================================================
-- 1) Date auxiliare pentru generare realistă
-- ============================================================

-- Orașe românești cu coordonate
CREATE TEMP TABLE _cities (
  city TEXT, region TEXT, country TEXT, lat NUMERIC, lng NUMERIC
) ON COMMIT DROP;

INSERT INTO _cities VALUES
  ('București',   'Ilfov',      'România', 44.4268, 26.1025),
  ('Cluj-Napoca', 'Cluj',       'România', 46.7712, 23.5897),
  ('Timișoara',   'Timiș',      'România', 45.7489, 21.2087),
  ('Iași',        'Iași',       'România', 47.1585, 27.6014),
  ('Constanța',   'Constanța',  'România', 44.1598, 28.6348),
  ('Craiova',     'Dolj',       'România', 44.3302, 23.7949),
  ('Brașov',      'Brașov',     'România', 45.6427, 25.5887),
  ('Galați',      'Galați',     'România', 45.4353, 28.0080),
  ('Sibiu',       'Sibiu',      'România', 45.7983, 24.1256),
  ('Oradea',      'Bihor',      'România', 47.0465, 21.9189),
  ('Arad',        'Arad',       'România', 46.1866, 21.3123),
  ('Ploiești',    'Prahova',    'România', 44.9462, 26.0254),
  ('Pitești',     'Argeș',      'România', 44.8565, 24.8692),
  ('Târgu Mureș', 'Mureș',      'România', 46.5386, 24.5579),
  ('Baia Mare',   'Maramureș',  'România', 47.6567, 23.5850),
  ('Suceava',     'Suceava',    'România', 47.6514, 26.2554),
  ('Bacău',       'Bacău',      'România', 46.5670, 26.9146),
  ('Buzău',       'Buzău',      'România', 45.1500, 26.8333),
  ('Alba Iulia',  'Alba',       'România', 46.0764, 23.5808),
  ('Deva',        'Hunedoara',  'România', 45.8833, 22.9000);

-- Prenume românești
CREATE TEMP TABLE _firstnames (name TEXT, gender TEXT) ON COMMIT DROP;
INSERT INTO _firstnames VALUES
  ('Ana', 'F'), ('Maria', 'F'), ('Elena', 'F'), ('Ioana', 'F'), ('Andreea', 'F'),
  ('Alexandra', 'F'), ('Cristina', 'F'), ('Diana', 'F'), ('Gabriela', 'F'), ('Laura', 'F'),
  ('Mihaela', 'F'), ('Raluca', 'F'), ('Simona', 'F'), ('Dana', 'F'), ('Alina', 'F'),
  ('Carmen', 'F'), ('Daniela', 'F'), ('Florina', 'F'), ('Iulia', 'F'), ('Monica', 'F'),
  ('Andrei', 'M'), ('Mihai', 'M'), ('Alexandru', 'M'), ('Ion', 'M'), ('Florin', 'M'),
  ('Cristian', 'M'), ('Adrian', 'M'), ('Gabriel', 'M'), ('Daniel', 'M'), ('Marius', 'M'),
  ('Vlad', 'M'), ('Bogdan', 'M'), ('Radu', 'M'), ('Dragoș', 'M'), ('Cătălin', 'M'),
  ('Ionuț', 'M'), ('Lucian', 'M'), ('Ovidiu', 'M'), ('Paul', 'M'), ('Sorin', 'M');

-- Nume de familie
CREATE TEMP TABLE _lastnames (name TEXT) ON COMMIT DROP;
INSERT INTO _lastnames VALUES
  ('Popescu'), ('Ionescu'), ('Popa'), ('Stan'), ('Dumitru'),
  ('Stoica'), ('Gheorghe'), ('Marin'), ('Tudor'), ('Rusu'),
  ('Constantin'), ('Dinu'), ('Moldovan'), ('Matei'), ('Cristea'),
  ('Ciobanu'), ('Luca'), ('Ungureanu'), ('Nistor'), ('Toma'),
  ('Cojocaru'), ('Lazăr'), ('Ene'), ('Voicu'), ('Barbu'),
  ('Neagu'), ('Preda'), ('Munteanu'), ('Oprea'), ('Savu'),
  ('Iordache'), ('Dumitrescu'), ('Petrescu'), ('Marinescu'), ('Vasilescu'),
  ('Georgescu'), ('Vladescu'), ('Radulescu'), ('Grigorescu'), ('Florescu'),
  ('Diaconu'), ('Ganea'), ('Manole'), ('Niculescu'), ('Micu'),
  ('Coman'), ('Tănase'), ('Moldoveanu'), ('Frîncu'), ('Olaru');

-- Categorii de obiecte
CREATE TEMP TABLE _categories (name TEXT) ON COMMIT DROP;
INSERT INTO _categories VALUES
  ('Electronică'), ('Sport & Outdoor'), ('Hobby & Jocuri'),
  ('Cărți & Media'), ('Casă & Grădină'), ('Modă & Accesorii');

-- Titluri de obiecte per categorie
CREATE TEMP TABLE _item_templates (
  category TEXT, title TEXT, description TEXT, tags TEXT[]
) ON COMMIT DROP;

INSERT INTO _item_templates VALUES
  ('Electronică', 'Monitor 24" IPS', 'Monitor IPS Full HD, stare bună, fără pixeli morți.', ARRAY['monitor','office','tech']),
  ('Electronică', 'Tastatură mecanică', 'Switch-uri Cherry MX, iluminare RGB.', ARRAY['tastatură','gaming','periferice']),
  ('Electronică', 'Căști wireless', 'Bluetooth 5.0, autonomie 20h, noise cancelling.', ARRAY['căști','audio','wireless']),
  ('Electronică', 'Raspberry Pi 4', 'Kit complet cu carcasă și alimentator.', ARRAY['raspberry','embedded','tech']),
  ('Electronică', 'Consolă retro', 'Consolă cu 200+ jocuri clasice preinstalate.', ARRAY['gaming','retro','consolă']),
  ('Electronică', 'Cameră web HD', 'Camera 1080p cu microfon integrat.', ARRAY['webcam','video','office']),
  ('Electronică', 'SSD extern 500GB', 'USB-C, viteze de transfer rapide.', ARRAY['stocare','ssd','portabil']),
  ('Electronică', 'Boxă Bluetooth', 'Portabilă, rezistentă la apă, sunet clar.', ARRAY['audio','bluetooth','portabil']),
  ('Sport & Outdoor', 'Bicicletă urbană', 'Cadru ușor, 21 viteze, ideală pentru oraș.', ARRAY['bicicletă','transport','urban']),
  ('Sport & Outdoor', 'Trotineta electrică', 'Autonomie 25km, viteză max 25km/h.', ARRAY['trotinetă','electric','transport']),
  ('Sport & Outdoor', 'Cort camping 3 pers', 'Impermeabil, montaj rapid, cu avanpost.', ARRAY['camping','cort','outdoor']),
  ('Sport & Outdoor', 'Skateboard', 'Placă standard, roți noi, grip tape proaspăt.', ARRAY['skateboard','sport','urban']),
  ('Sport & Outdoor', 'Minge fotbal', 'Mărime 5, piele sintetică, ca nouă.', ARRAY['fotbal','sport','minge']),
  ('Sport & Outdoor', 'Rachetă tenis', 'Grafină, mâner nou, husă inclusă.', ARRAY['tenis','rachetă','sport']),
  ('Sport & Outdoor', 'Set badminton', 'Două rachete + fluturași + plasă portabilă.', ARRAY['badminton','set','outdoor']),
  ('Sport & Outdoor', 'Rucsac hiking 40L', 'Ergonomic, husă ploaie inclusă.', ARRAY['rucsac','hiking','outdoor']),
  ('Hobby & Jocuri', 'Set Lego Technic', 'Parțial asamblat, manual inclus.', ARRAY['lego','technic','construcție']),
  ('Hobby & Jocuri', 'Puzzle 1000 piese', 'Peisaj montan, piese complete.', ARRAY['puzzle','hobby','relaxare']),
  ('Hobby & Jocuri', 'Set pictură acrilice', '24 culori + pensule + pânză.', ARRAY['pictură','artă','acrilice']),
  ('Hobby & Jocuri', 'Chitară acustică', 'Corzi noi, sunet cald, ideală pentru începători.', ARRAY['chitară','muzică','acustică']),
  ('Hobby & Jocuri', 'Joc Catan', 'Ediție standard + extensie 5-6 jucători.', ARRAY['boardgame','catan','societate']),
  ('Hobby & Jocuri', 'Drona mini', 'Cu cameră HD, autonomie 15 min.', ARRAY['drona','tech','hobby']),
  ('Hobby & Jocuri', 'Set cărți de magie', 'Pachet complet + manual trucuri.', ARRAY['magie','cărți','entertainment']),
  ('Hobby & Jocuri', 'Telescop amator', 'Lungime focală 700mm, suport inclus.', ARRAY['telescop','astronomie','hobby']),
  ('Cărți & Media', 'Colecție Harry Potter', 'Toate cele 7 volume, română.', ARRAY['cărți','harry-potter','colecție']),
  ('Cărți & Media', 'Curs programare Python', 'Manual + exerciții, nivel intermediar.', ARRAY['programare','python','educație']),
  ('Cărți & Media', 'Viniluri clasice', 'Set de 10 viniluri rock/jazz.', ARRAY['vinyl','muzică','colecție']),
  ('Cărți & Media', 'Manga One Piece vol 1-20', 'Ediție japoneză, stare perfectă.', ARRAY['manga','one-piece','comics']),
  ('Cărți & Media', 'DVD Box Set film', 'Trilogia LOTR extended edition.', ARRAY['dvd','film','colecție']),
  ('Cărți & Media', 'Carte bucătărie rom.', 'Rețete tradiționale românești, ilustrat.', ARRAY['carte','bucătărie','tradițional']),
  ('Casă & Grădină', 'Set unelte grădină', '5 piese, oțel inoxidabil, mânere lemn.', ARRAY['unelte','grădină','casă']),
  ('Casă & Grădină', 'Lampă de birou LED', 'Reglabilă, 3 temperaturi culoare.', ARRAY['lampă','birou','led']),
  ('Casă & Grădină', 'Aspirator robot', 'Funcțional, baterie recondiționată.', ARRAY['aspirator','robot','casă']),
  ('Casă & Grădină', 'Set ghivece ceramice', '3 bucăți, diverse mărimi, colorate.', ARRAY['ghivece','ceramică','decor']),
  ('Casă & Grădină', 'Hamac dublu', 'Bumbac, suportă 200kg, cu suport.', ARRAY['hamac','relaxare','grădină']),
  ('Casă & Grădină', 'Presă cafea french', 'Sticlă Borosilicată, 1L.', ARRAY['cafea','french-press','bucătărie']),
  ('Modă & Accesorii', 'Rucsac piele', 'Piele naturală, compartiment laptop 15".', ARRAY['rucsac','piele','accesorii']),
  ('Modă & Accesorii', 'Ochelari de soare', 'Polarizați, model aviator, protecție UV400.', ARRAY['ochelari','soare','modă']),
  ('Modă & Accesorii', 'Ceas analogic', 'Mecanism quartz, brățară oțel.', ARRAY['ceas','accesorii','elegant']),
  ('Modă & Accesorii', 'Geacă de piele', 'Mărime M, stil biker, căptușeală detașabilă.', ARRAY['geacă','piele','modă']);

-- Wishlist-uri posibile
CREATE TEMP TABLE _wishlists (text TEXT) ON COMMIT DROP;
INSERT INTO _wishlists VALUES
  ('Orice electronică funcțională'), ('Bicicletă sau trotinetă'), ('Jocuri de societate'),
  ('Cărți SF sau fantasy'), ('Accesorii camping'), ('Instrument muzical'),
  ('Gadget-uri smart home'), ('Echipament sport'), ('Mobilier mic de birou'),
  ('Plante de interior'), ('Ustensile bucătărie'), ('Decorațiuni handmade'),
  ('Haine vintage'), ('Set LEGO orice serie'), ('Viniluri rock'),
  ('Aparat foto instant'), ('Căști audio'), ('Monitor sau tastatură'),
  ('Puzzle-uri complexe'), ('Unelte grădinărit');

-- Bio-uri posibile
CREATE TEMP TABLE _bios (text TEXT) ON COMMIT DROP;
INSERT INTO _bios VALUES
  ('Pasionat de tehnologie și gadget-uri. Mereu în căutare de schimburi interesante.'),
  ('Iubesc cărțile și muzica. Deschis la swap-uri creative.'),
  ('Outdoor enthusiast, caut echipament camping și sport.'),
  ('Colecționar de boardgames, caut parteneri de schimb.'),
  ('Designer grafic, schimb unelte creative și tech.'),
  ('Grădinar amator, iubesc plantele și decorațiunile handmade.'),
  ('Student, caut cărți și electronică la prețuri accesibile.'),
  ('Mamă creativă, schimb jucării și cărți pentru copii.'),
  ('Fotograf amator, caut echipament foto și accesorii.'),
  ('Bucătar pasionat, schimb ustensile și cărți de rețete.'),
  ('Muzician, caut instrumente și echipament audio.'),
  ('Runner, caut echipament sport și accesorii fitness.'),
  ('Gamer, swap-uri de jocuri și periferice.'),
  ('Minimalist, dau mai departe ce nu mai folosesc.'),
  ('DIY enthusiast, caut materiale și unelte.'),
  ('Ciclist urban, schimb accesorii bicicletă.'),
  ('Iubitor de animale, caut accesorii și echipament.'),
  ('Traveler, schimb ghiduri și echipament de călătorie.'),
  ('Bookworm, am sute de cărți de oferit.'),
  ('Meseriaș, schimb unelte și materiale de lucru.');

-- ============================================================
-- 2) Generare 1000 profiluri demo
-- ============================================================
INSERT INTO profiles (
  id,
  email,
  display_name,
  bio,
  badge,
  languages,
  location,
  visibility,
  notifications,
  swap_preferences,
  security,
  stats
)
SELECT
  'demo-' || lpad(i::text, 4, '0') AS id,
  'demo' || i || '@swaply.example.com' AS email,
  fn.name || ' ' || ln.name AS display_name,
  b.text AS bio,
  (ARRAY['free','free','free','premium','premium','platinum'])[1 + (i % 6)] AS badge,
  CASE
    WHEN i % 5 = 0 THEN ARRAY['ro','en','es']::text[]
    WHEN i % 3 = 0 THEN ARRAY['ro','en']::text[]
    ELSE ARRAY['ro']::text[]
  END AS languages,
  jsonb_build_object(
    'country', c.country,
    'region', c.region,
    'city', c.city,
    'postalCode', lpad(((i * 7 + 100000) % 900000 + 100000)::text, 6, '0'),
    'coordinates', jsonb_build_object('lat', c.lat + (random() - 0.5) * 0.1, 'lng', c.lng + (random() - 0.5) * 0.1),
    'travelRadiusKm', (ARRAY[10,20,30,50,75,100])[1 + (i % 6)]
  ) AS location,
  jsonb_build_object(
    'publicProfile', true,
    'itemsVisibility', CASE WHEN i % 10 = 0 THEN 'match_only' ELSE 'public' END,
    'showExactLocation', i % 7 = 0,
    'showLastSeen', i % 3 != 0
  ) AS visibility,
  jsonb_build_object(
    'email', true,
    'push', i % 4 != 0,
    'chat', true,
    'matches', true,
    'swapUpdates', true
  ) AS notifications,
  jsonb_build_object(
    'logistics', (ARRAY['in_person','courier','flexible'])[1 + (i % 3)],
    'notes', CASE
      WHEN i % 3 = 0 THEN 'Prefer întâlniri în zone publice.'
      WHEN i % 3 = 1 THEN 'Pot trimite prin curier în toată țara.'
      ELSE 'Flexibil, discutăm detaliile.'
    END
  ) AS swap_preferences,
  jsonb_build_object(
    'twoFactorEnabled', i % 5 = 0,
    'method', CASE WHEN i % 5 = 0 THEN 'totp' ELSE null END,
    'passkeysEnabled', i % 10 = 0
  ) AS security,
  jsonb_build_object(
    'tokens', (i * 17 + 50) % 500,
    'reputation', (ARRAY['starter','starter','trusted','trusted','ambassador'])[1 + (i % 5)],
    'completedSwaps', (i * 3 + 1) % 50,
    'activeListings', 1 + (i % 5)
  ) AS stats
FROM generate_series(1, 1000) AS i
CROSS JOIN LATERAL (
  SELECT name FROM _firstnames OFFSET (i % (SELECT count(*) FROM _firstnames)) LIMIT 1
) fn
CROSS JOIN LATERAL (
  SELECT name FROM _lastnames OFFSET ((i * 7) % (SELECT count(*) FROM _lastnames)) LIMIT 1
) ln
CROSS JOIN LATERAL (
  SELECT city, region, country, lat, lng FROM _cities OFFSET (i % (SELECT count(*) FROM _cities)) LIMIT 1
) c
CROSS JOIN LATERAL (
  SELECT text FROM _bios OFFSET (i % (SELECT count(*) FROM _bios)) LIMIT 1
) b
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3) Generare ~2-3 items per cont demo (2000-3000 obiecte)
-- ============================================================
INSERT INTO items (
  id,
  owner_id,
  title,
  category,
  condition,
  description,
  wishlist,
  status,
  is_demo,
  is_active,
  created_at,
  location,
  ai_suggested_tags,
  user_final_tags,
  photos
)
SELECT
  'demo-item-' || lpad(row_number() OVER ()::text, 5, '0') AS id,
  'demo-' || lpad(profile_i::text, 4, '0') AS owner_id,
  t.title AS title,
  t.category AS category,
  (ARRAY['new','good','used'])[1 + (item_j % 3)] AS condition,
  t.description AS description,
  w.text AS wishlist,
  CASE
    WHEN item_j = 1 AND profile_i % 20 = 0 THEN 'reserved'
    WHEN item_j = 2 AND profile_i % 50 = 0 THEN 'swapped'
    ELSE 'active'
  END AS status,
  true AS is_demo,
  CASE
    WHEN item_j = 2 AND profile_i % 50 = 0 THEN false
    ELSE true
  END AS is_active,
  NOW() - ((profile_i + item_j * 100) % 365 || ' days')::interval AS created_at,
  c.city AS location,
  t.tags AS ai_suggested_tags,
  t.tags[1:2] AS user_final_tags,
  ARRAY[]::text[] AS photos
FROM generate_series(1, 1000) AS profile_i
CROSS JOIN generate_series(1, 3) AS item_j
CROSS JOIN LATERAL (
  SELECT title, category, description, tags
  FROM _item_templates
  OFFSET ((profile_i * 3 + item_j * 7) % (SELECT count(*) FROM _item_templates))
  LIMIT 1
) t
CROSS JOIN LATERAL (
  SELECT text FROM _wishlists
  OFFSET ((profile_i + item_j * 11) % (SELECT count(*) FROM _wishlists))
  LIMIT 1
) w
CROSS JOIN LATERAL (
  SELECT city FROM _cities
  OFFSET (profile_i % (SELECT count(*) FROM _cities))
  LIMIT 1
) c
WHERE item_j <= 2 + (profile_i % 2)  -- 2 sau 3 items per cont
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4) Categorii demo (dacă tabela e goală)
-- ============================================================
INSERT INTO categories (id, name)
SELECT 'cat-' || row_number() OVER (), name
FROM _categories
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- Rezultat: 1000 conturi demo (demo-0001 .. demo-1000)
--           ~2500 items demo (is_demo = true)
--           Toate în schema public cu RLS aplicabil
-- ============================================================
-- Pentru a șterge toate datele demo:
--   DELETE FROM items WHERE is_demo = true;
--   DELETE FROM profiles WHERE id LIKE 'demo-%';
-- ============================================================
