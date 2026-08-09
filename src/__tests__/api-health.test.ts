import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { flagCache, DEFAULT_FLAGS } from "@/lib/feature-flags";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    flagCache.flags = DEFAULT_FLAGS.map((flag) => ({ ...flag }));
    flagCache.fetchedAt = Date.now();
    flagCache.promise = null;
  });

  it("returns 200 with status ok", async () => {
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("includes timestamp and version", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.version).toBe("1.0.0");
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
  });

  it("reports supabase as false when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const response = await GET();
    const data = await response.json();
    expect(data.services.supabase).toBe(false);
  });

  it("reports supabase as true when env vars are present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
    const response = await GET();
    const data = await response.json();
    expect(data.services.supabase).toBe(true);
  });

  it("reports the core AI layer independently from paid provider activation", async () => {
    vi.stubEnv("GROQ_API_KEY", "configured-key");
    vi.stubEnv("SWAPLY_ENABLE_PAID_AI_PRODUCTION", "");

    const response = await GET();
    const data = await response.json();

    expect(data.services.ai).toBe(true);
    expect(data.providers.groq.configured).toBe(true);
    expect(data.providers.groq.authorised).toBe(false);
    expect(data.providers.groq.live).toBe(false);
    expect(data.services.groq).toBe(false);
  });

  it("never presents Stripe as live from credentials alone", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_configured");
    vi.stubEnv("SWAPLY_ENABLE_STRIPE_PRODUCTION", "");

    const response = await GET();
    const data = await response.json();

    expect(data.providers.stripe.configured).toBe(true);
    expect(data.providers.stripe.authorised).toBe(false);
    expect(data.providers.stripe.live).toBe(false);
    expect(data.services.stripe).toBe(false);
  });

  it("reports maps and Cloudinary configuration without claiming provider authorisation", async () => {
    vi.stubEnv("NEXT_PUBLIC_MAPS_TOKEN", "maps-token");
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "my-cloud");

    const response = await GET();
    const data = await response.json();

    expect(data.services.maps).toBe(true);
    expect(data.services.cloudinary).toBe(true);
  });
});
