import { describe, expect, it } from "vitest";
import {
  isAtLeastSixteen,
  nextStoredStep,
  stepNumberFromStoredStep,
  validateRequiredOnboardingProfile,
} from "@/lib/profile/onboardingState";

describe("onboarding state", () => {
  it("resumes from the persisted step", () => {
    expect(stepNumberFromStoredStep("identity")).toBe(1);
    expect(stepNumberFromStoredStep("languages")).toBe(3);
    expect(stepNumberFromStoredStep("interests")).toBe(5);
    expect(stepNumberFromStoredStep("unknown")).toBe(1);
  });

  it("stores the next step after each successful save", () => {
    expect(nextStoredStep(1)).toBe("location");
    expect(nextStoredStep(4)).toBe("interests");
    expect(nextStoredStep(5)).toBe("done");
  });

  it("rejects completion when mandatory data is missing", () => {
    expect(validateRequiredOnboardingProfile({ display_name: "P" })).toEqual([
      "display_name",
      "date_of_birth",
      "address_country",
      "languages",
    ]);
  });

  it("accepts a complete mandatory profile", () => {
    expect(validateRequiredOnboardingProfile({
      display_name: "Petru",
      date_of_birth: "1967-01-01",
      address_country: "RO",
      languages: ["ro"],
    })).toEqual([]);
  });

  it("enforces the minimum age at the exact birthday boundary", () => {
    const now = new Date("2026-07-21T12:00:00Z");
    expect(isAtLeastSixteen("2010-07-21", now)).toBe(true);
    expect(isAtLeastSixteen("2010-07-22", now)).toBe(false);
    expect(isAtLeastSixteen("invalid", now)).toBe(false);
  });
});
