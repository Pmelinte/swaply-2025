import { getSupabaseClient } from "./supabase/client";

const SUPABASE_BUCKET = "item-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload an image, with three tiers:
 * 1. Cloudinary (if NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set)
 * 2. Supabase Storage (if Supabase is configured)
 * 3. Local blob URL (fallback for dev/mock mode)
 */
export async function uploadItemPhoto(
  file: File,
  ownerId: string,
): Promise<UploadResult> {
  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: "Format neacceptat. Foloseste JPG, PNG, WebP sau GIF." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { url: null, error: "Fisierul depaseste limita de 5 MB." };
  }

  // Tier 1: Cloudinary unsigned upload
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloudName) {
    return uploadToCloudinary(file, cloudName, ownerId);
  }

  // Tier 2: Supabase Storage
  const supabase = getSupabaseClient();
  if (supabase) {
    return uploadToSupabase(file, supabase, ownerId);
  }

  // Tier 3: Local blob URL (mock/dev mode)
  return { url: URL.createObjectURL(file), error: null };
}

async function uploadToCloudinary(
  file: File,
  cloudName: string,
  ownerId: string,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "swaply_unsigned");
  formData.append("folder", `swaply/${ownerId}`);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    if (!res.ok) {
      const text = await res.text();
      console.warn("Cloudinary upload failed:", text);
      // Fallback to Supabase or blob
      const supabase = getSupabaseClient();
      if (supabase) return uploadToSupabase(file, supabase, ownerId);
      return { url: URL.createObjectURL(file), error: null };
    }
    const data = await res.json();
    return { url: data.secure_url as string, error: null };
  } catch (err) {
    console.warn("Cloudinary upload error:", err);
    const supabase = getSupabaseClient();
    if (supabase) return uploadToSupabase(file, supabase, ownerId);
    return { url: URL.createObjectURL(file), error: null };
  }
}

async function uploadToSupabase(
  file: File,
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  ownerId: string,
): Promise<UploadResult> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${ownerId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Supabase Storage upload error:", uploadError.message);
    return { url: null, error: uploadError.message };
  }

  const { data: publicUrl } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return { url: publicUrl.publicUrl, error: null };
}

/**
 * Upload a profile avatar and clean up the previous app-owned avatar after the
 * replacement is available. External URLs are left untouched because they may be
 * shared or require provider-side signed deletion.
 */
export async function uploadProfileAvatar(
  file: File,
  ownerId: string,
  previousAvatarUrl?: string | null,
): Promise<UploadResult> {
  const result = await uploadItemPhoto(file, ownerId);

  if (result.url && previousAvatarUrl && previousAvatarUrl !== result.url) {
    await deleteItemPhoto(previousAvatarUrl);
  }

  return result;
}

/**
 * Delete an image. Handles Cloudinary, Supabase and blob URLs gracefully.
 */
export async function deleteItemPhoto(url: string): Promise<void> {
  if (url.startsWith("blob:")) return;

  // Cloudinary URLs — no server-side deletion from client (requires signed API)
  if (url.includes("res.cloudinary.com")) return;

  // Unsplash placeholders — skip
  if (url.includes("unsplash.com")) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const bucketSegment = `/storage/v1/object/public/${SUPABASE_BUCKET}/`;
  const idx = url.indexOf(bucketSegment);
  if (idx === -1) return;

  const path = url.slice(idx + bucketSegment.length);
  await supabase.storage.from(SUPABASE_BUCKET).remove([path]);
}

/** Placeholder image URL for items without photos */
export const NO_IMAGE_URL = "/no-image.svg";
