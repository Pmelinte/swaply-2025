"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { uploadItemPhoto } from "@/lib/storage";
import { ChevronLeft, ChevronRight, Upload, X, Loader2, CheckCircle2 } from "lucide-react";

const WIZARD_STEPS = 5;

const CATEGORY_L1_LIST = [
  { emoji: "🐾", name: "Animals & Pet Supplies", key: "categoryAnimals" },
  { emoji: "👗", name: "Apparel & Accessories", key: "categoryApparel" },
  { emoji: "🎨", name: "Arts & Entertainment", key: "categoryArts" },
  { emoji: "👶", name: "Baby & Toddler", key: "categoryBaby" },
  { emoji: "🏭", name: "Business & Industrial", key: "categoryBusiness" },
  { emoji: "📷", name: "Cameras & Optics", key: "categoryCameras" },
  { emoji: "💻", name: "Electronics", key: "categoryElectronics" },
  { emoji: "🛋️", name: "Furniture", key: "categoryFurniture" },
  { emoji: "🔧", name: "Hardware", key: "categoryHardware" },
  { emoji: "💄", name: "Health & Beauty", key: "categoryHealth" },
  { emoji: "🏡", name: "Home & Garden", key: "categoryHome" },
  { emoji: "🧳", name: "Luggage & Bags", key: "categoryLuggage" },
  { emoji: "🔞", name: "Mature", key: "categoryMature" },
  { emoji: "📀", name: "Media", key: "categoryMedia" },
  { emoji: "📎", name: "Office Supplies", key: "categoryOffice" },
  { emoji: "💾", name: "Software", key: "categorySoftware" },
  { emoji: "⚽", name: "Sporting Goods", key: "categorySports" },
  { emoji: "🧸", name: "Toys & Games", key: "categoryToys" },
  { emoji: "🚗", name: "Vehicles & Parts", key: "categoryVehicles" },
];

const CATEGORY_L2_MAP: Record<string, string[]> = {
  "Animals & Pet Supplies": ["Pet Supplies", "Small Animals", "Aquatic", "Reptiles"],
  "Apparel & Accessories": ["Clothing", "Footwear", "Bags", "Jewelry", "Watches"],
  "Arts & Entertainment": ["Collectibles", "Art Supplies", "Musical Instruments", "Games"],
  "Baby & Toddler": ["Clothing", "Furniture", "Toys", "Gear"],
  "Business & Industrial": ["Equipment", "Supplies", "Tools", "Office"],
  "Cameras & Optics": ["Digital Cameras", "Film Cameras", "Lenses", "Accessories"],
  "Electronics": ["Computers", "Phones", "Audio", "Accessories"],
  "Furniture": ["Home Furniture", "Office Furniture", "Outdoor", "Storage"],
  "Hardware": ["Tools", "Safety Equipment", "Building Materials", "Fixtures"],
  "Health & Beauty": ["Skincare", "Fragrance", "Hair Care", "Wellness"],
  "Home & Garden": ["Kitchen", "Decor", "Bedding", "Garden Tools"],
  "Luggage & Bags": ["Travel Bags", "Backpacks", "Handbags", "Briefcases"],
  "Mature": ["Adult Items", "Books", "Games"],
  "Media": ["Books", "Movies", "Music", "Comics"],
  "Office Supplies": ["Writing", "Paper", "Organization", "Tech"],
  "Software": ["Applications", "Operating Systems", "Licenses", "Plugins"],
  "Sporting Goods": ["Equipment", "Apparel", "Footwear", "Accessories"],
  "Toys & Games": ["Board Games", "Action Figures", "Puzzles", "LEGO"],
  "Vehicles & Parts": ["Cars", "Motorcycles", "Parts", "Accessories"],
};

const CONDITIONS = [
  { emoji: "🆕", name: "New", key: "step2ConditionNew", desc: "step2ConditionNewDesc" },
  { emoji: "✨", name: "Like New", key: "step2ConditionLikeNew", desc: "step2ConditionLikeNewDesc" },
  { emoji: "👍", name: "Very Good", key: "step2ConditionVeryGood", desc: "step2ConditionVeryGoodDesc" },
  { emoji: "👌", name: "Good", key: "step2ConditionGood", desc: "step2ConditionGoodDesc" },
  { emoji: "🔧", name: "Used", key: "step2ConditionUsed", desc: "step2ConditionUsedDesc" },
  { emoji: "⚠️", name: "For Repair", key: "step2ConditionRepair", desc: "step2ConditionRepairDesc" },
  { emoji: "🏆", name: "Special / Collection", key: "step2ConditionSpecial", desc: "step2ConditionSpecialDesc" },
];

