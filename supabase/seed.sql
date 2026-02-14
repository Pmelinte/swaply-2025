-- ============================================================
-- Swaply Seed v2: 100 profile complete + ~250 obiecte cu toate câmpurile
-- Subcategorii corecte, poze Picsum, wishlist-uri RO, câmpuri semantice
-- Rulează cu: Supabase SQL Editor sau psql
-- Toate datele au is_demo = true
-- ============================================================

BEGIN;

-- Curăță datele demo vechi (dacă există)
-- Items first (has FK to profiles)
DELETE FROM items WHERE is_demo = true;
DELETE FROM profiles WHERE is_demo = true;

-- ============================================================
-- 1) Date auxiliare
-- ============================================================

CREATE TEMP TABLE _cities (
  idx INT, city TEXT, region TEXT, country TEXT, lang TEXT, lat NUMERIC, lng NUMERIC
) ON COMMIT DROP;

INSERT INTO _cities VALUES
  (1,  'București',      'Ilfov',              'România',        'ro', 44.4268, 26.1025),
  (2,  'Cluj-Napoca',    'Cluj',               'România',        'ro', 46.7712, 23.5897),
  (3,  'Timișoara',      'Timiș',              'România',        'ro', 45.7489, 21.2087),
  (4,  'Iași',           'Iași',               'România',        'ro', 47.1585, 27.6014),
  (5,  'Brașov',         'Brașov',             'România',        'ro', 45.6427, 25.5887),
  (6,  'Chișinău',       'Chișinău',           'Moldova',        'ro', 47.0105, 28.8638),
  (7,  'Bălți',          'Bălți',              'Moldova',        'ro', 47.7617, 27.9289),
  (8,  'Madrid',         'Comunidad de Madrid','España',         'es', 40.4168, -3.7038),
  (9,  'Barcelona',      'Cataluña',           'España',         'es', 41.3874,  2.1686),
  (10, 'London',         'Greater London',     'United Kingdom', 'en', 51.5074, -0.1278),
  (11, 'Manchester',     'Greater Manchester', 'United Kingdom', 'en', 53.4808, -2.2426),
  (12, 'New York',       'New York',           'United States',  'en', 40.7128, -74.0060),
  (13, 'Los Angeles',    'California',         'United States',  'en', 34.0522, -118.2437),
  (14, 'Berlin',         'Berlin',             'Deutschland',    'en', 52.5200, 13.4050),
  (15, 'Paris',          'Île-de-France',      'France',         'en', 48.8566,  2.3522),
  (16, 'Roma',           'Lazio',              'Italia',         'en', 41.9028, 12.4964),
  (17, 'Lisboa',         'Lisboa',             'Portugal',       'es', 38.7223, -9.1393),
  (18, 'Warszawa',       'Mazowieckie',        'Polska',         'en', 52.2297, 21.0122),
  (19, 'Budapest',       'Budapest',           'Magyarország',   'en', 47.4979, 19.0402),
  (20, 'Athens',         'Attica',             'Greece',         'en', 37.9838, 23.7275);

-- Prenume (50)
CREATE TEMP TABLE _firstnames (idx SERIAL, name TEXT) ON COMMIT DROP;
INSERT INTO _firstnames (name) VALUES
  ('Ana'),('Maria'),('Elena'),('Ioana'),('Andreea'),('Andrei'),('Mihai'),('Alexandru'),('Florin'),('Vlad'),
  ('Sofía'),('Valentina'),('Camila'),('Lucía'),('Isabella'),('Mateo'),('Santiago'),('Sebastián'),('Emiliano'),('Nicolás'),
  ('Emma'),('Olivia'),('Charlotte'),('Amelia'),('Sophia'),('Liam'),('Noah'),('James'),('Oliver'),('William'),
  ('Hannah'),('Leonie'),('Lena'),('Marie'),('Johanna'),('Felix'),('Lukas'),('Jonas'),('Elias'),('Maximilian'),
  ('Giulia'),('Francesca'),('Chiara'),('Aurora'),('Sara'),('Marco'),('Luca'),('Alessandro'),('Matteo'),('Pedro');

