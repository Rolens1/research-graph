"use client";

// 1. External imports
import React, { useState, useCallback } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import { MOCK_INVESTIGATION } from "@/lib/mock-investigation";
import { InvestigationHeader } from "./InvestigationHeader";
import { KnowledgeCanvas } from "@/components/canvas/KnowledgeCanvas";
import { LiveTerminal } from "@/components/telemetry/LiveTerminal";
import { ChronoTimeline } from "@/components/timeline/ChronoTimeline";
import { NodeInspectorDrawer } from "@/components/inspector/NodeInspectorDrawer";
import { InvestigationPlaybackProvider } from "@/components/telemetry/InvestigationPlaybackContext";
import { useInvestigationStream } from "@/hooks/useInvestigationStream";
import { useHypothesisMutation } from "@/hooks/useHypothesisMutation";
import type { InvestigationStreamStatus } from "@/lib/investigation-stream-helpers";
import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import type { ExpandResponse } from "@/types/expansion";

// 3. Type definitions
type Props = {
  sessionId: string;
  query?: string;
  depth?: "recon" | "expedition";
  className?: string;
};

// 4. Pure helper functions
function resolveHeaderStatus(
  streamStatus: InvestigationStreamStatus,
  fallback: "running" | "completed" | "failed",
): "running" | "completed" | "failed" {
  if (streamStatus === "streaming" || streamStatus === "connecting") return "running";
  if (streamStatus === "completed") return "completed";
  if (streamStatus === "error") return "failed";
  return fallback;
}

