/**
 * Country Service Registry for Swaply.
 *
 * Maps each supported country to its available services:
 *   - Domestic courier providers
 *   - Preferred payment methods
 *   - Default currency
 *   - International shipping provider
 *   - Ground transport operators
 *
 * This registry enables Swaply to adapt services per country
 * while keeping a unified API surface.
 */

// ── Types ──

export type CountryCode = string; // ISO 3166-1 alpha-2

export interface CourierProviderConfig {
  id: string;
  name: string;
  /** Env var prefix used to check configuration (e.g. "FANCOURIER" checks FANCOURIER_CLIENT_ID) */
  envPrefix: string;
  trackingUrlTemplate?: string;
}

export type PaymentMethod =
  | "stripe"
  | "paypal"
  | "ideal"        // Netherlands
  | "bancontact"   // Belgium
  | "blik"         // Poland
  | "eps"          // Austria
  | "giropay"      // Germany
  | "p24"          // Poland
  | "sofort"       // Germany/Austria
  | "multibanco"   // Portugal
  | "mbway"        // Portugal
  | "bizum"        // Spain
  | "swish"        // Sweden
  | "mobilepay"    // Denmark
  | "vipps"        // Norway
  | "pix"          // Brazil
  | "boleto"       // Brazil
  | "oxxo"         // Mexico
  | "payu"         // Eastern Europe
  | "klarna"       // Nordics / EU
  | "revolut"      // Pan-EU
  | "twint"        // Switzerland
  | "satispay"     // Italy
  | "cashapp"      // USA
  | "venmo";       // USA

export type GroundTransportProvider =
  | "flixbus"
  | "omio"
  | "blablacar"
  | "cfr"          // Romania
  | "sncf"         // France
  | "db"           // Germany
  | "renfe"        // Spain
  | "trenitalia"   // Italy
  | "obb"          // Austria
  | "sj"           // Sweden
  | "ns"           // Netherlands
  | "sbb"          // Switzerland
  | "pkp"          // Poland
  | "cd"           // Czech Republic
  | "mav"          // Hungary
  | "amtrak"       // USA
  | "viarail";     // Canada

export interface CountryServiceConfig {
  /** ISO 3166-1 alpha-2 */
  code: CountryCode;
  /** Country name in English */
  name: string;
  /** Default currency code (ISO 4217) */
  currency: string;
  /** Currency symbol for display */
  currencySymbol: string;
  /** VAT rate (percentage, 0-100) */
  vatRate: number;
  /** Available domestic courier providers */
  couriers: CourierProviderConfig[];
  /** Preferred payment methods (ordered by preference) */
  paymentMethods: PaymentMethod[];
  /** Ground transport providers available */
  groundTransport: GroundTransportProvider[];
  /** Whether DHL Express is available for international shipping */
  dhlAvailable: boolean;
  /** Region grouping for logistics */
  region: "eu" | "europe_non_eu" | "north_america" | "south_america" | "asia" | "middle_east" | "africa" | "oceania";
  /** EU member state */
  isEU: boolean;
  /** Address format hint */
  addressFormat: "eu_standard" | "uk" | "us" | "asian";
}

// ── Registry Data ──

