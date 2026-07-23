import { describe, expect, it } from "vitest";
import {
  isExactLocationPayload,
  normalizeChatDeliveryPreferences,
} from "@/lib/chat/chatDelivery";

describe("chat delivery helpers", () => {
  it("defaults chat notifications to in-app and push without forcing email", () => {
    expect(normalizeChatDeliveryPreferences(null)).toEqual({
      inApp: true,
      email: false,
      push: true,
    });
  });

  it("respects explicit chat notification preferences", () => {
    expect(
      normalizeChatDeliveryPreferences({
        message_inapp: false,
        message_email: true,
        message_push: false,
      }),
    ).toEqual({ inApp: false, email: true, push: false });
  });

  it("detects exact location fields that local handover must not persist", () => {
    expect(isExactLocationPayload({ lat: 44.43, lng: 26.1 })).toBe(true);
    expect(isExactLocationPayload({ address: "Exact street 1" })).toBe(true);
    expect(isExactLocationPayload({ areaLabel: "Central park area" })).toBe(false);
  });
});