const VALUE_TIERS = [
  { emoji: "🪙", name: "Small", key: "step2ValueSmall", range: "step2ValueSmallRange" },
  { emoji: "💵", name: "Medium", key: "step2ValueMedium", range: "step2ValueMediumRange" },
  { emoji: "💎", name: "Large", key: "step2ValueLarge", range: "step2ValueLargeRange" },
  { emoji: "⭐", name: "Special", key: "step2ValueSpecial", range: "step2ValueSpecialRange" },
];

const SWAP_OPEN_TO = [
  { emoji: "📦", name: "Objects only", key: "step4OpenToObjects" },
  { emoji: "📦+🛠️", name: "Objects + Services", key: "step4OpenToObjectsServices" },
  { emoji: "📦+🎫", name: "Objects + Events", key: "step4OpenToObjectsEvents" },
  { emoji: "📦+🏠", name: "Objects + Accommodation", key: "step4OpenToObjectsAccommodation" },
  { emoji: "🔀", name: "Anything", key: "step4OpenToAnything" },
];

const SWAP_VALUE_MATCH = [
  { name: "Exact", key: "step4ValueMatchExact" },
  { name: "Adjacent", key: "step4ValueMatchAdjacent" },
  { name: "Open", key: "step4ValueMatchOpen" },
];

const SWAP_FLEXIBILITY = [
  { name: "Strict", key: "step4FlexibilityStrict" },
  { name: "Moderate", key: "step4FlexibilityModerate" },
  { name: "Wide", key: "step4FlexibilityWide" },
];

const SWAP_GEO = [
  { emoji: "🏙️", name: "Local", key: "step4GeoLocal" },
  { emoji: "🗺️", name: "Regional", key: "step4GeoRegional" },
  { emoji: "🌍", name: "International", key: "step4GeoInternational" },
  { emoji: "✈️", name: "Vacation", key: "step4GeoVacation" },
];

type FormData = {
  // Step 1
  category_l1: string;
  category_l2: string;
  category_l3: string;
  title: string;
  // Step 2
  condition: string;
  condition_details: string;
  perceived_value_tier: string;
  photos: string[]; // URLs
  photo_files: File[]; // For upload tracking
  // Step 3
  description: string;
  tags: string[];
  age_years: string;
  original_packaging: boolean;
  // Step 4
  swap_open_to: string;
  swap_wants_description: string;
  swap_value_match: string;
  swap_flexibility: string;
  swap_chain_allowed: boolean;
  swap_geo_preference: string;
  // Step 5
  status: "draft" | "active";
};