const COUNTRY_REGISTRY: CountryServiceConfig[] = [
  // ── Romania (home market) ──
  {
    code: "RO",
    name: "Romania",
    currency: "RON",
    currencySymbol: "lei",
    vatRate: 19,
    couriers: [
      { id: "fancourier", name: "FanCourier", envPrefix: "FANCOURIER", trackingUrlTemplate: "https://www.fancourier.ro/awb-tracking/?awb={awb}" },
      { id: "sameday", name: "Sameday", envPrefix: "SAMEDAY", trackingUrlTemplate: "https://sameday.ro/tracking/awb/{awb}" },
      { id: "cargus", name: "Cargus", envPrefix: "CARGUS", trackingUrlTemplate: "https://www.cargus.ro/tracking/?t={awb}" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["cfr", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Germany ──
  {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 19,
    couriers: [
      { id: "dhl_paket", name: "DHL Paket", envPrefix: "DHL_PAKET", trackingUrlTemplate: "https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={awb}" },
      { id: "hermes", name: "Hermes", envPrefix: "HERMES", trackingUrlTemplate: "https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/{awb}" },
      { id: "dpd_de", name: "DPD", envPrefix: "DPD_DE", trackingUrlTemplate: "https://tracking.dpd.de/status/de_DE/parcel/{awb}" },
      { id: "gls_de", name: "GLS", envPrefix: "GLS_DE", trackingUrlTemplate: "https://gls-group.eu/DE/de/paketverfolgung?match={awb}" },
    ],
    paymentMethods: ["stripe", "paypal", "klarna", "sofort", "giropay", "revolut"],
    groundTransport: ["db", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── France ──
  {
    code: "FR",
    name: "France",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 20,
    couriers: [
      { id: "colissimo", name: "Colissimo", envPrefix: "COLISSIMO", trackingUrlTemplate: "https://www.laposte.fr/outils/suivre-vos-envois?code={awb}" },
      { id: "chronopost", name: "Chronopost", envPrefix: "CHRONOPOST", trackingUrlTemplate: "https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={awb}" },
      { id: "mondial_relay", name: "Mondial Relay", envPrefix: "MONDIAL_RELAY", trackingUrlTemplate: "https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition={awb}" },
    ],
    paymentMethods: ["stripe", "paypal", "klarna", "revolut"],
    groundTransport: ["sncf", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Italy ──
  {
    code: "IT",
    name: "Italy",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 22,
    couriers: [
      { id: "poste_italiane", name: "Poste Italiane", envPrefix: "POSTE_IT", trackingUrlTemplate: "https://www.poste.it/cerca/index.html#/risultati-tracciatura/{awb}" },
      { id: "brt", name: "BRT (Bartolini)", envPrefix: "BRT", trackingUrlTemplate: "https://vas.brt.it/vas/sped_det_show.hsm?referer=sped_numsped_par.htm&Ession_tracing={awb}" },
      { id: "gls_it", name: "GLS Italy", envPrefix: "GLS_IT" },
    ],
    paymentMethods: ["stripe", "paypal", "satispay", "klarna", "revolut"],
    groundTransport: ["trenitalia", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Spain ──
  {
    code: "ES",
    name: "Spain",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 21,
    couriers: [
      { id: "correos", name: "Correos", envPrefix: "CORREOS", trackingUrlTemplate: "https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number={awb}" },
      { id: "seur", name: "SEUR", envPrefix: "SEUR", trackingUrlTemplate: "https://www.seur.com/livetracking/?segOnlineIdentificador={awb}" },
      { id: "mrw", name: "MRW", envPrefix: "MRW" },
    ],
    paymentMethods: ["stripe", "paypal", "bizum", "klarna", "revolut"],
    groundTransport: ["renfe", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Netherlands ──
  {
    code: "NL",
    name: "Netherlands",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 21,
    couriers: [
      { id: "postnl", name: "PostNL", envPrefix: "POSTNL", trackingUrlTemplate: "https://postnl.nl/tracktrace/?B={awb}" },
      { id: "dpd_nl", name: "DPD", envPrefix: "DPD_NL" },
    ],
    paymentMethods: ["stripe", "paypal", "ideal", "klarna", "revolut"],
    groundTransport: ["ns", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Poland ──
  {
    code: "PL",
    name: "Poland",
    currency: "PLN",
    currencySymbol: "z\u0142",
    vatRate: 23,
    couriers: [
      { id: "inpost", name: "InPost", envPrefix: "INPOST", trackingUrlTemplate: "https://inpost.pl/sledzenie-przesylek?number={awb}" },
      { id: "poczta_polska", name: "Poczta Polska", envPrefix: "POCZTA_PL", trackingUrlTemplate: "https://emonitoring.poczta-polska.pl/?numer={awb}" },
      { id: "dpd_pl", name: "DPD Poland", envPrefix: "DPD_PL" },
    ],
    paymentMethods: ["stripe", "paypal", "blik", "p24", "klarna", "revolut"],
    groundTransport: ["pkp", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Austria ──
  {
    code: "AT",
    name: "Austria",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 20,
    couriers: [
      { id: "post_at", name: "\u00D6sterreichische Post", envPrefix: "POST_AT" },
      { id: "dpd_at", name: "DPD Austria", envPrefix: "DPD_AT" },
    ],
    paymentMethods: ["stripe", "paypal", "eps", "sofort", "klarna", "revolut"],
    groundTransport: ["obb", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Belgium ──
  {
    code: "BE",
    name: "Belgium",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 21,
    couriers: [
      { id: "bpost", name: "bpost", envPrefix: "BPOST" },
    ],
    paymentMethods: ["stripe", "paypal", "bancontact", "klarna", "revolut"],
    groundTransport: ["flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Portugal ──
  {
    code: "PT",
    name: "Portugal",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 23,
    couriers: [
      { id: "ctt", name: "CTT", envPrefix: "CTT", trackingUrlTemplate: "https://www.ctt.pt/feapl_2/app/open/objectSearch/objectSearch.jspx?objects={awb}" },
    ],
    paymentMethods: ["stripe", "paypal", "multibanco", "mbway", "revolut"],
    groundTransport: ["flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Czech Republic ──
  {
    code: "CZ",
    name: "Czech Republic",
    currency: "CZK",
    currencySymbol: "K\u010D",
    vatRate: 21,
    couriers: [
      { id: "ceska_posta", name: "\u010Cesk\u00E1 po\u0161ta", envPrefix: "CESKA_POSTA" },
      { id: "zasilkovna", name: "Z\u00E1silkovna", envPrefix: "ZASILKOVNA" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["cd", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Hungary ──
  {
    code: "HU",
    name: "Hungary",
    currency: "HUF",
    currencySymbol: "Ft",
    vatRate: 27,
    couriers: [
      { id: "magyar_posta", name: "Magyar Posta", envPrefix: "MAGYAR_POSTA" },
      { id: "gls_hu", name: "GLS Hungary", envPrefix: "GLS_HU" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["mav", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Sweden ──
  {
    code: "SE",
    name: "Sweden",
    currency: "SEK",
    currencySymbol: "kr",
    vatRate: 25,
    couriers: [
      { id: "postnord_se", name: "PostNord", envPrefix: "POSTNORD_SE" },
    ],
    paymentMethods: ["stripe", "paypal", "swish", "klarna", "revolut"],
    groundTransport: ["sj", "flixbus", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Denmark ──
  {
    code: "DK",
    name: "Denmark",
    currency: "DKK",
    currencySymbol: "kr",
    vatRate: 25,
    couriers: [
      { id: "postnord_dk", name: "PostNord", envPrefix: "POSTNORD_DK" },
    ],
    paymentMethods: ["stripe", "paypal", "mobilepay", "klarna", "revolut"],
    groundTransport: ["flixbus", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Bulgaria ──
  {
    code: "BG",
    name: "Bulgaria",
    currency: "BGN",
    currencySymbol: "\u043B\u0432",
    vatRate: 20,
    couriers: [
      { id: "econt", name: "Econt", envPrefix: "ECONT" },
      { id: "speedy_bg", name: "Speedy", envPrefix: "SPEEDY_BG" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── United Kingdom ──
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "\u00A3",
    vatRate: 20,
    couriers: [
      { id: "royal_mail", name: "Royal Mail", envPrefix: "ROYAL_MAIL", trackingUrlTemplate: "https://www.royalmail.com/track-your-item#/tracking-results/{awb}" },
      { id: "evri", name: "Evri (Hermes UK)", envPrefix: "EVRI" },
      { id: "dpd_uk", name: "DPD UK", envPrefix: "DPD_UK" },
    ],
    paymentMethods: ["stripe", "paypal", "klarna", "revolut"],
    groundTransport: ["flixbus", "omio"],
    dhlAvailable: true,
    region: "europe_non_eu",
    isEU: false,
    addressFormat: "uk",
  },

  // ── Switzerland ──
  {
    code: "CH",
    name: "Switzerland",
    currency: "CHF",
    currencySymbol: "CHF",
    vatRate: 8.1,
    couriers: [
      { id: "swiss_post", name: "Swiss Post", envPrefix: "SWISS_POST" },
    ],
    paymentMethods: ["stripe", "paypal", "twint", "klarna", "revolut"],
    groundTransport: ["sbb", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "europe_non_eu",
    isEU: false,
    addressFormat: "eu_standard",
  },

  // ── United States ──
  {
    code: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    vatRate: 0, // Sales tax varies by state
    couriers: [
      { id: "usps", name: "USPS", envPrefix: "USPS", trackingUrlTemplate: "https://tools.usps.com/go/TrackConfirmAction?tLabels={awb}" },
      { id: "ups", name: "UPS", envPrefix: "UPS", trackingUrlTemplate: "https://www.ups.com/track?tracknum={awb}" },
      { id: "fedex", name: "FedEx", envPrefix: "FEDEX", trackingUrlTemplate: "https://www.fedex.com/fedextrack/?trknbr={awb}" },
    ],
    paymentMethods: ["stripe", "paypal", "cashapp", "venmo", "klarna"],
    groundTransport: ["amtrak"],
    dhlAvailable: true,
    region: "north_america",
    isEU: false,
    addressFormat: "us",
  },

  // ── Canada ──
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "CA$",
    vatRate: 5, // GST (provinces add PST/HST)
    couriers: [
      { id: "canada_post", name: "Canada Post", envPrefix: "CANADA_POST" },
      { id: "purolator", name: "Purolator", envPrefix: "PUROLATOR" },
    ],
    paymentMethods: ["stripe", "paypal", "klarna"],
    groundTransport: ["viarail"],
    dhlAvailable: true,
    region: "north_america",
    isEU: false,
    addressFormat: "us",
  },
];

// ── Registry API ──

const registryMap = new Map<string, CountryServiceConfig>();
for (const config of COUNTRY_REGISTRY) {
  registryMap.set(config.code.toUpperCase(), config);
}

/** Get service configuration for a country. Returns undefined if country not in registry. */
export function getCountryConfig(countryCode: CountryCode): CountryServiceConfig | undefined {
  return registryMap.get(countryCode.toUpperCase());
}

/** Get all registered countries. */
export function getAllCountries(): CountryServiceConfig[] {
  return [...COUNTRY_REGISTRY];
}

/** Get countries by region. */
export function getCountriesByRegion(region: CountryServiceConfig["region"]): CountryServiceConfig[] {
  return COUNTRY_REGISTRY.filter((c) => c.region === region);
}

/** Get EU member states. */
export function getEUCountries(): CountryServiceConfig[] {
  return COUNTRY_REGISTRY.filter((c) => c.isEU);
}

/** Get available courier providers for a country (only those with configured env vars). */
export function getConfiguredCouriers(countryCode: CountryCode): CourierProviderConfig[] {
  const config = getCountryConfig(countryCode);
  if (!config) return [];

  return config.couriers.filter((courier) => {
    // Check if at least one env var with this prefix exists
    const prefix = courier.envPrefix;
    return Object.keys(process.env).some(
      (key) => key.startsWith(prefix) && !!process.env[key],
    );
  });
}

/** Get all courier providers for a country (configured or not). */
export function getAllCouriers(countryCode: CountryCode): CourierProviderConfig[] {
  return getCountryConfig(countryCode)?.couriers ?? [];
}

/** Get preferred payment methods for a country. */
export function getPaymentMethods(countryCode: CountryCode): PaymentMethod[] {
  return getCountryConfig(countryCode)?.paymentMethods ?? ["stripe", "paypal"];
}

/** Get the default currency for a country. */
export function getDefaultCurrency(countryCode: CountryCode): { code: string; symbol: string } {
  const config = getCountryConfig(countryCode);
  return config
    ? { code: config.currency, symbol: config.currencySymbol }
    : { code: "EUR", symbol: "\u20AC" };
}

/** Get VAT rate for a country. */
export function getVatRate(countryCode: CountryCode): number {
  return getCountryConfig(countryCode)?.vatRate ?? 0;
}

/** Check if international shipping (DHL) is needed between two countries. */
export function isInternationalShipment(fromCountry: CountryCode, toCountry: CountryCode): boolean {
  return fromCountry.toUpperCase() !== toCountry.toUpperCase();
}

/** Get ground transport providers available in a country. */
export function getGroundTransportProviders(countryCode: CountryCode): GroundTransportProvider[] {
  return getCountryConfig(countryCode)?.groundTransport ?? ["flixbus", "omio"];
}

/** Get tracking URL for an AWB, given country and courier ID. */
export function getTrackingUrl(countryCode: CountryCode, courierId: string, awbNumber: string): string | undefined {
  const config = getCountryConfig(countryCode);
  if (!config) return undefined;

  const courier = config.couriers.find((c) => c.id === courierId);
  if (!courier?.trackingUrlTemplate) return undefined;

  return courier.trackingUrlTemplate.replace("{awb}", encodeURIComponent(awbNumber));
}

/** Check if a country is registered in the system. */
export function isCountrySupported(countryCode: CountryCode): boolean {
  return registryMap.has(countryCode.toUpperCase());
}

/**
 * Determine the best shipping strategy between two countries.
 * Returns domestic courier if same country, or DHL for international.
 */
export function getShippingStrategy(
  fromCountry: CountryCode,
  toCountry: CountryCode,
): { type: "domestic"; couriers: CourierProviderConfig[] } | { type: "international"; provider: "dhl" } {
  if (!isInternationalShipment(fromCountry, toCountry)) {
    const couriers = getAllCouriers(fromCountry);
    return { type: "domestic", couriers };
  }
  return { type: "international", provider: "dhl" };
}
