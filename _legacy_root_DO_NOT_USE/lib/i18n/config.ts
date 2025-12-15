export const i18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'ro', 'fr', 'de', 'es'],
};

export type Locale = (typeof i18nConfig.locales)[number];