// 5. Component
export function InvestigationShell({
  sessionId,
  query,
  depth = "recon",
  className,
}: Props) {
  // Panel collapse toggles
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);

  // Live investigation stream connection (AC-1, AC-6, AC-7)
  const isMock = sessionId === "mock";
  const displayQuery = query || (isMock ? MOCK_INVESTIGATION.query : "Autonomous Investigation");

  const stream = useInvestigationStream({
    researchId: sessionId,
    query: query || (isMock ? MOCK_INVESTIGATION.query : undefined),
    depth,
    initialNodes: isMock ? MOCK_INVESTIGATION.nodes : [],
    initialEdges: isMock ? MOCK_INVESTIGATION.edges : [],
    initialLogs: isMock ? MOCK_INVESTIGATION.telemetry : [],
    initialTimeline: isMock ? MOCK_INVESTIGATION.timeline : [],
    initialConfidence: isMock ? MOCK_INVESTIGATION.confidenceScore : 0,
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isInspectorDrawerOpen, setIsInspectorDrawerOpen] = useState(false);
  const [focusNodeTarget, setFocusNodeTarget] = useState<{ nodeId: string; timestamp: number } | null>(null);
  const [focusEventTarget, setFocusEventTarget] = useState<{ eventId: string; timestamp: number } | null>(null);
  const headerStatus = resolveHeaderStatus(stream.status, isMock ? MOCK_INVESTIGATION.status : "running");
  const [expandedNodes, setExpandedNodes] = useState<GraphNodeData[]>([]);
  const [expandedEdges, setExpandedEdges] = useState<GraphEdgeData[]>([]);
  const [isExpandingRabbitHole, setIsExpandingRabbitHole] = useState(false);

  // User Hypothesis Mutation & Expansion Layer (Feature 28 & 29)
  const allBaseNodes = React.useMemo(() => [...stream.nodes, ...expandedNodes], [stream.nodes, expandedNodes]);
  const allBaseEdges = React.useMemo(() => [...stream.edges, ...expandedEdges], [stream.edges, expandedEdges]);

  const mutation = useHypothesisMutation({
    sessionId,
    baseNodes: allBaseNodes,
    baseEdges: allBaseEdges,
  });

  const selectedNode = React.useMemo(
    () => mutation.displayNodes.find((n) => n.id === selectedNodeId) || null,
    [mutation.displayNodes, selectedNodeId],
  );

  // Rabbit Hole Recursive Expansion (Feature 28)
  const handleExploreRabbitHole = useCallback(
    async (targetNode: GraphNodeData, customFocusAngle?: string) => {
      setIsExpandingRabbitHole(true);
      try {
        const res = await fetch(`/api/research/${sessionId}/expand`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId: targetNode.id,
            customFocusAngle,
            existingNodes: mutation.displayNodes,
            existingEdges: mutation.displayEdges,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to expand rabbit hole");
        }
        const data: ExpandResponse = await res.json();
        if (data.childNodes && data.childNodes.length > 0) {
          setExpandedNodes((prev) => [...prev, ...data.childNodes]);
          setFocusNodeTarget({ nodeId: data.childNodes[0].id, timestamp: Date.now() });
        }
        if (data.addedEdges && data.addedEdges.length > 0) {
          setExpandedEdges((prev) => [...prev, ...data.addedEdges]);
        }
      } finally {
        setIsExpandingRabbitHole(false);
      }
    },
    [sessionId, mutation.displayNodes, mutation.displayEdges],
  );

  // Timeline Milestone Click -> Canvas Centering & Node Selection (AC-1, AC-5)
  const handleSelectEvent = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    const event = stream.timelineEvents.find((e) => e.id === eventId);
    if (event?.nodeId) {
      setSelectedNodeId(event.nodeId);
      setIsInspectorDrawerOpen(true);
      setFocusNodeTarget({ nodeId: event.nodeId, timestamp: Date.now() });
    }
  }, [stream.timelineEvents]);

  // Canvas Node Click -> Timeline Auto Scroll & Milestone Selection (AC-3, AC-5)
  const handleSelectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (!nodeId) {
      setSelectedEventId(null);
      setIsInspectorDrawerOpen(false);
      return;
    }
    setIsInspectorDrawerOpen(true);
    setFocusNodeTarget({ nodeId, timestamp: Date.now() });
    const matchingEvent = stream.timelineEvents.find((e) => e.nodeId === nodeId);
    setSelectedEventId(matchingEvent ? matchingEvent.id : null);
    if (matchingEvent) {
      setFocusEventTarget({ eventId: matchingEvent.id, timestamp: Date.now() });
    }
  }, [stream.timelineEvents]);

  return (
    <InvestigationPlaybackProvider>
      <div className={cn("h-full w-full flex flex-col overflow-hidden bg-background relative", className)}>
        {/* 1. Top Investigation Header Bar */}
        <InvestigationHeader
          sessionId={sessionId}
          query={displayQuery}
          depth={depth}
          confidenceScore={stream.confidenceScore}
          status={headerStatus}
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
          isTimelineOpen={isTimelineOpen}
          onToggleTimeline={() => setIsTimelineOpen(!isTimelineOpen)}
        />

        {/* 2. Main Middle Split: Zone 1 Canvas (Fluid) + Zone 2 Terminal (380px or 40px) */}
        <div className="flex-1 flex overflow-hidden w-full relative">
          <KnowledgeCanvas
            nodes={mutation.displayNodes}
            edges={mutation.displayEdges}
            isStreamCompleted={stream.status === "completed"}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            focusNodeTarget={focusNodeTarget}
            onSelectNode={handleSelectNode}
            onOpenDrawer={() => setIsInspectorDrawerOpen(true)}
            onExcludeNode={mutation.handleExcludeNode}
            onRestoreNode={mutation.handleRestoreNode}
            onAddHypothesis={mutation.handleAddHypothesis}
            onExploreRabbitHole={(n) => {
              setSelectedNodeId(n.id);
              setIsInspectorDrawerOpen(true);
            }}
          />

          {stream.isStale && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-full bg-card/95 border border-warning/40 shadow-xl backdrop-blur-md">
              <WifiOff className="w-4 h-4 text-warning" />
              <span className="text-xs font-mono text-muted-foreground">
                Stream disconnected. Showing {mutation.displayNodes.length} cached nodes.
              </span>
              <button
                type="button"
                onClick={stream.reconnect}
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1.5 cursor-pointer font-medium ml-1"
              >
                <RefreshCw className="w-3 h-3" />
                Resume Stream
              </button>
            </div>
          )}

          <LiveTerminal
            logs={stream.telemetryLogs}
            isOpen={isTerminalOpen}
            onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
          />

          <NodeInspectorDrawer
            node={selectedNode}
            nodes={mutation.displayNodes}
            edges={mutation.displayEdges}
            isOpen={isInspectorDrawerOpen}
            onClose={() => {
              setIsInspectorDrawerOpen(false);
              setSelectedNodeId(null);
              setSelectedEventId(null);
            }}
            onSelectNode={handleSelectNode}
            onExcludeNode={(n) => mutation.handleExcludeNode(n.id)}
            onRestoreNode={(n) => mutation.handleRestoreNode(n.id)}
            onExploreRabbitHole={handleExploreRabbitHole}
            isExpandingRabbitHole={isExpandingRabbitHole}
          />
        </div>

        {/* 3. Bottom Strip: Zone 3 Chrono Timeline (112px or 36px) */}
        <ChronoTimeline
          events={stream.timelineEvents}
          nodes={stream.nodes}
          isOpen={isTimelineOpen}
          onToggle={() => setIsTimelineOpen(!isTimelineOpen)}
          selectedEventId={selectedEventId}
          selectedNodeId={selectedNodeId}
          focusEventTarget={focusEventTarget}
          onSelectEvent={handleSelectEvent}
          onHoverNode={setHoveredNodeId}
          isLoading={stream.isStreaming || stream.status === "connecting"}
        />
      </div>
    </InvestigationPlaybackProvider>
  );
}