-- Nume de familie (50)
CREATE TEMP TABLE _lastnames (idx SERIAL, name TEXT) ON COMMIT DROP;
INSERT INTO _lastnames (name) VALUES
  ('Popescu'),('Ionescu'),('Popa'),('Stan'),('Dumitru'),('Stoica'),('Gheorghe'),('Marin'),('Tudor'),('Rusu'),
  ('García'),('Rodríguez'),('Martínez'),('López'),('González'),('Hernández'),('Pérez'),('Sánchez'),('Ramírez'),('Torres'),
  ('Smith'),('Johnson'),('Williams'),('Brown'),('Jones'),('Davis'),('Miller'),('Wilson'),('Moore'),('Taylor'),
  ('Müller'),('Schmidt'),('Schneider'),('Fischer'),('Weber'),('Rossi'),('Russo'),('Ferrari'),('Bianchi'),('Greco'),
  ('Silva'),('Santos'),('Ferreira'),('Nowak'),('Kowalski'),('Nagy'),('Kovács'),('Tóth'),('Szabó'),('Horváth');

-- Bio-uri (20, mixte RO/EN)
CREATE TEMP TABLE _bios (idx SERIAL, text TEXT) ON COMMIT DROP;
INSERT INTO _bios (text) VALUES
  ('Pasionat de tehnologie, mereu în căutare de schimburi interesante.'),
  ('Iubesc cărțile și muzica. Deschis la schimburi creative.'),
  ('Iubitor de natură, caut echipament de camping și sport.'),
  ('Colecționar de jocuri de societate, caut parteneri de schimb.'),
  ('Designer grafic, schimb unelte creative și gadgeturi.'),
  ('Grădinar amator, iubesc plantele și decorațiunile handmade.'),
  ('Student, caut cărți și electronică accesibilă.'),
  ('Părinte creativ, schimb jucării și cărți pentru copii.'),
  ('Fotograf amator, caut echipament foto și accesorii.'),
  ('Bucătar pasionat, schimb ustensile de bucătărie și cărți de rețete.'),
  ('Tech enthusiast always looking for interesting swaps.'),
  ('Book and music lover. Open to creative exchanges.'),
  ('Outdoor lover, looking for camping and sports gear.'),
  ('Board game collector, always searching for trade partners.'),
  ('Musician looking for instruments and audio equipment.'),
  ('Runner and fitness fan, swapping sports gear.'),
  ('Gamer — trading games and peripherals.'),
  ('Minimalist passing along things I no longer need.'),
  ('Sustainability advocate, reduce-reuse-swap is my motto.'),
  ('Digital nomad, always moving — swap instead of buy!');

-- Swap notes per limbă
CREATE TEMP TABLE _swap_notes (lang TEXT, note TEXT) ON COMMIT DROP;
INSERT INTO _swap_notes VALUES
  ('ro', 'Prefer întâlniri în zone publice. Curier doar pentru obiecte mici.'),
  ('ro', 'Trimit prin curier în toată România.'),
  ('ro', 'Flexibil, discutăm detaliile pe chat.'),
  ('en', 'I prefer meeting in public places. Courier for small items only.'),
  ('en', 'Happy to ship nationwide.'),
  ('en', 'Flexible on logistics, let''s chat about it.'),
  ('es', 'Prefiero encuentros en zonas públicas. Envío solo artículos pequeños.'),
  ('es', 'Puedo enviar por correo a todo el país.'),
  ('es', 'Flexible, hablemos de los detalles.');

-- ============================================================
-- Item templates cu SUBCATEGORII corecte + câmpuri semantice
-- ============================================================
CREATE TEMP TABLE _item_templates (
  idx SERIAL,
  category TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  wishlist_ro TEXT,
  intent TEXT,
  flexibility TEXT,
  perceived_value TEXT,
  accepts_bundle BOOLEAN,
  recipient_matters BOOLEAN,
  clarity TEXT,
  context TEXT,
  ai_note TEXT,
  photo_seed TEXT
) ON COMMIT DROP;

