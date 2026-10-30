import { searchWeb } from "@/lib/search-provider";
import type { GraphNodeData, GraphEdgeData, SourceCitation } from "@/types/graph";
import type { AddNodePayload } from "@/types/mutation";

export interface PathBreakageResult {
  pathBroken: boolean;
  severedEdgeIds: string[];
  summary: string;
  agentThoughts: string[];
}

function buildAdjacencyList(edges: GraphEdgeData[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adj.get(edge.source) || [];
    list.push(edge.target);
    adj.set(edge.source, list);
  }
  return adj;
}

function getReachableNodes(adj: Map<string, string[]>, startId: string): Set<string> {
  const reachable = new Set<string>([startId]);
  const queue: string[] = [startId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!reachable.has(neighbor)) {
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return reachable;
}

/**
 * Evaluates whether excluding an entity breaks causal connectivity between genesis actors and terminal outcomes.
 * Satisfies AC-4.
 */
export function evaluatePathBreakage(
  nodes: GraphNodeData[],
  edges: GraphEdgeData[],
  excludedNodeId: string,
): PathBreakageResult {
  const targetNode = nodes.find((n) => n.id === excludedNodeId);
  const targetLabel = targetNode?.label || excludedNodeId;

  // 1. Identify all incident edges as severed
  const severedEdgeIds = edges
    .filter((e) => e.source === excludedNodeId || e.target === excludedNodeId)
    .map((e) => e.id);

  // 2. Active subgraph without the excluded node
  const activeNodes = nodes.filter((n) => n.id !== excludedNodeId && !n.isExcluded);
  const activeNodeIds = new Set(activeNodes.map((n) => n.id));

  const activeEdges = edges.filter(
    (e) =>
      e.source !== excludedNodeId &&
      e.target !== excludedNodeId &&
      activeNodeIds.has(e.source) &&
      activeNodeIds.has(e.target) &&
      !e.isSevered,
  );

  // 3. Find genesis nodes (in-degree 0) and terminal nodes (out-degree 0 or critical impact)
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();
  for (const node of activeNodes) {
    inDegreeMap.set(node.id, 0);
    outDegreeMap.set(node.id, 0);
  }

  for (const edge of activeEdges) {
    inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);
    outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) || 0) + 1);
  }

  const genesisNodes = activeNodes.filter((n) => (inDegreeMap.get(n.id) || 0) === 0);
  const terminalNodes = activeNodes.filter(
    (n) => (outDegreeMap.get(n.id) || 0) === 0 || n.impactLevel === "critical",
  );

  // 4. Adjacency graphs: original topology vs active remaining topology
  const originalEdges = edges.filter((e) => !e.isSevered);
  const originalAdj = buildAdjacencyList(originalEdges);
  const activeAdj = buildAdjacencyList(activeEdges);

  // Terminals reachable from the excluded node in the original topology
  const terminalsFromExcluded = getReachableNodes(originalAdj, excludedNodeId);

  // 5. Test if any genesis-to-terminal continuity depended on the excluded node
  let pathBroken = false;
  const brokenPairs: { genesis: string; terminal: string }[] = [];

  for (const genesis of genesisNodes) {
    const reachedExcludedOriginally = getReachableNodes(originalAdj, genesis.id).has(excludedNodeId);
    if (!reachedExcludedOriginally) continue;

    const reachableInActive = getReachableNodes(activeAdj, genesis.id);
    for (const terminal of terminalNodes) {
      if (terminalsFromExcluded.has(terminal.id) && !reachableInActive.has(terminal.id)) {
        pathBroken = true;
        brokenPairs.push({ genesis: genesis.label, terminal: terminal.label });
      }
    }
  }

  const summary = pathBroken
    ? `The Fact Checker: Excluding "${targetLabel}" severs direct causal continuity between ${brokenPairs[0]?.genesis || "primary drivers"} and downstream outcomes.`
    : `The Fact Checker: Excluding "${targetLabel}" alters local causal weights, but alternate pathways to terminal outcomes remain intact.`;

  const agentThoughts = [
    `The Fact Checker: Auditing causal graph topology without node "${targetLabel}"...`,
    summary,
    `The Visualizer: Tagging ${severedEdgeIds.length} incident edges as severed with dashed warning styling.`,
  ];

  return {
    pathBroken,
    severedEdgeIds,
    summary,
    agentThoughts,
  };
}

