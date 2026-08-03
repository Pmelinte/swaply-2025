import { describe, expect, it } from "vitest";
import {
  buildSwapProposalEmail,
  canSendSwapProposalEmail,
  resolveTransactionalLocale,
} from "../lib/notifications/swapProposalEmail";

describe("swap proposal email authority", () => {
  it("allows only the canonical requester for a pending bilateral swap", () => {
    expect(
      canSendSwapProposalEmail({
        actorId: "requester",
        requesterId: "requester",
        responderId: "responder",
        status: "pending",
      }),
    ).toBe(true);
  });

  it.each([
    {
      actorId: "outsider",
      requesterId: "requester",
      responderId: "responder",
      status: "pending",
    },
    {
      actorId: "responder",
      requesterId: "requester",
      responderId: "responder",
      status: "pending",
    },
    {
      actorId: "requester",
      requesterId: "requester",
      responderId: "responder",
      status: "accepted",
    },
    {
      actorId: "same",
      requesterId: "same",
      responderId: "same",
      status: "pending",
    },
  ])("denies an unauthorized or invalid trigger", (input) => {
    expect(canSendSwapProposalEmail(input)).toBe(false);
  });
});

describe("swap proposal email content", () => {
  it("uses a canonical locale and a localized private deep link", () => {
    const email = buildSwapProposalEmail({
      appUrl: "https://www.swaply.world/",
      locale: "ro",
      swapId: "swap-123",
      recipientName: "Petru",
      senderName: "Ana",
      requesterItemTitle: "Bicicletă",
      responderItemTitle: "Caiac",
    });

    expect(email.locale).toBe("ro");
    expect(email.swapUrl).toBe(
      "https://www.swaply.world/ro/exchange?swap=swap-123",
    );
    expect(email.preferencesUrl).toBe(
      "https://www.swaply.world/ro/profile#notifications",
    );
    expect(email.subject).toContain("Ana");
  });

  it("uses English as the final fallback for an unsupported locale", () => {
    expect(resolveTransactionalLocale("zz")).toBe("en");
  });

  it("escapes user-controlled text in the HTML body", () => {
    const email = buildSwapProposalEmail({
      appUrl: "https://www.swaply.world",
      locale: "en",
      swapId: "swap-123",
      recipientName: "<script>alert(1)</script>",
      senderName: "Sender",
      requesterItemTitle: "<img src=x onerror=alert(1)>",
      responderItemTitle: "Item",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
