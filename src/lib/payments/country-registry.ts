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
  | "venmo"        // USA
  | "mada"         // Saudi Arabia
  | "promptpay"    // Thailand
  | "grabpay"      // Southeast Asia
  | "gcash"        // Philippines
  | "dana"         // Indonesia
  | "upi"          // India
  | "wechat_pay"   // China
  | "alipay"       // China
  | "konbini"      // Japan
  | "kakaopay"     // South Korea
  | "toss"         // South Korea
  | "mir";         // Russia

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
  | "viarail"      // Canada
  | "trainose"     // Greece
  | "zssk"         // Slovakia
  | "hzpp"         // Croatia
  | "sz"           // Slovenia
  | "srbija_voz"   // Serbia
  | "vr"           // Finland
  | "vy"           // Norway
  | "ltg"          // Lithuania
  | "pv"           // Latvia
  | "elron"        // Estonia
  | "ukrzaliznytsia" // Ukraine
  | "rzd"          // Russia
  | "tcdd"         // Turkey
  | "jr"           // Japan
  | "korail"       // South Korea
  | "srt";         // Thailand

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

  // ══════════════════════════════════════════════════════════════════
  // EU Member States (remaining)
  // ══════════════════════════════════════════════════════════════════

  // ── Greece ──
  {
    code: "GR",
    name: "Greece",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 24,
    couriers: [
      { id: "elta", name: "ELTA (Hellenic Post)", envPrefix: "ELTA" },
      { id: "acs_gr", name: "ACS Courier", envPrefix: "ACS_GR" },
      { id: "speedex", name: "Speedex", envPrefix: "SPEEDEX" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["trainose", "flixbus", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Slovakia ──
  {
    code: "SK",
    name: "Slovakia",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 20,
    couriers: [
      { id: "slovenska_posta", name: "Slovensk\u00E1 po\u0161ta", envPrefix: "SLOVENSKA_POSTA" },
      { id: "gls_sk", name: "GLS Slovakia", envPrefix: "GLS_SK" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["zssk", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Croatia ──
  {
    code: "HR",
    name: "Croatia",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 25,
    couriers: [
      { id: "hrvatska_posta", name: "Hrvatska po\u0161ta", envPrefix: "HRVATSKA_POSTA" },
      { id: "dpd_hr", name: "DPD Croatia", envPrefix: "DPD_HR" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["hzpp", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Slovenia ──
  {
    code: "SI",
    name: "Slovenia",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 22,
    couriers: [
      { id: "posta_slovenije", name: "Po\u0161ta Slovenije", envPrefix: "POSTA_SI" },
      { id: "gls_si", name: "GLS Slovenia", envPrefix: "GLS_SI" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["sz", "flixbus", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Finland ──
  {
    code: "FI",
    name: "Finland",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 25.5,
    couriers: [
      { id: "posti", name: "Posti", envPrefix: "POSTI" },
      { id: "matkahuolto", name: "Matkahuolto", envPrefix: "MATKAHUOLTO" },
    ],
    paymentMethods: ["stripe", "paypal", "klarna", "revolut"],
    groundTransport: ["vr", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Lithuania ──
  {
    code: "LT",
    name: "Lithuania",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 21,
    couriers: [
      { id: "lietuvos_pastas", name: "Lietuvos pa\u0161tas", envPrefix: "LIETUVOS_PASTAS" },
      { id: "omniva_lt", name: "Omniva", envPrefix: "OMNIVA_LT" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["ltg", "flixbus", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Latvia ──
  {
    code: "LV",
    name: "Latvia",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 21,
    couriers: [
      { id: "latvijas_pasts", name: "Latvijas Pasts", envPrefix: "LATVIJAS_PASTS" },
      { id: "omniva_lv", name: "Omniva", envPrefix: "OMNIVA_LV" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["pv", "flixbus", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Estonia ──
  {
    code: "EE",
    name: "Estonia",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 22,
    couriers: [
      { id: "omniva_ee", name: "Omniva", envPrefix: "OMNIVA_EE" },
      { id: "smartpost_ee", name: "Smartpost", envPrefix: "SMARTPOST_EE" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["elron", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ── Ireland ──
  {
    code: "IE",
    name: "Ireland",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 23,
    couriers: [
      { id: "an_post", name: "An Post", envPrefix: "AN_POST" },
      { id: "dpd_ie", name: "DPD Ireland", envPrefix: "DPD_IE" },
    ],
    paymentMethods: ["stripe", "paypal", "klarna", "revolut"],
    groundTransport: ["flixbus", "omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "uk",
  },

  // ── Malta ──
  {
    code: "MT",
    name: "Malta",
    currency: "EUR",
    currencySymbol: "\u20AC",
    vatRate: 18,
    couriers: [
      { id: "maltapost", name: "MaltaPost", envPrefix: "MALTAPOST" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["omio"],
    dhlAvailable: true,
    region: "eu",
    isEU: true,
    addressFormat: "eu_standard",
  },

  // ══════════════════════════════════════════════════════════════════
  // Europe (non-EU)
  // ══════════════════════════════════════════════════════════════════

  // ── Norway ──
  {
    code: "NO",
    name: "Norway",
    currency: "NOK",
    currencySymbol: "kr",
    vatRate: 25,
    couriers: [
      { id: "posten_no", name: "Posten Norge", envPrefix: "POSTEN_NO" },
      { id: "postnord_no", name: "PostNord", envPrefix: "POSTNORD_NO" },
    ],
    paymentMethods: ["stripe", "paypal", "vipps", "klarna", "revolut"],
    groundTransport: ["vy", "flixbus", "omio"],
    dhlAvailable: true,
    region: "europe_non_eu",
    isEU: false,
    addressFormat: "eu_standard",
  },

  // ── Serbia ──
  {
    code: "RS",
    name: "Serbia",
    currency: "RSD",
    currencySymbol: "din",
    vatRate: 20,
    couriers: [
      { id: "posta_srbije", name: "Po\u0161ta Srbije", envPrefix: "POSTA_RS" },
      { id: "dexpress", name: "D Express", envPrefix: "DEXPRESS" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["srbija_voz", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "europe_non_eu",
    isEU: false,
    addressFormat: "eu_standard",
  },

  // ── Ukraine ──
  {
    code: "UA",
    name: "Ukraine",
    currency: "UAH",
    currencySymbol: "\u20B4",
    vatRate: 20,
    couriers: [
      { id: "nova_poshta", name: "Nova Poshta", envPrefix: "NOVA_POSHTA" },
      { id: "ukrposhta", name: "Ukrposhta", envPrefix: "UKRPOSHTA" },
      { id: "meest", name: "Meest", envPrefix: "MEEST" },
    ],
    paymentMethods: ["stripe", "paypal", "revolut"],
    groundTransport: ["ukrzaliznytsia", "flixbus", "blablacar", "omio"],
    dhlAvailable: true,
    region: "europe_non_eu",
    isEU: false,
    addressFormat: "eu_standard",
  },

  // ── Russia ──
  {
    code: "RU",
    name: "Russia",
    currency: "RUB",
    currencySymbol: "\u20BD",
    vatRate: 20,
    couriers: [
      { id: "pochta_rossii", name: "\u041F\u043E\u0447\u0442\u0430 \u0420\u043E\u0441\u0441\u0438\u0438", envPrefix: "POCHTA_RU" },
      { id: "cdek", name: "CDEK", envPrefix: "CDEK" },
      { id: "dpd_ru", name: "DPD Russia", envPrefix: "DPD_RU" },
    ],
    paymentMethods: ["stripe", "paypal", "mir"],
    groundTransport: ["rzd", "blablacar"],
    dhlAvailable: true,
    region: "europe_non_eu",
    isEU: false,
    addressFormat: "eu_standard",
  },

  // ── Turkey ──
  {
    code: "TR",
    name: "Turkey",
    currency: "TRY",
    currencySymbol: "\u20BA",
    vatRate: 20,
    couriers: [
      { id: "ptt", name: "PTT", envPrefix: "PTT_TR" },
      { id: "yurtici", name: "Yurtici Kargo", envPrefix: "YURTICI" },
      { id: "aras", name: "Aras Kargo", envPrefix: "ARAS" },
    ],
    paymentMethods: ["stripe", "paypal"],
    groundTransport: ["tcdd", "flixbus", "omio"],
    dhlAvailable: true,
    region: "europe_non_eu",
    isEU: false,
    addressFormat: "eu_standard",
  },

  // ══════════════════════════════════════════════════════════════════
  // Middle East
  // ══════════════════════════════════════════════════════════════════

  // ── Saudi Arabia ──
  {
    code: "SA",
    name: "Saudi Arabia",
    currency: "SAR",
    currencySymbol: "\uFDFC",
    vatRate: 15,
    couriers: [
      { id: "saudi_post", name: "Saudi Post (SPL)", envPrefix: "SAUDI_POST" },
      { id: "aramex", name: "Aramex", envPrefix: "ARAMEX" },
      { id: "smsa", name: "SMSA Express", envPrefix: "SMSA" },
    ],
    paymentMethods: ["stripe", "paypal", "mada"],
    groundTransport: [],
    dhlAvailable: true,
    region: "middle_east",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Iran ──
  {
    code: "IR",
    name: "Iran",
    currency: "IRR",
    currencySymbol: "\uFDFC",
    vatRate: 9,
    couriers: [
      { id: "post_ir", name: "Iran Post", envPrefix: "POST_IR" },
      { id: "tipax", name: "Tipax", envPrefix: "TIPAX" },
    ],
    paymentMethods: ["paypal"],
    groundTransport: [],
    dhlAvailable: true,
    region: "middle_east",
    isEU: false,
    addressFormat: "asian",
  },

  // ══════════════════════════════════════════════════════════════════
  // Asia
  // ══════════════════════════════════════════════════════════════════

  // ── China ──
  {
    code: "CN",
    name: "China",
    currency: "CNY",
    currencySymbol: "\u00A5",
    vatRate: 13,
    couriers: [
      { id: "china_post", name: "China Post", envPrefix: "CHINA_POST" },
      { id: "sf_express", name: "SF Express", envPrefix: "SF_EXPRESS" },
      { id: "sto", name: "STO Express", envPrefix: "STO" },
      { id: "yto", name: "YTO Express", envPrefix: "YTO" },
    ],
    paymentMethods: ["stripe", "alipay", "wechat_pay"],
    groundTransport: [],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── India ──
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "\u20B9",
    vatRate: 18, // GST
    couriers: [
      { id: "india_post", name: "India Post", envPrefix: "INDIA_POST" },
      { id: "bluedart", name: "Blue Dart", envPrefix: "BLUEDART" },
      { id: "delhivery", name: "Delhivery", envPrefix: "DELHIVERY" },
      { id: "dtdc", name: "DTDC", envPrefix: "DTDC" },
    ],
    paymentMethods: ["stripe", "paypal", "upi"],
    groundTransport: [],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Bangladesh ──
  {
    code: "BD",
    name: "Bangladesh",
    currency: "BDT",
    currencySymbol: "\u09F3",
    vatRate: 15,
    couriers: [
      { id: "bangladesh_post", name: "Bangladesh Post", envPrefix: "BD_POST" },
      { id: "pathao", name: "Pathao", envPrefix: "PATHAO" },
      { id: "redx", name: "RedX", envPrefix: "REDX" },
    ],
    paymentMethods: ["stripe", "paypal"],
    groundTransport: [],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Japan ──
  {
    code: "JP",
    name: "Japan",
    currency: "JPY",
    currencySymbol: "\u00A5",
    vatRate: 10,
    couriers: [
      { id: "japan_post", name: "Japan Post", envPrefix: "JAPAN_POST" },
      { id: "yamato", name: "Yamato Transport", envPrefix: "YAMATO" },
      { id: "sagawa", name: "Sagawa Express", envPrefix: "SAGAWA" },
    ],
    paymentMethods: ["stripe", "paypal", "konbini"],
    groundTransport: ["jr"],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── South Korea ──
  {
    code: "KR",
    name: "South Korea",
    currency: "KRW",
    currencySymbol: "\u20A9",
    vatRate: 10,
    couriers: [
      { id: "korea_post", name: "Korea Post", envPrefix: "KOREA_POST" },
      { id: "cj_logistics", name: "CJ Logistics", envPrefix: "CJ_LOGISTICS" },
      { id: "logen", name: "Logen", envPrefix: "LOGEN" },
    ],
    paymentMethods: ["stripe", "paypal", "kakaopay", "toss"],
    groundTransport: ["korail"],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Vietnam ──
  {
    code: "VN",
    name: "Vietnam",
    currency: "VND",
    currencySymbol: "\u20AB",
    vatRate: 10,
    couriers: [
      { id: "vietnam_post", name: "Vietnam Post", envPrefix: "VIETNAM_POST" },
      { id: "ghn", name: "Giao Hang Nhanh", envPrefix: "GHN" },
      { id: "ghtk", name: "Giao Hang Tiet Kiem", envPrefix: "GHTK" },
    ],
    paymentMethods: ["stripe", "paypal"],
    groundTransport: [],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Thailand ──
  {
    code: "TH",
    name: "Thailand",
    currency: "THB",
    currencySymbol: "\u0E3F",
    vatRate: 7,
    couriers: [
      { id: "thailand_post", name: "Thailand Post", envPrefix: "THAILAND_POST" },
      { id: "kerry_th", name: "Kerry Express", envPrefix: "KERRY_TH" },
      { id: "flash_express", name: "Flash Express", envPrefix: "FLASH_EXPRESS" },
    ],
    paymentMethods: ["stripe", "paypal", "promptpay"],
    groundTransport: ["srt"],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Indonesia ──
  {
    code: "ID",
    name: "Indonesia",
    currency: "IDR",
    currencySymbol: "Rp",
    vatRate: 11,
    couriers: [
      { id: "pos_indonesia", name: "Pos Indonesia", envPrefix: "POS_ID" },
      { id: "jne", name: "JNE", envPrefix: "JNE" },
      { id: "jnt_id", name: "J&T Express", envPrefix: "JNT_ID" },
      { id: "sicepat", name: "SiCepat", envPrefix: "SICEPAT" },
    ],
    paymentMethods: ["stripe", "paypal", "dana", "grabpay"],
    groundTransport: [],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Malaysia ──
  {
    code: "MY",
    name: "Malaysia",
    currency: "MYR",
    currencySymbol: "RM",
    vatRate: 8, // SST
    couriers: [
      { id: "pos_malaysia", name: "Pos Malaysia", envPrefix: "POS_MY" },
      { id: "jnt_my", name: "J&T Express", envPrefix: "JNT_MY" },
      { id: "gdex", name: "GDEX", envPrefix: "GDEX" },
    ],
    paymentMethods: ["stripe", "paypal", "grabpay"],
    groundTransport: [],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Philippines ──
  {
    code: "PH",
    name: "Philippines",
    currency: "PHP",
    currencySymbol: "\u20B1",
    vatRate: 12,
    couriers: [
      { id: "phlpost", name: "PHLPost", envPrefix: "PHLPOST" },
      { id: "jnt_ph", name: "J&T Express", envPrefix: "JNT_PH" },
      { id: "lbc", name: "LBC Express", envPrefix: "LBC" },
    ],
    paymentMethods: ["stripe", "paypal", "gcash", "grabpay"],
    groundTransport: [],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
  },

  // ── Mongolia ──
  {
    code: "MN",
    name: "Mongolia",
    currency: "MNT",
    currencySymbol: "\u20AE",
    vatRate: 10,
    couriers: [
      { id: "mongol_post", name: "Mongol Post", envPrefix: "MONGOL_POST" },
    ],
    paymentMethods: ["stripe", "paypal"],
    groundTransport: [],
    dhlAvailable: true,
    region: "asia",
    isEU: false,
    addressFormat: "asian",
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
