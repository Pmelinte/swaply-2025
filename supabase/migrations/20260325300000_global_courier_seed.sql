-- Global courier database seed: 225+ domestic couriers for 100+ countries
-- + 8 global international couriers for all countries
-- Depends on: 20260324200000_global_platform.sql (countries, services_by_country tables)

---------------------------------------------------------------------
-- 0. Add missing countries for full top-100 coverage
---------------------------------------------------------------------
INSERT INTO countries (code, name_en, name_local, locale, currency_code, currency_symbol, phone_prefix, flag_emoji) VALUES
('CH','Switzerland','Schweiz','de','CHF','Fr.','+41','🇨🇭'),
('ZA','South Africa','South Africa','en','ZAR','R','+27','🇿🇦'),
('NG','Nigeria','Nigeria','en','NGN','₦','+234','🇳🇬'),
('EG','Egypt','مصر','ar','EGP','E£','+20','🇪🇬'),
('PK','Pakistan','پاکستان','ur','PKR','₨','+92','🇵🇰'),
('BR','Brazil','Brasil','pt','BRL','R$','+55','🇧🇷'),
('MX','Mexico','México','es','MXN','$','+52','🇲🇽'),
('AR','Argentina','Argentina','es','ARS','$','+54','🇦🇷'),
('CO','Colombia','Colombia','es','COP','$','+57','🇨🇴'),
('CL','Chile','Chile','es','CLP','$','+56','🇨🇱'),
('PE','Peru','Perú','es','PEN','S/','+51','🇵🇪'),
('CA','Canada','Canada','en','CAD','C$','+1','🇨🇦'),
('SG','Singapore','Singapore','en','SGD','S$','+65','🇸🇬'),
('TW','Taiwan','臺灣','zh','TWD','NT$','+886','🇹🇼'),
('HK','Hong Kong','香港','zh','HKD','HK$','+852','🇭🇰'),
('AE','United Arab Emirates','الإمارات','ar','AED','د.إ','+971','🇦🇪'),
('QA','Qatar','قطر','ar','QAR','ر.ق','+974','🇶🇦'),
('KW','Kuwait','الكويت','ar','KWD','د.ك','+965','🇰🇼'),
('JO','Jordan','الأردن','ar','JOD','د.ا','+962','🇯🇴'),
('LB','Lebanon','لبنان','ar','LBP','ل.ل','+961','🇱🇧'),
('IL','Israel','ישראל','he','ILS','₪','+972','🇮🇱'),
('VE','Venezuela','Venezuela','es','VES','Bs.','+58','🇻🇪'),
('EC','Ecuador','Ecuador','es','USD','$','+593','🇪🇨'),
('BO','Bolivia','Bolivia','es','BOB','Bs.','+591','🇧🇴'),
('PY','Paraguay','Paraguay','es','PYG','₲','+595','🇵🇾'),
('UY','Uruguay','Uruguay','es','UYU','$U','+598','🇺🇾'),
('GT','Guatemala','Guatemala','es','GTQ','Q','+502','🇬🇹'),
('DO','Dominican Republic','Rep. Dominicana','es','DOP','RD$','+1','🇩🇴'),
('CR','Costa Rica','Costa Rica','es','CRC','₡','+506','🇨🇷'),
('PA','Panama','Panamá','es','PAB','B/.','+507','🇵🇦'),
('CU','Cuba','Cuba','es','CUP','$','+53','🇨🇺'),
('JM','Jamaica','Jamaica','en','JMD','J$','+1','🇯🇲'),
('TT','Trinidad and Tobago','Trinidad and Tobago','en','TTD','TT$','+1','🇹🇹'),
('ET','Ethiopia','ኢትዮጵያ','am','ETB','Br','+251','🇪🇹'),
('GH','Ghana','Ghana','en','GHS','₵','+233','🇬🇭'),
('TZ','Tanzania','Tanzania','sw','TZS','TSh','+255','🇹🇿'),
('UG','Uganda','Uganda','en','UGX','USh','+256','🇺🇬'),
('CI','Ivory Coast','Côte d''Ivoire','fr','XOF','CFA','+225','🇨🇮'),
('SN','Senegal','Sénégal','fr','XOF','CFA','+221','🇸🇳'),
('MA','Morocco','المغرب','ar','MAD','د.م.','+212','🇲🇦'),
('TN','Tunisia','تونس','ar','TND','د.ت','+216','🇹🇳'),
('DZ','Algeria','الجزائر','ar','DZD','د.ج','+213','🇩🇿'),
('AO','Angola','Angola','pt','AOA','Kz','+244','🇦🇴'),
('CM','Cameroon','Cameroun','fr','XAF','FCFA','+237','🇨🇲'),
('ZM','Zambia','Zambia','en','ZMW','ZK','+260','🇿🇲'),
('ZW','Zimbabwe','Zimbabwe','en','ZWL','Z$','+263','🇿🇼'),
('MZ','Mozambique','Moçambique','pt','MZN','MT','+258','🇲🇿'),
('MG','Madagascar','Madagasikara','mg','MGA','Ar','+261','🇲🇬'),
('RW','Rwanda','Rwanda','rw','RWF','RF','+250','🇷🇼'),
('MM','Myanmar','မြန်မာ','my','MMK','K','+95','🇲🇲'),
('KH','Cambodia','កម្ពុជា','km','KHR','៛','+855','🇰🇭'),
('LK','Sri Lanka','ශ්‍රී ලංකාව','si','LKR','Rs','+94','🇱🇰'),
('NP','Nepal','नेपाल','ne','NPR','रू','+977','🇳🇵'),
('KZ','Kazakhstan','Қазақстан','kk','KZT','₸','+7','🇰🇿'),
('UZ','Uzbekistan','Oʻzbekiston','uz','UZS','сўм','+998','🇺🇿'),
('AZ','Azerbaijan','Azərbaycan','az','AZN','₼','+994','🇦🇿'),
('GE','Georgia','საქართველო','ka','GEL','₾','+995','🇬🇪'),
('AM','Armenia','Հայաստան','hy','AMD','֏','+374','🇦🇲')
ON CONFLICT (code) DO NOTHING;

