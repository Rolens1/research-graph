"use client";

// 1. External imports
import React from "react";
import { Compass, Sparkles } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  isLive?: boolean;
  className?: string;
};

// 4. Component
export function TerminalEmptyState({ isLive = true, className }: Props) {
  return (
    <div
      className={cn(
        "h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-3",
        className,
      )}
    >
      <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-muted/60 border border-border">
        {isLive && (
          <span className="absolute -inset-1 rounded-2xl border border-accent/30 animate-ping opacity-60" />
        )}
        <Compass className="h-6 w-6 text-accent animate-pulse" />
      </div>

      <div className="space-y-1 max-w-[240px]">
        <h4 className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
          {isLive ? "Dispatching Agents..." : "No Telemetry Recorded"}
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
          {isLive
            ? "The Architect is decomposing the research query into causal hypotheses."
            : "This investigation contains no dialogue events."}
        </p>
      </div>

      {isLive && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-mono text-accent">
          <Sparkles className="h-3 w-3" />
          <span>Awaiting first transmission</span>
        </div>
      )}
    </div>
  );
}
