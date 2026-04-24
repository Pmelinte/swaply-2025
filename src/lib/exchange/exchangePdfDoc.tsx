import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { ExchangeSwap, SupportService } from "./exchangeQuery";
import type { SwapSummary } from "@/lib/chat/chatSummary";

export interface ExchangePDFData {
  swap: ExchangeSwap;
  summary: SwapSummary | null;
  myServices: SupportService[];
  partnerServices: SupportService[];
  myName: string;
  partnerName: string;
  generatedAt: string;
  disclaimer: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#111111" },
  header: { marginBottom: 18, borderBottom: "2 solid #2563eb", paddingBottom: 10 },
  title: { fontSize: 20, color: "#2563eb", fontWeight: 700 },
  meta: { marginTop: 4, fontSize: 9, color: "#6b7280" },
  h2: { fontSize: 13, color: "#111827", marginTop: 18, marginBottom: 6, fontWeight: 700 },
  p: { marginBottom: 4, lineHeight: 1.4 },
  cardRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  card: { flex: 1, border: "1 solid #e5e7eb", borderRadius: 4, padding: 10 },
  cardLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", marginBottom: 3 },
  cardValue: { fontSize: 11, fontWeight: 700 },
  tableRow: { flexDirection: "row", borderBottom: "1 solid #f3f4f6", paddingVertical: 4 },
  th: { flex: 1, fontSize: 9, color: "#374151", fontWeight: 700 },
  td: { flex: 1, fontSize: 9, color: "#4b5563" },
  disclaimer: {
    marginTop: 24,
    padding: 10,
    backgroundColor: "#fef3c7",
    border: "1 solid #f59e0b",
    borderRadius: 4,
    fontSize: 9,
    color: "#78350f",
    lineHeight: 1.45,
  },
  footer: { marginTop: 20, textAlign: "center", fontSize: 7, color: "#9ca3af" },
});

function serviceSection(heading: string, services: SupportService[]): ReactElement {
  return (
    <View>
      <Text style={styles.h2}>{heading}</Text>
      {services.length === 0 ? (
        <Text style={styles.p}>—</Text>
      ) : (
        <View>
          <View style={[styles.tableRow, { borderBottom: "1 solid #d1d5db" }]}>
            <Text style={styles.th}>Service</Text>
            <Text style={styles.th}>Status</Text>
            <Text style={styles.th}>Cost</Text>
            <Text style={[styles.th, { flex: 2 }]}>Details</Text>
          </View>
          {services.map((s) => (
            <View key={s.id} style={styles.tableRow}>
              <Text style={styles.td}>{s.serviceType}</Text>
              <Text style={styles.td}>{s.status}</Text>
              <Text style={styles.td}>{s.costEur != null ? `€${s.costEur}` : "—"}</Text>
              <Text style={[styles.td, { flex: 2 }]}>
                {Object.entries(s.details ?? {})
                  .filter(([, v]) => v !== null && v !== undefined && v !== "")
                  .map(([k, v]) => `${k}: ${String(v)}`)
                  .join("; ") || "—"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ExchangePDFDoc(data: ExchangePDFData): ReactElement<DocumentProps> {
  const { swap, summary, myServices, partnerServices, myName, partnerName, generatedAt, disclaimer } = data;

  const title = summary?.swapTitle ?? `Swap #${swap.id.slice(0, 8)}`;
  const date = new Date(generatedAt);
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Swaply — Exchange Document</Text>
          <Text style={styles.meta}>
            Swap ID: {swap.id}   |   Generated: {dateStr}   |   Participants: {myName} - {partnerName}
          </Text>
        </View>

        <Text style={styles.h2}>Common Summary</Text>
        <Text style={[styles.p, { fontWeight: 700 }]}>{title}</Text>
        {summary && (
          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Offers</Text>
              <Text style={styles.cardValue}>{summary.itemA.title}</Text>
              <Text style={[styles.p, { fontSize: 9, color: "#6b7280" }]}>
                Owner: {summary.itemA.owner}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Receives</Text>
              <Text style={styles.cardValue}>{summary.itemB.title}</Text>
              <Text style={[styles.p, { fontSize: 9, color: "#6b7280" }]}>
                Owner: {summary.itemB.owner}
              </Text>
            </View>
          </View>
        )}
        {summary && (
          <Text style={[styles.p, { marginTop: 8 }]}>
            Agreed items: {summary.agreedItems.length ? summary.agreedItems.join(", ") : "—"}
          </Text>
        )}

        {serviceSection(`${myName}'s Services`, myServices)}
        {serviceSection(`${partnerName}'s Services`, partnerServices)}

        <View style={styles.disclaimer}>
          <Text>{disclaimer}</Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Swaply.world   |   Swap ID: {swap.id}   |   {dateStr}
          </Text>
          <Text>
            Digital signature: {swap.requesterId}:{swap.responderId}:{date.getTime()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
