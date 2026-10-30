import type { GraphNodeData } from "@/types/graph";
import type { TimelineEvent } from "@/types/timeline";
import type { ExportClientPayload } from "@/types/export";

/**
 * Downloads a compiled PDF briefing dossier for an investigation.
 * Packages live nodes and timeline state from client memory for instantaneous rendering.
 */
export async function downloadInvestigationPdf(
  sessionId: string,
  options: {
    query?: string;
    depth?: "recon" | "expedition";
    status?: "running" | "completed" | "failed";
    confidenceScore?: number;
    nodes?: GraphNodeData[];
    timeline?: TimelineEvent[];
  },
): Promise<void> {
  const payload: ExportClientPayload = {
    query: options.query,
    depth: options.depth,
    status: options.status,
    confidenceScore: options.confidenceScore,
    nodes: (options.nodes || []).map((n) => ({
      id: n.id,
      label: n.label,
      entityType: n.entityType,
      confidence: n.confidence,
      summary: n.summary,
      impactLevel: n.impactLevel,
      depthLevel: n.depthLevel ?? 0,
      sources: (n.sources || []).map((s) => ({
        url: s.url,
        title: s.title,
        verbatimSnippet: s.verbatimSnippet,
        credibilityScore: s.credibilityScore,
        publishedDate: s.publishedDate,
      })),
    })),
    timeline: (options.timeline || []).map((t) => ({
      id: t.id,
      eventDate: t.eventDate,
      title: t.title,
      description: t.description,
      sourceUrl: t.sourceUrl,
    })),
  };

  try {
    const res = await fetch(`/api/export/${sessionId}/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("POST export failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chronocause-dossier-${sessionId.slice(0, 16)}.pdf`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (err) {
    console.warn("[ExportClient] POST failed, falling back to direct GET:", err);
    window.open(`/api/export/${sessionId}/pdf`, "_blank");
  }
}

