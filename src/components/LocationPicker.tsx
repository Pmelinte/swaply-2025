"use client";

import { useEffect, useMemo, useState } from "react";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";

interface LocationPickerProps {
  country?: string;
  region?: string;
  city?: string;
  onChange: (location: { country: string; region: string; city: string }) => void;
}

const selectClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function LocationPicker({
  country = "",
  region = "",
  city = "",
  onChange,
}: LocationPickerProps) {
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  // Find the selected country's ISO code from the name
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");

  // Resolve initial country/region to ISO codes on mount
  useEffect(() => {
    if (country) {
      const found = allCountries.find(
        (c) => c.name === country || c.isoCode === country,
      );
      if (found) {
        setSelectedCountryCode(found.isoCode);
        if (region) {
          const states = State.getStatesOfCountry(found.isoCode);
          const foundState = states.find(
            (s) => s.name === region || s.isoCode === region,
          );
          if (foundState) {
            setSelectedStateCode(foundState.isoCode);
          }
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        Țară
        <select
          value={selectedCountryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          className={selectClass}
        >
          <option value="">— Selectează țara —</option>
          {allCountries.map((c: ICountry) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Regiune / Județ
        <select
          value={selectedStateCode}
          onChange={(e) => handleStateChange(e.target.value)}
          disabled={!selectedCountryCode}
          className={selectClass}
        >
          <option value="">
            {selectedCountryCode ? "— Selectează regiunea —" : "— Alege mai întâi țara —"}
          </option>
          {states.map((s: IState) => (
            <option key={s.isoCode} value={s.isoCode}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        Oraș
        <select
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={!selectedStateCode}
          className={selectClass}
        >
          <option value="">
            {selectedStateCode ? "— Selectează orașul —" : "— Alege mai întâi regiunea —"}
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
