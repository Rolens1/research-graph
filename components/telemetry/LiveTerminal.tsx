"use client";

// 1. External imports
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, Terminal, Activity } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { TelemetryLog, AgentName } from "@/types/telemetry";
import { TerminalHeader } from "./TerminalHeader";
import { AgentAvatarBubble } from "./AgentAvatarBubble";
import { ScrollToBottomButton } from "./ScrollToBottomButton";
import { TerminalEmptyState } from "./TerminalEmptyState";
import { StepThroughControls } from "./StepThroughControls";
import { useOptionalInvestigationPlayback } from "./InvestigationPlaybackContext";

// 3. Type definitions
type Props = {
  logs: TelemetryLog[];
  activeAgent?: AgentName | null;
  isLive?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  speedMode?: "turbo" | "step";
  onSpeedModeChange?: (mode: "turbo" | "step") => void;
  pendingCount?: number;
  onNextStep?: () => void;
  onFlushToTurbo?: () => void;
  className?: string;
};

// 4. Component
export function LiveTerminal({
  logs,
  isLive = true,
  isOpen,
  onToggle,
  speedMode: propSpeedMode,
  onSpeedModeChange: propOnSpeedModeChange,
  pendingCount: propPendingCount,
  onNextStep: propOnNextStep,
  onFlushToTurbo: propOnFlushToTurbo,
  className,
}: Props) {
  const playback = useOptionalInvestigationPlayback();
  const speedMode = propOnSpeedModeChange
    ? (propSpeedMode ?? "turbo")
    : (playback?.mode ?? propSpeedMode ?? "turbo");
  const onSpeedModeChange = propOnSpeedModeChange || playback?.setMode;
  const pendingCount = propPendingCount ?? playback?.pendingCount ?? 0;
  const handleNextStep = propOnNextStep || playback?.stepForward || (() => {});
  const handleFlushToTurbo = propOnFlushToTurbo || playback?.flushQueue || (() => {});

  const [activeFilter, setActiveFilter] = useState<AgentName | null>(null);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLogsLengthRef = useRef(logs.length);

  // Compute agent message counts for filter chips
  const agentCounts = useMemo(() => {
    const counts: Record<AgentName, number> = {
      "The Architect": 0,
      "The Reader": 0,
      "The Fact Checker": 0,
      "The Visualizer": 0,
    };
    for (const log of logs) {
      if (counts[log.agentName] !== undefined) counts[log.agentName] += 1;
    }
    return counts;
  }, [logs]);

  // Filter logs by selected agent
  const filteredLogs = useMemo(() => {
    return activeFilter ? logs.filter((log) => log.agentName === activeFilter) : logs;
  }, [logs, activeFilter]);

  const latestLogId = logs[logs.length - 1]?.id;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 36;
    if (isNearBottom) {
      setIsAutoScrollPaused(false);
      setUnreadCount(0);
    } else {
      setIsAutoScrollPaused(true);
    }
  }, []);

  const handleScrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setIsAutoScrollPaused(false);
    setUnreadCount(0);
  }, []);

  // Auto scroll effect on incoming events
  useEffect(() => {
    const diff = logs.length - prevLogsLengthRef.current;
    prevLogsLengthRef.current = logs.length;
    if (diff <= 0) return;

    if (isAutoScrollPaused) {
      setUnreadCount((prev) => prev + diff);
    } else if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [logs, isAutoScrollPaused]);

  // Collapsed rail view
  if (!isOpen) {
    return (
      <aside
        className={cn(
          "w-10 shrink-0 h-full border-l border-border/80 bg-card/60 backdrop-blur-md flex flex-col items-center justify-between py-4 select-none transition-all duration-200",
          className,
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Expand Live Terminal"
          aria-label="Expand live terminal"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4">
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
          )}

          <span className="[writing-mode:vertical-rl] text-[11px] font-mono tracking-widest text-muted-foreground uppercase rotate-180">
            Live Telemetry
          </span>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Expand Live Terminal"
          aria-label="Expand live terminal"
        >
          <Terminal className="h-4 w-4 text-accent" />
        </button>
      </aside>
    );
  }

  // Expanded panel view
  return (
    <aside
      className={cn(
        "w-full sm:w-[380px] shrink-0 h-full border-l border-border/80 bg-card/75 backdrop-blur-md flex flex-col justify-between shadow-xs select-none transition-all duration-200 overflow-hidden relative",
        className,
      )}
    >
      <TerminalHeader
        isLive={isLive}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        agentCounts={agentCounts}
        totalCount={logs.length}
        speedMode={speedMode}
        onSpeedModeChange={onSpeedModeChange}
        onToggle={onToggle}
      />

      {/* Scrollable Dialogue List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3.5 space-y-2.5 font-mono text-xs relative"
      >
        {filteredLogs.length === 0 ? (
          <TerminalEmptyState isLive={isLive} />
        ) : (
          filteredLogs.map((log) => (
            <AgentAvatarBubble
              key={log.id}
              log={log}
              isLatest={log.id === latestLogId}
            />
          ))
        )}
      </div>

      {/* Floating Scroll Resume Pill */}
      {isAutoScrollPaused && (
        <ScrollToBottomButton
          unreadCount={unreadCount}
          onClick={handleScrollToBottom}
        />
      )}

      {/* Step by Step Manual Advance Bar (Feature 21) */}
      {speedMode === "step" && (
        <StepThroughControls
          pendingCount={pendingCount}
          onNextStep={handleNextStep}
          onFlushToTurbo={() => {
            handleFlushToTurbo();
            onSpeedModeChange?.("turbo");
          }}
        />
      )}

      {/* Footer Status Bar */}
      <footer className="h-9 px-3.5 border-t border-border/80 bg-muted/20 flex items-center justify-between text-[10px] font-mono text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-accent" />
          <span>
            {logs.length} {logs.length === 1 ? "event" : "events"} streamed
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="capitalize">Mode: {speedMode}</span>
          {speedMode === "step" && pendingCount > 0 && (
            <span className="text-accent font-semibold">({pendingCount} queued)</span>
          )}
        </div>
      </footer>
    </aside>
  );
}
