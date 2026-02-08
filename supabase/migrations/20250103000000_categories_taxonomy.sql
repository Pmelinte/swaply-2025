-- ============================================================
-- Extended categories: tree structure with subcategories,
-- keywords for match engine, and icon hints.
-- Based on curated Google Product Taxonomy (barter-relevant).
-- ============================================================

-- Add new columns to existing categories table
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Index for fast subcategory lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- ============================================================
-- Seed: 6 top-level + ~50 subcategories (Romanian, curated)
-- Using UPSERT so it's safe to re-run
-- ============================================================

-- Top-level categories (level 0)
INSERT INTO public.categories (id, name, parent_id, level, keywords, icon, sort_order) VALUES
  ('cat-electronica',   'Electronică',       NULL, 0, ARRAY['electronica','electronic','tech','gadget','digital'], 'monitor', 10),
  ('cat-sport',         'Sport & Outdoor',    NULL, 0, ARRAY['sport','outdoor','fitness','activ'], 'bike', 20),
  ('cat-hobby',         'Hobby & Jocuri',     NULL, 0, ARRAY['hobby','jocuri','joc','divertisment','creativ'], 'gamepad', 30),
  ('cat-carti',         'Cărți & Media',      NULL, 0, ARRAY['carti','carte','media','muzica','film'], 'book', 40),
  ('cat-casa',          'Casă & Grădină',     NULL, 0, ARRAY['casa','home','gradina','garden','mobilier'], 'home', 50),
  ('cat-moda',          'Modă & Accesorii',   NULL, 0, ARRAY['moda','fashion','accesorii','imbracaminte'], 'shirt', 60)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  level = EXCLUDED.level,
  keywords = EXCLUDED.keywords,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- Electronică subcategories
INSERT INTO public.categories (id, name, parent_id, level, keywords, icon, sort_order) VALUES
  ('cat-e-telefoane',    'Telefoane & Tablete',     'cat-electronica', 1, ARRAY['telefon','phone','tablet','smartphone','iphone','samsung','huawei'], 'smartphone', 11),
  ('cat-e-laptopuri',    'Laptopuri & PC',          'cat-electronica', 1, ARRAY['laptop','pc','calculator','computer','macbook','desktop'], 'laptop', 12),
  ('cat-e-monitoare',    'Monitoare & TV',          'cat-electronica', 1, ARRAY['monitor','tv','televizor','ecran','display'], 'monitor', 13),
  ('cat-e-audio',        'Audio & Căști',           'cat-electronica', 1, ARRAY['casti','headphones','boxe','speakers','audio','earbuds'], 'headphones', 14),
  ('cat-e-console',      'Console & Gaming',        'cat-electronica', 1, ARRAY['console','gaming','playstation','xbox','nintendo','switch'], 'gamepad', 15),
  ('cat-e-foto',         'Foto & Video',            'cat-electronica', 1, ARRAY['camera','foto','video','dslr','gopro','obiectiv','lens'], 'camera', 16),
  ('cat-e-componente',   'Componente & Periferice', 'cat-electronica', 1, ARRAY['ssd','hdd','ram','tastatura','keyboard','mouse','placa','gpu'], 'cpu', 17),
  ('cat-e-wearables',    'Wearables & Smart',       'cat-electronica', 1, ARRAY['smartwatch','ceas','smart','wearable','fitness','tracker'], 'watch', 18)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level, keywords = EXCLUDED.keywords, sort_order = EXCLUDED.sort_order;

