import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import type { ResearchEngineState, ResearchEngineOptions } from "@/types/engine";

export interface TerminationDecision {
  shouldStop: boolean;
  reason: string;
  status: "completed" | "failed" | "running";
}

/**
 * Checks whether an unbroken, undisputed causal path connects genesis nodes to terminal outcome nodes.
 * Satisfies AC-3.
 */
export function hasUnbrokenCausalPath(
  nodes: GraphNodeData[],
  edges: GraphEdgeData[],
): boolean {
  if (nodes.length < 2 || edges.length === 0) {
    return false;
  }

  const overallInDegree = new Map<string, number>();
  const overallOutDegree = new Map<string, number>();
  const validAdjacency = new Map<string, string[]>();

  for (const node of nodes) {
    overallInDegree.set(node.id, 0);
    overallOutDegree.set(node.id, 0);
    validAdjacency.set(node.id, []);
  }

  for (const edge of edges) {
    overallInDegree.set(edge.target, (overallInDegree.get(edge.target) || 0) + 1);
    overallOutDegree.set(edge.source, (overallOutDegree.get(edge.source) || 0) + 1);

    // Only non disputed, non blocked edges may form valid causal links
    if (edge.relationType !== "blocks" && !edge.isDisputed) {
      const neighbors = validAdjacency.get(edge.source) || [];
      neighbors.push(edge.target);
      validAdjacency.set(edge.source, neighbors);
    }
  }

  // True genesis roots have zero incoming links in the overall graph
  const rootNodes = nodes.filter((n) => (overallInDegree.get(n.id) || 0) === 0);

  // True terminal outcomes have zero outgoing links in the overall graph
  const terminalNodes = nodes.filter((n) => (overallOutDegree.get(n.id) || 0) === 0);

  if (rootNodes.length === 0 || terminalNodes.length === 0) {
    return false;
  }

  for (const root of rootNodes) {
    const visited = new Set<string>();
    const queue = [root.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      if (terminalNodes.some((term) => term.id === current && term.id !== root.id)) {
        return true;
      }

      const neighbors = validAdjacency.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  return false;
}

/**
 * Evaluates the multi condition termination matrix.
 * Satisfies AC-3, AC-4, AC-6.
 */
export function evaluateTerminationCondition(
  state: ResearchEngineState,
  options: ResearchEngineOptions,
  enigmaTriggered = false,
): TerminationDecision {
  const maxAllowedIterations = options.maxIterations ?? (options.depth === "recon" ? 1 : 3);
  const maxQueriesBudget = options.maxQueriesBudget ?? 12;

  // 1. Enigma Resolution (AC-6)
  if (enigmaTriggered) {
    return {
      shouldStop: true,
      reason: "Unresolved causal mystery flagged; instantiated Enigma node card.",
      status: "completed",
    };
  }

  // 2. High Confidence and Topological Completeness (AC-3)
  const isCausalPathComplete = hasUnbrokenCausalPath(state.nodes, state.edges);
  if (state.confidenceScore >= 85 && isCausalPathComplete) {
    return {
      shouldStop: true,
      reason: `High confidence threshold achieved (${state.confidenceScore}%) with complete causal chain.`,
      status: "completed",
    };
  }

  // 3. Iteration Depth Ceiling (AC-4)
  if (state.iteration >= maxAllowedIterations) {
    return {
      shouldStop: true,
      reason: `Reached maximum configured depth limit (${state.iteration} iterations for ${options.depth} mode).`,
      status: "completed",
    };
  }

  // 4. Query Budget Ceiling (AC-4)
  if (state.totalQueriesExecuted >= maxQueriesBudget) {
    return {
      shouldStop: true,
      reason: `Reached maximum search query budget ceiling (${state.totalQueriesExecuted}/${maxQueriesBudget} queries).`,
      status: "completed",
    };
  }

  return {
    shouldStop: false,
    reason: "Investigation in progress; topological gaps detected for next iteration.",
    status: "running",
  };
}

/**
 * Formulates the final executive synthesis narrative for the investigation.
 */
export function generateExecutiveSynthesis(state: ResearchEngineState): string {
  const nodeCount = state.nodes.length;
  const edgeCount = state.edges.length;
  const timelineCount = state.timelineEvents.length;

  if (nodeCount === 0) {
    return `Investigation for "${state.query}" concluded with zero verified evidence links.`;
  }

  const primaryActors = state.nodes
    .filter((n) => n.entityType === "actor" || n.impactLevel === "critical")
    .map((n) => n.label)
    .slice(0, 3)
    .join(", ");

  const actorContext = primaryActors ? ` involving ${primaryActors}` : "";

  return `Autonomous investigation analyzed "${state.query}", structuring ${nodeCount} verified entities${actorContext} across ${edgeCount} causal links and ${timelineCount} chronological milestones with a global confidence score of ${state.confidenceScore}%.`;
}
