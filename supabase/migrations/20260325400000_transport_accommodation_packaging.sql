-- Transport, accommodation and packaging affiliate services for top 100 countries
-- Depends on: 20260325300000_global_courier_seed.sql

---------------------------------------------------------------------
-- 0. Extend CHECK constraint to allow new service types
---------------------------------------------------------------------
ALTER TABLE services_by_country DROP CONSTRAINT IF EXISTS services_by_country_service_type_check;
ALTER TABLE services_by_country ADD CONSTRAINT services_by_country_service_type_check
  CHECK (service_type IN (
    'courier_domestic','courier_international','airline','train','bus',
    'car_rental','rideshare','accommodation','local_transport','payment_method',
    'transport','packaging'
  ));

---------------------------------------------------------------------
-- 1. TRANSPORT — global services for ALL countries
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'transport', 'FlixBus', 'https://flixbus.com', 1 FROM countries c;
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'transport', 'Omio', 'https://omio.com', 2 FROM countries c;
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'transport', 'BlaBlaCar', 'https://blablacar.com', 3 FROM countries c;
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'transport', 'Rome2Rio', 'https://rome2rio.com', 5 FROM countries c;
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'transport', 'Trainline', 'https://thetrainline.com', 6 FROM countries c;

-- Eurail (Europe only)
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('RO','transport','Eurail','https://eurail.com',4),('DE','transport','Eurail','https://eurail.com',4),
('FR','transport','Eurail','https://eurail.com',4),('IT','transport','Eurail','https://eurail.com',4),
('ES','transport','Eurail','https://eurail.com',4),('GB','transport','Eurail','https://eurail.com',4),
('NL','transport','Eurail','https://eurail.com',4),('PL','transport','Eurail','https://eurail.com',4),
('HU','transport','Eurail','https://eurail.com',4),('CZ','transport','Eurail','https://eurail.com',4),
('SK','transport','Eurail','https://eurail.com',4),('AT','transport','Eurail','https://eurail.com',4),
('BE','transport','Eurail','https://eurail.com',4),('CH','transport','Eurail','https://eurail.com',4),
('SE','transport','Eurail','https://eurail.com',4),('NO','transport','Eurail','https://eurail.com',4),
('DK','transport','Eurail','https://eurail.com',4),('FI','transport','Eurail','https://eurail.com',4),
('PT','transport','Eurail','https://eurail.com',4),('GR','transport','Eurail','https://eurail.com',4),
('BG','transport','Eurail','https://eurail.com',4),('HR','transport','Eurail','https://eurail.com',4),
('RS','transport','Eurail','https://eurail.com',4),('SI','transport','Eurail','https://eurail.com',4),
('IE','transport','Eurail','https://eurail.com',4),('LT','transport','Eurail','https://eurail.com',4),
('LV','transport','Eurail','https://eurail.com',4),('EE','transport','Eurail','https://eurail.com',4);

-- 12Go Asia (Asia only)
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('TH','transport','12Go Asia','https://12go.asia',4),('VN','transport','12Go Asia','https://12go.asia',4),
('MY','transport','12Go Asia','https://12go.asia',4),('SG','transport','12Go Asia','https://12go.asia',4),
('ID','transport','12Go Asia','https://12go.asia',4),('PH','transport','12Go Asia','https://12go.asia',4),
('KH','transport','12Go Asia','https://12go.asia',4),('MM','transport','12Go Asia','https://12go.asia',4),
('LK','transport','12Go Asia','https://12go.asia',4),('NP','transport','12Go Asia','https://12go.asia',4),
('IN','transport','12Go Asia','https://12go.asia',4),('JP','transport','12Go Asia','https://12go.asia',4),
('CN','transport','12Go Asia','https://12go.asia',4),('KR','transport','12Go Asia','https://12go.asia',4);

-- National rail / transport
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('RO','transport','CFR Călători','https://cfrcalatori.ro',10),
('DE','transport','Deutsche Bahn','https://bahn.de',10),
('FR','transport','SNCF','https://sncf.com',10),
('IT','transport','Trenitalia','https://trenitalia.com',10),
('ES','transport','Renfe','https://renfe.com',10),
('GB','transport','National Rail','https://nationalrail.co.uk',10),
('NL','transport','NS','https://ns.nl',10),
('PL','transport','PKP Intercity','https://intercity.pl',10),
('HU','transport','MÁV','https://mavcsoport.hu',10),
('AT','transport','ÖBB','https://oebb.at',10),
('CH','transport','SBB','https://sbb.ch',10),
('BE','transport','SNCB','https://belgiantrain.be',10),
('SE','transport','SJ','https://sj.se',10),
('NO','transport','Vy','https://vy.no',10),
('DK','transport','DSB','https://dsb.dk',10),
('FI','transport','VR','https://vr.fi',10),
('PT','transport','CP','https://cp.pt',10),
('RU','transport','RZD','https://rzd.ru',10),
('UA','transport','Ukrzaliznytsia','https://uz.gov.ua',10),
('TR','transport','TCDD','https://tcddtasimacilik.gov.tr',10),
('IN','transport','IRCTC','https://irctc.co.in',10),
('JP','transport','JR Pass','https://japanrailpass.net',10),
('KR','transport','Korail','https://letskorail.com',10),
('CN','transport','12306','https://12306.cn',10),
('TH','transport','Thai Railways','https://railway.co.th',10),
('ID','transport','KAI','https://kai.id',10),
('US','transport','Amtrak','https://amtrak.com',10),
('CA','transport','VIA Rail','https://viarail.ca',10),
('BR','transport','ClickBus','https://clickbus.com.br',10),
('MX','transport','ADO','https://ado.com.mx',10),
('ZA','transport','Intercape','https://intercape.co.za',10),
('MA','transport','ONCF','https://oncf.ma',10),
('EG','transport','ENR','https://enr.gov.eg',10);