-- Sport & Outdoor subcategories
INSERT INTO public.categories (id, name, parent_id, level, keywords, icon, sort_order) VALUES
  ('cat-s-biciclete',    'Biciclete & Trotinete',  'cat-sport', 1, ARRAY['bicicleta','bike','trotineta','scooter','ciclism'], 'bike', 21),
  ('cat-s-camping',      'Camping & Drumeții',     'cat-sport', 1, ARRAY['camping','cort','tent','hiking','drumetie','rucsac','sac'], 'tent', 22),
  ('cat-s-fitness',      'Fitness & Sală',         'cat-sport', 1, ARRAY['fitness','sala','gym','greutati','gantere','yoga','benzi'], 'dumbbell', 23),
  ('cat-s-sporturi',     'Sporturi de echipă',     'cat-sport', 1, ARRAY['fotbal','baschet','tenis','volei','badminton','racheta','minge'], 'ball', 24),
  ('cat-s-iarna',        'Sporturi de iarnă',      'cat-sport', 1, ARRAY['schi','ski','snowboard','patine','iarna','winter'], 'snowflake', 25),
  ('cat-s-apa',          'Sporturi nautice',       'cat-sport', 1, ARRAY['inot','kayak','surf','snorkel','scuba','nautic','barca'], 'anchor', 26),
  ('cat-s-running',      'Alergare & Atletism',    'cat-sport', 1, ARRAY['running','alergare','pantofi','shoes','atletism','maraton'], 'footprints', 27)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level, keywords = EXCLUDED.keywords, sort_order = EXCLUDED.sort_order;

-- Hobby & Jocuri subcategories
INSERT INTO public.categories (id, name, parent_id, level, keywords, icon, sort_order) VALUES
  ('cat-h-boardgames',  'Jocuri de societate',    'cat-hobby', 1, ARRAY['boardgame','board game','puzzle','sah','chess','table','joc'], 'dice', 31),
  ('cat-h-muzica',      'Instrumente muzicale',   'cat-hobby', 1, ARRAY['chitara','guitar','pian','piano','vioara','tobe','drums','muzica'], 'music', 32),
  ('cat-h-arta',        'Artă & Pictură',         'cat-hobby', 1, ARRAY['pictura','painting','arta','art','desen','canvas','acuarela'], 'palette', 33),
  ('cat-h-colectie',    'Colecții & Rarități',    'cat-hobby', 1, ARRAY['colectie','collection','filatelic','monede','coins','stamps','rar'], 'gem', 34),
  ('cat-h-modele',      'Modelism & DIY',         'cat-hobby', 1, ARRAY['lego','model','drone','rc','telecomanda','machetă','puzzle3d'], 'wrench', 35),
  ('cat-h-foto',        'Fotografie & Video',     'cat-hobby', 1, ARRAY['fotografie','photography','video','editing','trepied','tripod'], 'camera', 36),
  ('cat-h-gradinarit',  'Grădinărit & Plante',    'cat-hobby', 1, ARRAY['plante','gradinarit','gardening','seminte','seeds','ghiveci','bonsai'], 'sprout', 37)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level, keywords = EXCLUDED.keywords, sort_order = EXCLUDED.sort_order;

-- Cărți & Media subcategories
INSERT INTO public.categories (id, name, parent_id, level, keywords, icon, sort_order) VALUES
  ('cat-c-ficiune',     'Ficțiune & Romane',      'cat-carti', 1, ARRAY['roman','ficiune','fiction','novel','povesti','literatura'], 'book-open', 41),
  ('cat-c-nonfic',      'Non-ficțiune & Știință', 'cat-carti', 1, ARRAY['nonfictiune','stiinta','science','istorie','history','biografie'], 'graduation-cap', 42),
  ('cat-c-comics',      'Benzi desenate & Manga', 'cat-carti', 1, ARRAY['comics','manga','bd','benzi','graphic','novel'], 'comic', 43),
  ('cat-c-vinyl',       'Vinyl & Muzică fizică',  'cat-carti', 1, ARRAY['vinyl','cd','disc','muzica','album','caseta','cassette'], 'disc', 44),
  ('cat-c-film',        'DVD & Blu-ray',          'cat-carti', 1, ARRAY['dvd','bluray','film','movie','serie','colectie'], 'film', 45),
  ('cat-c-manuale',     'Manuale & Cursuri',      'cat-carti', 1, ARRAY['manual','curs','textbook','scoala','universitate','studiu'], 'notebook', 46),
  ('cat-c-copii',       'Cărți pentru copii',     'cat-carti', 1, ARRAY['copii','children','kids','povesti','colorat','educativ'], 'baby', 47)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level, keywords = EXCLUDED.keywords, sort_order = EXCLUDED.sort_order;

