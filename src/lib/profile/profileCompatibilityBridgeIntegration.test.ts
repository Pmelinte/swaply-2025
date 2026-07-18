import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 65.5 strict profile RPC integration", () => {
  it("routes missing-profile bootstrap through the canonical RPC bridge", () => {
    const state = source("src/lib/state/index.tsx");

    expect(state).toContain("ensureOwnProfileWithCompatibility(supabase");
    expect(state).toContain("routeLocale: language");
    expect(state).toContain("profileRevisionRef.current = ensured.profileRevision");
    expect(state).not.toContain('supabase.from("profiles").upsert');
  });

  it("routes ordinary owner saves through the revisioned RPC", () => {
    const state = source("src/lib/state/index.tsx");

    expect(state).toContain("updateOwnProfileWithCompatibility(supabase");
    expect(state).toContain("expectedRevision: profileRevisionRef.current");
    expect(state).toContain("canonicalPayload");
    expect(state).toContain("primary_language: orderedLanguages[0]");
    expect(state).toContain("profileRevisionRef.current = saved.profileRevision");
  });

  it("contains no direct public.profiles write fallback in the bridge service", () => {
    const bridge = source("src/lib/profile/profileCompatibilityBridge.ts");

    expect(bridge).toContain('client.rpc("ensure_own_profile_v1"');
    expect(bridge).toContain('client.rpc("update_own_profile_v1"');
    expect(bridge).not.toContain('.from("profiles")');
    expect(bridge).not.toContain("legacyProfileUpsert");
    expect(bridge).not.toContain("return legacy");
  });

  it("keeps missing-RPC detection diagnostic-only", () => {
    const bridge = source("src/lib/profile/profileCompatibilityBridge.ts");

    expect(bridge).toContain("export function isMissingProfileRpcError");
    expect(bridge).not.toContain('isMissingProfileRpcError(error, "ensure_own_profile_v1")');
    expect(bridge).not.toContain('isMissingProfileRpcError(error, "update_own_profile_v1")');
  });
});
