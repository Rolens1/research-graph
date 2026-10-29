"use client";

// 1. External imports
import React, { memo } from "react";
import { Sparkles } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import { CinematicBackdrop } from "./CinematicBackdrop";
import { PresentationStarAnchor } from "./PresentationStarAnchor";
import { PresentationTopOverview } from "./PresentationTopOverview";
import { PresentationBottomDetails } from "./PresentationBottomDetails";
import { PresentationSlideControls } from "./PresentationSlideControls";
import type { GraphNodeData } from "@/types/graph";

// 3. Type definitions
type Props = {
  node: GraphNodeData;
  connectedEdgesCount?: number;
  currentIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  className?: string;
};

// 4. Master Slide Overlay Component
function StarPresentationSlideComponent({
  node,
  connectedEdgesCount = 0,
  currentIndex,
  totalSlides,
  onPrev,
  onNext,
  onClose,
  hasPrev,
  hasNext,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex flex-col justify-between overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 animate-in fade-in-0 duration-400 select-none",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label={`Presentation mode: ${node.label}`}
    >
      {/* Immersive Cinematic Background & Frosted Mask */}
      <CinematicBackdrop
        backdropUrl={node.backdropUrl}
        entityType={node.entityType}
      />

      {/* Top Header Row with Theater Brand & Slide Index */}
      <header className="relative z-10 flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-ping" />
          <span className="text-xs font-mono uppercase tracking-wider font-semibold text-foreground/90">
            Chronocause Cinematic Theater
          </span>
          <span className="text-border">/</span>
          <span className="text-xs font-mono text-muted-foreground">
            {node.timestamp || "00:00"}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-muted-foreground bg-card/60 backdrop-blur-sm border border-border/60">
          <Sparkles className="h-3 w-3 text-accent" />
          <span>Slide {currentIndex + 1} of {totalSlides}</span>
        </div>
      </header>

      {/* Main Content Body: Left Star Anchor + Right Horizontal Split */}
      <main className="relative z-10 my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full">
        {/* Left Column: Vertically Centered Radiant Star Hero */}
        <section
          className="lg:col-span-4 flex items-center justify-center"
          aria-label="Star Hero Anchor"
        >
          <PresentationStarAnchor node={node} />
        </section>

        {/* Right Column: Horizontal Split (Top Overview / Divider / Bottom Details) */}
        <section
          className="lg:col-span-8 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-card/50 backdrop-blur-md border border-border/60 shadow-2xl"
          aria-label="Event Details and Synthesis"
        >
          {/* Top Section: Broad Narrative Description */}
          <PresentationTopOverview node={node} />

          {/* Illuminated Separator Line Dividing Top from Bottom */}
          <div className="relative my-6 w-full" aria-hidden="true">
            <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-accent/70 to-transparent shadow-[0_0_12px_rgba(var(--color-accent),0.4)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          </div>

          {/* Bottom Section: Granular Details, Citations & Causal Links */}
          <PresentationBottomDetails
            node={node}
            connectedEdgesCount={connectedEdgesCount}
          />
        </section>
      </main>

      {/* Bottom Bar: Sequential Slide Navigation Controls */}
      <footer className="relative z-10 pt-4 flex justify-center">
        <PresentationSlideControls
          currentIndex={currentIndex}
          totalSlides={totalSlides}
          onPrev={onPrev}
          onNext={onNext}
          onClose={onClose}
          hasPrev={hasPrev}
          hasNext={hasNext}
          className="w-full max-w-2xl"
        />
      </footer>
    </div>
  );
}

export const StarPresentationSlide = memo(StarPresentationSlideComponent);
