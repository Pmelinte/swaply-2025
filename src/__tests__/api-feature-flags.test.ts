import { beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/feature-flags/route";
import { DEFAULT_FLAGS, flagCache } from "@/lib/feature-flags";

describe("GET /api/feature-flags", () => {
  beforeEach(() => {
    flagCache.flags = DEFAULT_FLAGS.map((flag) =>
      flag.id === "ai_matching"
        ? { ...flag, enabled: true, rolloutPercent: 25 }
        : { ...flag },
    );
    flagCache.fetchedAt = Date.now();
    flagCache.promise = null;
  });

  it("returns the database-shaped rollout field used by browser hooks", async () => {
    const response = await GET();
    const body = await response.json();
    const aiFlag = body.flags.find(
      (flag: { key: string }) => flag.key === "ai_matching",
    );

    expect(response.status).toBe(200);
    expect(aiFlag.rollout_percent).toBe(25);
    expect(aiFlag.enabled).toBe(true);
    expect(aiFlag.id).toBeUndefined();
  });
});