INSERT INTO _item_templates VALUES
  -- Electronică (10)
  (DEFAULT, 'Monitoare & TV',          'Monitor IPS 24"',               'Full HD IPS, fără pixeli morți, ideal pentru birou.',                    ARRAY['monitor','office','ips'],            'Tastatură mecanică sau mouse gaming',          'open',       'moderate', 'medium', true,  false, 'have_idea',     'permanent',  'Ideal pentru schimb cu periferice PC',         'monitor-ips'),
  (DEFAULT, 'Componente & Periferice', 'Tastatură Mecanică RGB',        'Switch-uri Cherry MX, retroiluminare RGB, layout full-size.',            ARRAY['keyboard','gaming','rgb'],            'Căști wireless sau SSD extern',                'open',       'moderate', 'medium', true,  false, 'have_idea',     'permanent',  'Potrivit pentru gameri și programatori',        'keyboard-rgb'),
  (DEFAULT, 'Audio & Căști',           'Căști Wireless ANC',            'Bluetooth 5.0, 20h baterie, noise cancelling activ.',                    ARRAY['headphones','wireless','anc'],        'Boxă Bluetooth sau ceas smart',                'committed',  'moderate', 'medium', false, false, 'know_exactly',  'permanent',  'Funcționează perfect, sunet excelent',          'headphones-anc'),
  (DEFAULT, 'Componente & Periferice', 'Raspberry Pi 4 Kit complet',    'Kit complet cu carcasă, alimentator și card SD 32GB.',                   ARRAY['raspberry','embedded','kit'],         'Arduino sau senzori IoT',                      'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Perfect pentru proiecte DIY sau educație',      'raspberry-pi'),
  (DEFAULT, 'Console & Gaming',        'Consolă Retro Gaming',          'Pre-încărcată cu 200+ jocuri clasice, ieșire HDMI.',                     ARRAY['gaming','retro','console'],           'Jocuri de societate sau puzzle-uri',           'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Nostalgie gaming în stare perfectă',            'retro-console'),
  (DEFAULT, 'Foto & Video',            'Webcam HD 1080p',               'Cameră 1080p cu microfon integrat, USB-C.',                              ARRAY['webcam','video','office'],            'Trepied foto sau lumină LED',                  'open',       'moderate', 'small',  true,  false, 'have_idea',     'permanent',  'Ideală pentru videoconferințe și streaming',    'webcam-hd'),
  (DEFAULT, 'Componente & Periferice', 'SSD Extern 500GB',              'USB-C, transfer rapid, dimensiune de buzunar.',                          ARRAY['ssd','storage','usb-c'],             'HDD extern sau memorie USB mare',              'committed',  'strict',   'medium', false, false, 'know_exactly',  'permanent',  'Capacitate mare, viteză excelentă',             'ssd-external'),
  (DEFAULT, 'Audio & Căști',           'Boxă Bluetooth Portabilă',      'Waterproof, portabilă, sunet clar 360°.',                                ARRAY['speaker','bluetooth','waterproof'],   'Căști over-ear sau adaptor audio',             'open',       'moderate', 'small',  true,  false, 'have_idea',     'permanent',  'Perfectă pentru outdoor și călătorii',           'bluetooth-speaker'),
  (DEFAULT, 'Wearables & Smart',       'Ceas Smart Fitness',            'Monitor cardiac, GPS, autonomie 5 zile.',                                ARRAY['smartwatch','fitness','gps'],         'Brățară fitness sau accesorii sport',          'open',       'moderate', 'medium', false, false, 'have_idea',     'permanent',  'Tracking complet pentru sport și sănătate',     'smartwatch-fitness'),
  (DEFAULT, 'Telefoane & Tablete',     'Tabletă 10" 64GB',             'Stocare 64GB, suport stylus, excelentă pentru citit.',                   ARRAY['tablet','stylus','reading'],          'E-reader sau laptop vechi funcțional',         'committed',  'moderate', 'large',  false, false, 'know_exactly',  'permanent',  'Ecran mare, ideală pentru multimedia',           'tablet-10'),

  -- Sport & Outdoor (10)
  (DEFAULT, 'Biciclete & Trotinete',   'Bicicletă Urbană Hybrid',       'Cadru ușor, 21 viteze, perfectă pentru oraș.',                          ARRAY['bike','urban','hybrid'],              'Trotinetă electrică sau echipament camping',   'open',       'moderate', 'large',  false, false, 'have_idea',     'permanent',  'Excelentă pentru navetă urbană',                'urban-bike'),
  (DEFAULT, 'Biciclete & Trotinete',   'Trotinetă Electrică',           'Autonomie 25km, viteză max 25km/h, pliabilă.',                          ARRAY['scooter','electric','foldable'],      'Bicicletă sau skateboard',                     'committed',  'moderate', 'large',  false, false, 'know_exactly',  'permanent',  'Transport urban eco-friendly',                  'electric-scooter'),
  (DEFAULT, 'Camping & Drumeții',      'Cort Camping 3 Persoane',       'Waterproof, montaj rapid, cu vestibul.',                                 ARRAY['tent','camping','waterproof'],        'Sac de dormit sau rucsac drumeție',            'open',       'moderate', 'medium', true,  false, 'have_idea',     'vacation',   'Testat pe munte, rezistent la ploaie',          'camping-tent'),
  (DEFAULT, 'Sporturi de echipă',      'Skateboard Complet',            'Deck standard, roți noi, grip tape proaspăt.',                           ARRAY['skateboard','sport','street'],        'Minge de fotbal sau echipament badminton',     'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Potrivit pentru începători și intermediari',    'skateboard'),
  (DEFAULT, 'Sporturi de echipă',      'Minge Fotbal Profesională',     'Mărimea 5, piele sintetică, calitate de meci.',                          ARRAY['football','ball','sport'],            'Rachetă tenis sau minge baschet',              'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Folosită doar indoor, stare excelentă',         'football'),
  (DEFAULT, 'Sporturi de echipă',      'Rachetă Tenis Grafit',          'Cadru grafit, grip nou, husă inclusă.',                                  ARRAY['tennis','racket','graphite'],         'Echipament badminton sau minge volei',         'open',       'moderate', 'medium', false, false, 'have_idea',     'permanent',  'Perfectă pentru jucători intermediari',          'tennis-racket'),
  (DEFAULT, 'Fitness & Sală',          'Set Yoga Complet',              'Saltea extra-groasă + blocuri + curea.',                                 ARRAY['yoga','mat','fitness'],               'Gantere sau bandă elastică',                   'open',       'moderate', 'small',  true,  false, 'have_idea',     'permanent',  'Kit complet pentru yoga acasă',                 'yoga-set'),
  (DEFAULT, 'Camping & Drumeții',      'Rucsac Drumeție 40L',           'Design ergonomic, husă de ploaie inclusă.',                              ARRAY['backpack','hiking','40L'],            'Cort mic sau sac de dormit',                   'open',       'moderate', 'medium', true,  false, 'have_idea',     'vacation',   'Confortabil pentru trasee lungi',                'hiking-backpack'),
  (DEFAULT, 'Alergare & Atletism',     'Pantofi Alergare Trail (42)',   'Puțin folosiți, amortizare excelentă, trail-ready.',                     ARRAY['shoes','running','trail'],            'Alt model de pantofi sport sau bandă fitness', 'open',       'strict',   'medium', false, false, 'have_idea',     'permanent',  'Mărimea 42, sub 50km alergați',                 'running-shoes'),
  (DEFAULT, 'Sporturi nautice',        'Placă Surf 6ft',               'Placă epoxy, bună pentru surfer intermediar.',                            ARRAY['surf','board','epoxy'],               'Echipament snorkeling sau kayak gonflabil',    'committed',  'moderate', 'large',  false, true,  'know_exactly',  'vacation',   'Performanță bună pe valuri medii',              'surfboard'),

  -- Hobby & Jocuri (8)
  (DEFAULT, 'Modelism & DIY',          'Set Lego Technic 800+ piese',   'Parțial asamblat, manual inclus, 800+ piese.',                          ARRAY['lego','technic','building'],          'Puzzle 1000+ piese sau alt set Lego',          'open',       'moderate', 'medium', true,  false, 'have_idea',     'permanent',  'Set complex, dezvoltă creativitatea',           'lego-technic'),
  (DEFAULT, 'Jocuri de societate',     'Puzzle 1000 Piese - Peisaj',    'Peisaj montan, toate piesele complete.',                                 ARRAY['puzzle','1000','landscape'],          'Alt puzzle sau joc de societate',              'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Relaxare și provocare în același timp',          'puzzle-mountain'),
  (DEFAULT, 'Artă & Pictură',          'Set Pictură Acrilice',          '24 culori + pensule + 2 pânze.',                                         ARRAY['painting','acrylic','art'],           'Set acuarele sau instrumente de desen',        'open',       'moderate', 'small',  true,  false, 'have_idea',     'permanent',  'Kit complet pentru pictori începători',          'acrylic-paint'),
  (DEFAULT, 'Instrumente muzicale',    'Chitară Acustică',              'Corzi noi, ton cald, excelentă pentru începători.',                      ARRAY['guitar','acoustic','music'],          'Ukulele sau set de tobe practice',             'committed',  'moderate', 'medium', false, true,  'know_exactly',  'permanent',  'Sunet plin, ideală pentru folk și pop',          'acoustic-guitar'),
  (DEFAULT, 'Jocuri de societate',     'Catan + Extensie 5-6 Jucători', 'Ediția standard + extensia pentru mai mulți jucători.',                  ARRAY['catan','boardgame','strategy'],       'Ticket to Ride sau Carcassonne',               'open',       'moderate', 'medium', true,  false, 'have_idea',     'permanent',  'Jocul perfect pentru seri între prieteni',      'catan-boardgame'),
  (DEFAULT, 'Modelism & DIY',          'Mini Dronă cu Cameră HD',       'Cameră HD, 15 min zbor, prietenoasă pentru începători.',                 ARRAY['drone','camera','mini'],              'Altă dronă sau accesorii foto',                'open',       'moderate', 'medium', false, false, 'have_idea',     'permanent',  'Ușor de controlat, imagini aeriene clare',      'mini-drone'),
  (DEFAULT, 'Jocuri de societate',     'Set Șah din Lemn',              'Piese sculptate manual, tablă pliabilă.',                                ARRAY['chess','wood','handmade'],            'Set table sau alt joc de strategie',           'committed',  'strict',   'medium', false, true,  'know_exactly',  'permanent',  'Piesă de colecție, lucrat artizanal',           'chess-wood'),
  (DEFAULT, 'Grădinărit & Plante',     'Telescop Amator 700mm',         'Distanță focală 700mm, trepied inclus.',                                 ARRAY['telescope','astronomy','tripod'],     'Binoclu sau microscop USB',                    'open',       'moderate', 'medium', false, false, 'have_idea',     'permanent',  'Observații lunare și planetare clare',           'telescope'),

  -- Cărți & Media (6)
  (DEFAULT, 'Ficțiune & Romane',       'Colecția Harry Potter',         'Toate 7 volumele, ediție paperback EN.',                                 ARRAY['books','harry-potter','collection'],  'Colecția LOTR sau Narnia',                     'committed',  'strict',   'medium', false, true,  'know_exactly',  'permanent',  'Colecție completă, stare foarte bună',          'harry-potter'),
  (DEFAULT, 'Manuale & Cursuri',       'Curs Python Programming',       'Manual + exerciții, nivel intermediar.',                                  ARRAY['python','programming','textbook'],    'Curs JavaScript sau cărți IT',                 'open',       'moderate', 'small',  true,  false, 'have_idea',     'permanent',  'Excelent pentru auto-învățare',                 'python-book'),
  (DEFAULT, 'Vinyl & Muzică fizică',   'Discuri Vinyl Clasice',         'Set de 10 vinyl-uri rock/jazz, stare excelentă.',                        ARRAY['vinyl','music','rock','jazz'],        'Alte vinyl-uri sau CD-uri rare',               'committed',  'strict',   'sentimental', false, true, 'know_exactly', 'permanent', 'Piese de colecție, presare originală',          'vinyl-records'),
  (DEFAULT, 'Benzi desenate & Manga',  'Manga One Piece vol 1-20',      'Ediție EN, stare perfectă.',                                             ARRAY['manga','one-piece','comics'],         'Alt manga sau benzi desenate',                 'open',       'moderate', 'medium', true,  false, 'have_idea',     'permanent',  'Serie clasică completă, primele 20 volume',    'manga-onepiece'),
  (DEFAULT, 'DVD & Blu-ray',           'LOTR Extended Edition Box',     'Trilogia extended, toate bonus-urile incluse.',                           ARRAY['dvd','lotr','collection'],            'Star Wars box sau Marvel collection',          'committed',  'strict',   'sentimental', false, true, 'know_exactly', 'permanent', 'Ediție de colecție, packaging original',        'lotr-dvd'),
  (DEFAULT, 'Non-ficțiune & Știință',  'Carte Rețete Tradiționale',     'Rețete tradiționale locale, ilustrată color.',                            ARRAY['cookbook','traditional','recipes'],    'Alte cărți de bucate sau ustensile',           'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Rețete autentice cu poze pas cu pas',           'cookbook'),

  -- Casă & Grădină (6)
  (DEFAULT, 'Unelte & Bricolaj',       'Set Unelte Grădină',            '5 piese, oțel inoxidabil, mânere din lemn.',                             ARRAY['tools','garden','steel'],             'Furtun de grădină sau ghivece ceramice',       'open',       'moderate', 'small',  true,  false, 'have_idea',     'permanent',  'Durabile, mânere ergonomice',                   'garden-tools'),
  (DEFAULT, 'Decor & Iluminat',        'Lampă LED de Birou',            'Reglabilă, 3 temperaturi de culoare, port USB.',                         ARRAY['lamp','led','desk','usb'],            'Organizator birou sau suport monitor',         'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Iluminare perfectă fără obosirea ochilor',      'desk-lamp'),
  (DEFAULT, 'Electrocasnice',          'Aspirator Robot',               'Funcțional, baterie recondiționată.',                                     ARRAY['vacuum','robot','smart'],             'Alt electrocasnic mic sau gadget smart home',  'open',       'moderate', 'medium', false, false, 'have_idea',     'permanent',  'Curăță eficient, programabil pe telefon',       'robot-vacuum'),
  (DEFAULT, 'Grădină & Exterior',      'Set Ghivece Ceramice',          '3 ghivece, dimensiuni diferite, pictate manual.',                         ARRAY['pots','ceramic','handmade'],          'Plante de interior sau semințe',               'open',       'broad',    'small',  true,  true,  'exploring',     'permanent',  'Decor unic, fiecare piesă e diferită',          'ceramic-pots'),
  (DEFAULT, 'Grădină & Exterior',      'Hamac Dublu cu Suport',         'Bumbac, suportă 200kg, cu suport metalic.',                               ARRAY['hammock','garden','relaxation'],      'Umbrelă de terasă sau grătar portabil',        'committed',  'moderate', 'medium', false, false, 'know_exactly',  'vacation',   'Relaxare totală în grădină sau terasă',         'hammock'),
  (DEFAULT, 'Bucătărie',               'Presă Cafea French Press',      'Sticlă borosilicată, capacitate 1L.',                                    ARRAY['coffee','french-press','glass'],      'Râșniță manuală sau ceainic',                  'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Cafea perfectă în 4 minute',                    'french-press'),

  -- Modă & Accesorii (6)
  (DEFAULT, 'Genți & Rucsacuri',       'Rucsac din Piele Naturală',     'Piele naturală, încape laptop 15".',                                      ARRAY['backpack','leather','laptop'],        'Geantă messenger sau portofel din piele',      'committed',  'strict',   'large',  false, true,  'know_exactly',  'permanent',  'Calitate premium, se maturizează frumos',       'leather-backpack'),
  (DEFAULT, 'Ochelari & Accesorii',    'Ochelari de Soare Polarizați',  'Stil aviator, protecție UV400.',                                          ARRAY['sunglasses','aviator','uv400'],      'Alte accesorii sau ceas casual',               'open',       'broad',    'small',  true,  false, 'exploring',     'permanent',  'Lentile de calitate, protecție completă',       'sunglasses'),
  (DEFAULT, 'Ceasuri & Bijuterii',     'Ceas Analog Minimalist',        'Mecanism quartz, brățară oțel, design minimalist.',                       ARRAY['watch','minimalist','steel'],         'Alt ceas sau bijuterie',                       'committed',  'strict',   'medium', false, true,  'know_exactly',  'permanent',  'Design elegant, potrivit oricărei ținute',      'analog-watch'),
  (DEFAULT, 'Îmbrăcăminte bărbați',    'Jachetă Piele Biker',           'Mărimea M, căptușeală detașabilă, look vintage.',                         ARRAY['jacket','leather','biker'],           'Geacă denim sau cizme din piele',              'committed',  'moderate', 'large',  false, true,  'know_exactly',  'permanent',  'Piele naturală, clasic atemporal',              'leather-jacket'),
  (DEFAULT, 'Genți & Rucsacuri',       'Geantă Tote Handmade',          'Canvas, eco-friendly, spațioasă.',                                        ARRAY['tote','handmade','canvas','eco'],     'Rucsac sau portofel artizanal',                'open',       'broad',    'small',  true,  true,  'exploring',     'permanent',  'Lucrat manual, material sustenabil',             'tote-bag'),
  (DEFAULT, 'Încălțăminte',            'Adidași Sneakers Nike Air',     'Mărimea 43, puțin purtați, foarte comozi.',                               ARRAY['sneakers','nike','shoes'],            'Alt model adidași sau ghete casual',           'open',       'strict',   'medium', false, false, 'have_idea',     'permanent',  'Originali, cutie inclusă',                      'nike-sneakers');

