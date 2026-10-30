import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import type { CausalGapTarget } from "@/types/architect";

/**
 * Deterministic Topological Causal Gap Detector
 * Inspects graph nodes and edges to detect missing causal antecedents and intermediate transitions.
 */
export function detectCausalGaps(
  userQuery: string,
  nodes: GraphNodeData[] = [],
  edges: GraphEdgeData[] = [],
): CausalGapTarget[] {
  // Case 1: Empty graph on initial inquiry start
  if (nodes.length === 0) {
    return [
      {
        gapId: "root_inquiry",
        description: `Identify direct historical antecedents and causes for inquiry: "${userQuery}"`,
        temporalWindow: "Present day outcome back to immediate preceding causes",
      },
    ];
  }

  const gaps: CausalGapTarget[] = [];
  const incomingEdgeCounts = new Map<string, number>();
  const outgoingEdgeCounts = new Map<string, number>();

  for (const node of nodes) {
    incomingEdgeCounts.set(node.id, 0);
    outgoingEdgeCounts.set(node.id, 0);
  }

  // Build adjacency lookup for direct connections
  const connectedPairs = new Set<string>();

  for (const edge of edges) {
    connectedPairs.add(`${edge.source}->${edge.target}`);
    incomingEdgeCounts.set(edge.target, (incomingEdgeCounts.get(edge.target) || 0) + 1);
    outgoingEdgeCounts.set(edge.source, (outgoingEdgeCounts.get(edge.source) || 0) + 1);
  }

  // Case 2: Genesis Nodes (nodes with zero incoming causal links)
  // Backward causal tracing prioritizes finding what happened prior to these genesis nodes.
  const genesisNodes = nodes.filter((node) => (incomingEdgeCounts.get(node.id) || 0) === 0);

  for (const genesis of genesisNodes) {
    gaps.push({
      gapId: `genesis_${genesis.id}`,
      toNodeId: genesis.id,
      description: `Uncover the founding decisions, precursor events, or technological origins that caused '${genesis.label}'`,
      temporalWindow: `Historical timeline prior to ${genesis.label}`,
    });
  }

  // Case 3: Intermediate Gaps (pairs of nodes with no direct causal edge connecting them)
  // Compare nodes with high confidence or divergent branch roots
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      const directAtoB = connectedPairs.has(`${nodeA.id}->${nodeB.id}`);
      const directBtoA = connectedPairs.has(`${nodeB.id}->${nodeA.id}`);

      if (!directAtoB && !directBtoA) {
        // Formulate an intermediate gap candidate
        gaps.push({
          gapId: `gap_${nodeA.id}_to_${nodeB.id}`,
          fromNodeId: nodeA.id,
          toNodeId: nodeB.id,
          description: `Missing intermediate causal link between '${nodeA.label}' (${nodeA.entityType}) and '${nodeB.label}' (${nodeB.entityType})`,
          temporalWindow: `${nodeA.label} and ${nodeB.label} transition era`,
        });
      }
    }
  }

  // Limit to top 8 prioritized gaps to provide diverse exploration avenues
  return gaps.slice(0, 8);
}