---------------------------------------------------------------------
-- 1. GLOBAL INTERNATIONAL COURIERS (8 for ALL countries)
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, tracking_url_template, sort_order)
SELECT c.code, 'courier_international', 'DHL Express', 'https://dhl.com', 'https://www.dhl.com/track?tracking-id={awb}', 1
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, tracking_url_template, sort_order)
SELECT c.code, 'courier_international', 'FedEx', 'https://fedex.com', 'https://www.fedex.com/apps/fedextrack/?tracknumbers={awb}', 2
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, tracking_url_template, sort_order)
SELECT c.code, 'courier_international', 'UPS', 'https://ups.com', 'https://www.ups.com/track?tracknum={awb}', 3
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'courier_international', 'TNT', 'https://tnt.com', 4
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'courier_international', 'DPD', 'https://dpd.com', 5
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'courier_international', 'GLS', 'https://gls-group.com', 6
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'courier_international', 'Aramex', 'https://aramex.com', 7
FROM countries c;

INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order)
SELECT c.code, 'courier_international', 'SF Express', 'https://sf-express.com', 8
FROM countries c;

---------------------------------------------------------------------
-- 2. EUROPE (30 countries) — domestic couriers
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, tracking_url_template, sort_order) VALUES
-- RO
('RO','courier_domestic','FAN Courier','https://fancourier.ro','https://fancourier.ro/awb-tracking/?awb={awb}',1),
('RO','courier_domestic','Cargus','https://cargus.ro','https://cargus.ro/tracking?awb={awb}',2),
('RO','courier_domestic','Urgent Cargus','https://urgentcargus.ro',NULL,3),
-- DE
('DE','courier_domestic','Deutsche Post','https://deutschepost.de','https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={awb}',1),
('DE','courier_domestic','Hermes','https://myhermes.de',NULL,2),
('DE','courier_domestic','DPD Germany','https://dpd.de',NULL,3),
-- FR
('FR','courier_domestic','Colissimo','https://colissimo.fr','https://www.laposte.fr/outils/suivre-vos-envois?code={awb}',1),
('FR','courier_domestic','Chronopost','https://chronopost.fr','https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLt={awb}',2),
('FR','courier_domestic','Mondial Relay','https://mondialrelay.fr',NULL,3),
-- IT
('IT','courier_domestic','BRT','https://brt.it',NULL,1),
('IT','courier_domestic','Poste Italiane','https://poste.it',NULL,2),
('IT','courier_domestic','GLS Italy','https://gls-group.com/IT',NULL,3),
-- ES
('ES','courier_domestic','Correos','https://correos.es',NULL,1),
('ES','courier_domestic','MRW','https://mrw.es',NULL,2),
('ES','courier_domestic','SEUR','https://seur.com',NULL,3),
-- GB
('GB','courier_domestic','Royal Mail','https://royalmail.com',NULL,1),
('GB','courier_domestic','Evri','https://evri.com',NULL,2),
('GB','courier_domestic','Yodel','https://yodel.co.uk',NULL,3),
('GB','courier_domestic','DPD UK','https://dpd.co.uk',NULL,4),
-- NL
('NL','courier_domestic','PostNL','https://postnl.nl',NULL,1),
('NL','courier_domestic','DHL Parcel NL','https://dhl.nl',NULL,2),
-- PL
('PL','courier_domestic','InPost','https://inpost.pl','https://inpost.pl/sledzenie-przesylek?number={awb}',1),
('PL','courier_domestic','Poczta Polska','https://poczta-polska.pl',NULL,2),
('PL','courier_domestic','DPD Poland','https://dpd.com.pl',NULL,3),
-- HU
('HU','courier_domestic','Magyar Posta','https://posta.hu',NULL,1),
('HU','courier_domestic','GLS Hungary','https://gls-group.com/HU',NULL,2),
-- CZ
('CZ','courier_domestic','Zásilkovna','https://zasilkovna.cz',NULL,1),
('CZ','courier_domestic','Česká pošta','https://ceskaposta.cz',NULL,2),
-- SK
('SK','courier_domestic','Slovenská pošta','https://posta.sk',NULL,1),
('SK','courier_domestic','Zásilkovna SK','https://zasilkovna.sk',NULL,2),
-- AT
('AT','courier_domestic','Österreichische Post','https://post.at',NULL,1),
('AT','courier_domestic','DPD Austria','https://dpd.at',NULL,2),
-- BE
('BE','courier_domestic','bpost','https://bpost.be',NULL,1),
('BE','courier_domestic','DPD Belgium','https://dpd.be',NULL,2),
-- CH
('CH','courier_domestic','Swiss Post','https://post.ch',NULL,1),
('CH','courier_domestic','DPD Switzerland','https://dpd.ch',NULL,2),
-- SE
('SE','courier_domestic','PostNord','https://postnord.se',NULL,1),
('SE','courier_domestic','DHL Sweden','https://dhl.se',NULL,2),
-- NO
('NO','courier_domestic','Posten','https://posten.no',NULL,1),
('NO','courier_domestic','DHL Norway','https://dhl.no',NULL,2),
-- DK
('DK','courier_domestic','PostNord DK','https://postnord.dk',NULL,1),
('DK','courier_domestic','GLS Denmark','https://gls-group.com/DK',NULL,2),
-- FI
('FI','courier_domestic','Posti','https://posti.fi',NULL,1),
('FI','courier_domestic','DHL Finland','https://dhl.fi',NULL,2),
-- PT
('PT','courier_domestic','CTT Correios','https://ctt.pt',NULL,1),
('PT','courier_domestic','DPD Portugal','https://dpd.pt',NULL,2),
-- GR
('GR','courier_domestic','ELTA Courier','https://elta-courier.gr',NULL,1),
('GR','courier_domestic','ACS Courier','https://acscourier.net',NULL,2),
-- BG
('BG','courier_domestic','Speedy','https://speedy.bg',NULL,1),
('BG','courier_domestic','Econt','https://econt.com',NULL,2),
-- HR
('HR','courier_domestic','Hrvatska pošta','https://posta.hr',NULL,1),
('HR','courier_domestic','GLS Croatia','https://gls-group.com/HR',NULL,2),
-- RS
('RS','courier_domestic','Post of Serbia','https://posta.rs',NULL,1),
('RS','courier_domestic','DExpress','https://dexpress.rs',NULL,2),
-- UA
('UA','courier_domestic','Nova Poshta','https://novaposhta.ua',NULL,1),
('UA','courier_domestic','Ukrposhta','https://ukrposhta.ua',NULL,2),
-- TR
('TR','courier_domestic','PTT','https://ptt.gov.tr',NULL,1),
('TR','courier_domestic','Yurtiçi Kargo','https://yurticikargo.com',NULL,2),
('TR','courier_domestic','MNG Kargo','https://mngkargo.com.tr',NULL,3),
-- RU
('RU','courier_domestic','CDEK','https://cdek.ru',NULL,1),
('RU','courier_domestic','Boxberry','https://boxberry.ru',NULL,2),
('RU','courier_domestic','Russian Post','https://pochta.ru',NULL,3),
-- IE
('IE','courier_domestic','An Post','https://anpost.com',NULL,1),
('IE','courier_domestic','DPD Ireland','https://dpd.ie',NULL,2),
-- LT
('LT','courier_domestic','LP Express','https://lpexpress.lt',NULL,1),
('LT','courier_domestic','DPD Lithuania','https://dpd.lt',NULL,2),
-- LV
('LV','courier_domestic','Latvijas Pasts','https://pasts.lv',NULL,1),
('LV','courier_domestic','DPD Latvia','https://dpd.lv',NULL,2),
-- EE
('EE','courier_domestic','Omniva','https://omniva.ee',NULL,1),
('EE','courier_domestic','DPD Estonia','https://dpd.ee',NULL,2),
-- SI
('SI','courier_domestic','Pošta Slovenije','https://posta.si',NULL,1),
('SI','courier_domestic','GLS Slovenia','https://gls-group.com/SI',NULL,2);

