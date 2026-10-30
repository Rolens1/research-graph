// lib/graph-adapter.ts

import type { Node, Edge } from "@xyflow/react";
import type { MockGraphNode, MockGraphEdge } from "@/lib/mock-investigation";
import type { GraphNodeData, GraphEdgeData, ImpactLevel } from "@/types/graph";

export type CanvasViewMode = "constellation" | "cards";

export type AdaptedGraph = {
  initialNodes: Node<GraphNodeData>[];
  initialEdges: Edge<GraphEdgeData>[];
};

/**
 * Resolves the visual impact level of a graph node.
 * Uses explicit node impactLevel if set, falling back to topological edge centrality.
 */
export function resolveNodeImpact(
  node: MockGraphNode | GraphNodeData,
  connectedEdgesCount: number,
): ImpactLevel {
  if (node.impactLevel) return node.impactLevel;
  if (connectedEdgesCount >= 4) return "critical";
  if (connectedEdgesCount >= 3 || node.isDisputed) return "high";
  if (connectedEdgesCount >= 2) return "medium";
  return "low";
}

/**
 * Initial fallback positions for the benchmark investigation prior to dynamic ELK calculation.
 */
const CURATED_POSITIONS: Record<string, { x: number; y: number }> = {
  "actor_houthi-ansarallah": { x: 60, y: 120 },
  "decision_operation-prosperity-guardian": { x: 60, y: 340 },
  "decision_bab-el-mandeb-blockade": { x: 420, y: 220 },
  "technology_ais-transponder-spoofing": { x: 420, y: 420 },
  "event_cape-good-hope-rerouting": { x: 780, y: 220 },
  "dispute_insurance-war-risk-premiums": { x: 1140, y: 220 },
};

/**
 * Transforms normalized investigation graph fixtures into typed React Flow Node and Edge collections.
 */
export function adaptMockToReactFlow(
  nodes: MockGraphNode[],
  edges: MockGraphEdge[],
  selectedNodeId?: string | null,
  viewMode: CanvasViewMode = "constellation",
): AdaptedGraph {
  const initialNodes: Node<GraphNodeData>[] = nodes.map((node, index) => {
    const fallbackPosition = {
      x: 60 + (index % 3) * 360,
      y: 120 + Math.floor(index / 3) * 220,
    };
    const position = CURATED_POSITIONS[node.id] || fallbackPosition;
    const connectedEdges = edges.filter(
      (e) => e.source === node.id || e.target === node.id,
    ).length;
    const impactLevel = resolveNodeImpact(node, connectedEdges);

    return {
      id: node.id,
      position,
      selected: selectedNodeId === node.id,
      type: viewMode === "constellation" ? "constellationStarNode" : "entityNode",
      data: {
        id: node.id,
        label: node.label,
        entityType: node.entityType,
        summary: node.summary,
        confidence: node.confidence,
        depthLevel: node.depthLevel,
        parentNodeId: node.parentNodeId,
        isUserAdded: node.isUserAdded,
        isExcluded: Boolean(node.isExcluded),
        isDisputed: node.isDisputed ?? (node.entityType === "dispute"),
        impactLevel,
        timestamp: node.timestamp ?? "00:00",
        backdropUrl: node.backdropUrl,
        pathwayRole: node.pathwayRole ?? "core_causal",
        ambiguities: node.ambiguities,
        unresolvedQuestion: node.unresolvedQuestion,
        sources: node.sources,
      },
    };
  });

  const initialEdges: Edge<GraphEdgeData>[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: viewMode === "constellation" ? "constellationEdge" : "causalEdge",
    label: edge.label,
    animated: edge.isDisputed,
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationType: edge.relationType,
      label: edge.label,
      isDisputed: edge.isDisputed,
      isSevered: Boolean(edge.isSevered),
      explanation: edge.explanation,
    },
    style: {
      stroke: edge.isDisputed ? "var(--color-warning)" : "var(--color-border-strong)",
      strokeWidth: edge.isDisputed ? 2 : 1.5,
    },
    labelStyle: {
      fill: "var(--color-muted-foreground)",
      fontSize: 10,
      fontFamily: "var(--font-mono)",
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: "var(--color-card)",
      stroke: "var(--color-border)",
      strokeWidth: 1,
    },
    labelBgPadding: [6, 8] as [number, number],
    labelBgBorderRadius: 8,
  }));

  return { initialNodes, initialEdges };
}
