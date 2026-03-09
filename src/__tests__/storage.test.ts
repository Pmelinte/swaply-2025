import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the supabase client module before importing storage
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: vi.fn(() => null),
}));

describe("Storage: uploadItemPhoto", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "");
  });

  it("rejects invalid file types", async () => {
    const { uploadItemPhoto } = await import("@/lib/storage");
    const file = new File(["data"], "test.exe", { type: "application/x-executable" });
    const result = await uploadItemPhoto(file, "user-1");
    expect(result.url).toBeNull();
    expect(result.error).toContain("Format neacceptat");
  });

  it("rejects files over 5MB", async () => {
    const { uploadItemPhoto } = await import("@/lib/storage");
    const bigData = new Uint8Array(6 * 1024 * 1024);
    const file = new File([bigData], "big.jpg", { type: "image/jpeg" });
    const result = await uploadItemPhoto(file, "user-1");
    expect(result.url).toBeNull();
    expect(result.error).toContain("5 MB");
  });

  it("accepts JPEG files", async () => {
    const { uploadItemPhoto } = await import("@/lib/storage");
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });
    const result = await uploadItemPhoto(file, "user-1");
    // Falls through to blob URL (no cloudinary, no supabase)
    expect(result.url).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it("accepts PNG files", async () => {
    const { uploadItemPhoto } = await import("@/lib/storage");
    const file = new File(["data"], "photo.png", { type: "image/png" });
    const result = await uploadItemPhoto(file, "user-1");
    expect(result.url).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it("accepts WebP files", async () => {
    const { uploadItemPhoto } = await import("@/lib/storage");
    const file = new File(["data"], "photo.webp", { type: "image/webp" });
    const result = await uploadItemPhoto(file, "user-1");
    expect(result.url).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it("accepts GIF files", async () => {
    const { uploadItemPhoto } = await import("@/lib/storage");
    const file = new File(["data"], "animation.gif", { type: "image/gif" });
    const result = await uploadItemPhoto(file, "user-1");
    expect(result.url).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it("rejects text/html files", async () => {
    const { uploadItemPhoto } = await import("@/lib/storage");
    const file = new File(["<script>alert(1)</script>"], "page.html", { type: "text/html" });
    const result = await uploadItemPhoto(file, "user-1");
    expect(result.url).toBeNull();
    expect(result.error).toContain("Format neacceptat");
  });

  it("rejects application/javascript files", async () => {
    const { uploadItemPhoto } = await import("@/lib/storage");
    const file = new File(["console.log('hack')"], "script.js", { type: "application/javascript" });
    const result = await uploadItemPhoto(file, "user-1");
    expect(result.url).toBeNull();
  });
});

describe("Storage: deleteItemPhoto", () => {
  it("handles blob URLs gracefully", async () => {
    const { deleteItemPhoto } = await import("@/lib/storage");
    await expect(deleteItemPhoto("blob:http://localhost/123")).resolves.not.toThrow();
  });

  it("handles Cloudinary URLs gracefully (no deletion)", async () => {
    const { deleteItemPhoto } = await import("@/lib/storage");
    await expect(deleteItemPhoto("https://res.cloudinary.com/demo/image/upload/sample.jpg")).resolves.not.toThrow();
  });

  it("handles Unsplash URLs gracefully (skip)", async () => {
    const { deleteItemPhoto } = await import("@/lib/storage");
    await expect(deleteItemPhoto("https://images.unsplash.com/photo-123")).resolves.not.toThrow();
  });
});

describe("Storage: constants", () => {
  it("NO_IMAGE_URL is defined", async () => {
    const { NO_IMAGE_URL } = await import("@/lib/storage");
    expect(NO_IMAGE_URL).toBe("/no-image.svg");
  });
});
