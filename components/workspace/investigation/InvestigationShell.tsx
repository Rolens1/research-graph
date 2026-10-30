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
import type { InvestigationStreamStatus } from "@/lib/investigation-stream-helpers";

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

  // Active selections & bidirectional focus targets (Feature 24 / AC-1 to AC-5)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isInspectorDrawerOpen, setIsInspectorDrawerOpen] = useState(false);
  const [focusNodeTarget, setFocusNodeTarget] = useState<{ nodeId: string; timestamp: number } | null>(null);
  const [focusEventTarget, setFocusEventTarget] = useState<{ eventId: string; timestamp: number } | null>(null);

  const headerStatus = resolveHeaderStatus(stream.status, isMock ? MOCK_INVESTIGATION.status : "running");

  // Selected node entity lookup
  const selectedNode = React.useMemo(
    () => stream.nodes.find((n) => n.id === selectedNodeId) || null,
    [stream.nodes, selectedNodeId],
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
    if (matchingEvent) {
      setSelectedEventId(matchingEvent.id);
      setFocusEventTarget({ eventId: matchingEvent.id, timestamp: Date.now() });
    } else {
      setSelectedEventId(null);
    }
  }, [stream.timelineEvents]);

  return (
    <InvestigationPlaybackProvider>
      <div
        className={cn(
          "h-full w-full flex flex-col overflow-hidden bg-background relative",
          className,
        )}
      >
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
          {/* Zone 1: The Causal Canvas */}
          <KnowledgeCanvas
            nodes={stream.nodes}
            edges={stream.edges}
            isStreamCompleted={stream.status === "completed"}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            focusNodeTarget={focusNodeTarget}
            onSelectNode={handleSelectNode}
            onOpenDrawer={() => setIsInspectorDrawerOpen(true)}
          />

          {/* Stale Connection & Retry Indicator (AC-7) */}
          {stream.isStale && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-full bg-card/95 border border-amber-500/40 shadow-xl backdrop-blur-md">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-muted-foreground">
                Stream disconnected. Showing {stream.nodes.length} cached nodes.
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

          {/* Zone 2: Live Agent Terminal */}
          <LiveTerminal
            logs={stream.telemetryLogs}
            isOpen={isTerminalOpen}
            onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
          />

          {/* Feature 25: Node Inspector Drawer (Right Slide-Out) */}
          <NodeInspectorDrawer
            node={selectedNode}
            nodes={stream.nodes}
            edges={stream.edges}
            isOpen={isInspectorDrawerOpen}
            onClose={() => {
              setIsInspectorDrawerOpen(false);
              setSelectedNodeId(null);
              setSelectedEventId(null);
            }}
            onSelectNode={handleSelectNode}
            onExploreRabbitHole={(n) => {
              console.log("[RabbitHole] Requested inquiry for node:", n.id);
            }}
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
