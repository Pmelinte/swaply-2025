// Run with: node scripts/seed-part2.mjs
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required: npm install @supabase/supabase-js
//
// Creates 350 auth users + profiles + onboarding_progress rows across 30 countries.
// Idempotent: skips any email already present in public.profiles.
// Writes scripts/seed-users.json at the end with { userId, email, countryCode, username } entries.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_USERS_FILE = resolve(__dirname, 'seed-users.json');
const TOTAL_USERS = 350;
const PASSWORD = 'Swaply2026!';

const countries = [
  { code: 'RO', city: 'București',         lat: 44.4268,  lon: 26.1025,  locale: 'ro', currency: 'RON', lang: 'ro' },
  { code: 'FR', city: 'Paris',             lat: 48.8566,  lon: 2.3522,   locale: 'fr', currency: 'EUR', lang: 'fr' },
  { code: 'DE', city: 'Berlin',            lat: 52.5200,  lon: 13.4050,  locale: 'de', currency: 'EUR', lang: 'de' },
  { code: 'ES', city: 'Madrid',            lat: 40.4168,  lon: -3.7038,  locale: 'es', currency: 'EUR', lang: 'es' },
  { code: 'IT', city: 'Roma',              lat: 41.9028,  lon: 12.4964,  locale: 'it', currency: 'EUR', lang: 'it' },
  { code: 'PL', city: 'Warszawa',          lat: 52.2297,  lon: 21.0122,  locale: 'pl', currency: 'PLN', lang: 'pl' },
  { code: 'NL', city: 'Amsterdam',         lat: 52.3676,  lon: 4.9041,   locale: 'nl', currency: 'EUR', lang: 'nl' },
  { code: 'PT', city: 'Lisboa',            lat: 38.7169,  lon: -9.1395,  locale: 'pt', currency: 'EUR', lang: 'pt' },
  { code: 'SE', city: 'Stockholm',         lat: 59.3293,  lon: 18.0686,  locale: 'sv', currency: 'SEK', lang: 'sv' },
  { code: 'HU', city: 'Budapest',          lat: 47.4979,  lon: 19.0402,  locale: 'hu', currency: 'HUF', lang: 'hu' },
  { code: 'CZ', city: 'Praha',             lat: 50.0755,  lon: 14.4378,  locale: 'cs', currency: 'CZK', lang: 'cs' },
  { code: 'GR', city: 'Athína',            lat: 37.9838,  lon: 23.7275,  locale: 'el', currency: 'EUR', lang: 'el' },
  { code: 'US', city: 'New York',          lat: 40.7128,  lon: -74.0060, locale: 'en', currency: 'USD', lang: 'en' },
  { code: 'CA', city: 'Toronto',           lat: 43.6532,  lon: -79.3832, locale: 'en', currency: 'CAD', lang: 'en' },
  { code: 'MX', city: 'Ciudad de México',  lat: 19.4326,  lon: -99.1332, locale: 'es', currency: 'MXN', lang: 'es' },
  { code: 'BR', city: 'São Paulo',         lat: -23.5505, lon: -46.6333, locale: 'pt', currency: 'BRL', lang: 'pt' },
  { code: 'AR', city: 'Buenos Aires',      lat: -34.6037, lon: -58.3816, locale: 'es', currency: 'ARS', lang: 'es' },
  { code: 'CO', city: 'Bogotá',            lat: 4.7110,   lon: -74.0721, locale: 'es', currency: 'COP', lang: 'es' },
  { code: 'JP', city: 'Tokyo',             lat: 35.6762,  lon: 139.6503, locale: 'ja', currency: 'JPY', lang: 'ja' },
  { code: 'KR', city: 'Seoul',             lat: 37.5665,  lon: 126.9780, locale: 'ko', currency: 'KRW', lang: 'ko' },
  { code: 'IN', city: 'Mumbai',            lat: 19.0760,  lon: 72.8777,  locale: 'hi', currency: 'INR', lang: 'hi' },
  { code: 'TR', city: 'Istanbul',          lat: 41.0082,  lon: 28.9784,  locale: 'tr', currency: 'TRY', lang: 'tr' },
  { code: 'AE', city: 'Dubai',             lat: 25.2048,  lon: 55.2708,  locale: 'ar', currency: 'AED', lang: 'ar' },
  { code: 'TH', city: 'Bangkok',           lat: 13.7563,  lon: 100.5018, locale: 'th', currency: 'THB', lang: 'th' },
  { code: 'SG', city: 'Singapore',         lat: 1.3521,   lon: 103.8198, locale: 'en', currency: 'SGD', lang: 'en' },
  { code: 'ZA', city: 'Cape Town',         lat: -33.9249, lon: 18.4241,  locale: 'en', currency: 'ZAR', lang: 'en' },
  { code: 'NG', city: 'Lagos',             lat: 6.5244,   lon: 3.3792,   locale: 'en', currency: 'NGN', lang: 'en' },
  { code: 'EG', city: 'Cairo',             lat: 30.0444,  lon: 31.2357,  locale: 'ar', currency: 'EGP', lang: 'ar' },
  { code: 'AU', city: 'Sydney',            lat: -33.8688, lon: 151.2093, locale: 'en', currency: 'AUD', lang: 'en' },
  { code: 'NZ', city: 'Auckland',          lat: -36.8485, lon: 174.7633, locale: 'en', currency: 'NZD', lang: 'en' },
];

