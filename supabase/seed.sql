-- Swaply Demo Seed: 1000 conturi demo internationale + items asociate
-- 20 tari, orase diverse, limbi diferite (ro / en / es)
-- Rulează cu: psql sau Supabase SQL Editor
-- Toate datele au is_demo = true pentru a fi ușor de identificat / șters

BEGIN;

-- ============================================================
-- 1) Date auxiliare pentru generare realistă internatională
-- ============================================================

-- Orașe din 20 de țări (4 orașe per țară = 80 orașe)
-- Coloana lang = limba principală a țării (ro / en / es)
CREATE TEMP TABLE _cities (
  city TEXT, region TEXT, country TEXT, lang TEXT, lat NUMERIC, lng NUMERIC
) ON COMMIT DROP;

INSERT INTO _cities VALUES
  -- România (ro)
  ('București',    'Ilfov',          'România',       'ro', 44.4268, 26.1025),
  ('Cluj-Napoca',  'Cluj',           'România',       'ro', 46.7712, 23.5897),
  ('Timișoara',    'Timiș',          'România',       'ro', 45.7489, 21.2087),
  ('Iași',         'Iași',           'România',       'ro', 47.1585, 27.6014),
  -- Moldova (ro)
  ('Chișinău',     'Chișinău',       'Moldova',       'ro', 47.0105, 28.8638),
  ('Bălți',        'Bălți',          'Moldova',       'ro', 47.7617, 27.9289),
  ('Cahul',        'Cahul',          'Moldova',       'ro', 45.9042, 28.1944),
  ('Ungheni',      'Ungheni',        'Moldova',       'ro', 47.2101, 27.8003),
  -- Spania (es)
  ('Madrid',       'Comunidad de Madrid', 'España',   'es', 40.4168, -3.7038),
  ('Barcelona',    'Cataluña',       'España',        'es', 41.3874, 2.1686),
  ('Valencia',     'Comunidad Valenciana', 'España',   'es', 39.4699, -0.3763),
  ('Sevilla',      'Andalucía',      'España',        'es', 37.3891, -5.9845),
  -- Mexic (es)
  ('Ciudad de México', 'CDMX',       'México',        'es', 19.4326, -99.1332),
  ('Guadalajara',  'Jalisco',        'México',        'es', 20.6597, -103.3496),
  ('Monterrey',    'Nuevo León',     'México',        'es', 25.6866, -100.3161),
  ('Puebla',       'Puebla',         'México',        'es', 19.0414, -98.2063),
  -- Argentina (es)
  ('Buenos Aires', 'CABA',           'Argentina',     'es', -34.6037, -58.3816),
  ('Córdoba',      'Córdoba',        'Argentina',     'es', -31.4201, -64.1888),
  ('Rosario',      'Santa Fe',       'Argentina',     'es', -32.9468, -60.6393),
  ('Mendoza',      'Mendoza',        'Argentina',     'es', -32.8895, -68.8458),
  -- Colombia (es)
  ('Bogotá',       'Cundinamarca',   'Colombia',      'es', 4.7110, -74.0721),
  ('Medellín',     'Antioquia',      'Colombia',      'es', 6.2442, -75.5812),
  ('Cali',         'Valle del Cauca','Colombia',      'es', 3.4516, -76.5320),
  ('Barranquilla', 'Atlántico',      'Colombia',      'es', 10.9685, -74.7813),
  -- Chile (es)
  ('Santiago',     'Metropolitana',  'Chile',         'es', -33.4489, -70.6693),
  ('Valparaíso',   'Valparaíso',     'Chile',         'es', -33.0472, -71.6127),
  ('Concepción',   'Biobío',         'Chile',         'es', -36.8270, -73.0503),
  ('Antofagasta',  'Antofagasta',    'Chile',         'es', -23.6509, -70.3975),
  -- Peru (es)
  ('Lima',         'Lima',           'Perú',          'es', -12.0464, -77.0428),
  ('Arequipa',     'Arequipa',       'Perú',          'es', -16.4090, -71.5375),
  ('Trujillo',     'La Libertad',    'Perú',          'es', -8.1116, -79.0288),
  ('Cusco',        'Cusco',          'Perú',          'es', -13.5320, -71.9675),
  -- UK (en)
  ('London',       'Greater London', 'United Kingdom', 'en', 51.5074, -0.1278),
  ('Manchester',   'Greater Manchester','United Kingdom','en', 53.4808, -2.2426),
  ('Birmingham',   'West Midlands',  'United Kingdom', 'en', 52.4862, -1.8904),
  ('Edinburgh',    'Scotland',       'United Kingdom', 'en', 55.9533, -3.1883),
  -- USA (en)
  ('New York',     'New York',       'United States',  'en', 40.7128, -74.0060),
  ('Los Angeles',  'California',     'United States',  'en', 34.0522, -118.2437),
  ('Chicago',      'Illinois',       'United States',  'en', 41.8781, -87.6298),
  ('Austin',       'Texas',          'United States',  'en', 30.2672, -97.7431),
  -- Canada (en)
  ('Toronto',      'Ontario',        'Canada',         'en', 43.6532, -79.3832),
  ('Vancouver',    'British Columbia','Canada',         'en', 49.2827, -123.1207),
  ('Montreal',     'Quebec',         'Canada',         'en', 45.5017, -73.5673),
  ('Calgary',      'Alberta',        'Canada',         'en', 51.0447, -114.0719),
  -- Australia (en)
  ('Sydney',       'New South Wales','Australia',      'en', -33.8688, 151.2093),
  ('Melbourne',    'Victoria',       'Australia',      'en', -37.8136, 144.9631),
  ('Brisbane',     'Queensland',     'Australia',      'en', -27.4698, 153.0251),
  ('Perth',        'Western Australia','Australia',    'en', -31.9505, 115.8605),
  -- Irlanda (en)
  ('Dublin',       'Leinster',       'Ireland',        'en', 53.3498, -6.2603),
  ('Cork',         'Munster',        'Ireland',        'en', 51.8969, -8.4863),
  ('Galway',       'Connacht',       'Ireland',        'en', 53.2707, -9.0568),
  ('Limerick',     'Munster',        'Ireland',        'en', 52.6638, -8.6267),
  -- Germania (en — nu avem de/limba, mapăm pe en)
  ('Berlin',       'Berlin',         'Deutschland',    'en', 52.5200, 13.4050),
  ('München',      'Bayern',         'Deutschland',    'en', 53.5511,  9.9937),
  ('Hamburg',      'Hamburg',        'Deutschland',    'en', 53.5511,  9.9937),
  ('Frankfurt',    'Hessen',         'Deutschland',    'en', 50.1109,  8.6821),
  -- Franța (en — nu avem fr, mapăm pe en)
  ('Paris',        'Île-de-France',  'France',         'en', 48.8566,  2.3522),
  ('Lyon',         'Auvergne-Rhône-Alpes','France',    'en', 45.7640,  4.8357),
  ('Marseille',    'Provence-Alpes-Côte d''Azur','France','en', 43.2965, 5.3698),
  ('Toulouse',     'Occitanie',      'France',         'en', 43.6047,  1.4442),
  -- Italia (en — nu avem it, mapăm pe en)
  ('Roma',         'Lazio',          'Italia',         'en', 41.9028, 12.4964),
  ('Milano',       'Lombardia',      'Italia',         'en', 45.4642,  9.1900),
  ('Napoli',       'Campania',       'Italia',         'en', 40.8518, 14.2681),
  ('Firenze',      'Toscana',        'Italia',         'en', 43.7696, 11.2558),
  -- Portugalia (es — cel mai apropiat de pt)
  ('Lisboa',       'Lisboa',         'Portugal',       'es', 38.7223, -9.1393),
  ('Porto',        'Porto',          'Portugal',       'es', 41.1579, -8.6291),
  ('Braga',        'Braga',          'Portugal',       'es', 41.5518, -8.4229),
  ('Coimbra',      'Coimbra',        'Portugal',       'es', 40.2033, -8.4103),
  -- Polonia (en — nu avem pl, mapăm pe en)
  ('Warszawa',     'Mazowieckie',    'Polska',         'en', 52.2297, 21.0122),
  ('Kraków',       'Małopolskie',    'Polska',         'en', 50.0647, 19.9450),
  ('Wrocław',      'Dolnośląskie',   'Polska',         'en', 51.1079, 17.0385),
  ('Gdańsk',       'Pomorskie',      'Polska',         'en', 54.3520, 18.6466),
  -- Grecia (en — nu avem el, mapăm pe en)
  ('Athens',       'Attica',         'Greece',         'en', 37.9838, 23.7275),
  ('Thessaloniki', 'Central Macedonia','Greece',       'en', 40.6401, 22.9444),
  ('Heraklion',    'Crete',          'Greece',         'en', 35.3387, 25.1442),
  ('Patras',       'Western Greece', 'Greece',         'en', 38.2466, 21.7346),
  -- Ungaria (en — nu avem hu, mapăm pe en)
  ('Budapest',     'Budapest',       'Magyarország',   'en', 47.4979, 19.0402),
  ('Debrecen',     'Hajdú-Bihar',    'Magyarország',   'en', 47.5316, 21.6273),
  ('Szeged',       'Csongrád-Csanád','Magyarország',   'en', 46.2530, 20.1414),
  ('Pécs',         'Baranya',        'Magyarország',   'en', 46.0727, 18.2323);

