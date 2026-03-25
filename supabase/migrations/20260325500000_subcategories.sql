-- Hierarchical subcategories for all content types
-- 114 subcategories across 16 categories including vehicles and experiences

CREATE TABLE IF NOT EXISTS subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name_ro TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0,
  requires_disclaimer BOOLEAN DEFAULT false,
  disclaimer_key TEXT,
  extra_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_slug);

ALTER TABLE items ADD COLUMN IF NOT EXISTS subcategory_slug TEXT;

ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read subcategories" ON subcategories FOR SELECT USING (true);

-- ELECTRONICS (9)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('electronics','phones-tablets','Telefoane & Tablete','Phones & Tablets','📱',1),
('electronics','laptops-pc','Laptopuri & PC','Laptops & PC','💻',2),
('electronics','audio-headphones','Audio & Căști','Audio & Headphones','🎧',3),
('electronics','tv-video','TV & Video','TV & Video','📺',4),
('electronics','consoles-games','Console & Jocuri','Consoles & Games','🎮',5),
('electronics','cameras','Camere foto & Video','Cameras & Video','📷',6),
('electronics','accessories-cables','Accesorii & Cabluri','Accessories & Cables','🔌',7),
('electronics','smart-home','Smart Home','Smart Home','🏠',8),
('electronics','other-electronics','Alte electronice','Other Electronics','⚡',9);

-- SPORT (8)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('sport','fitness-gym','Fitness & Gym','Fitness & Gym','💪',1),
('sport','cycling','Ciclism','Cycling','🚴',2),
('sport','water-sports','Sporturi nautice','Water Sports','🏊',3),
('sport','winter-sports','Sporturi de iarnă','Winter Sports','⛷️',4),
('sport','team-sports','Sporturi de echipă','Team Sports','⚽',5),
('sport','martial-arts','Arte marțiale','Martial Arts','🥋',6),
('sport','outdoor-camping','Outdoor & Camping','Outdoor & Camping','🏕️',7),
('sport','other-sports','Alte sporturi','Other Sports','🏆',8);

-- FASHION (7)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('fashion','mens-clothing','Haine bărbați','Men Clothing','👔',1),
('fashion','womens-clothing','Haine femei','Women Clothing','👗',2),
('fashion','kids-clothing','Haine copii','Kids Clothing','👕',3),
('fashion','shoes','Încălțăminte','Shoes','👟',4),
('fashion','bags-accessories','Genți & Accesorii','Bags & Accessories','👜',5),
('fashion','jewelry-watches','Bijuterii & Ceasuri','Jewelry & Watches','💍',6),
('fashion','other-fashion','Alte modă','Other Fashion','🧥',7);

-- BOOKS (7)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('books','fiction','Ficțiune','Fiction','📚',1),
('books','non-fiction','Non-ficțiune','Non-Fiction','📖',2),
('books','textbooks','Manuale','Textbooks','🎓',3),
('books','comics-manga','Benzi desenate & Manga','Comics & Manga','🦸',4),
('books','music-vinyl','Muzică & Vinyl','Music & Vinyl','🎵',5),
('books','movies-dvd','Filme & DVD','Movies & DVD','🎬',6),
('books','other-media','Alte media','Other Media','📀',7);

-- HOME (7)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('home','furniture','Mobilă','Furniture','🛋️',1),
('home','kitchen','Bucătărie','Kitchen','🍳',2),
('home','decor','Decorațiuni','Decor','🖼️',3),
('home','garden-tools','Unelte grădină','Garden Tools','🌱',4),
('home','lighting','Iluminat','Lighting','💡',5),
('home','bedding','Lenjerie & Pat','Bedding','🛏️',6),
('home','other-home','Alte casă','Other Home','🏡',7);

-- AUTO (7)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('auto','engine-parts','Piese motor','Engine Parts','⚙️',1),
('auto','body-parts','Caroserie','Body Parts','🚗',2),
('auto','interior','Interior','Interior','🪑',3),
('auto','tires-wheels','Anvelope & Jante','Tires & Wheels','🔄',4),
('auto','car-accessories','Accesorii auto','Car Accessories','🔧',5),
('auto','tools-workshop','Unelte & Atelier','Tools & Workshop','🔨',6),
('auto','other-auto','Alte auto','Other Auto','🚘',7);

-- MUSIC (7)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('music','guitars','Chitare','Guitars','🎸',1),
('music','keyboards','Tastaturi & Pian','Keyboards & Piano','🎹',2),
('music','drums-percussion','Tobe & Percuție','Drums & Percussion','🥁',3),
('music','wind-instruments','Instrumente de suflat','Wind Instruments','🎷',4),
('music','dj-equipment','Echipamente DJ','DJ Equipment','🎧',5),
('music','recording','Înregistrare & Studio','Recording & Studio','🎙️',6),
('music','other-music','Alte muzică','Other Music','🎵',7);

-- TOYS (7)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('toys','baby-0-3','Bebeluș 0-3 ani','Baby 0-3 years','👶',1),
('toys','kids-3-12','Copii 3-12 ani','Kids 3-12 years','🧸',2),
('toys','lego-construction','LEGO & Construcții','LEGO & Construction','🧱',3),
('toys','board-games','Jocuri de societate','Board Games','🎲',4),
('toys','outdoor-toys','Jucării outdoor','Outdoor Toys','🛴',5),
('toys','educational','Educaționale','Educational','📐',6),
('toys','other-toys','Alte jucării','Other Toys','🎠',7);