---------------------------------------------------------------------
-- 2. ACCOMMODATION — global services for ALL countries
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'accommodation', 'Hotels.com', 'https://hotels.com', 3 FROM countries c
WHERE NOT EXISTS (SELECT 1 FROM services_by_country s WHERE s.country_code=c.code AND s.service_type='accommodation' AND s.name='Hotels.com');
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'accommodation', 'Couchsurfing', 'https://couchsurfing.com', 5 FROM countries c
WHERE NOT EXISTS (SELECT 1 FROM services_by_country s WHERE s.country_code=c.code AND s.service_type='accommodation' AND s.name='Couchsurfing');
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'accommodation', 'Expedia', 'https://expedia.com', 6 FROM countries c
WHERE NOT EXISTS (SELECT 1 FROM services_by_country s WHERE s.country_code=c.code AND s.service_type='accommodation' AND s.name='Expedia');
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'accommodation', 'Agoda', 'https://agoda.com', 7 FROM countries c
WHERE NOT EXISTS (SELECT 1 FROM services_by_country s WHERE s.country_code=c.code AND s.service_type='accommodation' AND s.name='Agoda');

-- Regional accommodation
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('DE','accommodation','HRS','https://hrs.com',10),('FR','accommodation','HRS','https://hrs.com',10),
('IT','accommodation','HRS','https://hrs.com',10),('ES','accommodation','HRS','https://hrs.com',10),
('GB','accommodation','HRS','https://hrs.com',10),('AT','accommodation','HRS','https://hrs.com',10),
('CH','accommodation','HRS','https://hrs.com',10),('NL','accommodation','HRS','https://hrs.com',10),
('DE','accommodation','Trivago','https://trivago.com',11),('FR','accommodation','Trivago','https://trivago.com',11),
('IT','accommodation','Trivago','https://trivago.com',11),('ES','accommodation','Trivago','https://trivago.com',11),
('GB','accommodation','Trivago','https://trivago.com',11),
('CN','accommodation','Trip.com','https://trip.com',10),('HK','accommodation','Trip.com','https://trip.com',10),
('TW','accommodation','Trip.com','https://trip.com',10),('JP','accommodation','Trip.com','https://trip.com',10),
('KR','accommodation','Trip.com','https://trip.com',10),('SG','accommodation','Trip.com','https://trip.com',10),
('TH','accommodation','Traveloka','https://traveloka.com',10),('ID','accommodation','Traveloka','https://traveloka.com',10),
('MY','accommodation','Traveloka','https://traveloka.com',10),('VN','accommodation','Traveloka','https://traveloka.com',10),
('PH','accommodation','Traveloka','https://traveloka.com',10),
('IN','accommodation','OYO','https://oyorooms.com',10),('IN','accommodation','MakeMyTrip','https://makemytrip.com',11),
('CN','accommodation','Ctrip','https://ctrip.com',11),('CN','accommodation','Meituan','https://meituan.com',12),
('JP','accommodation','Jalan','https://jalan.net',10),('JP','accommodation','Rakuten Travel','https://travel.rakuten.co.jp',11),
('BR','accommodation','Decolar','https://decolar.com',10),('BR','accommodation','HotelUrbano','https://hotelurbano.com',11),
('RU','accommodation','Ostrovok','https://ostrovok.ru',10);

---------------------------------------------------------------------
-- 3. PACKAGING — global services for ALL countries
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'packaging', 'Amazon Boxes', 'https://amazon.com/s?k=shipping+boxes', 1 FROM countries c;
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'packaging', 'Sealed Air', 'https://sealedair.com', 2 FROM countries c;
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'packaging', 'RAJA Group', 'https://rajapack.com', 3 FROM countries c;

-- National packaging
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('RO','packaging','Dedeman','https://dedeman.ro',10),
('RO','packaging','Leroy Merlin','https://leroymerlin.ro',11),
('RO','packaging','Emag Cutii','https://emag.ro/cutii-carton/c',12),
('DE','packaging','Viking DE','https://viking.de',10),
('DE','packaging','Amazon.de','https://amazon.de/s?k=Versandkartons',11),
('FR','packaging','Viking FR','https://viking.fr',10),
('FR','packaging','Manutan','https://manutan.fr',11),
('GB','packaging','Viking UK','https://viking.co.uk',10),
('GB','packaging','Amazon.co.uk','https://amazon.co.uk/s?k=shipping+boxes',11),
('NL','packaging','Viking NL','https://viking.nl',10),
('PL','packaging','Allegro Packaging','https://allegro.pl/listing?string=opakowania+kartonowe',10),
('IT','packaging','Viking IT','https://viking.it',10),
('ES','packaging','Viking ES','https://viking.es',10),
('US','packaging','ULine','https://uline.com',10),
('US','packaging','Amazon.com','https://amazon.com/s?k=shipping+boxes',11),
('CA','packaging','Staples CA','https://staples.ca',10),
('IN','packaging','Amazon.in','https://amazon.in/s?k=packaging+materials',10),
('IN','packaging','Flipkart','https://flipkart.com',11),
('BR','packaging','Amazon.com.br','https://amazon.com.br/s?k=embalagens',10),
('CN','packaging','Taobao','https://taobao.com',10),
('JP','packaging','Amazon.co.jp','https://amazon.co.jp/s?k=梱包材',10),
('SG','packaging','Amazon.sg','https://amazon.sg/s?k=packaging',10),
('SG','packaging','Lazada','https://lazada.sg',11),
('AT','packaging','Viking AT','https://viking.at',10),
('CH','packaging','Viking CH','https://viking.ch',10),
('BE','packaging','Viking BE','https://viking.be',10);