-- Prenume internaționale (50 feminine + 50 masculine = 100)
CREATE TEMP TABLE _firstnames (name TEXT) ON COMMIT DROP;
INSERT INTO _firstnames VALUES
  -- Românești
  ('Ana'), ('Maria'), ('Elena'), ('Ioana'), ('Andreea'),
  ('Andrei'), ('Mihai'), ('Alexandru'), ('Florin'), ('Vlad'),
  -- Spaniole / Latine
  ('Sofía'), ('Valentina'), ('Camila'), ('Lucía'), ('Isabella'),
  ('Mateo'), ('Santiago'), ('Sebastián'), ('Emiliano'), ('Nicolás'),
  -- Engleze
  ('Emma'), ('Olivia'), ('Charlotte'), ('Amelia'), ('Sophia'),
  ('Liam'), ('Noah'), ('James'), ('Oliver'), ('William'),
  -- Germane
  ('Hannah'), ('Leonie'), ('Lena'), ('Marie'), ('Johanna'),
  ('Maximilian'), ('Felix'), ('Lukas'), ('Jonas'), ('Elias'),
  -- Franceze
  ('Chloé'), ('Manon'), ('Léa'), ('Inès'), ('Camille'),
  ('Hugo'), ('Louis'), ('Lucas'), ('Raphaël'), ('Arthur'),
  -- Italiene
  ('Giulia'), ('Francesca'), ('Chiara'), ('Aurora'), ('Sara'),
  ('Marco'), ('Luca'), ('Alessandro'), ('Matteo'), ('Andrea'),
  -- Portugheze
  ('Beatriz'), ('Carolina'), ('Mariana'), ('Teresa'), ('Catarina'),
  ('Gonçalo'), ('Tiago'), ('Diogo'), ('Rafael'), ('Pedro'),
  -- Poloneze
  ('Zofia'), ('Maja'), ('Hanna'), ('Alicja'), ('Wiktoria'),
  ('Antoni'), ('Jakub'), ('Szymon'), ('Kacper'), ('Filip'),
  -- Maghiare
  ('Boglárka'), ('Nóra'), ('Réka'), ('Eszter'), ('Petra'),
  ('Bence'), ('Ádám'), ('Dániel'), ('Balázs'), ('Tamás'),
  -- Grecești
  ('Eleni'), ('Dimitra'), ('Katerina'), ('Niki'), ('Eirini'),
  ('Giorgos'), ('Dimitris'), ('Nikos'), ('Panagiotis'), ('Kostas');

