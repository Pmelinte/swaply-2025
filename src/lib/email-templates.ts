/**
 * Email templates for Swaply notifications.
 * Returns HTML strings ready to be sent via any email provider.
 */

/* ------------------------------------------------------------------ */
/*  Welcome email                                                      */
/* ------------------------------------------------------------------ */

interface WelcomeEmailData {
  name: string;
  loginUrl: string;
  unsubscribeUrl: string;
}

export function renderWelcomeEmail(data: WelcomeEmailData): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bine ai venit pe Swaply!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:32px;text-align:center;">
              <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:700;">Bine ai venit pe Swaply!</h1>
              <p style="margin:0;color:#bfdbfe;font-size:14px;">Schimbă obiecte, nu bani</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#18181b;font-size:16px;line-height:1.6;">
                Salut <strong>${data.name}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:15px;line-height:1.6;">
                Contul tău Swaply este activ! Ești gata să descoperi o comunitate în care obiectele își găsesc un nou proprietar prin schimb direct.
              </p>

              <!-- Steps -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-radius:12px 12px 0 0;border-bottom:1px solid #e0f2fe;">
                    <p style="margin:0;color:#2563eb;font-size:14px;font-weight:600;">1. Adaugă primul tău obiect</p>
                    <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Fotografiază-l, descrie-l și publică-l în câteva secunde.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-bottom:1px solid #e0f2fe;">
                    <p style="margin:0;color:#2563eb;font-size:14px;font-weight:600;">2. Descoperă oferte</p>
                    <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Răsfoiește mii de obiecte și găsește ce-ți dorești.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#f0f9ff;border-radius:0 0 12px 12px;">
                    <p style="margin:0;color:#2563eb;font-size:14px;font-weight:600;">3. Propune un schimb</p>
                    <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Trimite o propunere și finalizează schimbul în siguranță.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:600;">
                      Începe acum →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;text-align:center;">
                Ai primit acest email pentru că ți-ai creat un cont pe Swaply.<br />
                <a href="${data.unsubscribeUrl}" style="color:#2563eb;text-decoration:underline;">Dezactivează notificările email</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#fafafa;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                © ${new Date().getFullYear()} Swaply · Schimb de obiecte fără bani
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
}

export function renderSwapProposalEmail(data: SwapProposalData): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Propunere de schimb — Swaply</title>
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
                Salut <strong>${data.recipientName}</strong>,
              </p>
              <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
                <strong>${data.senderName}</strong> îți propune un schimb:
              </p>
              <!-- Swap visual -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f0f9ff;border-radius:12px;padding:16px;">
                <tr>
                  <td style="padding:16px;text-align:center;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">El/ea oferă</p>
                    <p style="margin:0;color:#2563eb;font-size:16px;font-weight:600;">${data.requesterItemTitle}</p>
                  </td>
                  <td style="padding:16px;text-align:center;color:#a1a1aa;font-size:24px;">⇄</td>
                  <td style="padding:16px;text-align:center;">
                    <p style="margin:0 0 4px;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Pentru</p>
                    <p style="margin:0;color:#059669;font-size:16px;font-weight:600;">${data.responderItemTitle}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${data.swapUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:12px;font-size:15px;font-weight:600;">
                      Vezi propunerea →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px;line-height:1.5;text-align:center;">
                Ai primit acest email pentru că ai un cont Swaply.<br />
                <a href="${data.unsubscribeUrl}" style="color:#2563eb;text-decoration:underline;">Dezactivează notificările email</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#fafafa;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                © ${new Date().getFullYear()} Swaply · Schimb de obiecte fără bani
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