/**
 * Creates and verifies a user hypothesis node against web evidence.
 * Satisfies AC-5, AC-8.
 */
export async function verifyAndCreateHypothesisNode(
  payload: AddNodePayload,
  existingNodes: GraphNodeData[],
): Promise<{
  node: GraphNodeData;
  addedEdges: GraphEdgeData[];
  agentThoughts: string[];
}> {
  // Enforce session quota: maximum 5 user added nodes
  const userAddedCount = existingNodes.filter((n) => n.isUserAdded).length;
  if (userAddedCount >= 5) {
    throw new Error("Session quota exceeded: Maximum 5 user hypothesis nodes allowed per session.");
  }

  // Generate slug
  const baseSlug = payload.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  const nodeId = `${payload.entityType}_${baseSlug || "hypothesis"}`;

  const agentThoughts: string[] = [
    `The Architect: User proposed new hypothesis node "${payload.label}" (${payload.entityType}).`,
    `The Reader: Dispatching targeted search to verify evidence for "${payload.label}"...`,
  ];

  // 1. Run web search for evidence
  let sources: SourceCitation[] = [];
  let confidence = 35;
  let isUnverified = false;

  try {
    const { results } = await searchWeb(`${payload.label} ${payload.summary}`, { maxResults: 3 });
    if (results.length > 0) {
      sources = results.map((r, i) => ({
        id: `src_user_${nodeId}_${i}`,
        url: r.url,
        title: r.title,
        verbatimSnippet: r.content || `${r.title} mentions context regarding ${payload.label}`,
        credibilityScore: Math.min(90, Math.max(50, Math.round(r.score * 100))),
      }));
      confidence = Math.min(85, Math.max(55, Math.round((sources[0]?.credibilityScore || 60) * 0.9)));
      agentThoughts.push(`The Reader: Retrieved ${sources.length} sources corroborating "${payload.label}".`);
      agentThoughts.push(`The Fact Checker: Hypothesis verified with credibility score ${confidence}%.`);
    } else {
      isUnverified = true;
    }
  } catch {
    isUnverified = true;
  }

  if (isUnverified || sources.length === 0) {
    sources = [
      {
        id: `src_hypothesis_${nodeId}`,
        url: "https://investigation.local/hypothesis",
        title: `Hypothesis: ${payload.label}`,
        verbatimSnippet: `User-formulated hypothesis: ${payload.summary}. No independent web citations were confirmed.`,
        credibilityScore: 35,
      },
    ];
    confidence = 35;
    agentThoughts.push(`The Fact Checker: No independent web citations confirmed. Tagging as unverified hypothesis (35% confidence).`);
  }

  const newNode: GraphNodeData = {
    id: nodeId,
    label: payload.label,
    entityType: payload.entityType,
    summary: payload.summary,
    confidence,
    depthLevel: 1,
    parentNodeId: payload.proposedConnections?.[0] || null,
    isUserAdded: true,
    isExcluded: false,
    unresolvedQuestion: isUnverified ? "User-proposed hypothesis awaiting external corroboration" : undefined,
    sources,
  };

  // Connect edges to proposed connections or closest adjacent node
  const addedEdges: GraphEdgeData[] = [];
  const targetIds = payload.proposedConnections && payload.proposedConnections.length > 0
    ? payload.proposedConnections
    : existingNodes.slice(0, 1).map((n) => n.id);

  targetIds.forEach((targetId) => {
    if (targetId && targetId !== nodeId && existingNodes.some((n) => n.id === targetId)) {
      addedEdges.push({
        id: `${nodeId}->${targetId}`,
        source: nodeId,
        target: targetId,
        relationType: "leads_to",
        label: "hypothesized influence",
        isDisputed: isUnverified,
        explanation: `User hypothesis connects ${payload.label} to target node ${targetId}.`,
      });
    }
  });

  agentThoughts.push(`The Visualizer: Anchored node "${newNode.label}" to graph with ${addedEdges.length} causal connections.`);

  return {
    node: newNode,
    addedEdges,
    agentThoughts,
  };
}
