export const locales = [
  "en", "ro", "fr", "de", "es", "it", "pt", "nl", "pl", "el",
  "hu", "bg", "cs", "sk", "hr", "sl", "sr", "sv", "da", "fi",
  "no", "lt", "lv", "et", "ga", "mt", "ru", "tr", "ar", "zh",
  "hi", "bn", "ja", "ko", "vi", "th", "id", "ms", "fil", "fa",
  "mn", "uk", "yi",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** ISO 3166-1 alpha-2 country code for flag display */
export const languageNames: Record<Locale, { name: string; nativeName: string; countryCode: string }> = {
  en:  { name: "English",     nativeName: "English",          countryCode: "gb" },
  ro:  { name: "Romanian",    nativeName: "Română",           countryCode: "ro" },
  fr:  { name: "French",      nativeName: "Français",         countryCode: "fr" },
  de:  { name: "German",      nativeName: "Deutsch",          countryCode: "de" },
  es:  { name: "Spanish",     nativeName: "Español",          countryCode: "es" },
  it:  { name: "Italian",     nativeName: "Italiano",         countryCode: "it" },
  pt:  { name: "Portuguese",  nativeName: "Português",        countryCode: "pt" },
  nl:  { name: "Dutch",       nativeName: "Nederlands",       countryCode: "nl" },
  pl:  { name: "Polish",      nativeName: "Polski",           countryCode: "pl" },
  el:  { name: "Greek",       nativeName: "Ελληνικά",         countryCode: "gr" },
  hu:  { name: "Hungarian",   nativeName: "Magyar",           countryCode: "hu" },
  bg:  { name: "Bulgarian",   nativeName: "Български",        countryCode: "bg" },
  cs:  { name: "Czech",       nativeName: "Čeština",          countryCode: "cz" },
  sk:  { name: "Slovak",      nativeName: "Slovenčina",       countryCode: "sk" },
  hr:  { name: "Croatian",    nativeName: "Hrvatski",         countryCode: "hr" },
  sl:  { name: "Slovenian",   nativeName: "Slovenščina",      countryCode: "si" },
  sr:  { name: "Serbian",     nativeName: "Srpski",           countryCode: "rs" },
  sv:  { name: "Swedish",     nativeName: "Svenska",          countryCode: "se" },
  da:  { name: "Danish",      nativeName: "Dansk",            countryCode: "dk" },
  fi:  { name: "Finnish",     nativeName: "Suomi",            countryCode: "fi" },
  no:  { name: "Norwegian",   nativeName: "Norsk",            countryCode: "no" },
  lt:  { name: "Lithuanian",  nativeName: "Lietuvių",         countryCode: "lt" },
  lv:  { name: "Latvian",     nativeName: "Latviešu",         countryCode: "lv" },
  et:  { name: "Estonian",    nativeName: "Eesti",            countryCode: "ee" },
  ga:  { name: "Irish",       nativeName: "Gaeilge",          countryCode: "ie" },
  mt:  { name: "Maltese",     nativeName: "Malti",            countryCode: "mt" },
  ru:  { name: "Russian",     nativeName: "Русский",          countryCode: "ru" },
  tr:  { name: "Turkish",     nativeName: "Türkçe",           countryCode: "tr" },
  ar:  { name: "Arabic",      nativeName: "العربية",           countryCode: "sa" },
  zh:  { name: "Chinese",     nativeName: "中文",              countryCode: "cn" },
  hi:  { name: "Hindi",       nativeName: "हिन्दी",            countryCode: "in" },
  bn:  { name: "Bengali",     nativeName: "বাংলা",             countryCode: "bd" },
  ja:  { name: "Japanese",    nativeName: "日本語",             countryCode: "jp" },
  ko:  { name: "Korean",      nativeName: "한국어",             countryCode: "kr" },
  vi:  { name: "Vietnamese",  nativeName: "Tiếng Việt",       countryCode: "vn" },
  th:  { name: "Thai",        nativeName: "ภาษาไทย",          countryCode: "th" },
  id:  { name: "Indonesian",  nativeName: "Bahasa Indonesia", countryCode: "id" },
  ms:  { name: "Malay",       nativeName: "Bahasa Melayu",    countryCode: "my" },
  fil: { name: "Filipino",    nativeName: "Filipino",         countryCode: "ph" },
  fa:  { name: "Persian",     nativeName: "فارسی",            countryCode: "ir" },
  mn:  { name: "Mongolian",   nativeName: "Монгол",           countryCode: "mn" },
  uk:  { name: "Ukrainian",   nativeName: "Українська",       countryCode: "ua" },
  yi:  { name: "Yiddish",     nativeName: "ייִדיש",           countryCode: "il" },
};

/** Local flag SVG path (served from /public/flags/) */
export function flagUrl(countryCode: string): string {
  return `/flags/${countryCode}.svg`;
}

/** Get flag SVG URL for a locale */
export function localeFlagUrl(locale: Locale): string {
  return flagUrl(languageNames[locale].countryCode);
}
