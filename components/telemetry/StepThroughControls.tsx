"use client";

// 1. External imports
import React from "react";
import { StepForward, FastForward, Clock } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
export interface StepThroughControlsProps {
  pendingCount: number;
  onNextStep: () => void;
  onFlushToTurbo: () => void;
  disabled?: boolean;
  className?: string;
}

// 4. Component
export function StepThroughControls({
  pendingCount,
  onNextStep,
  onFlushToTurbo,
  disabled = false,
  className,
}: StepThroughControlsProps) {
  const hasPending = pendingCount > 0;

  return (
    <div
      role="region"
      aria-label="Step by step stream controller"
      className={cn(
        "px-3 py-2 border-t border-border/80 bg-card/95 backdrop-blur-md flex items-center justify-between gap-2 text-xs font-mono select-none shadow-xs shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-150",
        className,
      )}
    >
      {/* Left: Pending Count Badge */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Clock className={cn("h-3.5 w-3.5 shrink-0", hasPending ? "text-accent animate-pulse" : "text-muted-foreground")} />
        <span className="text-[11px] text-muted-foreground truncate">
          {hasPending ? (
            <span className="text-foreground font-medium">
              {pendingCount} {pendingCount === 1 ? "step" : "steps"} queued
            </span>
          ) : (
            "Awaiting next event"
          )}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {hasPending && (
          <button
            type="button"
            onClick={onFlushToTurbo}
            disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer border border-transparent hover:border-border/60"
            title="Catch up: flush all queued steps and return to live Turbo streaming"
          >
            <FastForward className="h-3 w-3" />
            <span>Catch up</span>
          </button>
        )}

        <button
          type="button"
          onClick={onNextStep}
          disabled={disabled || !hasPending}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer shadow-xs border",
            hasPending
              ? "bg-accent text-accent-foreground border-accent hover:brightness-105 active:scale-95"
              : "bg-muted text-muted-foreground border-border/40 opacity-60 cursor-not-allowed",
          )}
          title={hasPending ? "Next step (or press Spacebar)" : "No steps currently buffered"}
        >
          <StepForward className="h-3.5 w-3.5" />
          <span>Next Step</span>
          <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-card/60 text-[9px] font-mono border border-border/60 uppercase">
            Space
          </kbd>
        </button>
      </div>
    </div>
  );
}
