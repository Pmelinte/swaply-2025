/**
 * Email templates for Swaply notifications.
 * Returns HTML strings ready to be sent via any email provider.
 */

/* ------------------------------------------------------------------ */
/*  Translations                                                        */
/* ------------------------------------------------------------------ */

const EMAIL_STRINGS: Record<string, Record<string, string>> = {
  en: {
    welcomeTitle: "Welcome to Swaply!",
    welcomeSubtitle: "Swap items, not money",
    welcomeGreeting: "Hi",
    welcomeBody: "Your Swaply account is active! You're ready to discover a community where items find new owners through direct swaps.",
    step1Title: "1. Add your first item",
    step1Text: "Take a photo, describe it, and publish in seconds.",
    step2Title: "2. Discover offers",
    step2Text: "Browse thousands of items and find what you want.",
    step3Title: "3. Propose a swap",
    step3Text: "Send a proposal and complete the swap safely.",
    ctaButton: "Start now →",
    emailNotice: "You received this email because you created a Swaply account.",
    unsubscribe: "Disable email notifications",
    footer: "Swap items without money",
    // Swap proposal
    proposalTitle: "Swap proposal — Swaply",
    proposalGreeting: "Hi",
    proposalBody: "proposes a swap:",
    theyOffer: "They offer",
    forItem: "For",
    viewProposal: "View proposal →",
    proposalNotice: "You received this email because you have a Swaply account.",
  },
  ro: {
    welcomeTitle: "Bine ai venit pe Swaply!",
    welcomeSubtitle: "Schimbă obiecte, nu bani",
    welcomeGreeting: "Salut",
    welcomeBody: "Contul tău Swaply este activ! Ești gata să descoperi o comunitate în care obiectele își găsesc un nou proprietar prin schimb direct.",
    step1Title: "1. Adaugă primul tău obiect",
    step1Text: "Fotografiază-l, descrie-l și publică-l în câteva secunde.",
    step2Title: "2. Descoperă oferte",
    step2Text: "Răsfoiește mii de obiecte și găsește ce-ți dorești.",
    step3Title: "3. Propune un schimb",
    step3Text: "Trimite o propunere și finalizează schimbul în siguranță.",
    ctaButton: "Începe acum →",
    emailNotice: "Ai primit acest email pentru că ți-ai creat un cont pe Swaply.",
    unsubscribe: "Dezactivează notificările email",
    footer: "Schimb de obiecte fără bani",
    // Swap proposal
    proposalTitle: "Propunere de schimb — Swaply",
    proposalGreeting: "Salut",
    proposalBody: "îți propune un schimb:",
    theyOffer: "El/ea oferă",
    forItem: "Pentru",
    viewProposal: "Vezi propunerea →",
    proposalNotice: "Ai primit acest email pentru că ai un cont Swaply.",
  },
};

function t(locale: string, key: string): string {
  return EMAIL_STRINGS[locale]?.[key] ?? EMAIL_STRINGS["en"][key] ?? key;
}

/* ------------------------------------------------------------------ */
/*  Welcome email                                                      */
/* ------------------------------------------------------------------ */

interface WelcomeEmailData {
  name: string;
  loginUrl: string;
  unsubscribeUrl: string;
  locale?: string;
}

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  const s = (key: string) => t(data.locale ?? "en", key);

  return `<!DOCTYPE html>
<html lang="${data.locale ?? "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${s("welcomeTitle")}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:32px;text-align:center;">
              <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:700;">${s("welcomeTitle")}</h1>
              <p style="margin:0;color:#bfdbfe;font-size:14px;">${s("welcomeSubtitle")}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#18181b;font-size:16px;line-height:1.6;">
                ${s("welcomeGreeting")} <strong>${data.name}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.6;">
                ${s("welcomeBody")}
              </p>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-radius:12px 12px 0 0;border-bottom:1px solid #e0f2fe;">
                    <p style="margin:0;color:#2563eb;font-size:14px;font-weight:600;">${s("step1Title")}</p>
                    <p style="margin:4px 0 0;color:#64748b;font-size:13px;">${s("step1Text")}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-bottom:1px solid #e0f2fe;">
                    <p style="margin:0;color:#2563eb;font-size:14px;font-weight:600;">${s("step2Title")}</p>
                    <p style="margin:4px 0 0;color:#64748b;font-size:13px;">${s("step2Text")}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-radius:0 0 12px 12px;">
                    <p style="margin:0;color:#2563eb;font-size:14px;font-weight:600;">${s("step3Title")}</p>
                    <p style="margin:4px 0 0;color:#64748b;font-size:13px;">${s("step3Text")}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:600;">
                      ${s("ctaButton")}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;text-align:center;">
                ${s("emailNotice")}<br />
                <a href="${data.unsubscribeUrl}" style="color:#2563eb;text-decoration:underline;">${s("unsubscribe")}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#fafafa;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                © ${new Date().getFullYear()} Swaply · ${s("footer")}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Swap proposal email                                                */
/* ------------------------------------------------------------------ */

interface SwapProposalData {
  recipientName: string;
  senderName: string;
  requesterItemTitle: string;
  responderItemTitle: string;
  swapUrl: string;
  unsubscribeUrl: string;
  locale?: string;
}

export function renderSwapProposalEmail(data: SwapProposalData): string {
  const s = (key: string) => t(data.locale ?? "en", key);

  return `<!DOCTYPE html>
<html lang="${data.locale ?? "en"}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${s("proposalTitle")}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Swaply</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#18181b;font-size:16px;line-height:1.6;">
                ${s("proposalGreeting")} <strong>${data.recipientName}</strong>,
              </p>
              <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
                <strong>${data.senderName}</strong> ${s("proposalBody")}
              </p>
              <!-- Swap visual -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f0f9ff;border-radius:12px;padding:16px;">
                <tr>
                  <td style="padding:16px;text-align:center;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${s("theyOffer")}</p>
                    <p style="margin:0;color:#2563eb;font-size:16px;font-weight:600;">${data.requesterItemTitle}</p>
                  </td>
                  <td style="padding:16px;text-align:center;color:#a1a1aa;font-size:24px;">⇄</td>
                  <td style="padding:16px;text-align:center;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">${s("forItem")}</p>
                    <p style="margin:0;color:#059669;font-size:16px;font-weight:600;">${data.responderItemTitle}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.swapUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:12px;font-size:15px;font-weight:600;">
                      ${s("viewProposal")}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;text-align:center;">
                ${s("proposalNotice")}<br />
                <a href="${data.unsubscribeUrl}" style="color:#2563eb;text-decoration:underline;">${s("unsubscribe")}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#fafafa;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                © ${new Date().getFullYear()} Swaply · ${s("footer")}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
