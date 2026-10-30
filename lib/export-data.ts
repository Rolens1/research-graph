import { MOCK_INVESTIGATION } from "@/lib/mock-investigation";
import { getInsForgeServerClient } from "@/lib/insforge-server";
import {
  type ResearchSummaryPayload,
  researchSummaryPayloadSchema,
  type ExportKeyDriver,
  type ExportMilestone,
  type ExportCitation,
} from "@/types/export";

/**
 * Extracts a clean domain string from a web URL
 */
function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "source.int";
  }
}

/**
 * Generates an executive narrative synthesis from investigation topology
 */
function generateExecutiveSynthesis(
  query: string,
  confidenceScore: number,
  keyDrivers: ExportKeyDriver[],
): string {
  const driverLabels = keyDrivers.slice(0, 3).map((d) => d.label);
  const driverListText =
    driverLabels.length > 0 ? driverLabels.join(", ") : "primary causal antecedents";

  return `This intelligence dossier summarizes multi agent causal discovery regarding ${query}. Systematic inquiry across primary sources established an aggregate epistemic confidence score of ${confidenceScore} percent. Key causal momentum centers on ${driverListText}, tracing direct structural dependencies from root operational decisions through to global supply chain and economic outcomes.`;
}

/**
 * Assembles a complete ResearchSummaryPayload for PDF export.
 * Queries InsForge database when an authenticated UUID is supplied;
 * falls back cleanly to MOCK_INVESTIGATION for mock or guest sessions.
 */
