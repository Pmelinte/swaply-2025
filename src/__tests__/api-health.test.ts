import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { flagCache, DEFAULT_FLAGS } from "@/lib/feature-flags";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    // Reset flag cache to defaults before each test
    flagCache.flags = DEFAULT_FLAGS;
    flagCache.fetchedAt = Date.now(); // prevent Supabase fetch
    flagCache.promise = null;
  });

  it("returns 200 with status ok", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  it("includes timestamp", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.timestamp).toBeTruthy();
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
  });

  it("includes version", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.version).toBe("1.0.0");
  });

  it("reports supabase as false when env vars missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const response = await GET();
    const data = await response.json();
    expect(data.services.supabase).toBe(false);
  });

  it("reports supabase as true when env vars present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
    const response = await GET();
    const data = await response.json();
    expect(data.services.supabase).toBe(true);
  });

  it("reports ai as false when ai_matching flag disabled", async () => {
    flagCache.flags = DEFAULT_FLAGS.map((f) =>
      f.id === "ai_matching" ? { ...f, enabled: false } : f,
    );
    const response = await GET();
    const data = await response.json();
    expect(data.services.ai).toBe(false);
  });

  it("reports ai as true when ai_matching flag enabled", async () => {
    // ai_matching is enabled by default in DEFAULT_FLAGS
    const response = await GET();
    const data = await response.json();
    expect(data.services.ai).toBe(true);
  });

  it("reports maps status from env", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPS_TOKEN", "");
    const response = await GET();
    const data = await response.json();
    expect(data.services.maps).toBe(false);
  });

  it("reports cloudinary status from env", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "my-cloud");
    const response = await GET();
    const data = await response.json();
    expect(data.services.cloudinary).toBe(true);
  });
});
