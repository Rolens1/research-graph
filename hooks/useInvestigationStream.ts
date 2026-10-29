"use client";

// 1. External imports
import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import type { Node, Edge } from "@xyflow/react";

// 2. Internal imports
import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import type { TelemetryLog } from "@/types/telemetry";
import { sseEventSchema } from "@/types/telemetry";
import { calculateElkLayout } from "@/lib/elk-layout";
import { adaptMockToReactFlow } from "@/lib/graph-adapter";
import type { MockGraphNode, MockGraphEdge, MockTimelineEvent } from "@/lib/mock-investigation";
import {
  type InvestigationStreamStatus,
  type UseInvestigationStreamOptions,
  type UseInvestigationStreamReturn,
  formatStreamTimelineEvent,
  routeStreamEvent,
} from "@/lib/investigation-stream-helpers";

export type {
  InvestigationStreamStatus,
  UseInvestigationStreamOptions,
  UseInvestigationStreamReturn,
};

const LAYOUT_DEBOUNCE_MS = 400;

// 3. Hook implementation
export function useInvestigationStream({
  researchId,
  initialNodes = [],
  initialEdges = [],
  initialLogs = [],
  initialTimeline = [],
  initialConfidence = 0,
  enabled = true,
  onCompleted,
  onError,
}: UseInvestigationStreamOptions): UseInvestigationStreamReturn {
  const [status, setStatus] = useState<InvestigationStreamStatus>(() =>
    enabled && researchId && researchId !== "mock" ? "connecting" : "idle",
  );
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const [nodes, setNodes] = useState<MockGraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<MockGraphEdge[]>(initialEdges);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>(initialLogs);
  const [timelineEvents, setTimelineEvents] = useState<MockTimelineEvent[]>(initialTimeline);
  const [confidenceScore, setConfidenceScore] = useState<number>(initialConfidence);
  const [finalSynthesis, setFinalSynthesis] = useState<string | null>(null);

  const initialFlow = adaptMockToReactFlow(initialNodes, initialEdges, null, "constellation");
  const [flowNodes, setFlowNodes] = useState<Node<GraphNodeData>[]>(initialFlow.initialNodes);
  const [flowEdges, setFlowEdges] = useState<Edge<GraphEdgeData>[]>(initialFlow.initialEdges);
  const [isLayoutCalculating, setIsLayoutCalculating] = useState(false);

  const [, startTransition] = useTransition();

  const eventSourceRef = useRef<EventSource | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompletedRef = useRef(onCompleted);
  const onErrorRef = useRef(onError);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const pendingNodesRef = useRef<MockGraphNode[]>([]);
  const pendingEdgesRef = useRef<MockGraphEdge[]>([]);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onErrorRef.current = onError;
  }, [onCompleted, onError]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Flushes staged nodes and edges, running ELK layout calculation
  const flushPendingLayout = useCallback(async () => {
    const combinedNodes = [...nodesRef.current, ...pendingNodesRef.current];
    const combinedEdges = [...edgesRef.current, ...pendingEdgesRef.current];
    nodesRef.current = combinedNodes;
    edgesRef.current = combinedEdges;
    pendingNodesRef.current = [];
    pendingEdgesRef.current = [];

    setNodes(combinedNodes);
    setEdges(combinedEdges);
    setIsLayoutCalculating(true);

    try {
      const adapted = adaptMockToReactFlow(combinedNodes, combinedEdges, null, "constellation");
      const layoutedNodes = await calculateElkLayout(adapted.initialNodes, adapted.initialEdges);

      startTransition(() => {
        setFlowNodes(layoutedNodes);
        setFlowEdges(adapted.initialEdges);
        setIsLayoutCalculating(false);
      });
    } catch (err) {
      console.error("ELK layout calculation failed during stream:", err);
      setIsLayoutCalculating(false);
    }
  }, []);

  const scheduleDebouncedLayout = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setIsLayoutCalculating(true);
    debounceTimerRef.current = setTimeout(() => {
      flushPendingLayout();
    }, LAYOUT_DEBOUNCE_MS);
  }, [flushPendingLayout]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setStatus("idle");
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setStatus("connecting");
    setIsStale(false);
    setError(null);
    setReconnectTrigger((prev) => prev + 1);
  }, [disconnect]);

  // SSE subscription effect (AC-1, AC-2, AC-7)
  useEffect(() => {
    if (!enabled || !researchId || researchId === "mock") return;

    const streamUrl = `/api/research/${encodeURIComponent(researchId)}/stream`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.onopen = () => setStatus("streaming");

    es.onmessage = (event) => {
      if (!event.data) return;
      try {
        const rawJson = JSON.parse(event.data);
        const parsed = sseEventSchema.safeParse(rawJson);
        if (!parsed.success) return;

        routeStreamEvent(parsed.data, {
          onLog: (log) =>
            setTelemetryLogs((prev) => (prev.some((l) => l.id === log.id) ? prev : [...prev, log])),
          onNode: (node) => {
            const exists =
              nodesRef.current.some((n) => n.id === node.id) ||
              pendingNodesRef.current.some((n) => n.id === node.id);
            if (!exists) {
              pendingNodesRef.current.push(node);
              scheduleDebouncedLayout();
            }
          },
          onEdge: (edge) => {
            const exists =
              edgesRef.current.some((e) => e.id === edge.id) ||
              pendingEdgesRef.current.some((e) => e.id === edge.id);
            if (!exists) {
              pendingEdgesRef.current.push(edge);
              scheduleDebouncedLayout();
            }
          },
          onTimeline: (evt) =>
            setTimelineEvents((prev) => {
              const formatted = formatStreamTimelineEvent(evt, prev.length);
              return prev.some((e) => e.id === formatted.id) ? prev : [...prev, formatted];
            }),
          onConfidence: (score) => setConfidenceScore(score),
          onCompleted: (synthesis) => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            flushPendingLayout();
            setStatus("completed");
            setFinalSynthesis(synthesis);
            onCompletedRef.current?.(synthesis);
            es.close();
          },
          onError: (msg, recoverable) => {
            if (!recoverable) {
              const err = new Error(msg);
              setStatus("error");
              setIsStale(true);
              setError(err);
              onErrorRef.current?.(err);
              es.close();
            }
          },
        });
      } catch (err) {
        console.warn("Failed to parse SSE event packet:", err);
      }
    };

    es.onerror = () => {
      const streamErr = new Error("Realtime stream disconnected");
      setStatus("error");
      setIsStale(true);
      setError(streamErr);
      onErrorRef.current?.(streamErr);
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [enabled, researchId, reconnectTrigger, scheduleDebouncedLayout, flushPendingLayout]);

  return {
    status,
    isConnected: status === "streaming" || status === "completed",
    isStreaming: status === "streaming",
    isStale,
    error,
    nodes,
    edges,
    flowNodes,
    flowEdges,
    isLayoutCalculating,
    telemetryLogs,
    timelineEvents,
    confidenceScore,
    finalSynthesis,
    reconnect,
    disconnect,
  };
}
