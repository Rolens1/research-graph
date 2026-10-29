// lib/elk-layout.ts

import ELK, { type ElkNode, type ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import type { Node, Edge } from "@xyflow/react";
import type { GraphNodeData } from "@/types/graph";

const elk = new ELK();

export const DEFAULT_NODE_WIDTH = 240;
export const DEFAULT_NODE_HEIGHT = 96;
export const STAR_NODE_WIDTH = 140;
export const STAR_NODE_HEIGHT = 90;

export const ELK_OPTIONS: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "80",
  "elk.layered.spacing.nodeNodeBetweenLayers": "120",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
};

/**
 * Calculates deterministic left-to-right positions for graph nodes using ELK.
 * Preserves existing node dimensions if measured by React Flow, falling back to 240x96 (or 140x90 for stars).
 */
export async function calculateElkLayout<T extends Record<string, unknown> = GraphNodeData>(
  nodes: Node<T>[],
  edges: Edge[],
): Promise<Node<T>[]> {
  if (nodes.length === 0) return [];

  const elkNodes: ElkNode[] = nodes.map((node) => {
    const isStar = node.type === "constellationStarNode";
    const defaultW = isStar ? STAR_NODE_WIDTH : DEFAULT_NODE_WIDTH;
    const defaultH = isStar ? STAR_NODE_HEIGHT : DEFAULT_NODE_HEIGHT;
    return {
      id: node.id,
      width: node.measured?.width ?? node.width ?? defaultW,
      height: node.measured?.height ?? node.height ?? defaultH,
    };
  });

  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: ELK_OPTIONS,
    children: elkNodes,
    edges: elkEdges,
  };

  const layout = await elk.layout(graph);

  const positionMap = new Map<string, { x: number; y: number }>();
  if (layout.children) {
    for (const child of layout.children) {
      if (child.id && typeof child.x === "number" && typeof child.y === "number") {
        positionMap.set(child.id, { x: child.x, y: child.y });
      }
    }
  }

  return nodes.map((node) => {
    const computedPosition = positionMap.get(node.id);
    return {
      ...node,
      position: computedPosition ?? node.position,
    };
  });
}
