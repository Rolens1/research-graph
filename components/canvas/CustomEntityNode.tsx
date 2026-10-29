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
  HelpCircle,
  GitBranch,
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
  enigma: "bg-entity-enigma-bg text-entity-enigma-foreground border-entity-enigma",
};

const entityIcons: Record<EntityType, React.ElementType> = {
  actor: Users,
  event: Calendar,
  technology: Cpu,
  decision: Scale,
  dispute: AlertTriangle,
  enigma: HelpCircle,
};

const handleBaseClass =
  "!h-2.5 !w-2.5 !rounded-full !bg-card !border-2 !border-border-strong hover:!border-accent hover:!bg-accent transition-colors z-20";

// 4. Component
function CustomEntityNodeComponent({ data, selected }: Props) {
  const isEnigma = data.entityType === "enigma" || Boolean(data.unresolvedQuestion);
  const isHighConfidence = data.confidence >= 85;
  const isDisputed = Boolean(data.isDisputed || data.entityType === "dispute");
  const sourceCount = data.sources?.length ?? 0;
  const badgeClass = entityBadgeStyles[data.entityType] || entityBadgeStyles.actor;
  const EntityIcon = entityIcons[data.entityType] || Users;

  return (
    <div
      className={cn(
        "w-[250px] min-h-[96px] rounded-xl border bg-card p-3 shadow-xs transition-all relative flex flex-col justify-between space-y-2 select-none group",
        isEnigma && "border-dashed border-entity-enigma/70 bg-entity-enigma-bg/15 shadow-sm",
        selected
          ? isEnigma
            ? "border-entity-enigma ring-2 ring-entity-enigma/40 shadow-glass"
            : "border-primary ring-2 ring-primary/30 shadow-glass"
          : isEnigma
            ? "hover:border-entity-enigma hover:shadow-md"
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
      <div className="space-y-1.5">
        <h4
          className="text-xs font-bold text-foreground font-sans line-clamp-1 group-hover:text-primary transition-colors leading-snug"
          title={data.label}
        >
          {data.label}
        </h4>
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {data.summary}
        </p>

        {/* Unresolved Mystery Question Card Section */}
        {data.unresolvedQuestion && (
          <div className="rounded-lg bg-entity-enigma-bg/60 border border-entity-enigma/40 p-2 text-[10px] space-y-1 mt-1 animate-in fade-in-0">
            <div className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-entity-enigma-foreground">
              <HelpCircle className="h-3 w-3 shrink-0" />
              <span>Unresolved Question</span>
            </div>
            <p className="text-[11px] text-foreground font-semibold leading-snug line-clamp-3">
              {data.unresolvedQuestion}
            </p>
          </div>
        )}
      </div>

      {/* Footer: Verified Sources Count, Pathway Role, and Optional Depth Tag */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-entity-technology" />
          <span>
            {sourceCount} {sourceCount === 1 ? "source" : "sources"}
          </span>
        </span>

        <div className="flex items-center gap-1.5">
          {data.pathwayRole === "divergent_branch" && (
            <span
              className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-mono font-medium bg-accent/15 text-accent border border-accent/30"
              title="Rabbit hole divergent exploration branch"
            >
              <GitBranch className="h-2 w-2" />
              <span>Branch</span>
            </span>
          )}
          {data.pathwayRole === "dead_end" && (
            <span
              className="px-1 py-0.2 rounded text-[8px] font-mono font-medium bg-muted text-muted-foreground border border-border"
              title="Explored lead that reached an investigative dead end"
            >
              Dead End
            </span>
          )}
          {data.depthLevel > 0 && (
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80">
              Depth {data.depthLevel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const CustomEntityNode = memo(CustomEntityNodeComponent);
