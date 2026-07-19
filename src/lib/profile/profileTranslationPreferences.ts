import type { UserProfile } from "../types";

export interface ProfileTranslationPreferences {
  autoTranslateMessages: boolean;
  showOriginalLanguage: boolean;
}

export type UserProfileWithTranslationPreferences = UserProfile & {
  translationPreferences: ProfileTranslationPreferences;
};

const DEFAULT_PROFILE_TRANSLATION_PREFERENCES: ProfileTranslationPreferences = {
  autoTranslateMessages: true,
  showOriginalLanguage: false,
};

export function getProfileTranslationPreferences(
  profile: UserProfile | null | undefined,
): ProfileTranslationPreferences {
  const preferences = (
    profile as Partial<UserProfileWithTranslationPreferences> | null | undefined
  )?.translationPreferences;

  return {
    autoTranslateMessages:
      typeof preferences?.autoTranslateMessages === "boolean"
        ? preferences.autoTranslateMessages
        : DEFAULT_PROFILE_TRANSLATION_PREFERENCES.autoTranslateMessages,
    showOriginalLanguage:
      typeof preferences?.showOriginalLanguage === "boolean"
        ? preferences.showOriginalLanguage
        : DEFAULT_PROFILE_TRANSLATION_PREFERENCES.showOriginalLanguage,
  };
}
