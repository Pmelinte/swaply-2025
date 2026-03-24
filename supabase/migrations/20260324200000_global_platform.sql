-- Migration: Global Platform (countries, cities, services_by_country)
-- Created: 2026-03-24

---------------------------------------------------------------------
-- 1. COUNTRIES
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS countries (
  code CHAR(2) PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_local TEXT,
  locale TEXT NOT NULL,
  currency_code CHAR(3),
  currency_symbol TEXT,
  phone_prefix TEXT,
  flag_emoji TEXT,
  is_active BOOLEAN DEFAULT true
);

INSERT INTO countries (code, name_en, name_local, locale, currency_code, currency_symbol, phone_prefix, flag_emoji) VALUES
('RO','Romania','România','ro','RON','lei','+40','🇷🇴'),
('DE','Germany','Deutschland','de','EUR','€','+49','🇩🇪'),
('FR','France','France','fr','EUR','€','+33','🇫🇷'),
('ES','Spain','España','es','EUR','€','+34','🇪🇸'),
('IT','Italy','Italia','it','EUR','€','+39','🇮🇹'),
('PT','Portugal','Portugal','pt','EUR','€','+351','🇵🇹'),
('NL','Netherlands','Nederland','nl','EUR','€','+31','🇳🇱'),
('PL','Poland','Polska','pl','PLN','zł','+48','🇵🇱'),
('HU','Hungary','Magyarország','hu','HUF','Ft','+36','🇭🇺'),
('CZ','Czech Republic','Česko','cs','CZK','Kč','+420','🇨🇿'),
('SK','Slovakia','Slovensko','sk','EUR','€','+421','🇸🇰'),
('HR','Croatia','Hrvatska','hr','EUR','€','+385','🇭🇷'),
('BG','Bulgaria','България','bg','BGN','лв','+359','🇧🇬'),
('GR','Greece','Ελλάδα','el','EUR','€','+30','🇬🇷'),
('UA','Ukraine','Україна','uk','UAH','₴','+380','🇺🇦'),
('RU','Russia','Россия','ru','RUB','₽','+7','🇷🇺'),
('TR','Turkey','Türkiye','tr','TRY','₺','+90','🇹🇷'),
('SA','Saudi Arabia','المملكة العربية السعودية','ar','SAR','ر.س','+966','🇸🇦'),
('CN','China','中国','zh','CNY','¥','+86','🇨🇳'),
('JP','Japan','日本','ja','JPY','¥','+81','🇯🇵'),
('KR','South Korea','대한민국','ko','KRW','₩','+82','🇰🇷'),
('IN','India','भारत','hi','INR','₹','+91','🇮🇳'),
('BD','Bangladesh','বাংলাদেশ','bn','BDT','৳','+880','🇧🇩'),
('ID','Indonesia','Indonesia','id','IDR','Rp','+62','🇮🇩'),
('MY','Malaysia','Malaysia','ms','MYR','RM','+60','🇲🇾'),
('TH','Thailand','ประเทศไทย','th','THB','฿','+66','🇹🇭'),
('VN','Vietnam','Việt Nam','vi','VND','₫','+84','🇻🇳'),
('KE','Kenya','Kenya','sw','KES','KSh','+254','🇰🇪'),
('FI','Finland','Suomi','fi','EUR','€','+358','🇫🇮'),
('SE','Sweden','Sverige','sv','SEK','kr','+46','🇸🇪'),
('DK','Denmark','Danmark','da','DKK','kr','+45','🇩🇰'),
('NO','Norway','Norge','no','NOK','kr','+47','🇳🇴'),
('EE','Estonia','Eesti','et','EUR','€','+372','🇪🇪'),
('LT','Lithuania','Lietuva','lt','EUR','€','+370','🇱🇹'),
('SI','Slovenia','Slovenija','sl','EUR','€','+386','🇸🇮'),
('MT','Malta','Malta','mt','EUR','€','+356','🇲🇹'),
('MN','Mongolia','Монгол','mn','MNT','₮','+976','🇲🇳'),
('US','United States','United States','en','USD','$','+1','🇺🇸'),
('GB','United Kingdom','United Kingdom','en','GBP','£','+44','🇬🇧'),
('LV','Latvia','Latvija','lv','EUR','€','+371','🇱🇻'),
('IE','Ireland','Éire','ga','EUR','€','+353','🇮🇪'),
('AT','Austria','Österreich','de','EUR','€','+43','🇦🇹'),
('BE','Belgium','België','nl','EUR','€','+32','🇧🇪'),
('RS','Serbia','Србија','sr','RSD','дин.','+381','🇷🇸'),
('PH','Philippines','Pilipinas','fil','PHP','₱','+63','🇵🇭'),
('IR','Iran','ایران','fa','IRR','﷼','+98','🇮🇷');

