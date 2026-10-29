"use client";

// 1. External imports
import React from "react";
import { Zap, Footprints } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { PlaybackSpeedMode } from "./InvestigationPlaybackContext";

// 3. Type definitions
export interface StreamSpeedToggleProps {
  mode: PlaybackSpeedMode;
  onChange: (mode: PlaybackSpeedMode) => void;
  disabled?: boolean;
  className?: string;
}

// 4. Component
export function StreamSpeedToggle({
  mode,
  onChange,
  disabled = false,
  className,
}: StreamSpeedToggleProps) {
  return (
    <div
      role="group"
      aria-label="Stream Playback Speed"
      className={cn(
        "flex items-center p-0.5 rounded-lg bg-card/80 border border-border text-[10px] font-mono shadow-xs select-none",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange("turbo")}
        disabled={disabled}
        aria-pressed={mode === "turbo"}
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring",
          mode === "turbo"
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
        )}
        title="Turbo streaming mode: events render immediately as they arrive"
      >
        <Zap className="h-2.5 w-2.5" />
        <span>Turbo</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("step")}
        disabled={disabled}
        aria-pressed={mode === "step"}
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring",
          mode === "step"
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
        )}
        title="Step by step mode: events buffer so you can step through with Spacebar"
      >
        <Footprints className="h-2.5 w-2.5" />
        <span>Step</span>
      </button>
    </div>
  );
}
