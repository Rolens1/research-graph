"use client";

// 1. External imports
import { Compass, Waves, ArrowRight, Crosshair, Radio } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
export type RadarStage = "sounding" | "detecting" | "locked" | "transitioning";

type Props = {
  query: string;
  depth?: "recon" | "expedition";
  stage: RadarStage;
  activeAgent: string;
  depthMeters: number;
  onSkip: () => void;
  className?: string;
};

// 4. Component
export function RadarTelemetryHUD({
  query,
  depth = "recon",
  stage,
  activeAgent,
  depthMeters,
  onSkip,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 p-4 md:p-8 flex flex-col justify-between select-none z-10",
        className
      )}
    >
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary border border-primary/40 flex items-center justify-center shadow-xs shrink-0">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span>VOYAGE IN PROGRESS</span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground truncate max-w-xs sm:max-w-md">
              {query || "Autonomous inquiry initialization"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground bg-card/60 hover:bg-card border border-border transition-colors cursor-pointer shadow-xs pointer-events-auto"
        >
          <span>Skip to Canvas</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
        </button>
      </div>

      {/* Center Lock-on Indicator */}
      {stage === "locked" && (
        <div className="mx-auto text-center space-y-1 animate-fade-in pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/40 text-xs font-mono font-semibold shadow-xs">
            <Crosshair className="h-4 w-4 animate-spin" />
            <span>RETICLE LOCKED &bull; ANCHOR CAUSALITY DETECTED</span>
          </div>
        </div>
      )}

      {/* Bottom Telemetry Gauges */}
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
        {/* Left Coordinates & Depth */}
        <div className="p-3 rounded-xl border border-border bg-card/75 backdrop-blur-xs space-y-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-foreground font-medium text-[11px]">
            <Waves className="h-3.5 w-3.5 text-accent" />
            <span>DEPTH SOUNDING</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div>DEPTH: {depthMeters.toLocaleString()}m</div>
            <div>BEARING: 314° NW &bull; LAT 34°12&apos;N LNG 118°28&apos;W</div>
            <div>MODE: {depth === "expedition" ? "DEEP EXPEDITION (3 LOOPS)" : "QUICK RECON (1 LOOP)"}</div>
          </div>
        </div>

        {/* Right Active Agent Channel */}
        <div className="p-3 rounded-xl border border-border bg-card/75 backdrop-blur-xs space-y-1 w-full sm:w-auto text-left sm:text-right">
          <div className="flex items-center sm:justify-end gap-2 text-foreground font-medium text-[11px]">
            <Radio className="h-3.5 w-3.5 text-primary" />
            <span>EXPEDITION CREW CHANNEL</span>
          </div>
          <div className="text-[11px] text-muted-foreground space-y-0.5">
            <div className="text-primary font-semibold">{activeAgent}</div>
            <div>STATUS: {stage.toUpperCase()}</div>
            <div>LANDMARK NODES: 5 DETECTED</div>
          </div>
        </div>
      </div>
    </div>
  );
}