---------------------------------------------------------------------
-- 3. ASIA (30 countries) — domestic couriers
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
-- CN
('CN','courier_domestic','SF Express','https://sf-express.com',1),
('CN','courier_domestic','ZTO Express','https://zto.com',2),
('CN','courier_domestic','YTO Express','https://yto.net.cn',3),
('CN','courier_domestic','STO Express','https://sto.cn',4),
('CN','courier_domestic','JD Logistics','https://jdl.com',5),
-- JP
('JP','courier_domestic','Yamato Transport','https://kuronekoyamato.co.jp',1),
('JP','courier_domestic','Japan Post','https://japanpost.jp',2),
('JP','courier_domestic','Sagawa Express','https://sagawa-exp.co.jp',3),
-- IN
('IN','courier_domestic','DTDC','https://dtdc.in',1),
('IN','courier_domestic','Delhivery','https://delhivery.com',2),
('IN','courier_domestic','Blue Dart','https://bluedart.com',3),
('IN','courier_domestic','India Post','https://indiapost.gov.in',4),
-- ID
('ID','courier_domestic','JNE','https://jne.co.id',1),
('ID','courier_domestic','J&T Express','https://jet.co.id',2),
('ID','courier_domestic','SiCepat','https://sicepat.com',3),
('ID','courier_domestic','AnterAja','https://anteraja.id',4),
-- PK
('PK','courier_domestic','TCS','https://tcsexpress.com',1),
('PK','courier_domestic','Leopards Courier','https://leopardscourier.com',2),
('PK','courier_domestic','Pakistan Post','https://pakpost.gov.pk',3),
-- BD
('BD','courier_domestic','Pathao','https://pathao.com',1),
('BD','courier_domestic','Sundarban Courier','https://sundarbancourier.com',2),
('BD','courier_domestic','Bangladesh Post','https://bangladeshpost.gov.bd',3),
-- PH
('PH','courier_domestic','LBC','https://lbcexpress.com',1),
('PH','courier_domestic','J&T Express PH','https://jtexpress.ph',2),
('PH','courier_domestic','Ninja Van PH','https://ninjavan.co/ph',3),
('PH','courier_domestic','2GO','https://2go.com.ph',4),
-- VN
('VN','courier_domestic','Vietnam Post','https://vnpost.vn',1),
('VN','courier_domestic','Giao Hang Nhanh','https://ghn.vn',2),
('VN','courier_domestic','Ninja Van VN','https://ninjavan.co/vn',3),
-- TH
('TH','courier_domestic','Thailand Post','https://thailandpost.co.th',1),
('TH','courier_domestic','Kerry Express','https://kerryexpress.com/th',2),
('TH','courier_domestic','Flash Express','https://flashexpress.com',3),
-- MY
('MY','courier_domestic','Pos Malaysia','https://pos.com.my',1),
('MY','courier_domestic','J&T Express MY','https://jtexpress.my',2),
('MY','courier_domestic','Ninja Van MY','https://ninjavan.co/my',3),
-- SG
('SG','courier_domestic','SingPost','https://singpost.com',1),
('SG','courier_domestic','Ninja Van SG','https://ninjavan.co/sg',2),
('SG','courier_domestic','DHL SG','https://dhl.com.sg',3),
-- KR
('KR','courier_domestic','Korea Post','https://koreapost.go.kr',1),
('KR','courier_domestic','CJ Logistics','https://cjlogistics.com',2),
('KR','courier_domestic','Lotte Global','https://lotteglogis.com',3),
-- TW
('TW','courier_domestic','Chunghwa Post','https://post.gov.tw',1),
('TW','courier_domestic','Black Cat (T-Cat)','https://t-cat.com.tw',2),
-- HK
('HK','courier_domestic','HongKong Post','https://hongkongpost.hk',1),
('HK','courier_domestic','SF Express HK','https://sf-express.com/hk',2),
-- MM
('MM','courier_domestic','Myanmar Post','https://myanmapost.gov.mm',1),
('MM','courier_domestic','KBZ Express','https://kbzexpress.com',2),
-- KH
('KH','courier_domestic','Cambodia Post','https://cambodiapost.post',1),
('KH','courier_domestic','Kerry Express KH','https://kerryexpress.com/kh',2),
-- LK
('LK','courier_domestic','Sri Lanka Post','https://slpost.gov.lk',1),
('LK','courier_domestic','Kapruka','https://kapruka.com',2),
-- NP
('NP','courier_domestic','Nepal Post','https://gpo.gov.np',1),
-- KZ
('KZ','courier_domestic','Kazpost','https://kazpost.kz',1),
('KZ','courier_domestic','CDEK KZ','https://cdek.kz',2),
-- UZ
('UZ','courier_domestic','Uzpost','https://pochta.uz',1),
-- AZ
('AZ','courier_domestic','AzərPoçt','https://azerpocht.az',1),
-- GE
('GE','courier_domestic','Georgian Post','https://gpost.ge',1),
-- AM
('AM','courier_domestic','HayPost','https://haypost.am',1),
-- IL
('IL','courier_domestic','Israel Post','https://israelpost.co.il',1),
('IL','courier_domestic','DHL Israel','https://dhl.co.il',2),
-- SA
('SA','courier_domestic','SMSA Express','https://smsaexpress.com',1),
('SA','courier_domestic','Aramex KSA','https://aramex.com',2),
('SA','courier_domestic','Saudi Post','https://splonline.com.sa',3),
-- AE
('AE','courier_domestic','Emirates Post','https://emiratespost.ae',1),
('AE','courier_domestic','Aramex UAE','https://aramex.com',2),
('AE','courier_domestic','Fetchr','https://fetchr.us',3),
-- QA
('QA','courier_domestic','Qatar Post','https://qpost.com.qa',1),
('QA','courier_domestic','Aramex Qatar','https://aramex.com',2),
-- KW
('KW','courier_domestic','Kuwait Post','https://moc.gov.kw',1),
('KW','courier_domestic','Aramex Kuwait','https://aramex.com',2),
-- JO
('JO','courier_domestic','Jordan Post','https://jordanpost.com.jo',1),
('JO','courier_domestic','Aramex Jordan','https://aramex.com',2),
-- LB
('LB','courier_domestic','LibanPost','https://libanpost.com',1),
('LB','courier_domestic','Aramex Lebanon','https://aramex.com',2);

