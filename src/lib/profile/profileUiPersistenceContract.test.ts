import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 65 Profile and Onboarding persistence integration", () => {
  it("routes the public updateProfile boundary through the revisioned service", () => {
    const state = source("src/lib/state.tsx");

    expect(state).toContain("persistUserProfile(client, merged");
    expect(state).toContain("persistOwnProfileFields(client, current, payload");
    expect(state).toContain("isProfileConflict(error)");
    expect(state).toContain("await refreshProfile()");
    expect(state).not.toContain('.from("profiles").upsert');
    expect(state).not.toContain('.from("profiles").update');
  });

  it("bootstraps missing profiles through ensure_own_profile_v1 without direct upsert", () => {
    const orchestrator = source("src/lib/state/index.tsx");

    expect(orchestrator).toContain('supabase.rpc( "ensure_own_profile_v1"');
    expect(orchestrator).toContain("{ p_route_locale: language }");
    expect(orchestrator).toContain('"profile" in ensured');
    expect(orchestrator).toContain("if (ensuredProfile) setUser(mapProfile(ensuredProfile))");
    expect(orchestrator).not.toContain('.from("profiles").upsert');
    expect(orchestrator).not.toContain('.from("profiles").update');
    expect(orchestrator).not.toContain("languages: [\"ro\"]");
  });

  it("keeps Profile saves behind the public revisioned updateProfile boundary", () => {
    const profile = source("src/app/[locale]/profile/ProfileClient.tsx");

    expect(profile).toContain("await updateProfile(draft, { persist: true })");
    expect(profile).toContain("isProfileConflict(error)");
    expect(profile).toContain("Fresh data was reloaded");
    expect(profile).not.toContain('.from("profiles")');
    expect(profile).not.toContain("updateOwnGlobalProfile(");
  });

  it("removes direct profile UPDATE from onboarding", () => {
    const onboarding = source("src/app/[locale]/onboarding/OnboardingClient.tsx");

    expect(onboarding).toContain("await updateProfileFields(payload)");
    expect(onboarding).toContain("buildCanonicalLanguagePayload");
    expect(onboarding).toContain("primary: ordered[0]");
    expect(onboarding).toContain("secondary: ordered[1] ?? null");
    expect(onboarding).toContain("tertiary: ordered[2] ?? null");
    expect(onboarding).not.toContain('.from("profiles").update');
    expect(onboarding).not.toContain("payload.user_id");
  });

  it("renders ordered language and explicit public-field controls", () => {
    const profileTab = source("src/app/[locale]/profile/_components/ProfileTab.tsx");
    const settings = source("src/app/[locale]/profile/_components/GlobalProfileSettingsCard.tsx");

    expect(profileTab).toContain("preferences.primary");
    expect(profileTab).toContain("preferences.secondary");
    expect(profileTab).toContain("preferences.tertiary");
    expect(profileTab).toContain("autoTranslateMessages");
    expect(profileTab).toContain("showOriginalLanguage");

    expect(settings).toContain("userType");
    expect(settings).toContain("availabilityStatus");
    expect(settings).toContain("timezone");
    expect(settings).toContain("showBio");
    expect(settings).toContain("showInterests");
    expect(settings).toContain("showOccupation");
    expect(settings).toContain("showWebsite");
    expect(settings).toContain("showSocialLinks");
  });
});
