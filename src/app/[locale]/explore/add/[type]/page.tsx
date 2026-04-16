"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { ChevronLeft, Upload, MapPin, X, Check } from "lucide-react";

/* ══════════════════════════════════════════════
   Types & config
   ══════════════════════════════════════════════ */

type WizardType = "objects" | "properties" | "services" | "events";
type Intent = "want" | "offer";

const STEP_COUNTS: Record<WizardType, number> = {
  objects: 4,
  properties: 5,
  services: 4,
  events: 3,
};

const VALID_TYPES = new Set<string>(["objects", "properties", "services", "events"]);

/* ══════════════════════════════════════════════
   Shared sub-components
   ══════════════════════════════════════════════ */

function RequiredLabel({ text }: { text: string }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-100">
      {text} <span className="text-red-500">*</span>
    </label>
  );
}

function OptionalLabel({ text }: { text: string }) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-zinc-800 dark:text-zinc-100">
      {text}{" "}
      <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">(optional)</span>
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const cls =
    "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500";
  return multiline ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className={cls}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cls}
    />
  );
}

function PhotoUpload({
  photos,
  onChange,
  required,
  max = 5,
}: {
  photos: string[];
  onChange: (p: string[]) => void;
  required?: boolean;
  max?: number;
}) {
  // Production: open file picker → upload to Cloudinary / Supabase Storage.
  // For now simulates adding a placeholder so the wizard is functional.
  const handleAdd = () => {
    if (photos.length < max) {
      onChange([...photos, `https://placehold.co/400x300?text=Photo+${photos.length + 1}`]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((src, idx) => (
          <div
            key={idx}
            className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, i) => i !== idx))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              aria-label="Remove photo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-blue-600 dark:hover:text-blue-400"
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs font-medium">Add photo</span>
          </button>
        )}
      </div>
      {required && photos.length === 0 && (
        <p className="text-xs text-red-500">At least 1 photo is required</p>
      )}
      <p className="text-xs text-zinc-400">
        {photos.length} / {max} photos
      </p>
    </div>
  );
}

function DistanceSlider({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const km = Number(value) || 50;
  return (
    <div>
      <input
        type="range"
        min={5}
        max={500}
        step={5}
        value={km}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-blue-600"
      />
      <div className="mt-1 flex justify-between text-xs text-zinc-400">
        <span>5 km</span>
        <span className="font-semibold text-zinc-600 dark:text-zinc-300">{km} km</span>
        <span>500 km</span>
      </div>
    </div>
  );
}

function LocationInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="City, Country"
        className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </div>
  );
}