---------------------------------------------------------------------
-- 2. CITIES
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code CHAR(2) REFERENCES countries(code),
  name_local TEXT NOT NULL,
  name_en TEXT,
  slug TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(country_code, slug)
);

INSERT INTO cities (country_code, name_local, name_en, slug, is_featured) VALUES
-- Romania
('RO','București','Bucharest','bucuresti',true),
('RO','Cluj-Napoca','Cluj-Napoca','cluj-napoca',true),
('RO','Timișoara','Timisoara','timisoara',true),
('RO','Iași','Iasi','iasi',true),
('RO','Constanța','Constanta','constanta',true),
-- Germany
('DE','Berlin','Berlin','berlin',true),
('DE','München','Munich','munchen',true),
('DE','Hamburg','Hamburg','hamburg',true),
('DE','Köln','Cologne','koln',true),
('DE','Frankfurt','Frankfurt','frankfurt',true),
-- France
('FR','Paris','Paris','paris',true),
('FR','Lyon','Lyon','lyon',true),
('FR','Marseille','Marseille','marseille',true),
('FR','Toulouse','Toulouse','toulouse',true),
('FR','Nice','Nice','nice',true),
-- Italy
('IT','Roma','Rome','roma',true),
('IT','Milano','Milan','milano',true),
('IT','Napoli','Naples','napoli',true),
('IT','Torino','Turin','torino',true),
('IT','Palermo','Palermo','palermo',true),
-- Spain
('ES','Madrid','Madrid','madrid',true),
('ES','Barcelona','Barcelona','barcelona',true),
('ES','Valencia','Valencia','valencia',true),
('ES','Sevilla','Seville','sevilla',true),
('ES','Bilbao','Bilbao','bilbao',true),
-- Netherlands
('NL','Amsterdam','Amsterdam','amsterdam',true),
('NL','Rotterdam','Rotterdam','rotterdam',true),
('NL','Den Haag','The Hague','den-haag',true),
('NL','Utrecht','Utrecht','utrecht',true),
('NL','Eindhoven','Eindhoven','eindhoven',true),
-- Poland
('PL','Warszawa','Warsaw','warszawa',true),
('PL','Kraków','Krakow','krakow',true),
('PL','Wrocław','Wroclaw','wroclaw',true),
('PL','Poznań','Poznan','poznan',true),
('PL','Gdańsk','Gdansk','gdansk',true),
-- Indonesia
('ID','Jakarta','Jakarta','jakarta',true),
('ID','Surabaya','Surabaya','surabaya',true),
('ID','Bandung','Bandung','bandung',true),
('ID','Medan','Medan','medan',true),
('ID','Semarang','Semarang','semarang',true),
-- Japan
('JP','Tokyo','Tokyo','tokyo',true),
('JP','Osaka','Osaka','osaka',true),
('JP','Kyoto','Kyoto','kyoto',true),
('JP','Yokohama','Yokohama','yokohama',true),
('JP','Nagoya','Nagoya','nagoya',true),
-- South Korea
('KR','Seoul','Seoul','seoul',true),
('KR','Busan','Busan','busan',true),
('KR','Incheon','Incheon','incheon',true),
('KR','Daegu','Daegu','daegu',true),
('KR','Daejeon','Daejeon','daejeon',true),
-- India
('IN','Mumbai','Mumbai','mumbai',true),
('IN','Delhi','Delhi','delhi',true),
('IN','Bangalore','Bangalore','bangalore',true),
('IN','Chennai','Chennai','chennai',true),
('IN','Hyderabad','Hyderabad','hyderabad',true),
-- China
('CN','Beijing','Beijing','beijing',true),
('CN','Shanghai','Shanghai','shanghai',true),
('CN','Guangzhou','Guangzhou','guangzhou',true),
('CN','Shenzhen','Shenzhen','shenzhen',true),
('CN','Chengdu','Chengdu','chengdu',true),
-- Turkey
('TR','Istanbul','Istanbul','istanbul',true),
('TR','Ankara','Ankara','ankara',true),
('TR','İzmir','Izmir','izmir',true),
('TR','Bursa','Bursa','bursa',true),
('TR','Antalya','Antalya','antalya',true),
-- Saudi Arabia
('SA','Riyadh','Riyadh','riyadh',true),
('SA','Jeddah','Jeddah','jeddah',true),
('SA','Mecca','Mecca','mecca',true),
('SA','Medina','Medina','medina',true),
('SA','Dammam','Dammam','dammam',true),
-- Malaysia
('MY','Kuala Lumpur','Kuala Lumpur','kuala-lumpur',true),
('MY','Penang','Penang','penang',true),
('MY','Johor Bahru','Johor Bahru','johor-bahru',true),
-- Thailand
('TH','Bangkok','Bangkok','bangkok',true),
('TH','Chiang Mai','Chiang Mai','chiang-mai',true),
('TH','Pattaya','Pattaya','pattaya',true),
('TH','Phuket','Phuket','phuket',true),
-- Vietnam
('VN','Hanoi','Hanoi','hanoi',true),
('VN','Ho Chi Minh','Ho Chi Minh City','ho-chi-minh',true),
('VN','Da Nang','Da Nang','da-nang',true),
('VN','Hue','Hue','hue',true),
-- Kenya
('KE','Nairobi','Nairobi','nairobi',true),
('KE','Mombasa','Mombasa','mombasa',true),
('KE','Kisumu','Kisumu','kisumu',true),
('KE','Nakuru','Nakuru','nakuru',true),
-- USA
('US','New York','New York','new-york',true),
('US','Los Angeles','Los Angeles','los-angeles',true),
('US','Chicago','Chicago','chicago',true),
('US','Houston','Houston','houston',true),
('US','Phoenix','Phoenix','phoenix',true),
-- UK
('GB','London','London','london',true),
('GB','Manchester','Manchester','manchester',true),
('GB','Birmingham','Birmingham','birmingham',true),
('GB','Glasgow','Glasgow','glasgow',true),
-- Sweden
('SE','Stockholm','Stockholm','stockholm',true),
('SE','Göteborg','Gothenburg','goteborg',true),
('SE','Malmö','Malmo','malmo',true),
-- Hungary
('HU','Budapest','Budapest','budapest',true),
('HU','Debrecen','Debrecen','debrecen',true),
('HU','Szeged','Szeged','szeged',true),
-- Czech Republic
('CZ','Praha','Prague','praha',true),
('CZ','Brno','Brno','brno',true),
('CZ','Ostrava','Ostrava','ostrava',true),
-- Austria
('AT','Wien','Vienna','wien',true),
('AT','Graz','Graz','graz',true),
('AT','Salzburg','Salzburg','salzburg',true),
-- Finland
('FI','Helsinki','Helsinki','helsinki',true),
('FI','Tampere','Tampere','tampere',true),
('FI','Turku','Turku','turku',true),
-- Denmark
('DK','København','Copenhagen','kobenhavn',true),
('DK','Aarhus','Aarhus','aarhus',true),
-- Norway
('NO','Oslo','Oslo','oslo',true),
('NO','Bergen','Bergen','bergen',true),
-- Portugal
('PT','Lisboa','Lisbon','lisboa',true),
('PT','Porto','Porto','porto',true),
-- Greece
('GR','Αθήνα','Athens','athina',true),
('GR','Θεσσαλονίκη','Thessaloniki','thessaloniki',true),
-- Bulgaria
('BG','София','Sofia','sofia',true),
('BG','Пловдив','Plovdiv','plovdiv',true);

