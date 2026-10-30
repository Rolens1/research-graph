import type { Node, Edge } from "@xyflow/react";
import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import type { TelemetryLog, SseEvent } from "@/types/telemetry";
import type { TimelineEvent } from "@/types/timeline";
import type { MockGraphNode, MockGraphEdge, MockTimelineEvent } from "@/lib/mock-investigation";

export type InvestigationStreamStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "completed"
  | "error";

export interface UseInvestigationStreamOptions {
  researchId: string;
  query?: string;
  depth?: "recon" | "expedition";
  initialNodes?: MockGraphNode[];
  initialEdges?: MockGraphEdge[];
  initialLogs?: TelemetryLog[];
  initialTimeline?: MockTimelineEvent[];
  initialConfidence?: number;
  enabled?: boolean;
  onCompleted?: (synthesis: string) => void;
  onError?: (error: Error) => void;
}

export interface UseInvestigationStreamReturn {
  status: InvestigationStreamStatus;
  isConnected: boolean;
  isStreaming: boolean;
  isStale: boolean;
  error: Error | null;

  nodes: MockGraphNode[];
  edges: MockGraphEdge[];
  flowNodes: Node<GraphNodeData>[];
  flowEdges: Edge<GraphEdgeData>[];
  isLayoutCalculating: boolean;

  telemetryLogs: TelemetryLog[];
  timelineEvents: MockTimelineEvent[];
  confidenceScore: number;
  finalSynthesis: string | null;

  reconnect: () => void;
  disconnect: () => void;
}

export interface StreamRouterCallbacks {
  onLog: (log: TelemetryLog) => void;
  onNode: (node: MockGraphNode) => void;
  onEdge: (edge: MockGraphEdge) => void;
  onTimeline: (event: TimelineEvent) => void;
  onConfidence: (score: number) => void;
  onCompleted: (synthesis: string) => void;
  onError: (message: string, recoverable: boolean) => void;
}

/**
 * Transforms an incoming SSE GraphNodeData packet into a normalized MockGraphNode.
 * Provides fallback defaults for optional properties to ensure structural integrity.
 */
export function formatStreamNode(rawNode: GraphNodeData): MockGraphNode {
  return {
    id: rawNode.id,
    label: rawNode.label,
    entityType: rawNode.entityType,
    summary: rawNode.summary,
    confidence: rawNode.confidence,
    depthLevel: rawNode.depthLevel,
    parentNodeId: rawNode.parentNodeId,
    isUserAdded: rawNode.isUserAdded,
    isDisputed: rawNode.isDisputed,
    impactLevel: rawNode.impactLevel,
    timestamp: rawNode.timestamp,
    backdropUrl: rawNode.backdropUrl,
    pathwayRole: rawNode.pathwayRole,
    ambiguities: rawNode.ambiguities,
    unresolvedQuestion: rawNode.unresolvedQuestion,
    sources: (rawNode.sources || []).map((s, idx) => ({
      id: s.id || `src_${rawNode.id}_${idx}`,
      url: s.url,
      title: s.title,
      publishedDate: s.publishedDate,
      verbatimSnippet: s.verbatimSnippet,
      credibilityScore: s.credibilityScore ?? 80,
    })),
  };
}

/**
 * Transforms an incoming SSE GraphEdgeData packet into a normalized MockGraphEdge.
 */
export function formatStreamEdge(rawEdge: GraphEdgeData): MockGraphEdge {
  return {
    id: rawEdge.id,
    source: rawEdge.source,
    target: rawEdge.target,
    relationType: rawEdge.relationType,
    label: rawEdge.label,
    isDisputed: rawEdge.isDisputed,
    explanation: rawEdge.explanation,
  };
}

/**
 * Transforms an incoming SSE TimelineEvent packet into a normalized MockTimelineEvent.
 */
export function formatStreamTimelineEvent(
  rawEvent: TimelineEvent,
  fallbackIndex: number,
): MockTimelineEvent {
  return {
    id: rawEvent.id || `evt_${rawEvent.researchId}_${fallbackIndex}`,
    researchId: rawEvent.researchId,
    nodeId: rawEvent.nodeId,
    eventDate: rawEvent.eventDate,
    parsedTimestamp: rawEvent.parsedTimestamp || new Date().toISOString(),
    title: rawEvent.title,
    description: rawEvent.description,
    sourceUrl: rawEvent.sourceUrl,
  };
}

/**
 * Dispatches a parsed SSE event packet to corresponding domain handlers.
 */
export function routeStreamEvent(event: SseEvent, callbacks: StreamRouterCallbacks): void {
  switch (event.type) {
    case "agent_dialogue":
      callbacks.onLog(event.data);
      break;
    case "node_added":
      callbacks.onNode(formatStreamNode(event.data));
      break;
    case "edge_added":
      callbacks.onEdge(formatStreamEdge(event.data));
      break;
    case "timeline_event_added":
      callbacks.onTimeline(event.data);
      break;
    case "confidence_changed":
      callbacks.onConfidence(event.data.confidenceScore);
      break;
    case "completed":
      callbacks.onCompleted(event.data.finalSynthesis);
      break;
    case "error":
      callbacks.onError(event.data.message, event.data.recoverable);
      break;
  }
}