export function ObjectWizardClient() {
  const t = useTranslations("objectWizard");
  const tc = useTranslations("common");
  const { user } = useAppState();
  const router = useRouter();
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState(false);
  const [aiGeneratedDescription, setAiGeneratedDescription] = useState(false);
  const [aiGeneratedCategory, setAiGeneratedCategory] = useState(false);
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [aiDebug, setAiDebug] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    category_l1: "",
    category_l2: "",
    category_l3: "",
    title: "",
    condition: "",
    condition_details: "",
    perceived_value_tier: "",
    photos: [],
    photo_files: [],
    description: "",
    tags: [],
    age_years: "",
    original_packaging: false,
    swap_open_to: "",
    swap_wants_description: "",
    swap_value_match: "",
    swap_flexibility: "",
    swap_chain_allowed: false,
    swap_geo_preference: "",
    status: "active",
  });

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const goToStep = (newStep: number) => {
    if (newStep >= 1 && newStep <= WIZARD_STEPS) {
      setStep(newStep);
      setError(null);
    }
  };

  const analyzeWithGrok = async (imageUrl: string) => {
    setLastAnalyzedUrl(imageUrl);
    setAiLoading(true);
    setAiDebug("Sending to AI...");
    try {
      const payloadKB = Math.round(imageUrl.length / 1024);
      console.log(`[AI] sending imageUrl type=${imageUrl.startsWith("data:") ? "data" : "http"} size=${payloadKB}KB`);

      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      console.log(`[AI] response status=${res.status}`);
      if (!res.ok) {
        setAiDebug(`HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log("[AI] response body:", JSON.stringify(data));
      setAiDebug(data._debug ?? "no _debug");

      const updates: Partial<FormData> = {};
      if (data.title) {
        updates.title = data.title;
        setAiGeneratedTitle(true);
      }
      if (data.description) {
        updates.description = data.description;
        setAiGeneratedDescription(true);
      }
      if (data.category_l1) {
        updates.category_l1 = data.category_l1;
        updates.category_l2 = data.category_l2 || "";
        setAiGeneratedCategory(true);
      }
      if (Object.keys(updates).length > 0) updateForm(updates);
    } catch (e) {
      console.error("[AI] fetch exception:", e);
      setAiDebug(`exception: ${String(e).slice(0, 80)}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setUrlInput("");
    if (!form.photos.includes(trimmed)) {
      setForm((prev) => ({ ...prev, photos: [...prev.photos, trimmed] }));
    }
    analyzeWithGrok(trimmed);
  };

  // Resize + compress a File to a small JPEG data URL (≤800 px, q=0.8).
  // Keeps the base64 payload well under Next.js's 4 MB body-parser limit.
  const resizeForAI = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        // Canvas failed (e.g. SVG/tainted) — fall back to raw FileReader
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });

  const handlePhotoUpload = async (files: File[]) => {
    if (!user) return;
    setLoading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "swaply_unsigned";

      // Kick off AI analysis immediately using a compressed local data URL —
      // runs in parallel with the Cloudinary upload.
      if (files[0] && form.photos.length === 0) {
        resizeForAI(files[0]).then((dataUrl) => {
          if (dataUrl) analyzeWithGrok(dataUrl);
        });
      }

      // Upload all files (Cloudinary → uploadItemPhoto → local blob fallback)
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          let url: string | null = null;

          if (cloudName) {
            try {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("upload_preset", uploadPreset);
              fd.append("folder", `swaply/${user.id}`);
              const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: "POST", body: fd },
              );
              if (res.ok) {
                const json = await res.json();
                url = json.secure_url as string;
              }
            } catch {
              // fall through to uploadItemPhoto
            }
          }

          if (!url) {
            const { url: fallbackUrl } = await uploadItemPhoto(file, user.id);
            url = fallbackUrl ?? URL.createObjectURL(file);
          }

          return url;
        }),
      );

      const validUrls = uploadedUrls.filter((u): u is string => Boolean(u));
      setForm((prev) => ({
        ...prev,
        photos: [...prev.photos, ...validUrls],
        photo_files: [...prev.photo_files, ...files],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    // Validate required fields
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.category_l1) {
      setError("Category is required");
      return;
    }
    if (!form.condition) {
      setError("Condition is required");
      return;
    }
    if (!form.perceived_value_tier) {
      setError("Value tier is required");
      return;
    }
    if (form.photos.length === 0) {
      setError("At least one photo is required");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!form.swap_open_to) {
      setError("Swap preference is required");
      return;
    }
    if (!form.swap_wants_description.trim()) {
      setError("Please describe what you want in return");
      return;
    }
    if (!form.swap_value_match) {
      setError("Value match preference is required");
      return;
    }
    if (!form.swap_flexibility) {
      setError("Flexibility level is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not available");

      const payload = {
        owner_id: user!.id,
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        category_l1: form.category_l1,
        category_l2: form.category_l2 || null,
        category_l3: form.category_l3.trim() || null,
        condition: form.condition,
        condition_details: form.condition_details.trim() || null,
        perceived_value_tier: form.perceived_value_tier,
        age_years: form.age_years ? parseInt(form.age_years) : null,
        original_packaging: form.original_packaging,
        tags: form.tags.length > 0 ? form.tags : null,
        photos: form.photos,
        swap_open_to: form.swap_open_to,
        swap_wants_description: form.swap_wants_description.trim(),
        swap_value_match: form.swap_value_match,
        swap_flexibility: form.swap_flexibility,
        swap_chain_allowed: form.swap_chain_allowed,
        swap_geo_preference: form.swap_geo_preference || null,
        item_type: "object",
      };

      const { data, error: insertError } = await supabase
        .from("items")
        .insert([payload])
        .select();

      if (insertError) throw insertError;

      if (data && data.length > 0) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/objects/${data[0].id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 p-4 dark:from-zinc-950 dark:to-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-700 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("step5Success")}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("step5SuccessMessage")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 dark:from-zinc-950 dark:to-slate-900 p-4">
      <div className="mx-auto w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {step === 1 && t("step1Title")}
              {step === 2 && t("step2Title")}
              {step === 3 && t("step3Title")}
              {step === 4 && t("step4Title")}
              {step === 5 && t("step5Title")}
            </h1>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {t("progressStep", { current: step })}
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / WIZARD_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white border border-zinc-200 shadow-sm p-6 dark:bg-zinc-900 dark:border-zinc-700 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 dark:bg-red-950/30 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Step 1: Photo → Title → Categories */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("step1Subtitle")}
              </p>

              {/* 1. Photo upload */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Photo
                </label>

                {/* Thumbnails */}
                {form.photos.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {form.photos.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="h-20 w-20 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-800"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d4d4d8'/%3E%3C/svg%3E";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateForm({
                              photos: form.photos.filter((_, i) => i !== idx),
                              photo_files: form.photo_files.filter((_, i) => i !== idx),
                            })
                          }
                          className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone */}
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = Array.from(e.dataTransfer.files).find((f) =>
                      f.type.startsWith("image/"),
                    );
                    if (file) handlePhotoUpload([file]);
                  }}
                  className="flex flex-col items-center justify-center w-full border-2 border-dashed border-zinc-300 rounded-lg p-6 cursor-pointer hover:border-blue-400 dark:border-zinc-600 dark:hover:border-blue-400 transition"
                >
                  {loading ? (
                    <Loader2 className="h-7 w-7 text-blue-500 animate-spin mb-2" />
                  ) : (
                    <Upload className="h-7 w-7 text-zinc-400 mb-2" />
                  )}
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {loading ? "Uploading…" : "Click to upload or drag & drop"}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    JPG, PNG, WebP, GIF · max 5 MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) handlePhotoUpload([file]);
                      e.currentTarget.value = "";
                    }}
                    className="hidden"
                  />
                </label>

                {/* URL input */}
                <div className="mt-3">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-2">
                    or paste an image URL
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleUrlSubmit();
                        }
                      }}
                      placeholder="https://example.com/product.jpg"
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={handleUrlSubmit}
                      disabled={!urlInput.trim() || loading || aiLoading}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Use
                    </button>
                  </div>
                </div>

                {/* AI analyzing indicator */}
                {aiLoading && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing image…</span>
                  </div>
                )}

                {/* AI debug status — visible in production to diagnose failures */}
                {!aiLoading && aiDebug && (
                  <div className={`mt-2 rounded px-2 py-1 text-xs font-mono ${aiDebug === "ok" ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}>
                    AI: {aiDebug}
                  </div>
                )}
              </div>

              {/* 2. Title */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("step1TitleLabel")} *
                  </label>
                  <div className="flex items-center gap-2">
                    {aiGeneratedTitle && (
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                        ✨ AI generated
                      </span>
                    )}
                    {lastAnalyzedUrl && (
                      <button
                        type="button"
                        onClick={() => analyzeWithGrok(lastAnalyzedUrl)}
                        disabled={aiLoading}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                      >
                        {aiLoading ? "Analyzing…" : "Regenerate with AI ✨"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={120}
                    value={form.title}
                    onChange={(e) => {
                      updateForm({ title: e.target.value });
                      setAiGeneratedTitle(false);
                    }}
                    placeholder={aiLoading ? "Analyzing image…" : t("step1TitlePlaceholder")}
                    disabled={aiLoading}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 disabled:opacity-60"
                  />
                  {aiLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {form.title.length}/120
                </p>
              </div>

              {/* 3. Category L1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("step1CategoryLabel")} *
                  </label>
                  {aiGeneratedCategory && (
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      ✨ AI
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_L1_LIST.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        updateForm({ category_l1: cat.name, category_l2: "" });
                        setAiGeneratedCategory(false);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition ${
                        form.category_l1 === cat.name
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="text-xs">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Category L2 */}
              {form.category_l1 && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                    {t("step1L2Label")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_L2_MAP[form.category_l1]?.map((subcat) => (
                      <button
                        key={subcat}
                        type="button"
                        onClick={() => {
                          updateForm({ category_l2: subcat });
                          setAiGeneratedCategory(false);
                        }}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          form.category_l2 === subcat
                            ? "bg-blue-600 text-white"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
                        }`}
                      >
                        {subcat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Category L3 */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  {t("step1L3Label")}
                </label>
                <input
                  type="text"
                  value={form.category_l3}
                  onChange={(e) => updateForm({ category_l3: e.target.value })}
                  placeholder="e.g., Vintage, Limited Edition"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* Step 2: Condition & Value */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("step2Subtitle")}
              </p>

              {/* Condition */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                  {t("step2ConditionLabel")} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDITIONS.map((cond) => (
                    <button
                      key={cond.name}
                      type="button"
                      onClick={() => updateForm({ condition: cond.name })}
                      className={`flex flex-col items-start rounded-lg border p-3 text-left transition ${
                        form.condition === cond.name
                          ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                          : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{cond.emoji}</span>
                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                          {cond.name}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {t(cond.desc)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition details */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  {t("step2DetailsLabel")}
                </label>
                <textarea
                  value={form.condition_details}
                  onChange={(e) => updateForm({ condition_details: e.target.value })}
                  placeholder={t("step2DetailsPlaceholder")}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {form.condition_details.length}/500
                </p>
              </div>

              {/* Value tier */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                  {t("step2ValueLabel")} *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VALUE_TIERS.map((tier) => (
                    <button
                      key={tier.name}
                      type="button"
                      onClick={() => updateForm({ perceived_value_tier: tier.name })}
                      className={`flex flex-col items-center rounded-lg border p-3 text-center transition ${
                        form.perceived_value_tier === tier.name
                          ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                          : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
                      }`}
                    >
                      <span className="text-2xl mb-1">{tier.emoji}</span>
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50 mb-1">
                        {tier.name}
                      </span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {t(tier.range)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  {t("step2PhotosLabel")} *
                </label>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                  {t("step2PhotosHint")}
                </p>

                {/* Photo thumbnails */}
                {form.photos.length > 0 && (
                  <div className="mb-4 grid grid-cols-4 gap-2">
                    {form.photos.map((url, idx) => (
                      <div key={idx} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-800"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d4d4d8'/%3E%3C/svg%3E";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateForm({
                              photos: form.photos.filter((_, i) => i !== idx),
                              photo_files: form.photo_files.filter((_, i) => i !== idx),
                            })
                          }
                          className="absolute -top-2 -right-2 rounded-full bg-red-600 p-1 text-white opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload area */}
                {form.photos.length < 10 && (
                  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-zinc-300 rounded-lg p-8 cursor-pointer hover:border-blue-400 dark:border-zinc-600 dark:hover:border-blue-400 transition">
                    <Upload className="h-8 w-8 text-zinc-400 mb-2" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {t("step2PhotoUpload")}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.currentTarget.files || []);
                        if (files.length + form.photos.length <= 10) {
                          handlePhotoUpload(files);
                        } else {
                          setError(`Maximum 10 photos allowed`);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Description */}
          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("step3Subtitle")}
              </p>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {t("step3DescriptionLabel")} *
                  </label>
                  <div className="flex items-center gap-2">
                    {aiGeneratedDescription && (
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                        ✨ AI generated
                      </span>
                    )}
                    {lastAnalyzedUrl && (
                      <button
                        type="button"
                        onClick={() => analyzeWithGrok(lastAnalyzedUrl)}
                        disabled={aiLoading}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                      >
                        {aiLoading ? "Analyzing…" : "Regenerate with AI ✨"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      updateForm({ description: e.target.value });
                      setAiGeneratedDescription(false);
                    }}
                    placeholder={aiLoading ? "Analyzing image…" : t("step3DescriptionPlaceholder")}
                    disabled={aiLoading}
                    maxLength={3000}
                    rows={5}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 disabled:opacity-60"
                  />
                  {aiLoading && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-500" />
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {form.description.length}/3000
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  {t("step3TagsLabel")}
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.tags.map((tag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          updateForm({ tags: form.tags.filter((_, i) => i !== idx) })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder={t("step3TagsPlaceholder")}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      const tag = e.currentTarget.value.trim().replace(/,/, "");
                      if (form.tags.length < 10 && !form.tags.includes(tag)) {
                        updateForm({ tags: [...form.tags, tag] });
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {form.tags.length}/10 {t("step3TagsHint")}
                </p>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  {t("step3AgeLabel")}
                </label>
                <input
                  type="number"
                  value={form.age_years}
                  onChange={(e) => updateForm({ age_years: e.target.value })}
                  placeholder={t("step3AgePlaceholder")}
                  min="0"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Original packaging */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.original_packaging}
                  onChange={(e) => updateForm({ original_packaging: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-200 dark:border-zinc-700"
                />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {t("step3PackagingLabel")}
                </span>
              </label>
            </div>
          )}

          {/* Step 4: Swap Preferences */}
          {step === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("step4Subtitle")}
              </p>

              {/* Open to */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                  {t("step4OpenToLabel")} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {SWAP_OPEN_TO.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => updateForm({ swap_open_to: opt.name })}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                        form.swap_open_to === opt.name
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wants description */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  {t("step4WantsLabel")} *
                </label>
                <textarea
                  value={form.swap_wants_description}
                  onChange={(e) => updateForm({ swap_wants_description: e.target.value })}
                  placeholder={t("step4WantsPlaceholder")}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {form.swap_wants_description.length}/500
                </p>
              </div>

              {/* Value match */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                  {t("step4ValueMatchLabel")} *
                </label>
                <div className="flex gap-2">
                  {SWAP_VALUE_MATCH.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => updateForm({ swap_value_match: opt.name })}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        form.swap_value_match === opt.name
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
                      }`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flexibility */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                  {t("step4FlexibilityLabel")} *
                </label>
                <div className="flex gap-2">
                  {SWAP_FLEXIBILITY.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => updateForm({ swap_flexibility: opt.name })}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        form.swap_flexibility === opt.name
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
                      }`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swap chain */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.swap_chain_allowed}
                  onChange={(e) => updateForm({ swap_chain_allowed: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-200 dark:border-zinc-700"
                />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {t("step4ChainLabel")}
                </span>
              </label>

              {/* Geographic preference */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                  {t("step4GeoLabel")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SWAP_GEO.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => updateForm({ swap_geo_preference: opt.name })}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                        form.swap_geo_preference === opt.name
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-blue-400"
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {t("step5Subtitle")}
              </p>

              {/* Preview card */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                  {t("step5PreviewTitle")}
                </h3>
                <div className="space-y-3">
                  {form.photos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.photos[0]}
                      alt={form.title || "Preview"}
                      className="w-full h-40 object-cover rounded-lg bg-zinc-100 dark:bg-zinc-800"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23d4d4d8'/%3E%3C/svg%3E";
                      }}
                    />
                  )}
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {form.title}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {form.category_l1}
                      {form.category_l2 && ` • ${form.category_l2}`}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs rounded-full bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {form.condition}
                    </span>
                    <span className="text-xs rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {form.perceived_value_tier}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {form.description}
                  </p>
                </div>
              </div>

              {/* Status selector */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                  {t("step5StatusLabel")} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateForm({ status: "draft" })}
                    className={`rounded-lg border p-4 text-left transition ${
                      form.status === "draft"
                        ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                        : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
                    }`}
                  >
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("step5StatusDraft")}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm({ status: "active" })}
                    className={`rounded-lg border p-4 text-left transition ${
                      form.status === "active"
                        ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                        : "border-zinc-200 bg-white hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-400"
                    }`}
                  >
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {t("step5StatusActive")}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            {step > 1 && (
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("back")}
              </button>
            )}
            {step < WIZARD_STEPS && (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                disabled={loading}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {t("next")}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {step === WIZARD_STEPS && (
              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateForm({ status: "draft" });
                    handlePublish();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("saveDraft")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateForm({ status: "active" });
                    handlePublish();
                  }}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("step5PublishButton")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