---------------------------------------------------------------------
-- 3. SERVICES BY COUNTRY
---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services_by_country (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code CHAR(2) REFERENCES countries(code),
  service_type TEXT NOT NULL CHECK (service_type IN (
    'courier_domestic','courier_international','airline','train','bus',
    'car_rental','rideshare','accommodation','local_transport','payment_method'
  )),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT NOT NULL,
  affiliate_url TEXT,
  affiliate_commission TEXT,
  tracking_url_template TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

---------------------------------------------------------------------
-- 3a. DOMESTIC COURIERS
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, tracking_url_template, sort_order) VALUES
-- Romania
('RO','courier_domestic','FanCourier','https://fancourier.ro','https://fancourier.ro/awb-tracking/?awb={awb}',1),
('RO','courier_domestic','Sameday','https://sameday.ro','https://sameday.ro/awb?awb={awb}',2),
('RO','courier_domestic','Cargus','https://cargus.ro','https://cargus.ro/tracking?awb={awb}',3),
('RO','courier_domestic','DPD Romania','https://dpd.ro',NULL,4),
('RO','courier_domestic','GLS Romania','https://gls-group.com/RO',NULL,5),
-- Germany
('DE','courier_domestic','DHL','https://dhl.de','https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={awb}',1),
('DE','courier_domestic','Hermes','https://myhermes.de',NULL,2),
('DE','courier_domestic','DPD','https://dpd.de',NULL,3),
('DE','courier_domestic','GLS','https://gls-group.com/DE',NULL,4),
-- France
('FR','courier_domestic','Chronopost','https://chronopost.fr','https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLt={awb}',1),
('FR','courier_domestic','Colissimo','https://colissimo.fr','https://www.laposte.fr/outils/suivre-vos-envois?code={awb}',2),
('FR','courier_domestic','DPD France','https://dpd.fr',NULL,3),
-- Indonesia
('ID','courier_domestic','JNE','https://jne.co.id',NULL,1),
('ID','courier_domestic','J&T Express','https://jet.co.id',NULL,2),
('ID','courier_domestic','SiCepat','https://sicepat.com',NULL,3),
('ID','courier_domestic','Anteraja','https://anteraja.id',NULL,4),
('ID','courier_domestic','Pos Indonesia','https://posindonesia.co.id',NULL,5),
-- Japan
('JP','courier_domestic','Yamato Transport','https://kuronekoyamato.co.jp',NULL,1),
('JP','courier_domestic','Sagawa Express','https://sagawa-exp.co.jp',NULL,2),
('JP','courier_domestic','Japan Post','https://japanpost.jp',NULL,3),
-- India
('IN','courier_domestic','Blue Dart','https://bluedart.com','https://www.bluedart.com/tracking?trackingId={awb}',1),
('IN','courier_domestic','Delhivery','https://delhivery.com',NULL,2),
('IN','courier_domestic','DTDC','https://dtdc.in',NULL,3),
('IN','courier_domestic','India Post','https://indiapost.gov.in',NULL,4),
-- South Korea
('KR','courier_domestic','CJ Logistics','https://cjlogistics.com',NULL,1),
('KR','courier_domestic','Lotte Logistics','https://lotteglogis.com',NULL,2),
('KR','courier_domestic','Hanjin','https://hanjin.com',NULL,3),
-- Vietnam
('VN','courier_domestic','Viettel Post','https://viettelpost.com.vn',NULL,1),
('VN','courier_domestic','GHTK','https://giaohangtietkiem.vn',NULL,2),
('VN','courier_domestic','J&T Vietnam','https://jtexpress.vn',NULL,3),
-- Turkey
('TR','courier_domestic','Yurtiçi Kargo','https://yurticikargo.com',NULL,1),
('TR','courier_domestic','Aras Kargo','https://araskargo.com.tr',NULL,2),
('TR','courier_domestic','MNG Kargo','https://mngkargo.com.tr',NULL,3),
('TR','courier_domestic','PTT Kargo','https://ptt.gov.tr',NULL,4),
-- Poland
('PL','courier_domestic','InPost','https://inpost.pl','https://inpost.pl/sledzenie-przesylek?number={awb}',1),
('PL','courier_domestic','DPD Poland','https://dpd.com.pl',NULL,2),
('PL','courier_domestic','GLS Poland','https://gls-group.com/PL',NULL,3),
-- Kenya
('KE','courier_domestic','Sendy','https://sendy.co.ke',NULL,1),
('KE','courier_domestic','Posta Kenya','https://posta.co.ke',NULL,2),
-- Spain
('ES','courier_domestic','Correos','https://correos.es',NULL,1),
('ES','courier_domestic','SEUR','https://seur.com',NULL,2),
('ES','courier_domestic','MRW','https://mrw.es',NULL,3),
-- Italy
('IT','courier_domestic','Poste Italiane','https://poste.it',NULL,1),
('IT','courier_domestic','BRT','https://brt.it',NULL,2),
('IT','courier_domestic','GLS Italy','https://gls-group.com/IT',NULL,3),
-- Netherlands
('NL','courier_domestic','PostNL','https://postnl.nl',NULL,1),
('NL','courier_domestic','DPD Netherlands','https://dpd.nl',NULL,2),
-- UK
('GB','courier_domestic','Royal Mail','https://royalmail.com',NULL,1),
('GB','courier_domestic','DPD UK','https://dpd.co.uk',NULL,2),
('GB','courier_domestic','Hermes UK','https://evri.com',NULL,3),
-- USA
('US','courier_domestic','USPS','https://usps.com',NULL,1),
('US','courier_domestic','UPS','https://ups.com',NULL,2),
('US','courier_domestic','FedEx','https://fedex.com',NULL,3);

