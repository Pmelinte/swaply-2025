"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { NO_IMAGE_URL } from "@/lib/storage";
import { getSupabaseClient } from "@/lib/supabase/client";
import { SafeImage } from "@/components/SafeImage";

type ServiceRow = {
  id: string;
  title: string | null;
  description: string | null;
  owner_id: string;
  service_data: Record<string, unknown> | null;
  swap_wants_description: string | null;
  perceived_value_tier: string | null;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [interestStatus, setInterestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [interestMessage, setInterestMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    void supabase
      .from("items")
      .select("id,title,description,owner_id,service_data,swap_wants_description,perceived_value_tier")
      .eq("id", params.id)
      .eq("category", "service")
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => {
        setService((data as ServiceRow | null) ?? null);
        setLoading(false);
      });
  }, [params.id]);

  const data = useMemo(() => service?.service_data ?? {}, [service?.service_data]);
  const images = useMemo(() => stringArray(data.portfolio_images), [data]);
  const certifications = stringArray(data.certifications);
  const portfolioUrls = stringArray(data.portfolio_urls);

  async function proposeServiceExchange() {
    setInterestStatus("sending");
    setInterestMessage("");
    const response = await fetch(`/api/items/services/${params.id}/interest`, { method: "POST" });
    if (response.ok) {
      setInterestStatus("sent");
      setInterestMessage("Service exchange proposal sent. The owner can accept it from matching interests.");
      return;
    }
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setInterestStatus("error");
    setInterestMessage(body?.error ?? "Could not send the service exchange proposal.");
  }

  if (loading) return <div className="p-8 text-center text-zinc-400">Loading service…</div>;
  if (!service) return <div className="p-8 text-center text-zinc-400">This service is unavailable.</div>;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <SafeImage src={images[0] || NO_IMAGE_URL} alt={service.title ?? "Service"} fill className="object-cover" unoptimized={!images[0]} />
      </div>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-emerald-600">{String(data.service_category_l1 ?? "Service")}</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{service.title}</h1>
        <p className="mt-3 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-300">{service.description}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={proposeServiceExchange} disabled={interestStatus === "sending" || interestStatus === "sent"} className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300">
            {interestStatus === "sending" ? "Sending proposal…" : interestStatus === "sent" ? "Proposal sent" : "Propose service exchange"}
          </button>
          <a href="#availability" className="rounded-full border border-zinc-300 px-5 py-2 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Check availability</a>
        </div>
        {interestMessage && <p className={`mt-2 text-sm ${interestStatus === "error" ? "text-red-600" : "text-emerald-600"}`}>{interestMessage}</p>}
        <div id="availability" className="mt-4 grid gap-3 sm:grid-cols-2">
          <Info label="Delivery" value={String(data.service_modality ?? "Flexible")} />
          <Info label="Availability" value={stringArray(data.availability_days).join(", ")} />
          <Info label="Duration" value={stringArray(data.service_duration).join(", ")} />
          <Info label="Timezone note" value="Coordinate exact times in Swaply chat before confirming the exchange." />
          <Info label="Indicative value" value={service.perceived_value_tier ?? "Exchange-oriented"} />
          <Info label="Wants in return" value={service.swap_wants_description ?? "Open to fair swaps"} />
        </div>
      </section>
      {(portfolioUrls.length > 0 || certifications.length > 0) && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Portfolio and certifications</h2>
          {certifications.length > 0 && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Certifications: {certifications.join(", ")}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {portfolioUrls.map((url) => <a key={url} href={url} className="rounded-full border px-3 py-1 text-sm text-blue-600" rel="noreferrer" target="_blank">Portfolio</a>)}
          </div>
        </section>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800"><p className="text-xs font-medium uppercase text-zinc-400">{label}</p><p className="mt-1 text-zinc-700 dark:text-zinc-200">{value || "Not specified"}</p></div>;
}
