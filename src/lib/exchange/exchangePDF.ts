import type { ExchangeSwap, SupportService } from "./exchangeQuery";
import type { SwapSummary } from "@/lib/chat/chatSummary";

export interface PDFData {
  swap: ExchangeSwap;
  summary: SwapSummary | null;
  myServices: SupportService[];
  partnerServices: SupportService[];
  myName: string;
  partnerName: string;
  generatedAt: string;
}

/** Build the HTML string for a printable exchange document. */
export function buildExchangeHTML(data: PDFData): string {
  const { swap, summary, myServices, partnerServices, myName, partnerName, generatedAt } = data;

  const title = summary?.swapTitle ?? `Swap #${swap.id.slice(0, 8)}`;
  const date = new Date(generatedAt).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const serviceRow = (s: SupportService) =>
    `<tr><td>${s.serviceType}</td><td>${s.status}</td><td>${s.costEur != null ? `€${s.costEur}` : "—"}</td><td>${JSON.stringify(s.details)}</td></tr>`;

  const myRows = myServices.map(serviceRow).join("");
  const partnerRows = partnerServices.map(serviceRow).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Swaply — ${title}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #111; font-size: 13px; }
  h1 { font-size: 22px; color: #2563eb; margin-bottom: 4px; }
  h2 { font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin-top: 28px; }
  .meta { color: #6b7280; font-size: 11px; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; }
  td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
  .disclaimer { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-top: 32px; font-size: 11px; color: #78350f; }
  .footer { margin-top: 32px; font-size: 10px; color: #9ca3af; text-align: center; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>🔄 Swaply — Exchange Document</h1>
<div class="meta">
  Swap ID: ${swap.id} &nbsp;|&nbsp; Generated: ${date} &nbsp;|&nbsp; Participants: ${myName} ↔ ${partnerName}
</div>

<h2>📋 Common Summary</h2>
<p><strong>${title}</strong></p>
${summary ? `
<div class="grid">
  <div class="card">
    <strong>Offers:</strong> ${summary.itemA.title}<br/>
    <small>Owner: ${summary.itemA.owner}</small>
  </div>
  <div class="card">
    <strong>Receives:</strong> ${summary.itemB.title}<br/>
    <small>Owner: ${summary.itemB.owner}</small>
  </div>
</div>
<p>✅ Agreed items: ${summary.agreedItems.join(", ") || "—"}</p>
` : ""}

<h2>⚙️ ${myName}'s Services</h2>
${myRows ? `<table><thead><tr><th>Service</th><th>Status</th><th>Cost</th><th>Details</th></tr></thead><tbody>${myRows}</tbody></table>` : "<p>No services selected.</p>"}

<h2>⚙️ ${partnerName}'s Services</h2>
${partnerRows ? `<table><thead><tr><th>Service</th><th>Status</th><th>Cost</th><th>Details</th></tr></thead><tbody>${partnerRows}</tbody></table>` : "<p>No services selected.</p>"}

<div class="disclaimer">
  <strong>⚠️ DISCLAIMER:</strong><br/>
  Swaply.world facilitates the connection between users and selected service providers. Swaply does not assume responsibility for services provided by third parties (courier, insurance, accommodation, restaurant). Each provider is responsible according to their own terms and conditions.
</div>

<div class="footer">
  Swaply.world &nbsp;|&nbsp; Swap ID: ${swap.id} &nbsp;|&nbsp; ${date}<br/>
  Digital signature: ${swap.requesterId}:${swap.responderId}:${new Date(generatedAt).getTime()}
</div>
</body>
</html>`;
}