-- Nume de familie internaționale (100 entries)
CREATE TEMP TABLE _lastnames (name TEXT) ON COMMIT DROP;
INSERT INTO _lastnames VALUES
  -- Românești
  ('Popescu'), ('Ionescu'), ('Popa'), ('Stan'), ('Dumitru'),
  ('Stoica'), ('Gheorghe'), ('Marin'), ('Tudor'), ('Rusu'),
  -- Spaniole / Latine
  ('García'), ('Rodríguez'), ('Martínez'), ('López'), ('González'),
  ('Hernández'), ('Pérez'), ('Sánchez'), ('Ramírez'), ('Torres'),
  -- Engleze
  ('Smith'), ('Johnson'), ('Williams'), ('Brown'), ('Jones'),
  ('Davis'), ('Miller'), ('Wilson'), ('Moore'), ('Taylor'),
  -- Germane
  ('Müller'), ('Schmidt'), ('Schneider'), ('Fischer'), ('Weber'),
  ('Meyer'), ('Wagner'), ('Becker'), ('Hoffmann'), ('Richter'),
  -- Franceze
  ('Martin'), ('Bernard'), ('Dubois'), ('Thomas'), ('Robert'),
  ('Petit'), ('Moreau'), ('Laurent'), ('Simon'), ('Michel'),
  -- Italiene
  ('Rossi'), ('Russo'), ('Ferrari'), ('Esposito'), ('Bianchi'),
  ('Romano'), ('Colombo'), ('Ricci'), ('Marino'), ('Greco'),
  -- Portugheze
  ('Silva'), ('Santos'), ('Ferreira'), ('Pereira'), ('Oliveira'),
  ('Costa'), ('Rodrigues'), ('Martins'), ('Sousa'), ('Fernandes'),
  -- Poloneze
  ('Nowak'), ('Kowalski'), ('Wiśniewski'), ('Wójcik'), ('Kamiński'),
  ('Lewandowski'), ('Zieliński'), ('Szymański'), ('Woźniak'), ('Dąbrowski'),
  -- Maghiare
  ('Nagy'), ('Kovács'), ('Tóth'), ('Szabó'), ('Horváth'),
  ('Varga'), ('Kiss'), ('Molnár'), ('Németh'), ('Farkas'),
  -- Grecești
  ('Papadopoulos'), ('Georgiou'), ('Nikolaou'), ('Dimitriou'), ('Panagiotopoulos'),
  ('Konstantinou'), ('Alexiou'), ('Vasileiou'), ('Ioannou'), ('Christodoulou');

