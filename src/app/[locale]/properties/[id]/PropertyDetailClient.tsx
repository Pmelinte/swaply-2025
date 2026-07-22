"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAppState } from "@/lib/state";
import {
  getApproximateMapLabel,
  getPropertyArray,
  getPropertyLocation,
  getPropertyNumber,
  getPropertyPhotos,
  getPropertyString,
  getPropertyTitle,
  type PropertyRow,
} from "@/lib/properties";
import {
  Bath,
  BedDouble,
  CalendarDays,
  MapPin,
  Pencil,
  Power,
  Users,
} from "lucide-react";

export default function PropertyDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppState();
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase not configured");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .or(
          "category.eq.property,wizard_type.eq.property,item_type.eq.property",
        )
        .eq("is_active", true)
        .maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      setProperty((data as PropertyRow | null) ?? null);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const photos = useMemo(
    () => (property ? getPropertyPhotos(property) : []),
    [property],
  );
  const owner = !!user && property?.owner_id === user.id;
  async function setStatus(status: "active" | "paused" | "archived") {
    setSavingStatus(true);
    setError(null);
    const res = await fetch(`/api/items/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) setError(body.error ?? "Could not update property status");
    else
      setProperty((p) =>
        p
          ? { ...p, status: body.item.status, is_active: body.item.is_active }
          : p,
      );
    setSavingStatus(false);
  }

  if (loading)
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-zinc-500">
        Loading property…
      </div>
    );
  if (!property)
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-xl font-semibold">Property not found</h1>
        <p className="mt-2 text-sm text-zinc-500">
          This property is unavailable or inactive.
        </p>
      </div>
    );

  const amenities = [
    "has_swimming_pool",
    "has_garden",
    "has_sauna",
    "has_hot_tub",
    "ev_charging",
    "linen_provided",
    "towels_provided",
  ].filter((k) => property.property_data?.[k] === true);
  const rules = [
    getPropertyString(property, "smoking_allowed"),
    getPropertyString(property, "quiet_hours"),
    getPropertyString(property, "special_house_rules"),
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100">
            <SafeImage
              src={photos[0] || NO_IMAGE_URL}
              alt={getPropertyTitle(property)}
              fill
              className="object-cover"
              unoptimized={!photos[0]}
            />
          </div>
          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {photos.slice(1, 5).map((src) => (
                <div
                  key={src}
                  className="relative aspect-video overflow-hidden rounded-lg bg-zinc-100"
                >
                  <SafeImage
                    src={src}
                    alt="Property photo"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          <h1 className="mt-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {getPropertyTitle(property)}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
            <MapPin className="h-4 w-4" />
            {getPropertyLocation(property)}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {property.description ||
              getPropertyString(property, "desired_exchange_description")}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Info
              icon={<BedDouble />}
              label="Bedrooms"
              value={getPropertyNumber(property, "bedrooms")}
            />
            <Info
              icon={<Bath />}
              label="Bathrooms"
              value={getPropertyNumber(property, "bathrooms")}
            />
            <Info
              icon={<Users />}
              label="Guests"
              value={
                getPropertyNumber(property, "number_of_guests_allowed") ??
                getPropertyNumber(property, "guests_limit")
              }
            />
          </div>
          <Section title="Calendar">
            <p>
              {getPropertyString(property, "available_start_date") ||
                "Flexible start"}{" "}
              →{" "}
              {getPropertyString(property, "available_end_date") ||
                "Flexible end"}
            </p>
            <p>
              Preferred seasons:{" "}
              {getPropertyArray(property, "preferred_seasons").join(", ") ||
                "Flexible"}
            </p>
          </Section>
          <Section title="Amenities">
            <div className="flex flex-wrap gap-2">
              {amenities.length ? (
                amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700"
                  >
                    {a.replaceAll("_", " ")}
                  </span>
                ))
              ) : (
                <span>No amenities listed.</span>
              )}
            </div>
          </Section>
          <Section title="House rules">
            {rules.length ? (
              <ul className="list-disc pl-5">
                {rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p>No extra rules listed.</p>
            )}
          </Section>
          <Section title="Approximate map">
            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50 p-6 text-purple-800">
              {getApproximateMapLabel(property)} — exact address and coordinates
              are private.
            </div>
          </Section>
        </section>
        <aside className="h-max rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="font-semibold">Exchange this stay</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Use Swaply messaging to propose a temporary vacation exchange.
          </p>
          <Link
            href={
              user
                ? `/matching?target=${property.id}`
                : `/register?returnTo=/properties/${property.id}`
            }
            className="mt-4 inline-flex w-full justify-center rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white"
          >
            Propose swap
          </Link>
          {owner && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">
                Owner administration
              </p>
              <Link
                href={`/properties/new?edit=${property.id}`}
                className="mb-2 flex items-center gap-2 text-sm text-purple-700"
              >
                <Pencil className="h-4 w-4" />
                Edit details
              </Link>
              <button
                disabled={savingStatus}
                onClick={() =>
                  setStatus(property.status === "active" ? "paused" : "active")
                }
                className="flex items-center gap-2 text-sm text-zinc-700"
              >
                <Power className="h-4 w-4" />
                {property.status === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: unknown;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-700">
      {" "}
      <div className="mb-1 h-4 w-4 text-purple-600">{icon}</div>
      <p className="text-zinc-500">{label}</p>
      <p className="font-semibold">
        {value === null || value === undefined ? "—" : String(value)}
      </p>
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <CalendarDays className="h-5 w-5 text-purple-600" />
        {title}
      </h2>
      <div className="text-sm text-zinc-700 dark:text-zinc-300">{children}</div>
    </section>
  );
}