-- Wishlist-uri suplimentare în română (25)
CREATE TEMP TABLE _wishlists_ro (idx SERIAL, text TEXT) ON COMMIT DROP;
INSERT INTO _wishlists_ro (text) VALUES
  ('Orice electronică funcțională'),('Bicicletă sau trotinetă'),('Jocuri de societate sau cărți de joc'),
  ('Cărți SF sau fantasy'),('Echipament camping'),('Instrument muzical'),
  ('Gadgeturi smart home'),('Echipament sportiv'),('Mobilier mic de birou'),
  ('Plante de interior'),('Ustensile de bucătărie'),('Decorațiuni handmade'),
  ('Haine vintage'),('Orice set LEGO'),('Vinyl-uri rock sau jazz'),
  ('Cameră instant'),('Căști de calitate'),('Monitor sau tastatură'),
  ('Puzzle-uri complexe (1000+ piese)'),('Unelte de grădină'),
  ('Echipament yoga sau fitness'),('Rechizite de artă'),('Accesorii călătorie'),
  ('Echipament foto'),('Jocuri retro sau console vechi');

-- ============================================================
-- 2) Generare 100 profiluri cu TOATE câmpurile completate
-- ============================================================
INSERT INTO profiles (
  id, email, display_name, first_name, avatar_url, bio, badge,
  languages, location, visibility, notifications,
  swap_preferences, security, stats, is_demo, created_at, updated_at
)
SELECT
  'demo-' || lpad(i::text, 4, '0') AS id,
  'demo' || i || '@swaply.test' AS email,
  fn.name || ' ' || ln.name AS display_name,
  fn.name AS first_name,
  'https://i.pravatar.cc/150?u=demo-' || lpad(i::text, 4, '0') AS avatar_url,
  b.text AS bio,
  (ARRAY['free','free','premium','premium','platinum'])[1 + (i % 5)] AS badge,
  CASE
    WHEN c.lang = 'ro' AND i % 4 = 0 THEN ARRAY['ro','en']::text[]
    WHEN c.lang = 'ro' THEN ARRAY['ro']::text[]
    WHEN c.lang = 'es' AND i % 4 = 0 THEN ARRAY['es','en']::text[]
    WHEN c.lang = 'es' THEN ARRAY['es']::text[]
    WHEN i % 5 = 0 THEN ARRAY['en','ro']::text[]
    ELSE ARRAY['en']::text[]
  END AS languages,
  jsonb_build_object(
    'country', c.country,
    'region', c.region,
    'city', c.city,
    'postalCode', lpad(((i * 7 + 100000) % 900000 + 100000)::text, 6, '0'),
    'coordinates', jsonb_build_object(
      'lat', c.lat + (random() - 0.5) * 0.08,
      'lng', c.lng + (random() - 0.5) * 0.08
    ),
    'travelRadiusKm', (ARRAY[10,20,30,50,75,100])[1 + (i % 6)]
  ) AS location,
  jsonb_build_object(
    'publicProfile', true,
    'itemsVisibility', CASE WHEN i % 10 = 0 THEN 'match_only' ELSE 'public' END,
    'showExactLocation', i % 5 = 0,
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
    'twoFactorEnabled', i % 10 = 0,
    'method', CASE WHEN i % 10 = 0 THEN 'totp' ELSE null END,
    'passkeysEnabled', false
  ) AS security,
  jsonb_build_object(
    'tokens', 50 + (i * 17) % 450,
    'reputation', (ARRAY['starter','trusted','trusted','ambassador'])[1 + (i % 4)],
    'completedSwaps', (i * 3 + 1) % 50,
    'activeListings', 2 + (i % 3)
  ) AS stats,
  true AS is_demo,
  NOW() - ((i * 3) % 365 || ' days')::interval AS created_at,
  NOW() - ((i * 2) % 30 || ' days')::interval AS updated_at
