export type ItemImageSourceObject = {
  url?: unknown;
  secure_url?: unknown;
  secureUrl?: unknown;
  src?: unknown;
  publicUrl?: unknown;
  public_url?: unknown;
};

function firstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }
  return undefined;
}

export function getItemImageUrl(image: unknown): string | undefined {
  if (typeof image === "string") {
    return image.trim() || undefined;
  }

  if (!image || typeof image !== "object" || Array.isArray(image)) {
    return undefined;
  }

  const candidate = image as ItemImageSourceObject;
  return firstNonEmptyString(
    candidate.url,
    candidate.secure_url,
    candidate.secureUrl,
    candidate.src,
    candidate.publicUrl,
    candidate.public_url,
  );
}

export function getItemImageUrls(images: unknown): string[] {
  if (!Array.isArray(images)) {
    const single = getItemImageUrl(images);
    return single ? [single] : [];
  }

  return images.map(getItemImageUrl).filter((url): url is string => Boolean(url));
}