-- Categorii de obiecte
CREATE TEMP TABLE _categories (name TEXT) ON COMMIT DROP;
INSERT INTO _categories VALUES
  ('Electronică'), ('Sport & Outdoor'), ('Hobby & Jocuri'),
  ('Cărți & Media'), ('Casă & Grădină'), ('Modă & Accesorii');

-- Titluri de obiecte (EN) — mai internaționale
CREATE TEMP TABLE _item_templates (
  category TEXT, title TEXT, description TEXT, tags TEXT[]
) ON COMMIT DROP;

INSERT INTO _item_templates VALUES
  ('Electronică', '24" IPS Monitor', 'Full HD IPS display, no dead pixels, great for office work.', ARRAY['monitor','office','tech']),
  ('Electronică', 'Mechanical Keyboard', 'Cherry MX switches, RGB backlighting, full-size layout.', ARRAY['keyboard','gaming','peripherals']),
  ('Electronică', 'Wireless Headphones', 'Bluetooth 5.0, 20h battery, active noise cancelling.', ARRAY['headphones','audio','wireless']),
  ('Electronică', 'Raspberry Pi 4 Kit', 'Complete kit with case, power supply and SD card.', ARRAY['raspberry','embedded','tech']),
  ('Electronică', 'Retro Gaming Console', 'Pre-loaded with 200+ classic games, HDMI output.', ARRAY['gaming','retro','console']),
  ('Electronică', 'HD Webcam', '1080p camera with built-in microphone, USB-C.', ARRAY['webcam','video','office']),
  ('Electronică', '500GB External SSD', 'USB-C, fast transfer speeds, pocket-sized.', ARRAY['storage','ssd','portable']),
  ('Electronică', 'Bluetooth Speaker', 'Waterproof, portable, clear 360° sound.', ARRAY['audio','bluetooth','portable']),
  ('Electronică', 'Smart Watch', 'Heart rate monitor, GPS, 5-day battery life.', ARRAY['smartwatch','wearable','tech']),
  ('Electronică', 'Tablet 10"', '64GB storage, stylus support, great for reading.', ARRAY['tablet','portable','tech']),
  ('Sport & Outdoor', 'Urban Hybrid Bike', 'Lightweight frame, 21 speeds, perfect for city commute.', ARRAY['bike','transport','urban']),
  ('Sport & Outdoor', 'Electric Scooter', '25km range, max speed 25km/h, foldable.', ARRAY['scooter','electric','transport']),
  ('Sport & Outdoor', '3-Person Camping Tent', 'Waterproof, quick setup, with vestibule.', ARRAY['camping','tent','outdoor']),
  ('Sport & Outdoor', 'Skateboard', 'Standard deck, new wheels, fresh grip tape.', ARRAY['skateboard','sport','urban']),
  ('Sport & Outdoor', 'Football', 'Size 5, synthetic leather, match quality.', ARRAY['football','sport','ball']),
  ('Sport & Outdoor', 'Tennis Racket', 'Graphite frame, new grip, case included.', ARRAY['tennis','racket','sport']),
  ('Sport & Outdoor', 'Yoga Mat Set', 'Extra thick mat + blocks + strap.', ARRAY['yoga','fitness','mat']),
  ('Sport & Outdoor', '40L Hiking Backpack', 'Ergonomic design, rain cover included.', ARRAY['backpack','hiking','outdoor']),
  ('Sport & Outdoor', 'Running Shoes (42)', 'Lightly used, great cushioning, trail-ready.', ARRAY['shoes','running','sport']),
  ('Sport & Outdoor', 'Surfboard 6ft', 'Epoxy board, good for intermediate surfers.', ARRAY['surf','board','water']),
  ('Hobby & Jocuri', 'Lego Technic Set', 'Partially assembled, manual included, 800+ pieces.', ARRAY['lego','technic','building']),
  ('Hobby & Jocuri', '1000-Piece Puzzle', 'Mountain landscape, all pieces complete.', ARRAY['puzzle','hobby','relaxation']),
  ('Hobby & Jocuri', 'Acrylic Paint Set', '24 colours + brushes + 2 canvases.', ARRAY['painting','art','acrylic']),
  ('Hobby & Jocuri', 'Acoustic Guitar', 'New strings, warm tone, great for beginners.', ARRAY['guitar','music','acoustic']),
  ('Hobby & Jocuri', 'Catan Board Game', 'Standard edition + 5-6 player extension.', ARRAY['boardgame','catan','strategy']),
  ('Hobby & Jocuri', 'Mini Drone', 'HD camera, 15 min flight time, beginner-friendly.', ARRAY['drone','tech','hobby']),
  ('Hobby & Jocuri', 'Chess Set (Wood)', 'Handcrafted wooden pieces, folding board.', ARRAY['chess','boardgame','wood']),
  ('Hobby & Jocuri', 'Amateur Telescope', '700mm focal length, tripod included.', ARRAY['telescope','astronomy','hobby']),
  ('Cărți & Media', 'Harry Potter Collection', 'All 7 volumes, English paperback edition.', ARRAY['books','harry-potter','collection']),
  ('Cărți & Media', 'Python Programming Course', 'Textbook + exercises, intermediate level.', ARRAY['programming','python','education']),
  ('Cărți & Media', 'Classic Vinyl Records', 'Set of 10 rock/jazz vinyls, great condition.', ARRAY['vinyl','music','collection']),
  ('Cărți & Media', 'Manga One Piece vol 1-20', 'English edition, perfect condition.', ARRAY['manga','one-piece','comics']),
  ('Cărți & Media', 'LOTR Extended DVD Box', 'Trilogy extended edition, all extras included.', ARRAY['dvd','film','collection']),
  ('Cărți & Media', 'Cookbook — Local Recipes', 'Traditional local recipes, illustrated.', ARRAY['book','cooking','traditional']),
  ('Casă & Grădină', 'Garden Tool Set', '5 pieces, stainless steel, wooden handles.', ARRAY['tools','garden','home']),
  ('Casă & Grădină', 'LED Desk Lamp', 'Adjustable, 3 colour temperatures, USB charging.', ARRAY['lamp','desk','led']),
  ('Casă & Grădină', 'Robot Vacuum', 'Working condition, refurbished battery.', ARRAY['vacuum','robot','home']),
  ('Casă & Grădină', 'Ceramic Plant Pots Set', '3 pots, different sizes, hand-painted.', ARRAY['pots','ceramic','decor']),
  ('Casă & Grădină', 'Double Hammock', 'Cotton, supports 200kg, with stand.', ARRAY['hammock','relaxation','garden']),
  ('Casă & Grădină', 'French Press Coffee', 'Borosilicate glass, 1L capacity.', ARRAY['coffee','french-press','kitchen']),
  ('Modă & Accesorii', 'Leather Backpack', 'Genuine leather, fits 15" laptop.', ARRAY['backpack','leather','accessories']),
  ('Modă & Accesorii', 'Polarized Sunglasses', 'Aviator style, UV400 protection.', ARRAY['sunglasses','fashion','accessories']),
  ('Modă & Accesorii', 'Analog Watch', 'Quartz movement, steel bracelet, minimalist.', ARRAY['watch','accessories','elegant']),
  ('Modă & Accesorii', 'Leather Biker Jacket', 'Size M, detachable lining, vintage look.', ARRAY['jacket','leather','fashion']),
  ('Modă & Accesorii', 'Handmade Tote Bag', 'Canvas, eco-friendly, spacious.', ARRAY['bag','handmade','eco']);