FROM generate_series(1, 100) AS i
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
-- 3) Generare ~250 obiecte cu TOATE câmpurile (inclusiv semantice)
-- ============================================================
INSERT INTO items (
  id, owner_id, title, category, condition, description,
  wishlist, status, is_demo, is_active, created_at, updated_at,
  location, photos,
  ai_suggested_tags, user_final_tags,
  intent, flexibility, "perceivedValue",
  "acceptsBundle", "recipientMatters",
  clarity, context, "aiNote"
)
SELECT
  'demo-item-' || lpad(row_number() OVER ()::text, 5, '0') AS id,
  'demo-' || lpad(profile_i::text, 4, '0') AS owner_id,
  t.title AS title,
  t.category AS category,
  (ARRAY['new','good','good','used'])[1 + (item_j % 4)] AS condition,
  t.description AS description,
  COALESCE(t.wishlist_ro, w.text) AS wishlist,
  CASE
    WHEN item_j = 1 AND profile_i % 15 = 0 THEN 'reserved'
    WHEN item_j = 2 AND profile_i % 30 = 0 THEN 'swapped'
    ELSE 'active'
  END AS status,
  true AS is_demo,
  CASE
    WHEN item_j = 2 AND profile_i % 30 = 0 THEN false
    ELSE true
  END AS is_active,
  NOW() - ((profile_i + item_j * 50) % 365 || ' days')::interval AS created_at,
  NOW() - ((profile_i + item_j * 10) % 30 || ' days')::interval AS updated_at,
  c.city AS location,
  ARRAY[
    'https://picsum.photos/seed/' || t.photo_seed || '-' || profile_i || '/400/300'
  ] AS photos,
  t.tags AS ai_suggested_tags,
  t.tags[1:3] AS user_final_tags,
  t.intent AS intent,
  t.flexibility AS flexibility,
  t.perceived_value AS "perceivedValue",
  t.accepts_bundle AS "acceptsBundle",
  t.recipient_matters AS "recipientMatters",
  t.clarity AS clarity,
  t.context AS context,
  t.ai_note AS "aiNote"
