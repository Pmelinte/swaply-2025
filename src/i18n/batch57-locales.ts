import type {Locale} from "./config";
import west from "./fragments/batch57.locales.west.json";
import northEast from "./fragments/batch57.locales.north-east.json";
import eurasia from "./fragments/batch57.locales.eurasia.json";
import asia from "./fragments/batch57.locales.asia.json";
import asiaSe from "./fragments/batch57.locales.asia-se.json";

type Messages = Record<string, unknown>;

const localized = {
  ...west,
  ...northEast,
  ...eurasia,
  ...asia,
  ...asiaSe,
} as Record<Exclude<Locale, "en">, Messages>;

export function getBatch57Messages(locale: Locale, english: Messages): Messages {
  if (locale === "en") return english;
  return localized[locale];
}

export const batch57LocalizedLocales = Object.freeze(Object.keys(localized));
