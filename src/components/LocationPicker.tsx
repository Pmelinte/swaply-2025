"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";

interface LocationPickerProps {
  country?: string;
  region?: string;
  city?: string;
  onChange: (location: { country: string; region: string; city: string }) => void;
  testIdPrefix?: string;
}

const selectClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function LocationPicker({
  country = "",
  region = "",
  city = "",
  onChange,
  testIdPrefix,
}: LocationPickerProps) {
  const t = useTranslations("location");
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  // Resolve initial country/region to ISO codes via lazy initialization (no useEffect needed)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() => {
    if (!country) return "";
    const countries = Country.getAllCountries();
    const found = countries.find((c) => c.name === country || c.isoCode === country);
    return found?.isoCode ?? "";
  });

  const [selectedStateCode, setSelectedStateCode] = useState<string>(() => {
    if (!country || !region) return "";
    const countries = Country.getAllCountries();
    const found = countries.find((c) => c.name === country || c.isoCode === country);
    if (!found) return "";
    const states = State.getStatesOfCountry(found.isoCode);
    const foundState = states.find((s) => s.name === region || s.isoCode === region);
    return foundState?.isoCode ?? "";
  });

  const states = useMemo(
    () => (selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : []),
    [selectedCountryCode],
  );

  const cities = useMemo(
    () =>
      selectedCountryCode && selectedStateCode
        ? City.getCitiesOfState(selectedCountryCode, selectedStateCode)
        : [],
    [selectedCountryCode, selectedStateCode],
  );

  const handleCountryChange = (isoCode: string) => {
    setSelectedCountryCode(isoCode);
    setSelectedStateCode("");
    const countryObj = allCountries.find((c) => c.isoCode === isoCode);
    onChange({
      country: countryObj?.name ?? "",
      region: "",
      city: "",
    });
  };

  const handleStateChange = (isoCode: string) => {
    setSelectedStateCode(isoCode);
    const stateObj = states.find((s) => s.isoCode === isoCode);
    onChange({
      country: allCountries.find((c) => c.isoCode === selectedCountryCode)?.name ?? country,
      region: stateObj?.name ?? "",
      city: "",
    });
  };

  const handleCityChange = (cityName: string) => {
    onChange({
      country: allCountries.find((c) => c.isoCode === selectedCountryCode)?.name ?? country,
      region: states.find((s) => s.isoCode === selectedStateCode)?.name ?? region,
      city: cityName,
    });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {t("country")}
        <select
          value={selectedCountryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          data-testid={testIdPrefix ? `${testIdPrefix}-country` : undefined}
          className={selectClass}
        >
          <option value="">{t("selectCountry")}</option>
          {allCountries.map((c: ICountry) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {t("region")}
        <select
          value={selectedStateCode}
          onChange={(e) => handleStateChange(e.target.value)}
          data-testid={testIdPrefix ? `${testIdPrefix}-region` : undefined}
          disabled={!selectedCountryCode}
          className={selectClass}
        >
          <option value="">
            {selectedCountryCode ? t("selectRegion") : t("chooseCountryFirst")}
          </option>
          {states.map((s: IState) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {t("city")}
        <select
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          data-testid={testIdPrefix ? `${testIdPrefix}-city` : undefined}
          disabled={!selectedStateCode}
          className={selectClass}
        >
          <option value="">
            {selectedStateCode ? t("selectCity") : t("chooseRegionFirst")}
          </option>
          {cities.map((c: ICity) => (
            <option key={`${c.name}-${c.latitude}-${c.longitude}`} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
