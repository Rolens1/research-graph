"use client";

// 1. External imports
import React, { useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import { MOCK_INVESTIGATION } from "@/lib/mock-investigation";
import { InvestigationHeader } from "./InvestigationHeader";
import { KnowledgeCanvas } from "@/components/canvas/KnowledgeCanvas";
import { LiveTerminal } from "@/components/telemetry/LiveTerminal";
import { ChronoTimeline } from "@/components/timeline/ChronoTimeline";
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

  // Active selections (derived fallback avoids cascading render effects)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const effectiveSelectedNodeId =
    selectedNodeId || stream.nodes[0]?.id || (isMock ? MOCK_INVESTIGATION.nodes[0]?.id : null) || null;

  const headerStatus = resolveHeaderStatus(stream.status, isMock ? MOCK_INVESTIGATION.status : "running");

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = stream.timelineEvents.find((e) => e.id === eventId);
    if (event?.nodeId) {
      setSelectedNodeId(event.nodeId);
    }
  };

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
            selectedNodeId={effectiveSelectedNodeId}
            onSelectNode={setSelectedNodeId}
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
        </div>

        {/* 3. Bottom Strip: Zone 3 Chrono Timeline (112px or 36px) */}
        <ChronoTimeline
          events={stream.timelineEvents}
          nodes={stream.nodes}
          isOpen={isTimelineOpen}
          onToggle={() => setIsTimelineOpen(!isTimelineOpen)}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
          isLoading={stream.isStreaming || stream.status === "connecting"}
        />
      </div>
    </InvestigationPlaybackProvider>
  );
}