-- ART (6)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('art','painting-drawing','Pictură & Desen','Painting & Drawing','🎨',1),
('art','photography','Fotografie','Photography','📸',2),
('art','crafts-diy','Crafts & DIY','Crafts & DIY','✂️',3),
('art','collecting','Colecționat','Collecting','🏺',4),
('art','sewing-knitting','Croitorie & Tricotat','Sewing & Knitting','🧵',5),
('art','other-art','Alte artă','Other Art','🖌️',6);

-- GARDEN (4)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('garden','plants-seeds','Plante & Semințe','Plants & Seeds','🌿',1),
('garden','garden-furniture','Mobilă grădină','Garden Furniture','🪑',2),
('garden','pots-planters','Ghivece & Jardiniere','Pots & Planters','🪴',3),
('garden','other-garden','Alte grădină','Other Garden','🌸',4);

-- TOOLS (5)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('tools','power-tools','Unelte electrice','Power Tools','🔌',1),
('tools','hand-tools','Unelte manuale','Hand Tools','🔧',2),
('tools','measuring','Măsurare & Nivel','Measuring & Level','📏',3),
('tools','construction','Construcții','Construction','🏗️',4),
('tools','other-tools','Alte unelte','Other Tools','⚒️',5);

-- MEDICAL (6, with disclaimer)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order, requires_disclaimer, disclaimer_key) VALUES
('medical','diagnostic-equipment','Echipamente diagnostic','Diagnostic Equipment','🩺',1,true,'medical_disclaimer'),
('medical','mobility-aids','Dispozitive mobilitate','Mobility Aids','♿',2,true,'medical_disclaimer'),
('medical','rehabilitation','Recuperare & Fizioterapie','Rehabilitation','🏋️',3,true,'medical_disclaimer'),
('medical','optical','Optică medicală','Medical Optical','👓',4,true,'medical_disclaimer'),
('medical','dental','Stomatologie','Dental','🦷',5,true,'medical_disclaimer'),
('medical','home-care','Îngrijire la domiciliu','Home Care','💊',6,true,'medical_disclaimer');

-- VEHICLES (7, with extra_fields for cars)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order, extra_fields) VALUES
('vehicles','cars','Autoturisme','Cars','🚗',1,'{"make":"text","model":"text","year":"number","mileage":"number","transmission":["manual","automatic","semi-auto"],"fuel":["petrol","diesel","electric","hybrid"],"in_person_only":true}'),
('vehicles','motorcycles','Motociclete & Scutere','Motorcycles & Scooters','🏍️',2,'{}'),
('vehicles','boats','Bărci & Watercraft','Boats & Watercraft','⛵',3,'{}'),
('vehicles','rvs-camping','Rulote & Camping','RVs & Camping','🚐',4,'{}'),
('vehicles','agricultural','Utilaje agricole','Agricultural Machinery','🚜',5,'{}'),
('vehicles','bicycles','Biciclete','Bicycles','🚲',6,'{}'),
('vehicles','other-vehicles','Alte vehicule','Other Vehicles','🚛',7,'{}');

-- EXPERIENCES (8, with extra_fields for flights/accommodation)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order, extra_fields) VALUES
('experiences','flights','Bilete avion','Flight Tickets','✈️',1,'{"from":"text","to":"text","date":"date","airline":"text","transferable":"boolean"}'),
('experiences','accommodation','Hotel & Cazare','Hotel & Accommodation','🏨',2,'{"location":"text","checkin":"date","checkout":"date","platform":"text"}'),
('experiences','events-concerts','Evenimente & Concerte','Events & Concerts','🎪',3,'{}'),
('experiences','sports-events','Evenimente sportive','Sports Events','🏟️',4,'{}'),
('experiences','tours-activities','Tururi & Activități','Tours & Activities','🗺️',5,'{}'),
('experiences','subscriptions','Abonamente & Membership','Subscriptions & Memberships','📋',6,'{}'),
('experiences','vouchers-giftcards','Vouchere & Gift Cards','Vouchers & Gift Cards','🎁',7,'{}'),
('experiences','other-experiences','Alte experiențe','Other Experiences','🌟',8,'{}');

-- SERVICES (11)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('services','it-tech','IT & Tehnologie','IT & Technology','💻',1),
('services','design-creative','Design & Creativ','Design & Creative','🎨',2),
('services','education-tutoring','Educație & Meditații','Education & Tutoring','📚',3),
('services','health-wellness','Sănătate & Wellness','Health & Wellness','💆',4),
('services','construction-repairs','Construcții & Reparații','Construction & Repairs','🔨',5),
('services','transport-delivery','Transport & Livrare','Transport & Delivery','🚚',6),
('services','legal-financial','Legal & Financiar','Legal & Financial','⚖️',7),
('services','cleaning','Curățenie','Cleaning','🧹',8),
('services','photography-video','Foto & Video','Photography & Video','📸',9),
('services','events-catering','Evenimente & Catering','Events & Catering','🎉',10),
('services','other-services','Alte servicii','Other Services','🛠️',11);

-- PROPERTIES (8)
INSERT INTO subcategories (category_slug, slug, name_ro, name_en, icon, sort_order) VALUES
('properties','apartments','Apartamente','Apartments','🏢',1),
('properties','houses','Case','Houses','🏠',2),
('properties','rooms','Camere','Rooms','🛏️',3),
('properties','land','Terenuri','Land','🌍',4),
('properties','commercial','Spații comerciale','Commercial Spaces','🏪',5),
('properties','garages','Garaje & Depozite','Garages & Storage','🏭',6),
('properties','vacation','Vacanță & Short-term','Vacation & Short-term','🏖️',7),
('properties','other-properties','Alte proprietăți','Other Properties','🏗️',8);