---------------------------------------------------------------------
-- 3b. INTERNATIONAL COURIERS (for ALL countries)
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, tracking_url_template, sort_order)
SELECT c.code, 'courier_international', 'DHL Express', 'https://dhl.com', 'https://www.dhl.com/track?tracking-id={awb}', 1
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, tracking_url_template, sort_order)
SELECT c.code, 'courier_international', 'FedEx', 'https://fedex.com', 'https://www.fedex.com/apps/fedextrack/?tracknumbers={awb}', 2
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'courier_international', 'UPS', 'https://ups.com', 3
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'courier_international', 'Aramex', 'https://aramex.com', 4
FROM countries c;

---------------------------------------------------------------------
-- 3c. AIRLINES
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
-- Romania
('RO','airline','Tarom','https://tarom.ro',1),
('RO','airline','Wizz Air','https://wizzair.com',2),
('RO','airline','Blue Air','https://blueairweb.com',3),
-- Indonesia
('ID','airline','Garuda Indonesia','https://garuda-indonesia.com',1),
('ID','airline','Lion Air','https://lionair.co.id',2),
('ID','airline','Batik Air','https://batikair.com',3),
('ID','airline','Citilink','https://citilink.co.id',4),
-- Germany
('DE','airline','Lufthansa','https://lufthansa.com',1),
('DE','airline','Eurowings','https://eurowings.com',2),
-- Japan
('JP','airline','Japan Airlines','https://jal.com',1),
('JP','airline','ANA','https://ana.co.jp',2),
('JP','airline','Peach Aviation','https://flypeach.com',3),
-- India
('IN','airline','IndiGo','https://goindigo.in',1),
('IN','airline','Air India','https://airindia.in',2),
('IN','airline','SpiceJet','https://spicejet.com',3),
-- South Korea
('KR','airline','Korean Air','https://koreanair.com',1),
('KR','airline','Asiana Airlines','https://flyasiana.com',2),
-- Turkey
('TR','airline','Turkish Airlines','https://turkishairlines.com',1),
('TR','airline','Pegasus Airlines','https://flypgs.com',2),
-- Vietnam
('VN','airline','Vietnam Airlines','https://vietnamairlines.com',1),
('VN','airline','VietJet Air','https://vietjetair.com',2),
-- France
('FR','airline','Air France','https://airfrance.com',1),
('FR','airline','Transavia','https://transavia.com',2),
-- Spain
('ES','airline','Iberia','https://iberia.com',1),
('ES','airline','Vueling','https://vueling.com',2),
-- Italy
('IT','airline','ITA Airways','https://ita-airways.com',1),
('IT','airline','Ryanair','https://ryanair.com',2),
-- UK
('GB','airline','British Airways','https://britishairways.com',1),
('GB','airline','easyJet','https://easyjet.com',2),
-- USA
('US','airline','American Airlines','https://aa.com',1),
('US','airline','Delta','https://delta.com',2),
('US','airline','United','https://united.com',3),
('US','airline','Southwest','https://southwest.com',4);

