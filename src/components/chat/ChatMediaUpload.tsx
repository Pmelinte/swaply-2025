"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Mic, Video, X } from "lucide-react";
import { isFileAllowed } from "@/lib/chat/chatModeration";

export type MediaType = "image" | "audio" | "video";

export interface PendingMedia {
  file: File;
  type: MediaType;
  previewUrl: string;
}

interface Props {
  onMediaSelected: (media: PendingMedia) => void;
  onClear: () => void;
  pending: PendingMedia | null;
}

export function ChatMediaUpload({ onMediaSelected, onClear, pending }: Props) {
  const t = useTranslations("chat");
  const imageRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File, type: MediaType) {
    setError(null);
    if (!isFileAllowed(file.name)) {
      setError(t("fileBlocked"));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onMediaSelected({ file, type, previewUrl });
  }

  return (
    <div className="flex items-center gap-1">
      {/* Image */}
      <button
        type="button"
        onClick={() => imageRef.current?.click()}
        className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        title={t("attachImage")}
      >
        <Camera className="h-4 w-4" />
      </button>
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f, "image");
          e.target.value = "";
        }}
      />

      {/* Audio */}
      <button
        type="button"
        onClick={() => audioRef.current?.click()}
        className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        title={t("attachAudio")}
      >
        <Mic className="h-4 w-4" />
      </button>
      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f, "audio");
          e.target.value = "";
        }}
      />

      {/* Video */}
      <button
        type="button"
        onClick={() => videoRef.current?.click()}
        className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        title={t("attachVideo")}
      >
        <Video className="h-4 w-4" />
      </button>
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f, "video");
          e.target.value = "";
        }}
      />

      {/* Preview badge */}
      {pending && (
        <div className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          {pending.type === "image" ? "📷" : pending.type === "audio" ? "🎤" : "🎬"}
          <span className="max-w-20 truncate">{pending.file.name}</span>
          <button type="button" onClick={onClear}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {error && (
        <span className="text-[10px] text-red-500">{error}</span>
      )}
    </div>
  );
}