-- Wishlist-uri (EN)
CREATE TEMP TABLE _wishlists (text TEXT) ON COMMIT DROP;
INSERT INTO _wishlists VALUES
  ('Any working electronics'), ('Bicycle or electric scooter'), ('Board games or card games'),
  ('Sci-fi or fantasy books'), ('Camping gear'), ('Musical instrument'),
  ('Smart home gadgets'), ('Sports equipment'), ('Small office furniture'),
  ('Indoor plants'), ('Kitchen tools'), ('Handmade decorations'),
  ('Vintage clothing'), ('Any LEGO set'), ('Rock or jazz vinyl records'),
  ('Instant camera'), ('Quality headphones'), ('Monitor or keyboard'),
  ('Complex puzzles (1000+ pieces)'), ('Gardening tools'),
  ('Yoga or fitness gear'), ('Art supplies'), ('Travel accessories'),
  ('Photography equipment'), ('Retro gaming stuff');

-- Bio-uri internaționale (EN)
CREATE TEMP TABLE _bios (text TEXT) ON COMMIT DROP;
INSERT INTO _bios VALUES
  ('Tech enthusiast always looking for interesting swaps.'),
  ('I love books and music. Open to creative exchanges.'),
  ('Outdoor lover, looking for camping and sports gear.'),
  ('Board game collector, always searching for trade partners.'),
  ('Graphic designer, trading creative tools and tech.'),
  ('Amateur gardener who loves plants and handmade decor.'),
  ('Student looking for books and affordable electronics.'),
  ('Creative parent, swapping toys and children''s books.'),
  ('Amateur photographer, looking for photo gear and accessories.'),
  ('Passionate cook, trading kitchen tools and recipe books.'),
  ('Musician looking for instruments and audio equipment.'),
  ('Runner and fitness fan, swapping sports gear.'),
  ('Gamer — trading games and peripherals.'),
  ('Minimalist passing along things I no longer need.'),
  ('DIY enthusiast, looking for materials and tools.'),
  ('Urban cyclist, trading bike accessories and gear.'),
  ('Animal lover, swapping pet accessories and equipment.'),
  ('Traveler trading guides and travel gear.'),
  ('Bookworm with hundreds of books to offer.'),
  ('Craftsperson trading tools and work materials.'),
  ('Digital nomad, always moving — swap instead of buy!'),
  ('Sustainability advocate, reduce-reuse-swap is my motto.'),
  ('Coffee addict, happy to trade brewing equipment.'),
  ('Vinyl collector looking for rare records.'),
  ('Weekend hiker, gear in great condition to swap.');

