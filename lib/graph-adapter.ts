// lib/graph-adapter.ts

import type { Node, Edge } from "@xyflow/react";
import type { MockGraphNode, MockGraphEdge } from "@/lib/mock-investigation";
import type { GraphNodeData, GraphEdgeData } from "@/types/graph";

export type AdaptedGraph = {
  initialNodes: Node<GraphNodeData>[];
  initialEdges: Edge<GraphEdgeData>[];
};

/**
 * Curated left-to-right causal positions for the Red Sea benchmark investigation.
 * These ensure readable layout during baseline setup before ELK.js integration in Feature 12.
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
): AdaptedGraph {
  const initialNodes: Node<GraphNodeData>[] = nodes.map((node, index) => {
    const fallbackPosition = {
      x: 60 + (index % 3) * 360,
      y: 120 + Math.floor(index / 3) * 220,
    };
    const position = CURATED_POSITIONS[node.id] || fallbackPosition;

    return {
      id: node.id,
      position,
      selected: selectedNodeId === node.id,
      type: "entityNode",
      data: {
        id: node.id,
        label: node.label,
        entityType: node.entityType,
        summary: node.summary,
        confidence: node.confidence,
        depthLevel: node.depthLevel,
        parentNodeId: node.parentNodeId,
        isUserAdded: node.isUserAdded,
        isDisputed: node.isDisputed ?? (node.entityType === "dispute"),
        sources: node.sources,
      },
    };
  });

  const initialEdges: Edge<GraphEdgeData>[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "causalEdge",
    label: edge.label,
    animated: edge.isDisputed,
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      relationType: edge.relationType,
      label: edge.label,
      isDisputed: edge.isDisputed,
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
