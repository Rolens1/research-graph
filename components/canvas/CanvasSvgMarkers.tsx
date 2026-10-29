import React, { memo } from "react";

/**
 * Global SVG Marker Definitions for Directed Causal Arrows on React Flow Canvas.
 */
function CanvasSvgMarkersComponent() {
  return (
    <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
      <defs>
        <marker
          id="causal-arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-border-strong)" />
        </marker>
        <marker
          id="causal-arrow-active"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-accent)" />
        </marker>
        <marker
          id="causal-arrow-disputed"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-warning)" />
        </marker>
      </defs>
    </svg>
  );
}

export const CanvasSvgMarkers = memo(CanvasSvgMarkersComponent);
