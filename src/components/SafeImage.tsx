"use client";

import { memo, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { NO_IMAGE_URL } from "@/lib/storage";

/**
 * Next.js Image wrapper that gracefully falls back to a placeholder
 * when the source URL is broken (blob:, expired, 404, etc.).
 */
export const SafeImage = memo(function SafeImage({ src, alt, onError, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...props}
      src={imgSrc || NO_IMAGE_URL}
      alt={alt}
      onError={(e) => {
        setImgSrc(NO_IMAGE_URL);
        onError?.(e);
      }}
      unoptimized={imgSrc === NO_IMAGE_URL || props.unoptimized}
    />
  );
});
