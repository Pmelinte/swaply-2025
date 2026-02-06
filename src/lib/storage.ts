import { getSupabaseClient } from "./supabase/client";

const BUCKET = "item-photos";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload an image to Supabase Storage.
 * Falls back to a local blob URL when Supabase is not configured.
 */
export async function uploadItemPhoto(
  file: File,
  ownerId: string,
): Promise<UploadResult> {
  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: "Format neacceptat. Folosește JPG, PNG, WebP sau GIF." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { url: null, error: "Fișierul depășește limita de 5 MB." };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    // Fallback: local blob URL for demo mode
    return { url: URL.createObjectURL(file), error: null };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${ownerId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    // If bucket doesn't exist or storage not set up, fall back to local
    if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket")) {
      console.warn("Supabase Storage bucket not configured, using local fallback:", uploadError.message);
      return { url: URL.createObjectURL(file), error: null };
    }
    return { url: null, error: uploadError.message };
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: publicUrl.publicUrl, error: null };
}

/**
 * Delete an image from Supabase Storage.
 * No-op for blob URLs (demo mode).
 */
export async function deleteItemPhoto(url: string): Promise<void> {
  if (url.startsWith("blob:") || url.startsWith("https://images.unsplash.com")) {
    return; // Local or placeholder — nothing to delete
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  // Extract path from public URL
  const bucketSegment = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(bucketSegment);
  if (idx === -1) return;

  const path = url.slice(idx + bucketSegment.length);
  await supabase.storage.from(BUCKET).remove([path]);
}
