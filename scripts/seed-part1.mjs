// Run with: node scripts/seed-part1.mjs
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required: npm install @supabase/supabase-js
//
// Seeds public.services_by_country with:
//   - international couriers (DHL, FedEx, UPS) for all 30 countries
//   - domestic couriers per country
//   - local payment methods per country
//
// Idempotent: rows with the same (country_code, service_type, name) are skipped.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COUNTRY_CODES = [
  'RO', 'FR', 'DE', 'ES', 'IT', 'PL', 'NL', 'PT', 'SE', 'HU', 'CZ', 'GR',
  'US', 'CA', 'MX', 'BR', 'AR', 'CO',
  'JP', 'KR', 'IN', 'TR', 'AE', 'TH', 'SG',
  'ZA', 'NG', 'EG',
  'AU', 'NZ',
];

const INTERNATIONAL_COURIERS = [
  { name: 'DHL International', website_url: 'https://www.dhl.com' },
  { name: 'FedEx', website_url: 'https://www.fedex.com' },
  { name: 'UPS International', website_url: 'https://www.ups.com' },
];

const DOMESTIC_COURIERS = {
  RO: [{ name: 'FAN Courier', url: 'https://www.fancourier.ro' }, { name: 'Cargus', url: 'https://www.cargus.ro' }],
  FR: [{ name: 'Colissimo', url: 'https://www.laposte.fr' }, { name: 'Chronopost', url: 'https://www.chronopost.fr' }],
  DE: [{ name: 'DPD Germany', url: 'https://www.dpd.com/de' }, { name: 'Hermes Germany', url: 'https://www.myhermes.de' }],
  ES: [{ name: 'SEUR', url: 'https://www.seur.com' }, { name: 'Correos Express', url: 'https://www.correosexpress.com' }],
  IT: [{ name: 'BRT', url: 'https://www.brt.it' }, { name: 'Poste Italiane', url: 'https://www.poste.it' }],
  PL: [{ name: 'InPost', url: 'https://inpost.pl' }, { name: 'DPD Poland', url: 'https://www.dpd.com.pl' }],
  NL: [{ name: 'PostNL', url: 'https://www.postnl.nl' }, { name: 'DHL Netherlands', url: 'https://www.dhl.com/nl' }],
  PT: [{ name: 'CTT', url: 'https://www.ctt.pt' }, { name: 'DPD Portugal', url: 'https://www.dpd.pt' }],
  SE: [{ name: 'PostNord', url: 'https://www.postnord.se' }, { name: 'Bring', url: 'https://www.bring.se' }],
  HU: [{ name: 'Magyar Posta', url: 'https://www.posta.hu' }, { name: 'GLS Hungary', url: 'https://gls-group.com/HU' }],
  CZ: [{ name: 'Zásilkovna', url: 'https://www.zasilkovna.cz' }, { name: 'PPL CZ', url: 'https://www.ppl.cz' }],
  GR: [{ name: 'ELTA Courier', url: 'https://www.eltacourier.gr' }, { name: 'ACS Courier', url: 'https://www.acscourier.net' }],
  US: [{ name: 'USPS', url: 'https://www.usps.com' }, { name: 'UPS Domestic', url: 'https://www.ups.com' }],
  CA: [{ name: 'Canada Post', url: 'https://www.canadapost-postescanada.ca' }, { name: 'Purolator', url: 'https://www.purolator.com' }],
  MX: [{ name: 'Estafeta', url: 'https://www.estafeta.com' }, { name: 'Redpack', url: 'https://www.redpack.com.mx' }],
  BR: [{ name: 'Correios', url: 'https://www.correios.com.br' }, { name: 'Jadlog', url: 'https://www.jadlog.com.br' }],
  AR: [{ name: 'OCA', url: 'https://www.oca.com.ar' }, { name: 'Andreani', url: 'https://www.andreani.com' }],
  CO: [{ name: 'Servientrega', url: 'https://www.servientrega.com' }, { name: 'Deprisa', url: 'https://www.deprisa.com' }],
  JP: [{ name: 'Yamato Transport', url: 'https://www.kuronekoyamato.co.jp' }, { name: 'Japan Post', url: 'https://www.japanpost.jp' }],
  KR: [{ name: 'CJ Logistics', url: 'https://www.cjlogistics.com' }, { name: 'Korea Post', url: 'https://www.koreapost.go.kr' }],
  IN: [{ name: 'India Post', url: 'https://www.indiapost.gov.in' }, { name: 'Blue Dart', url: 'https://www.bluedart.com' }],
  TR: [{ name: 'Yurtiçi Kargo', url: 'https://www.yurticikargo.com' }, { name: 'Aras Kargo', url: 'https://www.araskargo.com.tr' }],
  AE: [{ name: 'Aramex', url: 'https://www.aramex.com' }, { name: 'Emirates Post', url: 'https://www.emiratespost.ae' }],
  TH: [{ name: 'Thailand Post', url: 'https://www.thailandpost.co.th' }, { name: 'Kerry Express', url: 'https://th.kerryexpress.com' }],
  SG: [{ name: 'SingPost', url: 'https://www.singpost.com' }, { name: 'Ninja Van', url: 'https://www.ninjavan.co/sg' }],
  ZA: [{ name: 'The Courier Guy', url: 'https://www.thecourierguy.co.za' }, { name: 'Fastway', url: 'https://www.fastway.co.za' }],
  NG: [{ name: 'DHL Nigeria', url: 'https://www.dhl.com/ng' }, { name: 'GIG Logistics', url: 'https://giglogistics.com' }],
  EG: [{ name: 'Egypt Post', url: 'https://www.egyptpost.org' }, { name: 'Aramex Egypt', url: 'https://www.aramex.com/eg' }],
  AU: [{ name: 'Australia Post', url: 'https://auspost.com.au' }, { name: 'Toll', url: 'https://www.tollgroup.com' }],
  NZ: [{ name: 'NZ Post', url: 'https://www.nzpost.co.nz' }, { name: 'CourierPost', url: 'https://www.courierpost.co.nz' }],
};

