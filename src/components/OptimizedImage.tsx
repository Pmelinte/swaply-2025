"use client";

/**
 * Optimized image component using next/image for automatic optimization.
 * Handles Cloudinary URLs, placeholders, and error states.
 */
import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "blur" | "empty";
  onClick?: () => void;
}

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23e2e8f0'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14'%3ENo image%3C/text%3E%3C/svg%3E`;

/**
 * Cloudinary loader for automatic image optimization.
 * Transforms Cloudinary URLs to include resizing parameters.
 */
function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  // If it's a Cloudinary URL, add transformation
  if (src.includes("cloudinary.com")) {
    const parts = src.split("/upload/");
    if (parts.length === 2) {
      const transforms = `w_${width},q_${quality || 75},f_auto`;
      return `${parts[0]}/upload/${transforms}/${parts[1]}`;
    }
  }
  return src;
}

export default function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  fill = false,
  className = "",
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 75,
  onClick,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={PLACEHOLDER_SVG}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        className={`${className} ${fill ? "object-cover w-full h-full" : ""}`}
        onClick={onClick}
      />
    );
  }

  const isCloudinary = src.includes("cloudinary.com");

  const imageProps = {
    alt,
    className: `${className} ${isLoading ? "animate-pulse bg-gray-200" : ""} transition-opacity duration-300`,
    priority,
    sizes,
    quality,
    onError: () => setHasError(true),
    onLoad: () => setIsLoading(false),
    onClick,
    ...(isCloudinary ? { loader: cloudinaryLoader } : {}),
  };

  if (fill) {
    return (
      <Image
        src={src}
        fill
        {...imageProps}
        style={{ objectFit: "cover" }}
      />
    );
  }

  return (
    <Image
      src={src}
      width={width}
      height={height}
      {...imageProps}
    />
  );
}
