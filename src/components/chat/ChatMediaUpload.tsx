"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Mic, Video, ImageIcon } from "lucide-react";
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
  /** When true, renders each upload option as a labelled tile for use inside a grid. */
  tileLayout?: boolean;
}

export function ChatMediaUpload({ onMediaSelected, onClear, pending, tileLayout }: Props) {
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

  const hiddenInputs = (
    <>
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
    </>
  );

  if (tileLayout) {
    return (
      <>
        {hiddenInputs}
        {/* Image tile */}
        <button
          type="button"
          onClick={() => imageRef.current?.click()}
          className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs text-zinc-600 hover:bg-white"
          title={t("attachImage")}
        >
          <ImageIcon className="h-5 w-5 text-zinc-500" />
          <span>{t("attachImage")}</span>
        </button>

        {/* Audio tile */}
        <button
          type="button"
          onClick={() => audioRef.current?.click()}
          className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs text-zinc-600 hover:bg-white"
          title={t("attachAudio")}
        >
          <Mic className="h-5 w-5 text-zinc-500" />
          <span>{t("attachAudio")}</span>
        </button>

        {/* Video tile */}
        <button
          type="button"
          onClick={() => videoRef.current?.click()}
          className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs text-zinc-600 hover:bg-white"
          title={t("attachVideo")}
        >
          <Video className="h-5 w-5 text-zinc-500" />
          <span>{t("attachVideo")}</span>
        </button>

        {error && (
          <span className="col-span-3 text-[10px] text-red-500">{error}</span>
        )}
      </>
    );
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

      {/* Audio */}
      <button
        type="button"
        onClick={() => audioRef.current?.click()}
        className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        title={t("attachAudio")}
      >
        <Mic className="h-4 w-4" />
      </button>

      {/* Video */}
      <button
        type="button"
        onClick={() => videoRef.current?.click()}
        className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        title={t("attachVideo")}
      >
        <Video className="h-4 w-4" />
      </button>

      {hiddenInputs}

      {error && (
        <span className="text-[10px] text-red-500">{error}</span>
      )}
    </div>
  );
}