FROM generate_series(1, 100) AS profile_i
CROSS JOIN generate_series(1, 3) AS item_j
CROSS JOIN LATERAL (
  SELECT title, category, description, tags, wishlist_ro,
         intent, flexibility, perceived_value, accepts_bundle,
         recipient_matters, clarity, context, ai_note, photo_seed
  FROM _item_templates
  OFFSET ((profile_i * 3 + item_j * 11) % (SELECT count(*) FROM _item_templates))
  LIMIT 1
) t
CROSS JOIN LATERAL (
  SELECT text FROM _wishlists_ro
  OFFSET ((profile_i + item_j * 7) % (SELECT count(*) FROM _wishlists_ro))
  LIMIT 1
) w
CROSS JOIN LATERAL (
  SELECT city FROM _cities
  OFFSET (profile_i % (SELECT count(*) FROM _cities))
  LIMIT 1
) c
WHERE item_j <= 2 + (profile_i % 2)  -- 2 sau 3 items per profil
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================
-- Rezultat: 100 profile demo (demo-0001 .. demo-0100)
--           ~250 obiecte demo cu:
--             ✓ Subcategorii corecte (ex: "Telefoane & Tablete")
--             ✓ Poze Picsum unice per obiect
--             ✓ Avatare Pravatar unice per profil
--             ✓ Wishlist-uri în română
--             ✓ Câmpuri semantice: intent, flexibility, perceivedValue,
--               acceptsBundle, recipientMatters, clarity, context, aiNote
--             ✓ Profile complete: first_name, avatar, bio, badge,
--               languages, location (cu coordonate GPS), visibility,
--               notifications, swap_preferences, security, stats
--           20 orașe din 10 țări, limbi: ro/en/es
-- ============================================================
-- CONTURI DE TEST (creează manual în Supabase Auth → Users → Add user):
--   test1@swaply.test / TestSwap2025!
--   test2@swaply.test / TestSwap2025!
-- După crearea userilor, profilele se creează automat la primul login.
-- ============================================================
-- Pentru a șterge datele demo:
--   DELETE FROM items WHERE is_demo = true;
--   DELETE FROM profiles WHERE id LIKE 'demo-%';
-- ============================================================
