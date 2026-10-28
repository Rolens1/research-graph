"use client";

// 1. External imports
import React, { useState } from "react";
import {
  Terminal,
  ChevronRight,
  ChevronLeft,
  Bot,
  Zap,
  Play,
  Activity,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { MockTelemetryLog, AgentName } from "@/lib/mock-investigation";

// 3. Type definitions
type Props = {
  logs: MockTelemetryLog[];
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
};

const agentColorMap: Record<AgentName, { text: string; bg: string; border: string }> = {
  "The Architect": {
    text: "text-entity-actor",
    bg: "bg-entity-actor-bg",
    border: "border-entity-actor",
  },
  "The Reader": {
    text: "text-entity-event",
    bg: "bg-entity-event-bg",
    border: "border-entity-event",
  },
  "The Fact Checker": {
    text: "text-entity-technology",
    bg: "bg-entity-technology-bg",
    border: "border-entity-technology",
  },
  "The Visualizer": {
    text: "text-accent",
    bg: "bg-accent/15",
    border: "border-accent/40",
  },
};

// 4. Component
export function LiveTerminalPlaceholder({
  logs,
  isOpen,
  onToggle,
  className,
}: Props) {
  const [speedMode, setSpeedMode] = useState<"turbo" | "step">("turbo");

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
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>

          <span className="[writing-mode:vertical-rl] text-[11px] font-mono tracking-widest text-muted-foreground uppercase rotate-180">
            Live Telemetry
          </span>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Expand Live Terminal"
        >
          <Terminal className="h-4 w-4 text-accent" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "w-full sm:w-[380px] shrink-0 h-full border-l border-border/80 bg-card/75 backdrop-blur-md flex flex-col justify-between shadow-xs select-none transition-all duration-200 overflow-hidden",
        className,
      )}
    >
      {/* Terminal Top Header */}
      <div className="h-12 px-4 border-b border-border/80 flex items-center justify-between gap-2 shrink-0 bg-muted/30">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-accent" />
          <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
            Live Agent Room
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Speed Toggle */}
          <div
            role="group"
            aria-label="Streaming Pace Mode"
            className="flex items-center p-0.5 rounded-lg bg-muted/80 border border-border text-[10px] font-mono"
          >
            <button
              type="button"
              onClick={() => setSpeedMode("turbo")}
              aria-pressed={speedMode === "turbo"}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all cursor-pointer",
                speedMode === "turbo"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Zap className="h-3 w-3 text-entity-decision" />
              <span>Turbo</span>
            </button>
            <button
              type="button"
              onClick={() => setSpeedMode("step")}
              aria-pressed={speedMode === "step"}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all cursor-pointer",
                speedMode === "step"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Play className="h-2.5 w-2.5" />
              <span>Step</span>
            </button>
          </div>

          {/* Collapse Chevron Button */}
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Collapse Terminal"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Dialogue Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs">
        {logs.map((log) => {
          const colors = agentColorMap[log.agentName];

          return (
            <div
              key={log.id}
              className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-2 hover:border-accent/40 transition-colors shadow-xs"
            >
              {/* Agent Persona Row */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md flex items-center justify-center border",
                      colors.bg,
                      colors.border,
                      colors.text,
                    )}
                  >
                    <Bot className="h-3 w-3" />
                  </div>
                  <span className={cn("font-semibold text-xs", colors.text)}>
                    {log.agentName}
                  </span>
                </div>

                <span className="text-[10px] text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              {/* Message dialogue */}
              <p className="text-foreground/90 text-[11px] leading-relaxed">
                {log.message}
              </p>

              {/* Action pill */}
              <div className="flex items-center justify-between pt-1 text-[9px] text-muted-foreground uppercase tracking-wider">
                <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                  {log.actionType.replace("_", " ")}
                </span>
                <span className="text-muted-foreground/60">Verified</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Footer Bar */}
      <div className="h-10 px-4 border-t border-border/80 bg-muted/20 flex items-center justify-between text-[10px] font-mono text-muted-foreground shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-accent" />
          <span>Stream: 6 events buffered</span>
        </div>
        <span>Mode: {speedMode}</span>
      </div>
    </aside>
  );
}