-- Swap notes per limbă
CREATE TEMP TABLE _swap_notes (lang TEXT, note TEXT) ON COMMIT DROP;
INSERT INTO _swap_notes VALUES
  ('ro', 'Prefer întâlniri în zone publice. Curier doar pentru obiecte mici.'),
  ('ro', 'Trimit prin curier în toată România.'),
  ('ro', 'Flexibil, discutăm detaliile pe chat.'),
  ('en', 'I prefer meeting in public places. Courier for small items only.'),
  ('en', 'Happy to ship nationwide — buyer pays shipping.'),
  ('en', 'Flexible on logistics, let''s chat about it.'),
  ('es', 'Prefiero encuentros en zonas públicas. Envío solo artículos pequeños.'),
  ('es', 'Puedo enviar por correo a todo el país.'),
  ('es', 'Flexible, hablemos de los detalles.');

-- ============================================================
-- 2) Generare 1000 profiluri demo internaționale
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
  -- Limba: bazată pe țara respectivă + uneori bilingv
  CASE
    WHEN c.lang = 'ro' AND i % 4 = 0 THEN ARRAY['ro','en']::text[]
    WHEN c.lang = 'ro' THEN ARRAY['ro']::text[]
    WHEN c.lang = 'es' AND i % 4 = 0 THEN ARRAY['es','en']::text[]
    WHEN c.lang = 'es' AND i % 8 = 0 THEN ARRAY['es','en','ro']::text[]
    WHEN c.lang = 'es' THEN ARRAY['es']::text[]
    WHEN i % 5 = 0 THEN ARRAY['en','es']::text[]
    WHEN i % 7 = 0 THEN ARRAY['en','ro']::text[]
    ELSE ARRAY['en']::text[]
  END AS languages,
  jsonb_build_object(
    'country', c.country,
    'region', c.region,
    'city', c.city,
    'postalCode', lpad(((i * 7 + 100000) % 900000 + 100000)::text, 6, '0'),
    'coordinates', jsonb_build_object(
      'lat', c.lat + (random() - 0.5) * 0.1,
      'lng', c.lng + (random() - 0.5) * 0.1
    ),
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
    'notes', sn.note
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
  SELECT name FROM _firstnames
  OFFSET (i % (SELECT count(*) FROM _firstnames)) LIMIT 1
) fn
CROSS JOIN LATERAL (
  SELECT name FROM _lastnames
  OFFSET ((i * 7) % (SELECT count(*) FROM _lastnames)) LIMIT 1
) ln
CROSS JOIN LATERAL (
  SELECT city, region, country, lang, lat, lng FROM _cities
  OFFSET (i % (SELECT count(*) FROM _cities)) LIMIT 1
) c
CROSS JOIN LATERAL (
  SELECT text FROM _bios
  OFFSET (i % (SELECT count(*) FROM _bios)) LIMIT 1
) b
CROSS JOIN LATERAL (
  SELECT note FROM _swap_notes
  WHERE lang = c.lang
  OFFSET (i % 3) LIMIT 1
) sn
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3) Generare ~2-3 items per cont demo (~2500 obiecte)
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
--           20 țări: România, Moldova, Spania, Mexic, Argentina,
--              Colombia, Chile, Peru, UK, USA, Canada, Australia,
--              Irlanda, Germania, Franța, Italia, Portugalia,
--              Polonia, Grecia, Ungaria
--           80 orașe distincte
--           Limbi: ro, en, es (+ combinații bilingve)
-- ============================================================
-- Pentru a șterge toate datele demo:
--   DELETE FROM items WHERE is_demo = true;
--   DELETE FROM profiles WHERE id LIKE 'demo-%';
-- ============================================================