---------------------------------------------------------------------
-- 4. AFRICA (20 countries) — domestic couriers
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('ZA','courier_domestic','The Courier Guy','https://thecourierguy.co.za',1),
('ZA','courier_domestic','Aramex SA','https://aramex.com',2),
('ZA','courier_domestic','PostNet','https://postnet.co.za',3),
('NG','courier_domestic','GIG Logistics','https://giglogistics.com',1),
('NG','courier_domestic','DHL Nigeria','https://dhl.com/ng',2),
('NG','courier_domestic','NIPOST','https://nipost.gov.ng',3),
('KE','courier_domestic','Fargo Courier','https://faborecourier.co.ke',1),
('KE','courier_domestic','Sendy','https://sendy.co.ke',2),
('KE','courier_domestic','Posta Kenya','https://posta.co.ke',3),
('ET','courier_domestic','EthioPost','https://ethiopost.et',1),
('GH','courier_domestic','DHL Ghana','https://dhl.com/gh',1),
('GH','courier_domestic','Ghana Post','https://ghanapost.com.gh',2),
('TZ','courier_domestic','Tanzania Posts','https://posta.co.tz',1),
('UG','courier_domestic','Posta Uganda','https://ugapost.co.ug',1),
('CI','courier_domestic','La Poste CI','https://laposte.ci',1),
('SN','courier_domestic','La Poste Sénégal','https://laposte.sn',1),
('MA','courier_domestic','Amana Express','https://amana.ma',1),
('MA','courier_domestic','Maroc Post','https://poste.ma',2),
('EG','courier_domestic','Aramex Egypt','https://aramex.com',1),
('EG','courier_domestic','Egypt Post','https://egyptpost.gov.eg',2),
('EG','courier_domestic','Bosta','https://bosta.co',3),
('TN','courier_domestic','Rapid Poste','https://rapidposte.tn',1),
('TN','courier_domestic','Tunisia Post','https://poste.tn',2),
('DZ','courier_domestic','Algérie Poste','https://poste.dz',1),
('AO','courier_domestic','Angola Post','https://correiosdeangola.co.ao',1),
('CM','courier_domestic','Campost','https://campost.cm',1),
('ZM','courier_domestic','Zampost','https://zampost.co.zm',1),
('ZW','courier_domestic','Zimpost','https://zimpost.co.zw',1),
('MZ','courier_domestic','Correios de Moçambique','https://correios.co.mz',1),
('MG','courier_domestic','Paositra Malagasy','https://paositra.mg',1),
('RW','courier_domestic','Rwanda Post','https://i-posita.rw',1);

