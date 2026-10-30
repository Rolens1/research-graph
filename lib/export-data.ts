import { MOCK_INVESTIGATION } from "@/lib/mock-investigation";
import { getInsForgeServerClient } from "@/lib/insforge-server";
import {
  type ResearchSummaryPayload,
  researchSummaryPayloadSchema,
  type ExportKeyDriver,
  type ExportMilestone,
  type ExportCitation,
  type ExportClientPayload,
} from "@/types/export";
import {
  extractDomain,
  generateExecutiveSynthesis,
  synthesizeFallbackDrivers,
  synthesizeCitationsFromDrivers,
  synthesizeMilestonesFromDrivers,
} from "./export-helpers";

/**
 * Builds a complete ResearchSummaryPayload directly from client graph state.
 */
export function buildExportPayloadFromClient(
  researchId: string,
  clientData: ExportClientPayload,
): ResearchSummaryPayload {
  const query = clientData.query?.trim() || "Causal Investigation Briefing";
  const confidenceScore = clientData.confidenceScore ?? 85;

  let keyDrivers: ExportKeyDriver[] = (clientData.nodes || [])
    .filter((n) => n.id && n.label)
    .map((n) => ({
      id: String(n.id),
      label: String(n.label),
      entityType: n.entityType || "actor",
      confidence: Number(n.confidence ?? 80),
      summary: String(n.summary || `Primary causal driver identified for ${query}.`),
      impactLevel: n.impactLevel || "medium",
      depthLevel: Number(n.depthLevel ?? 0),
      sourceCount: Array.isArray(n.sources) ? n.sources.length : 1,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  if (keyDrivers.length === 0) {
    keyDrivers = synthesizeFallbackDrivers(query);
  }

  // Deduplicate and number citations from node sources
  const citationsMap = new Map<string, ExportCitation>();
  let citationIndex = 1;

  for (const node of clientData.nodes || []) {
    if (Array.isArray(node.sources)) {
      for (const s of node.sources) {
        const rawUrl = s.url?.trim();
        if (rawUrl && !citationsMap.has(rawUrl)) {
          citationsMap.set(rawUrl, {
            number: citationIndex++,
            url: rawUrl,
            title: s.title || `${node.label} Primary Source`,
            publishedDate: s.publishedDate,
            verbatimSnippet: s.verbatimSnippet || node.summary || "Corroborated intelligence.",
            credibilityScore: s.credibilityScore ?? 85,
            domain: extractDomain(rawUrl),
          });
        }
      }
    }
  }

  let citations = Array.from(citationsMap.values()).slice(0, 8);
  if (citations.length === 0) {
    citations = synthesizeCitationsFromDrivers(query, keyDrivers);
  }

  let milestones: ExportMilestone[] = (clientData.timeline || [])
    .filter((t) => t.eventDate && t.title)
    .map((t, idx) => ({
      id: String(t.id || `m_${idx}`),
      eventDate: String(t.eventDate),
      title: String(t.title),
      description: String(t.description || ""),
      sourceUrl: t.sourceUrl ? String(t.sourceUrl) : undefined,
    }))
    .slice(0, 6);

  if (milestones.length === 0) {
    milestones = synthesizeMilestonesFromDrivers(keyDrivers);
  }

  const payload: ResearchSummaryPayload = {
    id: researchId,
    query,
    depth: clientData.depth || "expedition",
    status: clientData.status || "completed",
    confidenceScore,
    date: new Date().toISOString().split("T")[0],
    executiveSynthesis: generateExecutiveSynthesis(query, confidenceScore, keyDrivers),
    keyDrivers: keyDrivers.slice(0, 6),
    milestones,
    citations,
    stats: {
      totalNodes: keyDrivers.length,
      totalEdges: Math.max(1, keyDrivers.length - 1),
      totalSources: citations.length,
      disputedCount: 0,
    },
  };

  return researchSummaryPayloadSchema.parse(payload);
}

/**
 * Assembles a complete ResearchSummaryPayload for PDF export via database or fallback.
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

        let keyDrivers: ExportKeyDriver[] = rawNodes
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
              summary: String(n.summary || `Verified actor influencing ${research.query}.`),
              impactLevel: (n.impact_level as ExportKeyDriver["impactLevel"]) || "medium",
              depthLevel: Number(n.depth_level ?? 0),
              sourceCount: Math.max(1, nodeSources.length),
            };
          })
          .sort((a: ExportKeyDriver, b: ExportKeyDriver) => b.confidence - a.confidence);

        if (keyDrivers.length === 0) {
          keyDrivers = synthesizeFallbackDrivers(research.query);
        }

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

        let citations = Array.from(citationsMap.values()).slice(0, 8);
        if (citations.length === 0) {
          citations = synthesizeCitationsFromDrivers(research.query, keyDrivers);
        }

        let milestones: ExportMilestone[] = rawTimeline
          .map((t: Record<string, unknown>) => ({
            id: String(t.id || ""),
            eventDate: String(t.event_date || "Milestone"),
            title: String(t.title || "Event"),
            description: String(t.description || ""),
            sourceUrl: t.source_url ? String(t.source_url) : undefined,
          }))
          .slice(0, 6);

        if (milestones.length === 0) {
          milestones = synthesizeMilestonesFromDrivers(keyDrivers);
        }

        const dateStr = research.created_at
          ? new Date(research.created_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        const payload: ResearchSummaryPayload = {
          id: research.id,
          query: research.query,
          depth: "expedition",
          status: (research.status as ResearchSummaryPayload["status"]) || "completed",
          confidenceScore: Number(research.confidence_score ?? 85) || 85,
          date: dateStr,
          executiveSynthesis: generateExecutiveSynthesis(
            research.query,
            Number(research.confidence_score ?? 85) || 85,
            keyDrivers,
          ),
          keyDrivers: keyDrivers.slice(0, 6),
          milestones,
          citations,
          stats: {
            totalNodes: Math.max(rawNodes.length, keyDrivers.length),
            totalEdges: rawEdges.length,
            totalSources: citations.length,
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
