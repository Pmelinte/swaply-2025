"use client";

import { memo, useMemo, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { NO_IMAGE_URL } from "@/lib/storage";
import { getItemImageUrl } from "@/lib/item-image-src";

/**
 * Next.js Image wrapper that gracefully falls back to a placeholder
 * when the source URL is broken (blob:, expired, 404, malformed object, etc.).
 */
export const SafeImage = memo(function SafeImage({ src, alt, onError, ...props }: ImageProps) {
  const normalizedSrc = useMemo(() => getItemImageUrl(src) || NO_IMAGE_URL, [src]);
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);

  const imgSrc = erroredSrc === normalizedSrc ? NO_IMAGE_URL : normalizedSrc;

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={(e) => {
        setErroredSrc(normalizedSrc);
        onError?.(e);
      }}
      unoptimized={imgSrc === NO_IMAGE_URL || props.unoptimized}
    />
  );
});
