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
function CustomCausalEdgeComponent({
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

  // Calculate smooth Bezier path and centered label anchor coordinates
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

  // Determine stroke color and arrowhead marker
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
      {/* Invisible wider target path for effortless mouse hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Visible Causal SVG Path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: isHovered ? 2.5 : 1.5,
          strokeDasharray: isDisputed ? "6 4" : undefined,
          transition: "stroke 0.2s ease, stroke-width 0.2s ease",
          animation: isDisputed ? "causalDash 1.2s linear infinite" : undefined,
        }}
        markerEnd={`url(#${markerId})`}
      />

      {/* Centered HTML Relationship Badge & Tooltip via EdgeLabelRenderer */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            zIndex: isHovered ? 1000 : 1,
          }}
          className={cn(
            "nodrag nopan flex flex-col items-center select-none transition-all duration-150",
            isHovered && "z-[1000]",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Floating Explanation Tooltip on Hover */}
          {isHovered && explanation && (
            <div
              className={cn(
                "absolute w-64 p-3 rounded-xl border border-border-strong/80 bg-card/95 backdrop-blur-md text-foreground shadow-2xl text-[11px] font-sans leading-relaxed text-center z-[1000] animate-in fade-in-0 zoom-in-95 pointer-events-none",
                labelY < 140 ? "top-full mt-2" : "bottom-full mb-2",
              )}
              role="tooltip"
            >
              <div className="flex items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                <RelationIcon className="h-2.5 w-2.5 text-accent" />
                <span>{relationType}</span>
                {isDisputed && (
                  <span className="text-warning">· Disputed</span>
                )}
              </div>
              <p className="text-foreground/90 font-normal">{explanation}</p>
            </div>
          )}

          {/* Centered Relationship Badge */}
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-medium transition-all cursor-pointer shadow-xs",
              isDisputed
                ? "bg-warning/15 text-warning border-warning/40 hover:bg-warning/25"
                : isHovered || selected
                  ? "bg-card text-foreground border-accent shadow-glass scale-105"
                  : "bg-card/90 backdrop-blur-xs text-muted-foreground border-border hover:border-border-strong hover:text-foreground",
            )}
          >
            <RelationIcon
              className={cn(
                "h-2.5 w-2.5 shrink-0",
                isDisputed
                  ? "text-warning"
                  : isHovered
                    ? "text-accent"
                    : "text-muted-foreground",
              )}
            />
            <span className="truncate max-w-[140px]">{labelText}</span>
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Keyframe animation for disputed dashed edge pulse */}
      <style jsx global>{`
        @keyframes causalDash {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}

export const CustomCausalEdge = memo(CustomCausalEdgeComponent);
