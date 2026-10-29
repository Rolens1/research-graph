"use client";

// 1. External imports
import React, { memo } from "react";
import { Users, Calendar, Cpu, Scale, AlertTriangle, ShieldCheck } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData, EntityType } from "@/types/graph";

// 3. Type definitions
type Props = {
  node: GraphNodeData;
  className?: string;
};

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

// 4. Component
function PresentationTopOverviewComponent({ node, className }: Props) {
  const EntityIcon = entityIcons[node.entityType] || Users;
  const categoryBadgeClass = entityBadgeStyles[node.entityType] || entityBadgeStyles.actor;
  const isHighConfidence = node.confidence >= 85;

  return (
    <div className={cn("space-y-4 select-text", className)}>
      {/* Category Pill & Verification Metadata Row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider font-semibold border shadow-xs",
            categoryBadgeClass,
          )}
        >
          <EntityIcon className="h-3.5 w-3.5" />
          <span>{node.entityType}</span>
        </span>

        <span className="inline-flex items-center gap-1.5 text-xs font-mono">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isHighConfidence ? "bg-entity-technology animate-pulse" : "bg-entity-decision",
            )}
          />
          <span className="font-semibold text-foreground">{node.confidence}%</span>
          <span className="text-muted-foreground">Confidence Consensus</span>
        </span>

        {node.sources?.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground border-l border-border pl-3">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            <span>{node.sources.length} Primary {node.sources.length === 1 ? "Citation" : "Citations"}</span>
          </span>
        )}
      </div>

      {/* Main Strategic Event Headline */}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground font-sans leading-tight">
        {node.label}
      </h2>

      {/* Executive Broad Narrative Summary */}
      <div className="relative pl-4 border-l-2 border-accent/60">
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-sans max-w-3xl">
          {node.summary}
        </p>
      </div>
    </div>
  );
}

export const PresentationTopOverview = memo(PresentationTopOverviewComponent);
