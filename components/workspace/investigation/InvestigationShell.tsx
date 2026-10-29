"use client";

// 1. External imports
import React, { useState } from "react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import { MOCK_INVESTIGATION } from "@/lib/mock-investigation";
import { InvestigationHeader } from "./InvestigationHeader";
import { KnowledgeCanvas } from "@/components/canvas/KnowledgeCanvas";
import { LiveTerminal } from "@/components/telemetry/LiveTerminal";
import { ChronoTimelinePlaceholder } from "./ChronoTimelinePlaceholder";
import { InvestigationPlaybackProvider } from "@/components/telemetry/InvestigationPlaybackContext";

// 3. Type definitions
type Props = {
  sessionId: string;
  query?: string;
  depth?: "recon" | "expedition";
  className?: string;
};

// 4. Component
export function InvestigationShell({
  sessionId,
  query,
  depth = "recon",
  className,
}: Props) {
  // Panel collapse toggles
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);

  // Active selections
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    MOCK_INVESTIGATION.nodes[0]?.id || null,
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const displayQuery = query || MOCK_INVESTIGATION.query;
  const confidenceScore = MOCK_INVESTIGATION.confidenceScore;
  const status = MOCK_INVESTIGATION.status;

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const event = MOCK_INVESTIGATION.timeline.find((e) => e.id === eventId);
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
          confidenceScore={confidenceScore}
          status={status}
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
          isTimelineOpen={isTimelineOpen}
          onToggleTimeline={() => setIsTimelineOpen(!isTimelineOpen)}
        />

        {/* 2. Main Middle Split: Zone 1 Canvas (Fluid) + Zone 2 Terminal (380px or 40px) */}
        <div className="flex-1 flex overflow-hidden w-full relative">
          {/* Zone 1: The Causal Canvas */}
          <KnowledgeCanvas
            nodes={MOCK_INVESTIGATION.nodes}
            edges={MOCK_INVESTIGATION.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />

          {/* Zone 2: Live Agent Terminal */}
          <LiveTerminal
            logs={MOCK_INVESTIGATION.telemetry}
            isOpen={isTerminalOpen}
            onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
          />
        </div>

        {/* 3. Bottom Strip: Zone 3 Chrono Timeline (112px or 36px) */}
        <ChronoTimelinePlaceholder
          events={MOCK_INVESTIGATION.timeline}
          isOpen={isTimelineOpen}
          onToggle={() => setIsTimelineOpen(!isTimelineOpen)}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
        />
      </div>
    </InvestigationPlaybackProvider>
  );
}
