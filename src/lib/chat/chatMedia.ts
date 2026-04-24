"use client";

/**
 * Media upload helpers for chat messages.
 *
 * Tries Cloudinary (if NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set) then falls
 * back to Supabase Storage, then to a local blob URL (dev/mock).
 *
 * Cloudinary requests enable async moderation via `aws_rek` — the returned
 * `moderationStatus` reflects the synchronous check; the final verdict is
 * emitted via webhook and mirrored into `messages.moderation_status` later.
 */

import { getSupabaseClient } from "@/lib/supabase/client";

export type ChatMediaType = "image" | "audio" | "video";

export interface ChatMediaUploadResult {
  url: string;
  publicId: string;
  moderationStatus: "pending" | "approved" | "rejected";
}

export const CHAT_MEDIA_LIMITS = {
  imageMaxCount: 5,
  imageMaxBytes: 10 * 1024 * 1024,   // 10 MB
  audioMaxSeconds: 60,
  audioMaxBytes: 15 * 1024 * 1024,   // 15 MB
  videoMaxSeconds: 30,
  videoMaxBytes: 50 * 1024 * 1024,   // 50 MB
} as const;

function resourceTypeFor(type: ChatMediaType): "image" | "video" | "raw" {
  if (type === "image") return "image";
  return "video"; // Cloudinary uses "video" for audio too
}

function bytesLimitFor(type: ChatMediaType): number {
  if (type === "image") return CHAT_MEDIA_LIMITS.imageMaxBytes;
  if (type === "audio") return CHAT_MEDIA_LIMITS.audioMaxBytes;
  return CHAT_MEDIA_LIMITS.videoMaxBytes;
}

function secondsLimitFor(type: ChatMediaType): number | null {
  if (type === "audio") return CHAT_MEDIA_LIMITS.audioMaxSeconds;
  if (type === "video") return CHAT_MEDIA_LIMITS.videoMaxSeconds;
  return null;
}

/** Return the duration of an audio/video File in seconds via a local element. */
export function probeMediaDuration(file: File, kind: "audio" | "video"): Promise<number> {
  return new Promise((resolve, reject) => {
    const el = document.createElement(kind);
    const url = URL.createObjectURL(file);
    el.preload = "metadata";
    el.src = url;
    el.onloadedmetadata = () => {
      const seconds = Number.isFinite(el.duration) ? el.duration : 0;
      URL.revokeObjectURL(url);
      resolve(seconds);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("probe_failed"));
    };
  });
}

/**
 * Upload a chat media file and request asynchronous AWS Rekognition moderation.
 * Throws on hard limit violations; falls back to Supabase Storage / blob URL
 * when Cloudinary is not configured.
 */
export async function uploadToCloudinary(
  file: File,
  type: ChatMediaType,
): Promise<ChatMediaUploadResult> {
  if (file.size > bytesLimitFor(type)) {
    throw new Error("file_too_large");
  }

  const durationCap = secondsLimitFor(type);
  if (durationCap && (type === "audio" || type === "video")) {
    try {
      const seconds = await probeMediaDuration(file, type);
      if (seconds > durationCap + 0.5) {
        throw new Error("duration_too_long");
      }
    } catch (err) {
      if ((err as Error).message === "duration_too_long") throw err;
      // probe failed – let the upstream enforce server-side
    }
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.NEXT_PUBLIC_CLOUDINARY_CHAT_PRESET ?? "swaply_chat_unsigned";

  if (cloudName) {
    const resourceType = resourceTypeFor(type);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "swaply/chat");
    formData.append("async_moderation", "aws_rek");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData },
    );

    if (res.ok) {
      const data = (await res.json()) as {
        secure_url: string;
        public_id: string;
        moderation?: Array<{ status: string; kind: string }>;
      };
      const modEntry = data.moderation?.[0];
      const moderationStatus: ChatMediaUploadResult["moderationStatus"] =
        modEntry?.status === "approved"
          ? "approved"
          : modEntry?.status === "rejected"
            ? "rejected"
            : "pending";
      return {
        url: data.secure_url,
        publicId: data.public_id,
        moderationStatus,
      };
    }
    // fallthrough to Supabase / blob
  }

  // Fallback: Supabase Storage (bucket "chat-media" assumed configured)
  const supabase = getSupabaseClient();
  if (supabase) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from("chat-media")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (!error && data) {
      const { data: pub } = supabase.storage.from("chat-media").getPublicUrl(data.path);
      return {
        url: pub.publicUrl,
        publicId: data.path,
        moderationStatus: "pending",
      };
    }
  }

  // Last resort: blob URL (dev-only)
  return {
    url: URL.createObjectURL(file),
    publicId: `local-${Date.now()}`,
    moderationStatus: "pending",
  };
}
