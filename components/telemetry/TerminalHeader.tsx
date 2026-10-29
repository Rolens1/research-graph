"use client";

// 1. External imports
import React from "react";
import {
  Terminal,
  ChevronRight,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { AgentName } from "@/types/telemetry";
import { StreamSpeedToggle } from "./StreamSpeedToggle";

// 3. Type definitions
type Props = {
  isLive?: boolean;
  activeFilter: AgentName | null;
  onFilterChange: (agent: AgentName | null) => void;
  agentCounts: Record<AgentName, number>;
  totalCount: number;
  speedMode?: "turbo" | "step";
  onSpeedModeChange?: (mode: "turbo" | "step") => void;
  onToggle: () => void;
  className?: string;
};

const filterTabs: Array<{ id: AgentName | null; label: string }> = [
  { id: null, label: "All" },
  { id: "The Architect", label: "Architect" },
  { id: "The Reader", label: "Reader" },
  { id: "The Fact Checker", label: "Checker" },
  { id: "The Visualizer", label: "Visualizer" },
];

// 4. Component
export function TerminalHeader({
  isLive = true,
  activeFilter,
  onFilterChange,
  agentCounts,
  totalCount,
  speedMode = "turbo",
  onSpeedModeChange,
  onToggle,
  className,
}: Props) {
  return (
    <header className={cn("border-b border-border/80 bg-muted/30 shrink-0", className)}>
      {/* Top Title & Quick Actions Row */}
      <div className="h-11 px-3.5 flex items-center justify-between gap-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-accent" />
          <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
            Live Agent Room
          </span>

          {isLive && (
            <span className="relative flex h-2 w-2" title="Streaming Live Telemetry">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Stream Speed Toggle (Feature 21) */}
          {onSpeedModeChange && (
            <StreamSpeedToggle
              mode={speedMode}
              onChange={onSpeedModeChange}
            />
          )}

          {/* Collapse Chevron Button */}
          <button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Collapse Terminal"
            aria-label="Collapse live telemetry terminal"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <nav
        aria-label="Filter Agent Dialogue"
        className="px-2.5 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar select-none"
      >
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          const count = tab.id ? agentCounts[tab.id] || 0 : totalCount;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-all shrink-0 cursor-pointer border",
                isActive
                  ? "bg-accent text-accent-foreground border-accent font-medium shadow-xs"
                  : "bg-card/60 text-muted-foreground hover:text-foreground border-border/60 hover:border-border",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[9px] px-1 py-0.2 rounded font-semibold",
                  isActive
                    ? "bg-accent-foreground/20 text-accent-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