---------------------------------------------------------------------
-- 5. AMERICAS (20 countries) — domestic couriers
---------------------------------------------------------------------
INSERT INTO services_by_country (country_code, service_type, name, website_url, sort_order) VALUES
('US','courier_domestic','USPS','https://usps.com',1),
('US','courier_domestic','UPS Ground','https://ups.com',2),
('US','courier_domestic','FedEx Ground','https://fedex.com',3),
('US','courier_domestic','Amazon Logistics','https://logistics.amazon.com',4),
('CA','courier_domestic','Canada Post','https://canadapost-postescanada.ca',1),
('CA','courier_domestic','Purolator','https://purolator.com',2),
('CA','courier_domestic','Canpar','https://canpar.com',3),
('BR','courier_domestic','Correios','https://correios.com.br',1),
('BR','courier_domestic','Jadlog','https://jadlog.com.br',2),
('BR','courier_domestic','Loggi','https://loggi.com',3),
('BR','courier_domestic','Total Express','https://totalexpress.com.br',4),
('MX','courier_domestic','Estafeta','https://estafeta.com',1),
('MX','courier_domestic','Redpack','https://redpack.com.mx',2),
('MX','courier_domestic','Sendex','https://sendex.com.mx',3),
('MX','courier_domestic','Correos MX','https://correosdemexico.gob.mx',4),
('AR','courier_domestic','OCA','https://oca.com.ar',1),
('AR','courier_domestic','Andreani','https://andreani.com',2),
('AR','courier_domestic','Correo Argentino','https://correoargentino.com.ar',3),
('CO','courier_domestic','Servientrega','https://servientrega.com',1),
('CO','courier_domestic','Deprisa','https://deprisa.com',2),
('CO','courier_domestic','Coordinadora','https://coordinadora.com',3),
('CL','courier_domestic','Chilexpress','https://chilexpress.cl',1),
('CL','courier_domestic','Starken','https://starken.cl',2),
('CL','courier_domestic','Correos Chile','https://correos.cl',3),
('PE','courier_domestic','Olva Courier','https://olvacourier.com',1),
('PE','courier_domestic','Shalom','https://shalomdelivery.com',2),
('PE','courier_domestic','Serpost','https://serpost.com.pe',3),
('VE','courier_domestic','MRW Venezuela','https://mrw.com.ve',1),
('VE','courier_domestic','Tealca','https://tealca.com',2),
('EC','courier_domestic','Servientrega EC','https://servientrega.com.ec',1),
('EC','courier_domestic','Correos EC','https://correosdelecuador.gob.ec',2),
('BO','courier_domestic','EcoPacket','https://ecopacket.com.bo',1),
('BO','courier_domestic','CorreoBoliviano','https://correo.com.bo',2),
('PY','courier_domestic','Jet Courier','https://jetcourier.com.py',1),
('PY','courier_domestic','Correo Paraguay','https://correoparaguayo.gov.py',2),
('UY','courier_domestic','Correo Uruguayo','https://correo.com.uy',1),
('UY','courier_domestic','Urupost','https://urupost.com.uy',2),
('GT','courier_domestic','King Express','https://kingexpress.com.gt',1),
('GT','courier_domestic','Correos Guatemala','https://elcorreo.com.gt',2),
('DO','courier_domestic','Caribe Express','https://caribeexpress.com',1),
('DO','courier_domestic','Vimenpaq','https://vimenpaq.com',2),
('CR','courier_domestic','Correos CR','https://correos.go.cr',1),
('CR','courier_domestic','Urbano Express','https://urbano.co.cr',2),
('PA','courier_domestic','Cable & Wireless','https://cwpanama.com',1),
('PA','courier_domestic','Correos Panamá','https://correospanama.gob.pa',2),
('CU','courier_domestic','Correos Cuba','https://correos.cu',1),
('JM','courier_domestic','Jam Delivery','https://jamdelivery.com',1),
('TT','courier_domestic','TTPOST','https://ttpost.net',1);
