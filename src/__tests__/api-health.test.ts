import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
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

  it("reports ai as false when HF not enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_HF_ENABLED", "false");
    const response = await GET();
    const data = await response.json();
    expect(data.services.ai).toBe(false);
  });

  it("reports ai as true when HF enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_HF_ENABLED", "true");
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