const firstNames = {
  RO: ['Alexandru', 'Andrei', 'Mihai', 'Ion', 'Maria', 'Elena', 'Ioana', 'Ana', 'Raluca', 'Cristian'],
  FR: ['Pierre', 'Jean', 'Thomas', 'Nicolas', 'Marie', 'Sophie', 'Camille', 'Léa', 'Emma', 'Marc'],
  DE: ['Thomas', 'Michael', 'Stefan', 'Klaus', 'Anna', 'Maria', 'Laura', 'Julia', 'Sarah', 'Andreas'],
  ES: ['Carlos', 'Juan', 'Miguel', 'Antonio', 'María', 'Carmen', 'Ana', 'Laura', 'David', 'Isabel'],
  IT: ['Marco', 'Luca', 'Andrea', 'Matteo', 'Sofia', 'Giulia', 'Francesca', 'Chiara', 'Giovanni', 'Sara'],
  PL: ['Piotr', 'Tomasz', 'Jan', 'Anna', 'Maria', 'Katarzyna', 'Andrzej', 'Agnieszka', 'Marta', 'Krzysztof'],
  NL: ['Jan', 'Peter', 'Thomas', 'Emma', 'Sophie', 'Lisa', 'Anna', 'Mark', 'Paul', 'Julia'],
  PT: ['João', 'Pedro', 'Miguel', 'Maria', 'Ana', 'Sofia', 'Inês', 'António', 'Carlos', 'Beatriz'],
  SE: ['Erik', 'Lars', 'Johan', 'Anna', 'Maria', 'Emma', 'Anders', 'Karin', 'Sara', 'Mikael'],
  HU: ['István', 'László', 'Péter', 'Erzsébet', 'Katalin', 'András', 'Gábor', 'Mária', 'Zsuzsanna', 'Ágnes'],
  CZ: ['Jan', 'Petr', 'Martin', 'Jana', 'Marie', 'Lucie', 'Tomáš', 'Eva', 'Tereza', 'Jakub'],
  GR: ['Nikos', 'Kostas', 'Dimitris', 'Maria', 'Eleni', 'Giorgos', 'Sofia', 'Anna', 'Panagiotis', 'Aikaterini'],
  US: ['James', 'John', 'Robert', 'Michael', 'Mary', 'Patricia', 'Jennifer', 'William', 'Linda', 'Barbara'],
  CA: ['Liam', 'Noah', 'Oliver', 'Emma', 'Olivia', 'Ava', 'James', 'Sophie', 'Charlotte', 'William'],
  MX: ['José', 'Luis', 'Carlos', 'María', 'Guadalupe', 'Rosa', 'Manuel', 'Carmen', 'Jorge', 'Ana'],
  BR: ['João', 'Pedro', 'Lucas', 'Gabriel', 'Ana', 'Maria', 'Juliana', 'Fernanda', 'Mateus', 'Beatriz'],
  AR: ['Juan', 'Carlos', 'Diego', 'María', 'Laura', 'Valentina', 'Martín', 'Florencia', 'Federico', 'Lucía'],
  CO: ['Carlos', 'Juan', 'Andrés', 'María', 'Valentina', 'Camila', 'Diego', 'Laura', 'Santiago', 'Ana'],
  JP: ['Hiroshi', 'Kenji', 'Takashi', 'Yoko', 'Keiko', 'Hanako', 'Yuki', 'Satoshi', 'Akiko', 'Naomi'],
  KR: ['Minjun', 'Seojun', 'Minji', 'Soyeon', 'Dohyun', 'Junho', 'Jiyeon', 'Eunji', 'Jisoo', 'Chaeyeon'],
  IN: ['Raj', 'Amit', 'Vikram', 'Priya', 'Sunita', 'Anjali', 'Suresh', 'Kavita', 'Ravi', 'Pooja'],
  TR: ['Mehmet', 'Ali', 'Mustafa', 'Fatma', 'Ayşe', 'Emine', 'Ahmet', 'Hatice', 'İbrahim', 'Zeynep'],
  AE: ['Mohammed', 'Ahmed', 'Ali', 'Fatima', 'Aisha', 'Mariam', 'Omar', 'Noura', 'Khalid', 'Sara'],
  TH: ['Somchai', 'Wichai', 'Malee', 'Nong', 'Prasert', 'Nid', 'Narong', 'Wan', 'Sombat', 'Pim'],
  SG: ['Wei', 'Jun', 'Ming', 'Li', 'Mei', 'Kai', 'Xin', 'Hui', 'Jian', 'Ying'],
  ZA: ['Sipho', 'Thabo', 'Lerato', 'Nomsa', 'Bongani', 'Zanele', 'Nkosi', 'Thandi', 'Ayanda', 'Siyanda'],
  NG: ['Emeka', 'Chidi', 'Ngozi', 'Chioma', 'Tunde', 'Adaeze', 'Kola', 'Funke', 'Bayo', 'Yetunde'],
  EG: ['Mohamed', 'Ahmed', 'Fatima', 'Nour', 'Mahmoud', 'Hana', 'Ali', 'Sara', 'Omar', 'Dina'],
  AU: ['Oliver', 'Jack', 'Charlotte', 'Olivia', 'William', 'Ava', 'Noah', 'Mia', 'James', 'Isla'],
  NZ: ['Oliver', 'Jack', 'Olivia', 'Isabella', 'Noah', 'Charlotte', 'Liam', 'Ava', 'Lucas', 'Mia'],
};

