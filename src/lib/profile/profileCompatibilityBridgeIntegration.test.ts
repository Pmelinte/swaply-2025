import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 65.2 application bridge integration", () => {
  it("routes missing-profile bootstrap through the compatibility bridge", () => {
    const state = source("src/lib/state/index.tsx");

    expect(state).toContain("ensureOwnProfileWithCompatibility(supabase");
    expect(state).toContain("routeLocale: language");
    expect(state).toContain("profileRevisionRef.current = ensured.profileRevision");
    expect(state).not.toContain('supabase.from("profiles").upsert');
  });

  it("routes owner saves through RPC-first compatibility with separate payloads", () => {
    const state = source("src/lib/state/index.tsx");

    expect(state).toContain("updateOwnProfileWithCompatibility(supabase");
    expect(state).toContain("expectedRevision: profileRevisionRef.current");
    expect(state).toContain("canonicalPayload");
    expect(state).toContain("legacyPayload");
    expect(state).toContain("primary_language: orderedLanguages[0]");
    expect(state).toContain("profileRevisionRef.current = saved.profileRevision");
  });

  it("keeps the legacy database write isolated inside the bridge service", () => {
    const bridge = source("src/lib/profile/profileCompatibilityBridge.ts");

    expect(bridge).toContain('client .from("profiles") .upsert(payload, { onConflict: "user_id" })');
    expect(bridge).toContain('isMissingProfileRpcError(error, "ensure_own_profile_v1")');
    expect(bridge).toContain('isMissingProfileRpcError(error, "update_own_profile_v1")');
    expect(bridge).not.toContain('error.code === "40001" &&');
  });
});
