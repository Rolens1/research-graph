import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import type { TimelineEvent } from "@/types/timeline";
import type { ResearchStreamEvent } from "@/types/engine";

export interface DiscoveredGraphDelta {
  newNodes: GraphNodeData[];
  newEdges: GraphEdgeData[];
  newTimelineEvents: TimelineEvent[];
}

/**
 * Extracts newly discovered nodes, edges, and timeline milestones not present in existing state.
 */
export function extractGraphDelta(
  discoveredNodes: GraphNodeData[],
  discoveredEdges: GraphEdgeData[],
  discoveredTimeline: TimelineEvent[],
  existingNodes: GraphNodeData[],
  existingEdges: GraphEdgeData[],
  existingTimeline: TimelineEvent[],
): DiscoveredGraphDelta {
  const existingNodeIds = new Set(existingNodes.map((n) => n.id));
  const existingEdgeIds = new Set(existingEdges.map((e) => e.id));
  const existingTimelineIds = new Set(existingTimeline.map((t) => t.nodeId));

  const newNodes: GraphNodeData[] = [];
  const newEdges: GraphEdgeData[] = [];
  const newTimelineEvents: TimelineEvent[] = [];

  for (const node of discoveredNodes) {
    if (!existingNodeIds.has(node.id)) {
      newNodes.push(node);
      existingNodeIds.add(node.id);
    }
  }

  for (const edge of discoveredEdges) {
    if (!existingEdgeIds.has(edge.id)) {
      newEdges.push(edge);
      existingEdgeIds.add(edge.id);
    }
  }

  for (const event of discoveredTimeline) {
    if (!existingTimelineIds.has(event.nodeId)) {
      newTimelineEvents.push(event);
      existingTimelineIds.add(event.nodeId);
    }
  }

  return { newNodes, newEdges, newTimelineEvents };
}

/**
 * Helper to construct agent thought events.
 */
export function createAgentThought(
  from: "Architect" | "Reader" | "Checker" | "Visualizer",
  text: string,
): ResearchStreamEvent {
  return {
    type: "agent_thought",
    from,
    text,
    timestamp: new Date().toISOString(),
  };
}
