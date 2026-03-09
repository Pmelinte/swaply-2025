/**
 * Lazy imports for heavy dependencies to reduce bundle size.
 * country-state-city is ~500KB and only needed on profile/item forms.
 */

/**
 * Lazy-load country-state-city library.
 * Returns Country, State, City classes on demand.
 */
export async function loadCountryStateCity() {
  const { Country, State, City } = await import("country-state-city");
  return { Country, State, City };
}

/**
 * Get all countries (lazy loaded).
 */
export async function getCountries() {
  const { Country } = await loadCountryStateCity();
  return Country.getAllCountries();
}

/**
 * Get states for a country (lazy loaded).
 */
export async function getStates(countryCode: string) {
  const { State } = await loadCountryStateCity();
  return State.getStatesOfCountry(countryCode);
}

/**
 * Get cities for a state (lazy loaded).
 */
export async function getCities(countryCode: string, stateCode: string) {
  const { City } = await loadCountryStateCity();
  return City.getCitiesOfState(countryCode, stateCode);
}
