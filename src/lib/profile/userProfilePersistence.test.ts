import { describe, expect, it } from "vitest";
import type { UserProfile } from "@/lib/types";
import type { GlobalUserProfile } from "./profileTypes";
import {
  buildUserProfileUpdatePayload,
  getGlobalProfileContract,
  getProfileRevision,
  mergeUserProfile,
} from "./userProfilePersistence";

function profile(): GlobalUserProfile {
  return {
    id: "00000000-0000-0000-0000-000000000065",
    email: "batch65@example.com",
    username: "batch65",
    fullName: "Batch 65",
    displayName: "Batch 65",
    firstName: "Batch",
    avatarUrl: "https://example.com/avatar.png",
    bio: "Global-first profile",
    languages: ["ro", "en", "fr"],
    badge: "free",
    role: "user",
    location: {
      country: "RO",
      region: "Tulcea",
      city: "Tulcea",
      postalCode: "820001",
      travelRadiusKm: 50,
    },
    visibility: {
      publicProfile: true,
      itemsVisibility: "public",
      showExactLocation: false,
      showLastSeen: true,
    },
    notifications: {
      email: true,
      push: false,
      chat: true,
      matches: true,
      swapUpdates: true,
    },
    swapPreferences: {
      logistics: "flexible",
      notes: "Courier is acceptable",
    },
    security: {
      twoFactorEnabled: true,
      method: "passkey",
      passkeysEnabled: true,
    },
    stats: {
      tokens: 500,
      reputation: "trusted",
      completedSwaps: 12,
      activeListings: 4,
    },
    globalProfile: {
      userId: "00000000-0000-0000-0000-000000000065",
      revision: 7,
      languagePreferences: {
        primary: "ro",
        secondary: "en",
        tertiary: "fr",
        autoTranslateMessages: true,
        showOriginalLanguage: true,
      },
      userType: "professional",
      availabilityStatus: "limited",
      timezone: "Europe/Bucharest",
      visibility: {
        publicProfile: true,
        itemsVisibility: "public",
        showExactLocation: false,
        showLastSeen: true,
        showBio: true,
        showInterests: false,
        showOccupation: true,
        showWebsite: false,
        showSocialLinks: false,
      },
      legacyLanguages: ["ro", "en", "fr"],
      preferredLocale: "ro",
    },
    profileRevision: 7,
  };
}

describe("Batch 65 user profile persistence adapter", () => {
  it("uses the canonical revision and global profile contract", () => {
    const current = profile();
    expect(getProfileRevision(current)).toBe(7);
    expect(getGlobalProfileContract(current).languagePreferences).toEqual({
      primary: "ro",
      secondary: "en",
      tertiary: "fr",
      autoTranslateMessages: true,
      showOriginalLanguage: true,
    });
  });

  it("builds only owner-editable canonical fields", () => {
    const payload = buildUserProfileUpdatePayload(profile());

    expect(payload).toMatchObject({
      username: "batch65",
      display_name: "Batch 65",
      primary_language: "ro",
      secondary_language: "en",
      tertiary_language: "fr",
      auto_translate_messages: true,
      show_original_language: true,
      user_type: "professional",
      availability_status: "limited",
      timezone: "Europe/Bucharest",
      location_text: "Tulcea, RO",
    });

    expect(payload.visibility).toMatchObject({
      publicProfile: true,
      showBio: true,
      showOccupation: true,
      showExactLocation: false,
    });

    expect(payload).not.toHaveProperty("user_id");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("badge");
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("stats");
    expect(payload).not.toHaveProperty("security");
    expect(payload).not.toHaveProperty("trust_score");
    expect(payload).not.toHaveProperty("token_balance");
  });

  it("deep-merges editable nested fields without losing the global contract", () => {
    const current = profile();
    const merged = mergeUserProfile(current, {
      location: { city: "Constanța" },
      notifications: { ...current.notifications, push: true },
      globalProfile: {
        ...current.globalProfile,
        availabilityStatus: "available",
        visibility: {
          ...current.globalProfile.visibility,
          showInterests: true,
        },
      },
    } as Partial<GlobalUserProfile>);

    expect(merged.location).toMatchObject({
      city: "Constanța",
      country: "RO",
      region: "Tulcea",
    });
    expect(merged.notifications.push).toBe(true);

    const global = (merged as GlobalUserProfile).globalProfile;
    expect(global.availabilityStatus).toBe("available");
    expect(global.visibility.showInterests).toBe(true);
    expect(global.languagePreferences.primary).toBe("ro");
    expect(getProfileRevision(merged as UserProfile)).toBe(7);
  });
});