const PAYMENT_METHODS = {
  RO: 'Revolut, card bancar',
  FR: 'Lydia, PayLib',
  DE: 'SEPA, Klarna, PayPal',
  ES: 'Bizum',
  IT: 'Satispay',
  PL: 'BLIK',
  NL: 'iDEAL, Tikkie',
  PT: 'MB Way',
  SE: 'Swish',
  HU: 'Revolut',
  CZ: 'Revolut',
  GR: 'Viva Wallet',
  US: 'Venmo, Zelle, PayPal',
  CA: 'Interac e-Transfer',
  MX: 'SPEI, OXXO Pay',
  BR: 'PIX',
  AR: 'Mercado Pago',
  CO: 'Nequi, Daviplata',
  JP: 'PayPay',
  KR: 'KakaoPay',
  IN: 'UPI, PhonePe',
  TR: 'Papara',
  AE: 'Apple Pay',
  TH: 'PromptPay',
  SG: 'PayNow',
  ZA: 'SnapScan, EFT',
  NG: 'Flutterwave',
  EG: 'Fawry',
  AU: 'PayID, BPAY',
  NZ: 'POLi',
};

function buildRows() {
  const rows = [];

  for (const code of COUNTRY_CODES) {
    for (const intl of INTERNATIONAL_COURIERS) {
      rows.push({
        country_code: code,
        service_type: 'courier_international',
        name: intl.name,
        website_url: intl.website_url,
        is_active: true,
      });
    }
  }

  for (const code of COUNTRY_CODES) {
    const couriers = DOMESTIC_COURIERS[code] ?? [];
    for (const c of couriers) {
      rows.push({
        country_code: code,
        service_type: 'courier_domestic',
        name: c.name,
        website_url: c.url,
        is_active: true,
      });
    }
  }

  for (const code of COUNTRY_CODES) {
    const pm = PAYMENT_METHODS[code];
    if (!pm) continue;
    rows.push({
      country_code: code,
      service_type: 'payment_method',
      name: pm,
      website_url: '#',
      is_active: true,
    });
  }

  return rows;
}

async function fetchExistingKeys() {
  const keys = new Set();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('services_by_country')
      .select('country_code, service_type, name')
      .in('country_code', COUNTRY_CODES)
      .in('service_type', ['courier_international', 'courier_domestic', 'payment_method'])
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch existing services_by_country rows: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      keys.add(`${row.country_code}|${row.service_type}|${row.name}`);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return keys;
}

async function main() {
  const allRows = buildRows();
  console.log(`Built ${allRows.length} candidate rows for services_by_country.`);

  const existing = await fetchExistingKeys();
  console.log(`Found ${existing.size} existing rows matching our targets.`);

  const newRows = allRows.filter(
    (r) => !existing.has(`${r.country_code}|${r.service_type}|${r.name}`),
  );
  console.log(`${newRows.length} rows to insert (skipping ${allRows.length - newRows.length} duplicates).`);

  if (newRows.length === 0) {
    console.log('services_by_country done: 0 rows inserted');
    return;
  }

  let inserted = 0;
  const BATCH = 100;

  for (let i = 0; i < newRows.length; i += BATCH) {
    const batch = newRows.slice(i, i + BATCH);
    const { error, count } = await supabase
      .from('services_by_country')
      .insert(batch, { count: 'exact' });

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH) + 1} failed:`, error.message);
      continue;
    }

    const n = typeof count === 'number' ? count : batch.length;
    inserted += n;
    console.log(`  Inserted batch ${Math.floor(i / BATCH) + 1}: ${n} rows (running total ${inserted})`);
  }

  console.log(`services_by_country done: ${inserted} rows inserted`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