---------------------------------------------------------------------
-- 3d. TRAINS
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('RO','train','CFR Călători','https://cfrcalatori.ro',1),
('DE','train','Deutsche Bahn','https://bahn.de',1),
('FR','train','SNCF','https://sncf.com',1),
('JP','train','JR Pass','https://japanrailpass.net',1),
('IN','train','Indian Railways','https://irctc.co.in',1),
('ID','train','KAI','https://kai.id',1),
('KR','train','Korail','https://letskorail.com',1),
('TR','train','TCDD','https://tcddtasimacilik.gov.tr',1),
('VN','train','Vietnam Railways','https://vr.com.vn',1),
('PL','train','PKP Intercity','https://intercity.pl',1),
('ES','train','Renfe','https://renfe.com',1),
('IT','train','Trenitalia','https://trenitalia.com',1),
('NL','train','NS','https://ns.nl',1),
('GB','train','National Rail','https://nationalrail.co.uk',1),
('US','train','Amtrak','https://amtrak.com',1),
('SE','train','SJ','https://sj.se',1);

---------------------------------------------------------------------
-- 3e. BUS
---------------------------------------------------------------------
-- FlixBus for all European countries
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('RO','bus','FlixBus','https://flixbus.com',1),
('DE','bus','FlixBus','https://flixbus.com',1),
('FR','bus','FlixBus','https://flixbus.com',1),
('ES','bus','FlixBus','https://flixbus.com',1),
('IT','bus','FlixBus','https://flixbus.com',1),
('PT','bus','FlixBus','https://flixbus.com',1),
('NL','bus','FlixBus','https://flixbus.com',1),
('PL','bus','FlixBus','https://flixbus.com',1),
('HU','bus','FlixBus','https://flixbus.com',1),
('CZ','bus','FlixBus','https://flixbus.com',1),
('SK','bus','FlixBus','https://flixbus.com',1),
('HR','bus','FlixBus','https://flixbus.com',1),
('BG','bus','FlixBus','https://flixbus.com',1),
('GR','bus','FlixBus','https://flixbus.com',1),
('UA','bus','FlixBus','https://flixbus.com',1),
('FI','bus','FlixBus','https://flixbus.com',1),
('SE','bus','FlixBus','https://flixbus.com',1),
('DK','bus','FlixBus','https://flixbus.com',1),
('NO','bus','FlixBus','https://flixbus.com',1),
('EE','bus','FlixBus','https://flixbus.com',1),
('LT','bus','FlixBus','https://flixbus.com',1),
('SI','bus','FlixBus','https://flixbus.com',1),
('MT','bus','FlixBus','https://flixbus.com',1),
('GB','bus','FlixBus','https://flixbus.com',1),
('LV','bus','FlixBus','https://flixbus.com',1),
('IE','bus','FlixBus','https://flixbus.com',1),
('AT','bus','FlixBus','https://flixbus.com',1),
('BE','bus','FlixBus','https://flixbus.com',1),
('RS','bus','FlixBus','https://flixbus.com',1),
('TR','bus','FlixBus','https://flixbus.com',1);

