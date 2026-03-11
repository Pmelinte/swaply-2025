/**
 * Image gallery hook — multi-image upload, reorder, captions.
 * Uses existing storage.ts for upload/delete.
 */
import { useCallback, useState } from "react";
import type { ItemImage } from "../types";
import { uploadItemPhoto, deleteItemPhoto } from "../storage";
import { nanoid } from "nanoid";

interface UseImageGalleryParams {
  userId: string | null;
  trackEvent: (event: string, properties?: Record<string, string | number | boolean>) => void;
}

const MAX_IMAGES_PER_ITEM = 10;

export function useImageGallery({ userId, trackEvent }: UseImageGalleryParams) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /** Upload multiple images for an item */
  const uploadImages = useCallback(
    async (
      itemId: string,
      files: File[],
      existingImages: ItemImage[] = [],
    ): Promise<{ images: ItemImage[]; errors: string[] }> => {
      if (!userId) return { images: [], errors: ["Trebuie să fii autentificat."] };

      const remaining = MAX_IMAGES_PER_ITEM - existingImages.length;
      if (remaining <= 0) {
        return { images: [], errors: [`Limita maximă de ${MAX_IMAGES_PER_ITEM} imagini a fost atinsă.`] };
      }

      const toUpload = files.slice(0, remaining);
      setUploading(true);
      setUploadProgress(0);

      const results: ItemImage[] = [];
      const errors: string[] = [];

      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        const { url, error } = await uploadItemPhoto(file, userId);

        if (error || !url) {
          errors.push(`${file.name}: ${error ?? "Upload eșuat"}`);
        } else {
          // Get image dimensions
          const dimensions = await getImageDimensions(url).catch(() => null);

          results.push({
            id: nanoid(),
            itemId,
            url,
            position: existingImages.length + i,
            caption: "",
            width: dimensions?.width,
            height: dimensions?.height,
            sizeBytes: file.size,
            uploadedAt: new Date().toISOString(),
          });
        }

        setUploadProgress(((i + 1) / toUpload.length) * 100);
      }

      setUploading(false);
      setUploadProgress(0);

      trackEvent("images_uploaded", {
        count: results.length,
        errorCount: errors.length,
        itemId,
      });

      return { images: results, errors };
    },
    [userId, trackEvent],
  );

  /** Delete an image */
  const deleteImage = useCallback(
    async (image: ItemImage): Promise<void> => {
      await deleteItemPhoto(image.url);
      trackEvent("image_deleted", { itemId: image.itemId });
    },
    [trackEvent],
  );

  /** Reorder images */
  const reorderImages = useCallback(
    (images: ItemImage[], fromIndex: number, toIndex: number): ItemImage[] => {
      const reordered = [...images];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered.map((img, idx) => ({ ...img, position: idx }));
    },
    [],
  );

  /** Update image caption */
  const updateCaption = useCallback(
    (images: ItemImage[], imageId: string, caption: string): ItemImage[] => {
      return images.map((img) =>
        img.id === imageId ? { ...img, caption } : img,
      );
    },
    [],
  );

  /** Set image as cover (move to position 0) */
  const setAsCover = useCallback(
    (images: ItemImage[], imageId: string): ItemImage[] => {
      const idx = images.findIndex((img) => img.id === imageId);
      if (idx <= 0) return images;
      return reorderImages(images, idx, 0);
    },
    [reorderImages],
  );

  return {
    uploading,
    uploadProgress,
    maxImages: MAX_IMAGES_PER_ITEM,
    uploadImages,
    deleteImage,
    reorderImages,
    updateCaption,
    setAsCover,
  };
}

/** Get image dimensions from URL */
function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("No window"));
      return;
    }
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}