function ChipSelector({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
            value === opt.key
              ? "bg-blue-600 text-white shadow-sm"
              : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-600"
          }`}
        >
          {value === opt.key && <Check className="h-3.5 w-3.5" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Step content per wizard type
   ══════════════════════════════════════════════ */

type StepProps = {
  step: number;
  data: Record<string, string>;
  set: (key: string, value: string) => void;
};

function ObjectsSteps({ step, data, set }: StepProps) {
  const photos = data.photos ? (JSON.parse(data.photos) as string[]) : [];
  if (step === 1) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Title" />
          <TextInput value={data.title ?? ""} onChange={(v) => set("title", v)} placeholder="e.g. Sony WH-1000XM5 Headphones" />
        </div>
        <div>
          <OptionalLabel text="Short description" />
          <TextInput value={data.description ?? ""} onChange={(v) => set("description", v)} placeholder="Describe the item and what you want in return…" multiline />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div>
        <RequiredLabel text="Photos" />
        <p className="mb-3 text-xs text-zinc-500">Add up to 5 photos. At least 1 required.</p>
        <PhotoUpload photos={photos} onChange={(p) => set("photos", JSON.stringify(p))} required max={5} />
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Condition" />
          <ChipSelector
            options={[
              { key: "new", label: "New" },
              { key: "like_new", label: "Like new" },
              { key: "good", label: "Good" },
              { key: "fair", label: "Fair" },
            ]}
            value={data.condition ?? null}
            onChange={(v) => set("condition", v)}
          />
        </div>
        <div>
          <RequiredLabel text="Category" />
          <ChipSelector
            options={[
              { key: "electronics", label: "Electronics" },
              { key: "sport", label: "Sports" },
              { key: "arts", label: "Art & Hobby" },
              { key: "books", label: "Books" },
              { key: "home", label: "Home" },
              { key: "fashion", label: "Fashion" },
              { key: "automotive", label: "Auto" },
              { key: "music", label: "Music" },
              { key: "garden", label: "Garden" },
              { key: "toys", label: "Toys" },
              { key: "tools", label: "Tools" },
              { key: "other", label: "Other" },
            ]}
            value={data.category ?? null}
            onChange={(v) => set("category", v)}
          />
        </div>
      </div>
    );
  }
  if (step === 4) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Your location" />
          <LocationInput value={data.location ?? ""} onChange={(v) => set("location", v)} />
        </div>
        <div>
          <OptionalLabel text="Max distance willing to travel" />
          <DistanceSlider value={data.distance ?? "50"} onChange={(v) => set("distance", v)} />
        </div>
      </div>
    );
  }
  return null;
}

function PropertiesSteps({ step, data, set }: StepProps) {
  const photos = data.photos ? (JSON.parse(data.photos) as string[]) : [];
  if (step === 1) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Title" />
          <TextInput value={data.title ?? ""} onChange={(v) => set("title", v)} placeholder="e.g. 2-bedroom apartment in city centre" />
        </div>
        <div>
          <OptionalLabel text="Description" />
          <TextInput value={data.description ?? ""} onChange={(v) => set("description", v)} placeholder="Describe the property, amenities, exchange preferences…" multiline />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div>
        <OptionalLabel text="Photos" />
        <p className="mb-3 text-xs text-zinc-500">Up to 5 photos of the property.</p>
        <PhotoUpload photos={photos} onChange={(p) => set("photos", JSON.stringify(p))} max={5} />
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Property type" />
          <ChipSelector
            options={[
              { key: "apartment", label: "Apartment" },
              { key: "house", label: "House" },
              { key: "room", label: "Room" },
              { key: "land", label: "Land" },
              { key: "commercial", label: "Commercial" },
            ]}
            value={data.propertyType ?? null}
            onChange={(v) => set("propertyType", v)}
          />
        </div>
        <div>
          <OptionalLabel text="Size (m²)" />
          <input
            type="number"
            value={data.size ?? ""}
            onChange={(e) => set("size", e.target.value)}
            placeholder="e.g. 75"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
    );
  }
  if (step === 4) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Location" />
          <LocationInput value={data.location ?? ""} onChange={(v) => set("location", v)} />
        </div>
        <div>
          <OptionalLabel text="Max distance" />
          <DistanceSlider value={data.distance ?? "50"} onChange={(v) => set("distance", v)} />
        </div>
      </div>
    );
  }
  if (step === 5) {
    return (
      <div>
        <OptionalLabel text="Exchange preferences" />
        <p className="mb-3 text-xs text-zinc-500">What would you like to receive in return?</p>
        <TextInput value={data.exchangePrefs ?? ""} onChange={(v) => set("exchangePrefs", v)} placeholder="e.g. A property near the mountains or a similar apartment in another city…" multiline />
      </div>
    );
  }
  return null;
}

function ServicesSteps({ step, data, set }: StepProps) {
  const photos = data.photos ? (JSON.parse(data.photos) as string[]) : [];
  if (step === 1) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Title" />
          <TextInput value={data.title ?? ""} onChange={(v) => set("title", v)} placeholder="e.g. Web design & development" />
        </div>
        <div>
          <OptionalLabel text="Description" />
          <TextInput value={data.description ?? ""} onChange={(v) => set("description", v)} placeholder="Describe your service, experience, and what you want in return…" multiline />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div>
        <OptionalLabel text="Portfolio photos" />
        <p className="mb-3 text-xs text-zinc-500">Example work or portfolio images (optional).</p>
        <PhotoUpload photos={photos} onChange={(p) => set("photos", JSON.stringify(p))} max={5} />
      </div>
    );
  }
  if (step === 3) {
    return (
      <div>
        <RequiredLabel text="Service category" />
        <ChipSelector
          options={[
            { key: "professional", label: "Professional" },
            { key: "manual", label: "Manual / Labour" },
            { key: "creative", label: "Creative" },
            { key: "digital", label: "Digital" },
            { key: "other", label: "Other" },
          ]}
          value={data.serviceCategory ?? null}
          onChange={(v) => set("serviceCategory", v)}
        />
      </div>
    );
  }
  if (step === 4) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Location preference" />
          <ChipSelector
            options={[
              { key: "remote", label: "Remote only" },
              { key: "local", label: "Local only" },
              { key: "both", label: "Both" },
            ]}
            value={data.locationPref ?? null}
            onChange={(v) => set("locationPref", v)}
          />
        </div>
        {data.locationPref !== "remote" && (
          <div>
            <OptionalLabel text="Max distance" />
            <DistanceSlider value={data.distance ?? "50"} onChange={(v) => set("distance", v)} />
          </div>
        )}
      </div>
    );
  }
  return null;
}

function EventsSteps({ step, data, set }: StepProps) {
  const photos = data.photos ? (JSON.parse(data.photos) as string[]) : [];
  if (step === 1) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Title" />
          <TextInput value={data.title ?? ""} onChange={(v) => set("title", v)} placeholder="e.g. Concert tickets — Coldplay, June 2026" />
        </div>
        <div>
          <OptionalLabel text="Description" />
          <TextInput value={data.description ?? ""} onChange={(v) => set("description", v)} placeholder="Describe the event, number of tickets, what you'd like in return…" multiline />
        </div>
        <div>
          <RequiredLabel text="Event date" />
          <input
            type="date"
            value={data.eventDate ?? ""}
            onChange={(e) => set("eventDate", e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div>
        <OptionalLabel text="Photos" />
        <p className="mb-3 text-xs text-zinc-500">Event flyer or ticket scans (optional).</p>
        <PhotoUpload photos={photos} onChange={(p) => set("photos", JSON.stringify(p))} max={5} />
      </div>
    );
  }
  if (step === 3) {
    return (
      <div className="space-y-5">
        <div>
          <RequiredLabel text="Location" />
          <LocationInput value={data.location ?? ""} onChange={(v) => set("location", v)} />
        </div>
        <div>
          <OptionalLabel text="Max distance" />
          <DistanceSlider value={data.distance ?? "50"} onChange={(v) => set("distance", v)} />
        </div>
      </div>
    );
  }
  return null;
}

/* ══════════════════════════════════════════════
   Validation
   ══════════════════════════════════════════════ */

function isStepValid(type: WizardType, step: number, data: Record<string, string>): boolean {
  if (type === "objects") {
    if (step === 1) return !!data.title?.trim();
    if (step === 2) {
      const p = data.photos ? (JSON.parse(data.photos) as string[]) : [];
      return p.length >= 1;
    }
    if (step === 3) return !!data.condition && !!data.category;
    if (step === 4) return !!data.location?.trim();
  }
  if (type === "properties") {
    if (step === 1) return !!data.title?.trim();
    if (step === 3) return !!data.propertyType;
    if (step === 4) return !!data.location?.trim();
  }
  if (type === "services") {
    if (step === 1) return !!data.title?.trim();
    if (step === 3) return !!data.serviceCategory;
    if (step === 4) return !!data.locationPref;
  }
  if (type === "events") {
    if (step === 1) return !!data.title?.trim() && !!data.eventDate;
    if (step === 3) return !!data.location?.trim();
  }
  return true; // optional steps always valid
}

/* ══════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════ */

interface PageProps {
  params: Promise<{ locale: string; type: string }>;
}

export default function AddWizardPage({ params }: PageProps) {
  const { type } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAppState();

  const wizardType: WizardType = VALID_TYPES.has(type)
    ? (type as WizardType)
    : "objects";
  const intent: Intent = searchParams.get("intent") === "offer" ? "offer" : "want";
  const totalSteps = STEP_COUNTS[wizardType];

  const [step, setStep] = useState(1);
  const [data, setData] = useState<Record<string, string>>({});

  const set = (key: string, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const canProceed = isStepValid(wizardType, step, data);

  const handleNext = () => {
    if (!canProceed) return;
    if (step < totalSteps) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Production: persist to Supabase, then redirect
      router.push(intent === "want" ? "/profile" : "/my-objects");
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Auth guard
  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Sign in to add items
        </p>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/login?returnTo=/explore/add/${wizardType}?intent=${intent}`,
            )
          }
          className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Sign in
        </button>
      </div>
    );
  }

  const pageTitle = intent === "want" ? "Add Want" : "Add Offer";

  const renderStep = () => {
    if (wizardType === "objects")
      return <ObjectsSteps step={step} data={data} set={set} />;
    if (wizardType === "properties")
      return <PropertiesSteps step={step} data={data} set={set} />;
    if (wizardType === "services")
      return <ServicesSteps step={step} data={data} set={set} />;
    if (wizardType === "events")
      return <EventsSteps step={step} data={data} set={set} />;
    return null;
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* ── Fixed header ── */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {pageTitle}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Step {step} of {totalSteps}
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {step}&thinsp;/&thinsp;{totalSteps}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6">{renderStep()}</div>
      </div>

      {/* ── Fixed footer ── */}
      <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-lg gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white transition ${
              canProceed
                ? "bg-blue-600 hover:bg-blue-700"
                : "cursor-not-allowed bg-blue-300 dark:bg-blue-900/50"
            }`}
          >
            {step === totalSteps ? "Publish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
