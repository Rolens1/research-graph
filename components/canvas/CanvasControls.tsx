"use client";

// 1. External imports
import React from "react";
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, LayoutGrid, Loader2 } from "lucide-react";
import { useReactFlow, useViewport } from "@xyflow/react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  isLocked: boolean;
  onToggleLock: () => void;
  isRealigning?: boolean;
  onRealignLayout?: () => void;
  className?: string;
};

// 4. Component
export function CanvasControls({
  isLocked,
  onToggleLock,
  isRealigning = false,
  onRealignLayout,
  className,
}: Props) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  const zoomPercentage = Math.round(zoom * 100);

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  const handleFitView = () => {
    fitView({ duration: 400, padding: 0.2 });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl bg-card/90 backdrop-blur-md border border-border/80 shadow-glass select-none pointer-events-auto",
        className,
      )}
      role="toolbar"
      aria-label="Canvas camera controls"
    >
      {/* Zoom In */}
      <button
        type="button"
        onClick={handleZoomIn}
        disabled={isLocked}
        className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title={isLocked ? "Canvas locked" : "Zoom in"}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>

      {/* Zoom Out */}
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={isLocked}
        className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title={isLocked ? "Canvas locked" : "Zoom out"}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>

      {/* Current Zoom Percentage */}
      <span
        className="px-1.5 text-[10px] font-mono text-muted-foreground font-semibold min-w-[38px] text-center"
        aria-live="polite"
        title={`Current zoom: ${zoomPercentage}%`}
      >
        {zoomPercentage}%
      </span>

      <div className="h-3.5 w-px bg-border/80 mx-0.5" />

      {/* Fit View to all nodes */}
      <button
        type="button"
        onClick={handleFitView}
        className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
        title="Fit view (recenter all nodes)"
        aria-label="Fit view"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>

      {/* Re-align Layout via ELK */}
      {onRealignLayout && (
        <button
          type="button"
          onClick={onRealignLayout}
          disabled={isLocked || isRealigning}
          className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title={
            isLocked
              ? "Canvas locked"
              : isRealigning
                ? "Realigning layout..."
                : "Re-align layout (auto arrange nodes)"
          }
          aria-label="Re-align layout"
        >
          {isRealigning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
          ) : (
            <LayoutGrid className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      {/* Lock / Unlock Viewport Panning & Zooming */}
      <button
        type="button"
        onClick={onToggleLock}
        className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
          isLocked
            ? "bg-warning/15 text-warning hover:bg-warning/25 border border-warning/30"
            : "hover:bg-muted text-muted-foreground hover:text-foreground",
        )}
        title={
          isLocked
            ? "Canvas locked: click to unlock pan and zoom"
            : "Lock viewport: prevent pan and zoom while inspecting"
        }
        aria-label={isLocked ? "Unlock canvas viewport" : "Lock canvas viewport"}
        aria-pressed={isLocked}
      >
        {isLocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <Unlock className="h-3.5 w-3.5 text-accent" />
        )}
      </button>
    </div>
  );
}