-- Country-specific bus services
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('RO','bus','Autogari.ro','https://autogari.ro',2),
('IN','bus','RedBus','https://redbus.in',1),
('ID','bus','DAMRI','https://damri.co.id',1);

---------------------------------------------------------------------
-- 3f. RIDESHARE
---------------------------------------------------------------------
-- Uber for ALL countries
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'rideshare', 'Uber', 'https://uber.com', 1
FROM countries c;

-- Bolt for ALL countries
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'rideshare', 'Bolt', 'https://bolt.eu', 2
FROM countries c;

-- Country-specific rideshare
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('ID','rideshare','Gojek','https://gojek.com',3),
('ID','rideshare','Grab','https://grab.com',4),
('MY','rideshare','Grab','https://grab.com',3),
('TH','rideshare','Grab','https://grab.com',3),
('VN','rideshare','Grab','https://grab.com',3),
('KR','rideshare','Kakao Taxi','https://kakaomobility.com',3),
('IN','rideshare','Ola','https://olacabs.com',3),
('TR','rideshare','BiTaksi','https://bitaksi.com',3);

---------------------------------------------------------------------
-- 3g. CAR RENTAL (universal for all)
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'car_rental', 'Rentalcars.com', 'https://rentalcars.com', 1
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'car_rental', 'Booking.com Cars', 'https://booking.com/cars', 2
FROM countries c;

---------------------------------------------------------------------
-- 3h. ACCOMMODATION (universal for all)
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'accommodation', 'Booking.com', 'https://booking.com', 1
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'accommodation', 'Airbnb', 'https://airbnb.com', 2
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'accommodation', 'Hostelworld', 'https://hostelworld.com', 3
FROM countries c;

-- Local accommodation services
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('ID','accommodation','Tiket.com','https://tiket.com',4),
('JP','accommodation','Jalan','https://jalan.net',4),
('JP','accommodation','Rakuten Travel','https://travel.rakuten.co.jp',5),
('IN','accommodation','MakeMyTrip','https://makemytrip.com',4),
('TR','accommodation','Tatilsepeti','https://tatilsepeti.com',4);

---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
---------------------------------------------------------------------
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read countries" ON countries FOR SELECT USING (true);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);

ALTER TABLE services_by_country ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read services_by_country" ON services_by_country FOR SELECT USING (true);
