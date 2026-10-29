import type {
  GraphNodeData,
  GraphEdgeData,
  ImpactLevel,
  PathwayRole,
} from "@/types/graph";
import type { TimelineEvent } from "@/types/timeline";
import type { EnigmaDeclaration, CausalGapTarget } from "@/types/architect";
import { generateEntitySlugId } from "./visualizer-mapping";

/**
 * Calculates deterministic impact levels based on graph degree and confidence.
 * Satisfies AC-3.
 */
export function calculateHeuristicImpact(
  nodes: { id: string; confidence: number; entityType: string }[],
  edges: GraphEdgeData[],
): Map<string, ImpactLevel> {
  const degreeMap = new Map<string, number>();

  for (const node of nodes) {
    degreeMap.set(node.id, 0);
  }

  for (const edge of edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  }

  const impactMap = new Map<string, ImpactLevel>();

  for (const node of nodes) {
    const degree = degreeMap.get(node.id) || 0;

    if (node.entityType === "enigma") {
      impactMap.set(node.id, "high");
      continue;
    }

    if (degree >= 3 || node.confidence >= 90) {
      impactMap.set(node.id, "critical");
    } else if (degree >= 2 || node.confidence >= 80) {
      impactMap.set(node.id, "high");
    } else if (degree >= 1) {
      impactMap.set(node.id, "medium");
    } else {
      impactMap.set(node.id, "low");
    }
  }

  return impactMap;
}

/**
 * Assigns pathway roles across nodes distinguishing the main spine from side inquiries.
 * Satisfies AC-4.
 */
export function assignHeuristicPathwayRoles(
  nodes: { id: string; entityType: string; isDisputed?: boolean }[],
  edges: GraphEdgeData[],
  divergentEntityIds: Set<string> = new Set(),
): Map<string, PathwayRole> {
  const roleMap = new Map<string, PathwayRole>();
  const deadEndTargets = new Set<string>();

  for (const edge of edges) {
    if (edge.relationType === "blocks") {
      deadEndTargets.add(edge.target);
    }
  }

  for (const node of nodes) {
    if (node.entityType === "enigma") {
      roleMap.set(node.id, "dead_end");
      continue;
    }

    if (deadEndTargets.has(node.id)) {
      roleMap.set(node.id, "dead_end");
      continue;
    }

    if (divergentEntityIds.has(node.id) || node.isDisputed) {
      roleMap.set(node.id, "divergent_branch");
      continue;
    }

    roleMap.set(node.id, "core_causal");
  }

  return roleMap;
}

/**
 * Extracts timeline events strictly for nodes whose entity type is event.
 * Satisfies AC-6.
 */
export function extractChronologicalTimelineEvents(
  nodes: GraphNodeData[],
  researchId: string,
): TimelineEvent[] {
  const eventNodes = nodes.filter((n) => n.entityType === "event");
  const timelineEvents: TimelineEvent[] = [];

  for (const node of eventNodes) {
    const rawDate = node.timestamp || "Historical Milestone";
    let parsedTimestamp: string | undefined = undefined;

    // Attempt ISO date normalization
    const dateMatch = rawDate.match(/\b(19\d\d|20\d\d)(?:[-/.](\d{1,2}))?(?:[-/.](\d{1,2}))?\b/);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2] ? dateMatch[2].padStart(2, "0") : "01";
      const day = dateMatch[3] ? dateMatch[3].padStart(2, "0") : "01";
      parsedTimestamp = `${year}-${month}-${day}T00:00:00.000Z`;
    }

    timelineEvents.push({
      researchId,
      nodeId: node.id,
      eventDate: rawDate,
      parsedTimestamp,
      title: node.label.slice(0, 80),
      description: node.summary.slice(0, 300),
      sourceUrl: node.sources[0]?.url,
    });
  }

  // Sort events chronologically by parsed timestamp or event date
  timelineEvents.sort((a, b) => {
    if (a.parsedTimestamp && b.parsedTimestamp) {
      return a.parsedTimestamp.localeCompare(b.parsedTimestamp);
    }
    if (a.parsedTimestamp) return -1;
    if (b.parsedTimestamp) return 1;
    return a.eventDate.localeCompare(b.eventDate);
  });

  return timelineEvents;
}

/**
 * Instantiates an enigma mystery node card when 4 attempts fail to bridge a causal gap.
 * Satisfies AC-7.
 */
export function buildEnigmaNode(
  enigmaDecl?: EnigmaDeclaration,
  unbridgedGap?: CausalGapTarget,
): GraphNodeData {
  const question = enigmaDecl?.unresolvedQuestion || unbridgedGap?.description || "Unresolved causal connection between historical events.";
  const slugId = generateEntitySlugId("unresolved-mystery", "enigma");
  const summary = enigmaDecl?.failureSummary || "Four alternative pathways were explored without finding the missing antecedent link.";

  return {
    id: slugId,
    label: `Enigma: ${question.slice(0, 48)}`,
    entityType: "enigma",
    summary: summary.slice(0, 280),
    confidence: 25,
    depthLevel: 0,
    parentNodeId: null,
    isUserAdded: false,
    isDisputed: true,
    impactLevel: "high",
    pathwayRole: "dead_end",
    unresolvedQuestion: question,
    sources: [
      {
        url: "https://research-graph.local/unresolved-enigma",
        title: "Unresolved Research Enigma",
        verbatimSnippet: "Exhausted maximum exploratory attempts without establishing a verified causal bridge.",
        credibilityScore: 30,
      },
    ],
  };
}
