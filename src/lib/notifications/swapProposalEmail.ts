import { defaultLocale, locales, type Locale } from "@/i18n/config";

type SwapProposalEmailInput = {
  appUrl: string;
  locale: string | null | undefined;
  swapId: string;
  recipientName: string;
  senderName: string;
  requesterItemTitle: string;
  responderItemTitle: string;
};

type SwapProposalEmailContent = {
  locale: Locale;
  subject: string;
  html: string;
  swapUrl: string;
  preferencesUrl: string;
};

const COPY = {
  en: {
    heading: "You received a swap proposal",
    greeting: "Hello",
    sentence: (sender: string, offered: string, requested: string) =>
      `${sender} wants to swap ${offered} for ${requested}.`,
    action: "View proposal",
    preferences: "Notification preferences",
    subject: (sender: string) => `${sender} sent you a swap proposal on Swaply`,
  },
  ro: {
    heading: "Ai primit o propunere de schimb",
    greeting: "Salut",
    sentence: (sender: string, offered: string, requested: string) =>
      `${sender} vrea să schimbe ${offered} cu ${requested}.`,
    action: "Vezi propunerea",
    preferences: "Preferințe notificări",
    subject: (sender: string) => `${sender} îți propune un schimb pe Swaply`,
  },
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function resolveTransactionalLocale(value: string | null | undefined): Locale {
  return (locales as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : defaultLocale;
}

export function canSendSwapProposalEmail(params: {
  actorId: string;
  requesterId: string;
  responderId: string;
  status: string;
}): boolean {
  return (
    params.actorId === params.requesterId &&
    params.requesterId !== params.responderId &&
    params.status === "pending"
  );
}

export function buildSwapProposalEmail(
  input: SwapProposalEmailInput,
): SwapProposalEmailContent {
  const locale = resolveTransactionalLocale(input.locale);
  const copy = locale === "ro" ? COPY.ro : COPY.en;
  const appUrl = input.appUrl.replace(/\/$/, "");
  const recipientName = escapeHtml(input.recipientName || "Swaply user");
  const senderName = escapeHtml(input.senderName || "Swaply user");
  const requesterItemTitle = escapeHtml(input.requesterItemTitle || "an item");
  const responderItemTitle = escapeHtml(input.responderItemTitle || "your item");
  const swapUrl = `${appUrl}/${locale}/exchange?swap=${encodeURIComponent(input.swapId)}`;
  const preferencesUrl = `${appUrl}/${locale}/profile#notifications`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">${copy.heading}</h2>
      <p style="color: #444; line-height: 1.6;">
        ${copy.greeting} <strong>${recipientName}</strong>,<br><br>
        ${copy.sentence(senderName, `<em>${requesterItemTitle}</em>`, `<em>${responderItemTitle}</em>`)}
      </p>
      <a href="${swapUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        ${copy.action}
      </a>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
      <p style="color: #999; font-size: 12px;">
        <a href="${preferencesUrl}" style="color: #999;">${copy.preferences}</a>
      </p>
    </div>
  `;

  return {
    locale,
    subject: copy.subject(senderName),
    html,
    swapUrl,
    preferencesUrl,
  };
}
