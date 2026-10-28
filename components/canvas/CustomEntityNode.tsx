"use client";

// 1. External imports
import React, { memo } from "react";
import {
  Handle,
  Position,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Calendar,
  Cpu,
  Scale,
  AlertCircle,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData, EntityType } from "@/types/graph";

// 3. Type definitions
type Props = NodeProps<Node<GraphNodeData>>;

const entityBadgeStyles: Record<EntityType, string> = {
  actor: "bg-entity-actor-bg text-entity-actor-foreground border-entity-actor",
  event: "bg-entity-event-bg text-entity-event-foreground border-entity-event",
  technology: "bg-entity-technology-bg text-entity-technology-foreground border-entity-technology",
  decision: "bg-entity-decision-bg text-entity-decision-foreground border-entity-decision",
  dispute: "bg-entity-dispute-bg text-entity-dispute-foreground border-entity-dispute",
};

const entityIcons: Record<EntityType, React.ElementType> = {
  actor: Users,
  event: Calendar,
  technology: Cpu,
  decision: Scale,
  dispute: AlertTriangle,
};

const handleBaseClass =
  "!h-2.5 !w-2.5 !rounded-full !bg-card !border-2 !border-border-strong hover:!border-accent hover:!bg-accent transition-colors z-20";

// 4. Component
function CustomEntityNodeComponent({ data, selected }: Props) {
  const isHighConfidence = data.confidence >= 85;
  const isDisputed = Boolean(data.isDisputed || data.entityType === "dispute");
  const sourceCount = data.sources?.length ?? 0;
  const badgeClass = entityBadgeStyles[data.entityType] || entityBadgeStyles.actor;
  const EntityIcon = entityIcons[data.entityType] || Users;

  return (
    <div
      className={cn(
        "w-[240px] min-h-[96px] rounded-xl border bg-card p-3 shadow-xs transition-all relative flex flex-col justify-between space-y-2 select-none group",
        selected
          ? "border-primary ring-2 ring-primary/30 shadow-glass"
          : "border-border/80 hover:border-accent/60 hover:shadow-xs",
      )}
      role="article"
      aria-label={`${data.entityType} node: ${data.label}`}
    >
      {/* 4 Connection Handles for Horizontal & Vertical Branching */}
      {/* Left Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={cn(handleBaseClass, "!-left-1.25")}
      />

      {/* Right Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={cn(handleBaseClass, "!-right-1.25")}
      />

      {/* Top Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={cn(handleBaseClass, "!-top-1.25")}
      />

      {/* Bottom Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={cn(handleBaseClass, "!-bottom-1.25")}
      />

      {/* Header Row: Entity Type Badge, Disputed Warning, and Confidence Score */}
      <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border uppercase tracking-wider font-semibold text-[9px] shrink-0",
              badgeClass,
            )}
          >
            <EntityIcon className="h-2.5 w-2.5" />
            <span>{data.entityType}</span>
          </span>

          {/* Contested Beacon */}
          {isDisputed && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-warning/15 text-warning border border-warning/40 shrink-0"
              title="Contested finding across sources"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-warning" />
              </span>
              <AlertCircle className="h-2.5 w-2.5" />
            </span>
          )}
        </div>

        {/* Confidence Percentage Pill */}
        <span
          className={cn(
            "inline-flex items-center gap-1 font-semibold shrink-0",
            isHighConfidence ? "text-entity-technology" : "text-entity-decision",
          )}
          title={`Confidence: ${data.confidence}%`}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isHighConfidence ? "bg-entity-technology" : "bg-entity-decision",
            )}
          />
          <span>{data.confidence}%</span>
        </span>
      </div>

      {/* Label and Summary Preview */}
      <div className="space-y-1">
        <h4
          className="text-xs font-bold text-foreground font-sans line-clamp-1 group-hover:text-primary transition-colors leading-snug"
          title={data.label}
        >
          {data.label}
        </h4>
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {data.summary}
        </p>
      </div>

      {/* Footer: Verified Sources Count and Optional Depth Tag */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-entity-technology" />
          <span>
            {sourceCount} {sourceCount === 1 ? "source" : "sources"}
          </span>
        </span>

        {data.depthLevel > 0 && (
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80">
            Depth {data.depthLevel}
          </span>
        )}
      </div>
    </div>
  );
}

export const CustomEntityNode = memo(CustomEntityNodeComponent);
