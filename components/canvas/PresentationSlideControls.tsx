"use client";

// 1. External imports
import React, { memo, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, PlayCircle } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  currentIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  className?: string;
};

// 4. Component
function PresentationSlideControlsComponent({
  currentIndex,
  totalSlides,
  onPrev,
  onNext,
  onClose,
  hasPrev,
  hasNext,
  className,
}: Props) {
  // Global keyboard shortcuts for presentation mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, onPrev, onNext, onClose]);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-2xl bg-card/90 backdrop-blur-md border border-border/80 shadow-glass select-none",
        className,
      )}
      role="toolbar"
      aria-label="Presentation slide controls"
    >
      {/* Navigation Buttons: Previous and Next */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className={cn(
            "h-8 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-medium border transition-colors cursor-pointer",
            hasPrev
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
              : "opacity-40 cursor-not-allowed border-transparent text-muted-foreground",
          )}
          aria-label="Previous event"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Slide Position Counter */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-background/60 border border-border/60 text-xs font-mono text-muted-foreground">
          <PlayCircle className="h-3.5 w-3.5 text-accent" />
          <span className="font-semibold text-foreground">
            {currentIndex + 1}
          </span>
          <span>of</span>
          <span>{totalSlides}</span>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={cn(
            "h-8 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-medium border transition-colors cursor-pointer",
            hasNext
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
              : "opacity-40 cursor-not-allowed border-transparent text-muted-foreground",
          )}
          aria-label="Next event"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Keyboard Hint & Close Presentation Trigger */}
      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-[11px] font-mono text-muted-foreground">
          Use <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">→</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px]">ESC</kbd>
        </span>

        <button
          type="button"
          onClick={onClose}
          className="h-8 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-medium bg-secondary/80 hover:bg-danger/20 hover:text-danger hover:border-danger/30 text-foreground border border-border transition-colors cursor-pointer"
          aria-label="Exit presentation mode"
        >
          <X className="h-3.5 w-3.5" />
          <span>Exit Theater</span>
        </button>
      </div>
    </div>
  );
}

export const PresentationSlideControls = memo(PresentationSlideControlsComponent);