const lastNames = {
  RO: ['Popescu', 'Ionescu', 'Popa', 'Constantin', 'Gheorghe', 'Stoica', 'Stan', 'Radu', 'Marin', 'Dumitrescu'],
  FR: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Richard', 'Durand', 'Leroy', 'Moreau'],
  DE: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'],
  ES: ['García', 'Martínez', 'López', 'Sánchez', 'González', 'Rodríguez', 'Fernández', 'Pérez', 'Gómez', 'Díaz'],
  IT: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'],
  PL: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Woźniak', 'Szymański'],
  NL: ['deJong', 'Jansen', 'deVries', 'vandenBerg', 'vanDijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer'],
  PT: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa'],
  SE: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Gustafsson'],
  HU: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas'],
  CZ: ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Blažek', 'Kratochvíl'],
  GR: ['Papadopoulos', 'Papageorgiou', 'Ioannou', 'Georgiou', 'Athanasiou', 'Nikolaou', 'Papanikolaou', 'Dimitriou', 'Konstantinou', 'Christodoulou'],
  US: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Martinez'],
  CA: ['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'MacDonald', 'Taylor', 'Campbell', 'Anderson'],
  MX: ['González', 'Rodríguez', 'López', 'Martínez', 'Hernández', 'García', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'],
  BR: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'],
  AR: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Martínez', 'Díaz', 'Pérez', 'García', 'Sánchez'],
  CO: ['González', 'Rodríguez', 'García', 'Martínez', 'López', 'Hernández', 'Díaz', 'Torres', 'Vargas', 'Gómez'],
  JP: ['Sato', 'Suzuki', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida'],
  KR: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Im'],
  IN: ['Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Joshi', 'Mehta', 'Shah', 'Rao'],
  TR: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Arslan', 'Doğan'],
  AE: ['AlRashid', 'AlMansoori', 'AlMaktoum', 'AlNahyan', 'AlFalasi', 'AlMazrouei', 'AlShamsi', 'AlKaabi', 'AlNuaimi', 'AlQubaisi'],
  TH: ['Srisuk', 'Jaidee', 'Buaklee', 'Wongsak', 'Somporn', 'Rakdee', 'Phromma', 'Chaiyo', 'Saetan', 'Deesom'],
  SG: ['Tan', 'Lim', 'Lee', 'Ng', 'Wong', 'Chan', 'Goh', 'Chua', 'Ong', 'Koh'],
  ZA: ['Dlamini', 'Nkosi', 'Mthembu', 'Ndlovu', 'Zulu', 'Sithole', 'Mkhize', 'Ntuli', 'Mabaso', 'Khumalo'],
  NG: ['Okonkwo', 'Adeyemi', 'Okafor', 'Adesanya', 'Nwosu', 'Adeleke', 'Obi', 'Adewale', 'Eze', 'Ogundimu'],
  EG: ['Hassan', 'Ibrahim', 'Khalil', 'Mahmoud', 'Nasser', 'Salem', 'Youssef', 'Farid', 'Mansour', 'Badr'],
  AU: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson'],
  NZ: ['Smith', 'Jones', 'Williams', 'Brown', 'Taylor', 'Wilson', 'Johnson', 'Walker', 'Anderson', 'Thompson'],
};

const bios = {
  ro: ['Colecționar pasionat, caut schimburi corecte.', 'Îmi place să dau lucrurilor o a doua șansă.', 'Minimalism în acțiune.'],
  fr: ['Échange équitable, toujours.', 'Passionné de troc et objets vintage.', 'Je préfère échanger plutôt qu\'acheter.'],
  de: ['Tauschen statt kaufen.', 'Nachhaltigkeit durch Tauschen.', 'Sammler sucht faire Tauschpartner.'],
  es: ['Intercambio justo y sostenible.', 'Me encanta dar nueva vida a las cosas.', 'Coleccionista buscando buenos trueques.'],
  it: ['Scambio equo e sostenibile.', 'Amo dare nuova vita agli oggetti.', 'Collezionista in cerca di scambi onesti.'],
  pl: ['Wymiana zamiast kupowania.', 'Pasjonat zrównoważonej wymiany.', 'Kolekcjoner szukający uczciwych wymian.'],
  nl: ['Ruilen in plaats van kopen.', 'Gepassioneerd door duurzaam ruilen.', 'Verzamelaar op zoek naar eerlijke ruil.'],
  pt: ['Troca justa e sustentável.', 'Amo dar nova vida às coisas.', 'Colecionador buscando boas trocas.'],
  sv: ['Byta istället för att köpa.', 'Passionerad för hållbart byte.', 'Samlare söker rättvisa byten.'],
  hu: ['Csere vásárlás helyett.', 'Szenvedélyesen cserélek.', 'Gyűjtő, igazságos cserét keresek.'],
  cs: ['Výměna místo nakupování.', 'Nadšenec udržitelné výměny.', 'Sběratel hledající férové výměny.'],
  el: ['Ανταλλαγή αντί για αγορά.', 'Παθιασμένος με βιώσιμες ανταλλαγές.', 'Συλλέκτης που αναζητά δίκαιες ανταλλαγές.'],
  en: ['Passionate about sustainable swapping.', 'Give items a second life.', 'Collector looking for fair trades.'],
  ja: ['フェアなスワップを求めています。', '物に第二の命を与えたい。', 'コレクター、公平な取引を探しています。'],
  ko: ['공정한 교환을 원합니다.', '물건에 새 생명을 불어넣어요.', '컬렉터, 좋은 거래를 찾습니다.'],
  hi: ['उचित विनिमय की तलाश में।', 'चीजों को दूसरा जीवन देना पसंद है।', 'संग्रहकर्ता, उचित व्यापार की तलाश।'],
  tr: ['Satın almak yerine takas.', 'Sürdürülebilir takasa tutkuluyum.', 'Koleksiyoncu, adil takas arıyor.'],
  ar: ['أبحث عن تبادل عادل.', 'أحب إعطاء الأشياء حياة ثانية.', 'جامع يبحث عن صفقات عادلة.'],
  th: ['แลกเปลี่ยนแทนการซื้อ', 'หลงใหลในการแลกเปลี่ยนอย่างยั่งยืน', 'นักสะสมที่มองหาการแลกเปลี่ยนที่ยุติธรรม'],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ascii = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

function loadExistingSeedUsers() {
  if (!existsSync(SEED_USERS_FILE)) return [];
  try {
    const raw = readFileSync(SEED_USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`Could not parse existing ${SEED_USERS_FILE}: ${err.message}`);
    return [];
  }
}

function saveSeedUsers(users) {
  writeFileSync(SEED_USERS_FILE, JSON.stringify(users, null, 2) + '\n');
}

async function emailExistsInProfiles(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle();
  if (error) throw new Error(`profiles lookup failed: ${error.message}`);
  return data ?? null;
}

function buildProfileRow({ userId, email, username, firstName, lastName, country, indexInCountry }) {
  const i = indexInCountry;
  const badge = i % 10 < 7 ? 'free' : i % 10 < 9 ? 'gold' : 'premium';
  const subscriptionPlan = badge === 'free' ? 'free' : badge === 'gold' ? 'starter' : 'pro';
  const trustLevel = i % 10 < 6 ? 'starter' : i % 10 < 8 ? 'verified' : i % 10 < 9 ? 'trusted' : 'ambassador';
  const openToTypes = ['object', 'property', 'service', 'event'].filter(() => Math.random() > 0.4);
  const languages = Array.from(new Set([country.lang, 'en']));

  return {
    user_id: userId,
    email,
    username,
    full_name: `${firstName} ${lastName}`,
    first_name: firstName,
    display_name: firstName,
    bio: pick(bios[country.lang] || bios.en),
    location_text: `${country.city}, ${country.code}`,
    location: { city: country.city, country: country.code, lat: country.lat, lon: country.lon },
    address_city: country.city,
    address_country: country.code,
    address_lat: +(country.lat + (Math.random() - 0.5) * 0.1).toFixed(6),
    address_lon: +(country.lon + (Math.random() - 0.5) * 0.1).toFixed(6),
    preferred_locale: country.locale,
    preferred_currency: country.currency,
    languages,
    badge,
    subscription_plan: subscriptionPlan,
    trust_level: trustLevel,
    trust_score: rand(0, 800),
    swap_intent: pick(['exploring', 'open', 'clear', 'serious']),
    swap_geo_range: pick(['local', 'regional', 'international', 'vacation']),
    open_to_types: openToTypes.length > 0 ? openToTypes : ['object'],
    onboarding_completed: true,
    onboarding_step: 'done',
    profile_completeness: rand(75, 100),
    last_active_at: new Date(Date.now() - rand(0, 30) * 86_400_000).toISOString(),
    swaps_completed: rand(0, 15),
    rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
    rating_count: rand(0, 20),
    swap_context: ['permanent'],
    role: 'user',
    is_suspended: false,
    is_banned: false,
    report_count: 0,
    token_balance: rand(0, 100),
  };
}

function buildOnboardingRow(userId) {
  return {
    user_id: userId,
    step_profile: true,
    step_first_item: true,
    step_first_match: true,
    step_first_swap: true,
    step_verified: false,
    current_step: 'done',
    completed_at: new Date().toISOString(),
  };
}

function distributeUsersPerCountry(total, countryCount) {
  const base = Math.floor(total / countryCount);
  const remainder = total - base * countryCount;
  return Array.from({ length: countryCount }, (_, idx) => base + (idx < remainder ? 1 : 0));
}

async function main() {
  const seedUsers = loadExistingSeedUsers();
  const usedEmails = new Set(seedUsers.map((u) => u.email));

  const perCountry = distributeUsersPerCountry(TOTAL_USERS, countries.length);
  const target = perCountry.reduce((a, b) => a + b, 0);
  console.log(`Target: ${target} users across ${countries.length} countries.`);
  console.log(`Per-country counts: ${perCountry.join(',')}`);
  console.log(`Already in ${SEED_USERS_FILE}: ${seedUsers.length} users`);

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let attempted = 0;

  for (let ci = 0; ci < countries.length; ci++) {
    const country = countries[ci];
    const firsts = firstNames[country.code];
    const lasts = lastNames[country.code];
    let perCountryCreated = 0;
    let perCountryAttempts = 0;
    const targetForCountry = perCountry[ci];

    while (perCountryCreated < targetForCountry && perCountryAttempts < targetForCountry * 5) {
      perCountryAttempts++;
      attempted++;

      const firstName = pick(firsts);
      const lastName = pick(lasts);
      const suffix = String(rand(100, 999));
      const firstSlug = ascii(firstName) || 'user';
      const lastSlug = ascii(lastName) || 'user';
      const username = `${firstSlug}_${suffix}`;
      const email = `${firstSlug}.${lastSlug}${suffix}@gmail.com`;

      if (usedEmails.has(email)) {
        continue;
      }

      try {
        const existing = await emailExistsInProfiles(email);
        if (existing) {
          skipped++;
          usedEmails.add(email);
          console.log(`Skipped existing: ${email}`);
          continue;
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: `${firstName} ${lastName}` },
        });

        if (authError || !authData?.user) {
          errors++;
          console.error(`  auth.admin.createUser failed for ${email}: ${authError?.message ?? 'unknown error'}`);
          await sleep(200);
          continue;
        }

        const userId = authData.user.id;

        const profileRow = buildProfileRow({
          userId,
          email,
          username,
          firstName,
          lastName,
          country,
          indexInCountry: perCountryCreated,
        });

        const { error: profileError } = await supabase.from('profiles').insert(profileRow);

        if (profileError) {
          errors++;
          console.error(`  profiles insert failed for ${email}: ${profileError.message}`);
          await supabase.auth.admin.deleteUser(userId).catch(() => {});
          await sleep(200);
          continue;
        }

        const onboardingRow = buildOnboardingRow(userId);
        const { error: onboardError } = await supabase.from('onboarding_progress').insert(onboardingRow);

        if (onboardError) {
          errors++;
          console.error(`  onboarding_progress insert failed for ${email}: ${onboardError.message}`);
        }

        const record = { userId, email, countryCode: country.code, username };
        seedUsers.push(record);
        usedEmails.add(email);
        created++;
        perCountryCreated++;

        console.log(`User ${created + skipped}/${target}: ${email} [${country.code}]`);
      } catch (err) {
        errors++;
        console.error(`  Unexpected error for ${email}: ${err.message}`);
      }

      await sleep(200);

      if (created > 0 && created % 25 === 0) {
        saveSeedUsers(seedUsers);
      }
    }

    if (perCountryCreated < targetForCountry) {
      console.warn(`  ${country.code}: only ${perCountryCreated}/${targetForCountry} created (exceeded attempt budget)`);
    }
  }

  saveSeedUsers(seedUsers);
  console.log(`\nDone: ${created} created, ${skipped} skipped, ${errors} errors (attempted ${attempted})`);
  console.log(`Seed users saved to ${SEED_USERS_FILE} (total ${seedUsers.length} entries).`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
