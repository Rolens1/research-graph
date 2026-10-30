import React from "react";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import type { ResearchSummaryPayload, ExportKeyDriver, ExportCitation } from "@/types/export";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: 9,
    lineHeight: 1.4,
  },
  masthead: {
    borderBottomWidth: 2,
    borderBottomColor: "#0284C7",
    paddingBottom: 8,
    marginBottom: 12,
  },
  mastheadKicker: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0284C7",
    letterSpacing: 1.2,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  mastheadTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  metaGrid: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    padding: 8,
    marginBottom: 14,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  synthesisText: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.5,
    marginBottom: 10,
    textAlign: "justify",
  },
  driverRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  driverCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 4,
    padding: 7,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  driverTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    width: "70%",
  },
  driverBadge: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#0369A1",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
    textTransform: "uppercase",
  },
  driverSummary: {
    fontSize: 7.5,
    color: "#475569",
    lineHeight: 1.35,
  },
  milestoneRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 5,
  },
  milestoneDate: {
    width: "22%",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0369A1",
  },
  milestoneContent: {
    width: "78%",
  },
  milestoneTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 1,
  },
  milestoneDesc: {
    fontSize: 7.5,
    color: "#475569",
    lineHeight: 1.3,
  },
  citationCard: {
    borderLeftWidth: 2,
    borderLeftColor: "#0284C7",
    backgroundColor: "#F8FAFC",
    padding: 5,
    marginBottom: 5,
  },
  citationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  citationTitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    width: "75%",
  },
  citationScore: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
  },
  citationLink: {
    fontSize: 6.5,
    color: "#0284C7",
    textDecoration: "none",
    marginBottom: 2,
  },
  citationSnippet: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Oblique",
    color: "#64748B",
    lineHeight: 1.25,
  },
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 6.5,
    color: "#94A3B8",
    fontFamily: "Helvetica",
  },
});

export function PdfReportDocument({ report }: { report: ResearchSummaryPayload }) {
  return (
    <Document
      title={`Chronocause Dossier: ${report.query}`}
      author="Chronocause AI Knowledge Engine"
      subject="Executive Decision Briefing"
    >
      {/* PAGE 1: EXECUTIVE INTELLIGENCE OVERVIEW */}
      <Page size="A4" style={styles.page}>
        <View style={styles.masthead}>
          <Text style={styles.mastheadKicker}>Chronocause Causal Intelligence Engine</Text>
          <Text style={styles.mastheadTitle}>{report.query}</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Confidence</Text>
            <Text style={styles.metaValue}>{report.confidenceScore}%</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{report.status.toUpperCase()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Depth</Text>
            <Text style={styles.metaValue}>{report.depth.toUpperCase()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{report.date}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Session ID</Text>
            <Text style={styles.metaValue}>{report.id.slice(0, 12)}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Executive Causal Synthesis</Text>
        <Text style={styles.synthesisText}>{report.executiveSynthesis}</Text>

        <Text style={styles.sectionHeading}>Primary Causal Drivers</Text>
        <View style={styles.driverRow}>
          {report.keyDrivers.slice(0, 6).map((driver: ExportKeyDriver) => (
            <View key={driver.id} style={styles.driverCard}>
              <View style={styles.driverHeader}>
                <Text style={styles.driverTitle}>{driver.label}</Text>
                <Text style={styles.driverBadge}>{driver.entityType}</Text>
              </View>
              <Text style={styles.driverSummary}>{driver.summary}</Text>
            </View>
          ))}
        </View>

        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>
            Chronocause Intelligence Platform • Decision Grade Causal Analysis
          </Text>
          <Text style={styles.footerText}>Page 1 of 2</Text>
        </View>
      </Page>

      {/* PAGE 2: CHRONOLOGY & AUDIT TRAIL */}
      <Page size="A4" style={styles.page}>
        <View style={styles.masthead}>
          <Text style={styles.mastheadKicker}>Part II: Chronology & Verified Sources</Text>
          <Text style={styles.mastheadTitle}>{report.query}</Text>
        </View>

        <Text style={styles.sectionHeading}>Chronological Milestone Ledger</Text>
        {report.milestones.slice(0, 5).map((m) => (
          <View key={m.id || m.title} style={styles.milestoneRow}>
            <Text style={styles.milestoneDate}>{m.eventDate}</Text>
            <View style={styles.milestoneContent}>
              <Text style={styles.milestoneTitle}>{m.title}</Text>
              <Text style={styles.milestoneDesc}>{m.description}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionHeading}>Numbered Source Citations</Text>
        {report.citations.slice(0, 5).map((c: ExportCitation) => (
          <View key={c.number} style={styles.citationCard}>
            <View style={styles.citationHeader}>
              <Text style={styles.citationTitle}>
                [{c.number}] {c.title}
              </Text>
              <Text style={styles.citationScore}>{c.credibilityScore}% Confirmed</Text>
            </View>
            <Link src={c.url} style={styles.citationLink}>
              {c.domain || c.url}
            </Link>
            <Text style={styles.citationSnippet}>
              &quot;{c.verbatimSnippet}&quot;
            </Text>
          </View>
        ))}

        <View style={styles.pageFooter} fixed>
          <Text style={styles.footerText}>
            Chronocause Intelligence Platform • Primary Evidence Audit Trail
          </Text>
          <Text style={styles.footerText}>Page 2 of 2</Text>
        </View>
      </Page>
    </Document>
  );
}
