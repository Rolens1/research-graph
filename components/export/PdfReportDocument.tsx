import React from "react";
import { Document, Page, Text, View, Link } from "@react-pdf/renderer";
import type { ResearchSummaryPayload, ExportKeyDriver, ExportCitation } from "@/types/export";
import { pdfStyles as styles } from "./pdf-styles";

export function PdfReportDocument({ report }: { report: ResearchSummaryPayload }) {
  return (
    <Document
      title={`Causality-Search Dossier: ${report.query}`}
      author="Causality-Search AI Knowledge Engine"
      subject="Executive Decision Briefing"
    >
      {/* PAGE 1: EXECUTIVE INTELLIGENCE OVERVIEW */}
      <Page size="A4" style={styles.page}>
        <View style={styles.masthead}>
          <Text style={styles.mastheadKicker}>Causality-Search Causal Intelligence Engine</Text>
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
            Causality-Search Intelligence Platform • Decision Grade Causal Analysis
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
            Causality-Search Intelligence Platform • Primary Evidence Audit Trail
          </Text>
          <Text style={styles.footerText}>Page 2 of 2</Text>
        </View>
      </Page>
    </Document>
  );
}