-- Casă & Grădină subcategories
INSERT INTO public.categories (id, name, parent_id, level, keywords, icon, sort_order) VALUES
  ('cat-g-mobilier',    'Mobilier',               'cat-casa', 1, ARRAY['mobilier','scaun','masa','birou','dulap','canapea','pat'], 'armchair', 51),
  ('cat-g-bucatarie',   'Bucătărie',              'cat-casa', 1, ARRAY['bucatarie','kitchen','oala','tigaie','blender','mixer','cafetiera'], 'utensils', 52),
  ('cat-g-unelte',      'Unelte & Bricolaj',      'cat-casa', 1, ARRAY['unelte','tools','bormasina','ciocan','surubelnita','bricolaj'], 'hammer', 53),
  ('cat-g-decor',       'Decor & Iluminat',       'cat-casa', 1, ARRAY['decor','lampa','lamp','lustra','perdea','tablou','vaza'], 'lamp', 54),
  ('cat-g-electro',     'Electrocasnice',         'cat-casa', 1, ARRAY['aspirator','vacuum','masina','spalat','frigider','cuptor','microunde'], 'plug', 55),
  ('cat-g-gradina',     'Grădină & Exterior',     'cat-casa', 1, ARRAY['gradina','garden','gazon','furtun','gratar','umbrela','terasă'], 'tree', 56),
  ('cat-g-baie',        'Baie & Sanitare',        'cat-casa', 1, ARRAY['baie','bathroom','dus','robinet','prosop','raft','oglinda'], 'droplet', 57)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level, keywords = EXCLUDED.keywords, sort_order = EXCLUDED.sort_order;

-- Modă & Accesorii subcategories
INSERT INTO public.categories (id, name, parent_id, level, keywords, icon, sort_order) VALUES
  ('cat-m-barbati',     'Îmbrăcăminte bărbați',   'cat-moda', 1, ARRAY['barbati','men','camasa','pantaloni','costum','jeans','tricou'], 'shirt', 61),
  ('cat-m-femei',       'Îmbrăcăminte femei',     'cat-moda', 1, ARRAY['femei','women','rochie','fusta','bluza','dress','top'], 'shirt', 62),
  ('cat-m-copii',       'Îmbrăcăminte copii',     'cat-moda', 1, ARRAY['copii','kids','children','body','salopeta','caciula'], 'baby', 63),
  ('cat-m-incaltaminte','Încălțăminte',            'cat-moda', 1, ARRAY['pantofi','shoes','ghete','boots','adidasi','sneakers','sandale'], 'footprints', 64),
  ('cat-m-genti',       'Genți & Rucsacuri',      'cat-moda', 1, ARRAY['geanta','bag','rucsac','backpack','poseta','troler','valiză'], 'briefcase', 65),
  ('cat-m-ceasuri',     'Ceasuri & Bijuterii',    'cat-moda', 1, ARRAY['ceas','watch','bijuterii','jewelry','inel','bratara','lantisor'], 'watch', 66),
  ('cat-m-ochelari',    'Ochelari & Accesorii',   'cat-moda', 1, ARRAY['ochelari','sunglasses','glasses','esarfa','palarie','curea','belt'], 'glasses', 67)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, level = EXCLUDED.level, keywords = EXCLUDED.keywords, sort_order = EXCLUDED.sort_order;

-- Clean up old seed entries that don't have the new structure
DELETE FROM public.categories
WHERE id LIKE 'cat-%'
  AND parent_id IS NULL
  AND level = 0
  AND keywords = '{}'
  AND id NOT IN (
    'cat-electronica','cat-sport','cat-hobby','cat-carti','cat-casa','cat-moda'
  );
