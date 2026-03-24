"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionCard, Pill } from "@/components/ui";
import {
  Plus, Pencil, Trash2, Star, Globe, Search,
  Truck, Plane, Train, Car, Hotel, CreditCard,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

/* ── Types ── */

interface ServiceRecord {
  id: string;
  country_code: string;
  service_type: string;
  name: string;
  website_url: string;
  affiliate_url: string | null;
  affiliate_commission: string | null;
  tracking_url_template: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

const SERVICE_TYPES = [
  "courier_domestic", "courier_international", "airline", "train",
  "bus", "car_rental", "rideshare", "accommodation", "local_transport", "payment_method",
] as const;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  courier_domestic: <Truck className="h-4 w-4" />,
  courier_international: <Globe className="h-4 w-4" />,
  airline: <Plane className="h-4 w-4" />,
  train: <Train className="h-4 w-4" />,
  bus: <Train className="h-4 w-4" />,
  car_rental: <Car className="h-4 w-4" />,
  rideshare: <Car className="h-4 w-4" />,
  accommodation: <Hotel className="h-4 w-4" />,
  payment_method: <CreditCard className="h-4 w-4" />,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQ, setSearchQ] = useState("");

  const fetchServices = useCallback(async () => {
    const sb = getSupabaseClient();
    if (!sb) return;
    setLoading(true);

    let query = sb.from("services_by_country").select("*").order("country_code").order("service_type").order("sort_order").limit(200);
    if (filterCountry) query = query.eq("country_code", filterCountry);
    if (filterType) query = query.eq("service_type", filterType);

    const { data } = await query;
    setServices((data as ServiceRecord[]) ?? []);
    setLoading(false);
  }, [filterCountry, filterType]);

  useEffect(() => { void fetchServices(); }, [fetchServices]);

  const toggleFeatured = async (s: ServiceRecord) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from("services_by_country").update({ is_featured: !s.is_featured }).eq("id", s.id);
    void fetchServices();
  };

  const toggleActive = async (s: ServiceRecord) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from("services_by_country").update({ is_active: !s.is_active }).eq("id", s.id);
    void fetchServices();
  };

  const deleteService = async (id: string) => {
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from("services_by_country").delete().eq("id", id);
    void fetchServices();
  };

  const filtered = services.filter((s) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.website_url.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Service Management
        </h1>
        <span className="text-sm text-zinc-500">{filtered.length} services</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search services..."
            className="rounded-lg border border-zinc-200 pl-9 pr-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
          />
        </div>
        <input
          type="text"
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value.toUpperCase().slice(0, 2))}
          placeholder="Country (e.g. DE)"
          className="w-28 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        >
          <option value="">All types</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Services table */}
      <SectionCard title="Services">
        {loading ? (
          <div className="py-8 text-center text-sm text-zinc-400">Loading services...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-700">
                  <th className="pb-2 pr-3">Country</th>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Name</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Featured</th>
                  <th className="pb-2 pr-3">Order</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((s) => (
                  <tr key={s.id} className={!s.is_active ? "opacity-50" : ""}>
                    <td className="py-2 pr-3 font-mono text-xs">{s.country_code}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        {TYPE_ICONS[s.service_type]}
                        {s.service_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <a href={s.website_url} target="_blank" rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                        {s.name}
                      </a>
                      {s.affiliate_url && <Pill color="green">affiliate</Pill>}
                    </td>
                    <td className="py-2 pr-3">
                      <button type="button" onClick={() => void toggleActive(s)}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          s.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        }`}>
                        {s.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-2 pr-3">
                      <button type="button" onClick={() => void toggleFeatured(s)}>
                        <Star className={`h-4 w-4 ${s.is_featured ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`} />
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-xs text-zinc-500">{s.sort_order}</td>
                    <td className="py-2">
                      <button type="button" onClick={() => void deleteService(s.id)}
                        className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-zinc-400">
                No services found. {filterCountry || filterType ? "Try adjusting filters." : "Run the migration to populate services."}
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