export async function getResearchExportPayload(
  researchId: string,
): Promise<ResearchSummaryPayload> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(researchId);

  if (isUuid) {
    try {
      const insforge = await getInsForgeServerClient();

      const { data: research } = await insforge.database
        .from("researches")
        .select("*")
        .eq("id", researchId)
        .single();

      if (research) {
        const [nodesRes, edgesRes, timelineRes, sourcesRes] = await Promise.all([
          insforge.database.from("nodes").select("*").eq("research_id", researchId),
          insforge.database.from("edges").select("*").eq("research_id", researchId),
          insforge.database.from("timeline_events").select("*").eq("research_id", researchId),
          insforge.database.from("sources").select("*").eq("research_id", researchId),
        ]);

        const rawNodes = nodesRes.data || [];
        const rawEdges = edgesRes.data || [];
        const rawTimeline = timelineRes.data || [];
        const rawSources = sourcesRes.data || [];

        // Build key drivers
        const keyDrivers: ExportKeyDriver[] = rawNodes
          .filter((n: Record<string, unknown>) => !n.is_excluded)
          .map((n: Record<string, unknown>) => {
            const nodeSources = rawSources.filter(
              (s: Record<string, unknown>) => s.node_id === n.id,
            );
            return {
              id: String(n.id),
              label: String(n.label || "Entity"),
              entityType: (n.entity_type as ExportKeyDriver["entityType"]) || "actor",
              confidence: Number(n.confidence ?? 80),
              summary: String(n.summary || "No summary available."),
              impactLevel: (n.impact_level as ExportKeyDriver["impactLevel"]) || "medium",
              depthLevel: Number(n.depth_level ?? 0),
              sourceCount: nodeSources.length,
            };
          })
          .sort((a: ExportKeyDriver, b: ExportKeyDriver) => b.confidence - a.confidence);

        // Build milestones
        const milestones: ExportMilestone[] = rawTimeline
          .map((t: Record<string, unknown>) => ({
            id: String(t.id || ""),
            eventDate: String(t.event_date || "Unknown Date"),
            title: String(t.title || "Milestone"),
            description: String(t.description || ""),
            sourceUrl: t.source_url ? String(t.source_url) : undefined,
          }))
          .slice(0, 6);

        // Build citations
        const citationsMap = new Map<string, ExportCitation>();
        let citationIndex = 1;

        for (const s of rawSources) {
          const url = String(s.url || "");
          if (url && !citationsMap.has(url)) {
            citationsMap.set(url, {
              number: citationIndex++,
              url,
              title: String(s.title || "Reference Source"),
              publishedDate: s.published_date ? String(s.published_date) : undefined,
              verbatimSnippet: String(
                s.verbatim_snippet || s.snippet || "Primary source evidence.",
              ),
              credibilityScore: Number(s.credibility_score ?? 85),
              domain: extractDomain(url),
            });
          }
        }

        const dateStr = research.created_at
          ? new Date(research.created_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        const payload: ResearchSummaryPayload = {
          id: research.id,
          query: research.query,
          depth: "expedition",
          status: (research.status as ResearchSummaryPayload["status"]) || "completed",
          confidenceScore: Number(research.confidence_score ?? 85),
          date: dateStr,
          executiveSynthesis: generateExecutiveSynthesis(
            research.query,
            Number(research.confidence_score ?? 85),
            keyDrivers,
          ),
          keyDrivers: keyDrivers.slice(0, 6),
          milestones,
          citations: Array.from(citationsMap.values()).slice(0, 8),
          stats: {
            totalNodes: rawNodes.length,
            totalEdges: rawEdges.length,
            totalSources: citationsMap.size,
            disputedCount: rawEdges.filter((e: Record<string, unknown>) => e.is_disputed).length,
          },
        };

        return researchSummaryPayloadSchema.parse(payload);
      }
    } catch (dbError) {
      console.warn("[ExportData] Failed to load research from InsForge:", dbError);
    }
  }

  // Fallback to MOCK_INVESTIGATION fixture
  const mockNodes: ExportKeyDriver[] = MOCK_INVESTIGATION.nodes
    .filter((n) => !n.isExcluded)
    .map((n) => ({
      id: n.id,
      label: n.label,
      entityType: n.entityType,
      confidence: n.confidence,
      summary: n.summary,
      impactLevel: n.impactLevel || "medium",
      depthLevel: n.depthLevel ?? 0,
      sourceCount: n.sources.length,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const mockMilestones: ExportMilestone[] = MOCK_INVESTIGATION.timeline
    .map((t) => ({
      id: t.id,
      eventDate: t.eventDate,
      title: t.title,
      description: t.description,
      sourceUrl: t.sourceUrl,
    }))
    .slice(0, 6);

  const citationsMap = new Map<string, ExportCitation>();
  let citationNum = 1;

  for (const n of MOCK_INVESTIGATION.nodes) {
    for (const s of n.sources) {
      if (!citationsMap.has(s.url)) {
        citationsMap.set(s.url, {
          number: citationNum++,
          url: s.url,
          title: s.title,
          publishedDate: s.publishedDate,
          verbatimSnippet: s.verbatimSnippet,
          credibilityScore: s.credibilityScore,
          domain: extractDomain(s.url),
        });
      }
    }
  }

  const mockPayload: ResearchSummaryPayload = {
    id: researchId || MOCK_INVESTIGATION.id,
    query: MOCK_INVESTIGATION.query,
    depth: MOCK_INVESTIGATION.depth,
    status: MOCK_INVESTIGATION.status,
    confidenceScore: MOCK_INVESTIGATION.confidenceScore,
    date: MOCK_INVESTIGATION.createdAt.split("T")[0],
    executiveSynthesis: generateExecutiveSynthesis(
      MOCK_INVESTIGATION.query,
      MOCK_INVESTIGATION.confidenceScore,
      mockNodes,
    ),
    keyDrivers: mockNodes.slice(0, 6),
    milestones: mockMilestones,
    citations: Array.from(citationsMap.values()).slice(0, 8),
    stats: {
      totalNodes: MOCK_INVESTIGATION.nodes.length,
      totalEdges: MOCK_INVESTIGATION.edges.length,
      totalSources: citationsMap.size,
      disputedCount: MOCK_INVESTIGATION.edges.filter((e) => e.isDisputed).length,
    },
  };

  return researchSummaryPayloadSchema.parse(mockPayload);
}
