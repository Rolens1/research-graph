"use client";

// 1. External imports
import React, { useState, memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { ArrowRight, AlertCircle, Ban, DollarSign, GitFork } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphEdgeData, RelationType } from "@/types/graph";

// 3. Type definitions
type Props = EdgeProps<Edge<GraphEdgeData>>;

const relationIcons: Record<RelationType, React.ElementType> = {
  causes: ArrowRight,
  blocks: Ban,
  finances: DollarSign,
  contradicts: AlertCircle,
  leads_to: GitFork,
};

// 4. Component
function ConstellationEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);

  // Smooth Bezier path calculation between star anchor coordinates
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationType: RelationType = data?.relationType || "causes";
  const isDisputed = Boolean(data?.isDisputed);
  const labelText = data?.label || relationType;
  const explanation = data?.explanation;
  const RelationIcon = relationIcons[relationType] || ArrowRight;

  // Starlight styling: ethereal thin line that brightens on hover or selection
  const strokeColor = isDisputed
    ? "var(--color-warning)"
    : isHovered || selected
      ? "var(--color-accent)"
      : "var(--color-border-strong)";

  const markerId = isDisputed
    ? "causal-arrow-disputed"
    : isHovered || selected
      ? "causal-arrow-active"
      : "causal-arrow";

  return (
    <>
      {/* Invisible wider target path for effortless cursor hover interaction */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Radiant Starlight Corona Layer for Glowing Bloom Effect */}
      {(isHovered || selected || isDisputed) && (
        <path
          d={edgePath}
          fill="none"
          stroke={isDisputed ? "var(--color-warning)" : "var(--color-accent)"}
          strokeWidth={4}
          strokeOpacity={0.25}
          className="pointer-events-none transition-all duration-300"
          style={{
            filter: `drop-shadow(0 0 6px ${isDisputed ? "rgba(245, 158, 11, 0.4)" : "rgba(37, 99, 235, 0.4)"})`,
          }}
        />
      )}

      {/* Visible Primary Starlight Connection */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: isHovered || selected ? 2 : 1.25,
          strokeDasharray: isDisputed ? "4 4" : undefined,
          transition: "stroke 0.25s ease, stroke-width 0.25s ease, filter 0.25s ease",
          animation: isDisputed ? "stellarVibration 1.5s linear infinite" : undefined,
          filter: isHovered || selected
            ? "drop-shadow(0 0 4px var(--color-accent))"
            : undefined,
        }}
        markerEnd={`url(#${markerId})`}
      />

      {/* Minimal Stardust Relationship Badge via EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan flex flex-col items-center select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Floating Evidence Context Tooltip on Hover */}
          {isHovered && explanation && (
            <div
              className="absolute bottom-full mb-2 w-56 p-2.5 rounded-xl border border-border bg-popover/95 backdrop-blur-md text-popover-foreground shadow-glass text-[11px] font-sans leading-relaxed text-center z-50 animate-in fade-in-0 zoom-in-95 pointer-events-none"
              role="tooltip"
            >
              <div className="flex items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                <RelationIcon className="h-2.5 w-2.5 text-accent" />
                <span>{relationType}</span>
                {isDisputed && (
                  <span className="text-warning">· Contested Link</span>
                )}
              </div>
              <p className="text-foreground/90">{explanation}</p>
            </div>
          )}

          {/* Minimal Starlight Relationship Pill */}
          <div
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-mono font-medium transition-all duration-200 cursor-pointer shadow-xs",
              isDisputed
                ? "bg-warning/15 text-warning border-warning/40 hover:bg-warning/25"
                : isHovered || selected
                  ? "bg-card text-foreground border-accent shadow-glass scale-110"
                  : "bg-card/75 backdrop-blur-xs text-muted-foreground/80 border-border/70 hover:border-border-strong hover:text-foreground hover:bg-card",
            )}
            title={explanation || labelText}
          >
            <RelationIcon
              className={cn(
                "h-2 w-2 shrink-0",
                isDisputed
                  ? "text-warning"
                  : isHovered || selected
                    ? "text-accent"
                    : "text-muted-foreground/70",
              )}
            />
            <span className="truncate max-w-[120px]">{labelText}</span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const ConstellationEdge = memo(ConstellationEdgeComponent);
