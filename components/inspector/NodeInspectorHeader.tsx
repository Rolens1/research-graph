"use client";

// 1. External imports
import React, { memo } from "react";
import Image from "next/image";
import {
  Users,
  Calendar,
  Cpu,
  Scale,
  AlertTriangle,
  HelpCircle,
  Flame,
  Radio,
  GitBranch,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData, EntityType, ImpactLevel } from "@/types/graph";

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

const impactBadgeConfig: Record<
  ImpactLevel,
  { label: string; pillClass: string; icon: React.ElementType }
> = {
  critical: { label: "Critical Inflection", pillClass: "bg-danger/10 text-danger border-danger/30", icon: Flame },
  high: { label: "Major Event", pillClass: "bg-warning/15 text-warning border-warning/30", icon: Radio },
  medium: { label: "Verified Signal", pillClass: "bg-accent/10 text-accent border-accent/30", icon: Radio },
  low: { label: "Context Signal", pillClass: "bg-secondary text-secondary-foreground border-border", icon: Radio },
};

// 4. Component
function NodeInspectorHeaderComponent({ node, className }: Props) {
  const impact = node.impactLevel ?? "medium";
  const isHighConfidence = node.confidence >= 85;
  const EntityIcon = entityIcons[node.entityType] || Users;
  const categoryBadgeClass = entityBadgeStyles[node.entityType] || entityBadgeStyles.actor;
  const impactConfig = impactBadgeConfig[impact];
  const ImpactIcon = impactConfig.icon;

  return (
    <div className={cn("space-y-3 font-sans select-none", className)}>
      {/* Thematic Backdrop Imagery Preview */}
      {node.backdropUrl && (
        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-border shadow-xs">
          <Image
            src={node.backdropUrl}
            alt={node.label}
            fill
            sizes="420px"
            className="object-cover object-center filter brightness-[0.8] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>
      )}

      {/* Main Title & Impact Pill */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground leading-snug">
            {node.label}
          </h2>
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border",
              impactConfig.pillClass,
            )}
          >
            <ImpactIcon className="h-2.5 w-2.5" />
            <span>{impactConfig.label}</span>
          </span>
        </div>

        {/* Category Badge & Pathway Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold border",
              categoryBadgeClass,
            )}
          >
            <EntityIcon className="h-2.5 w-2.5" />
            <span>{node.entityType}</span>
          </span>

          {node.pathwayRole === "divergent_branch" && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-accent/15 text-accent border border-accent/30">
              <GitBranch className="h-2.5 w-2.5" />
              <span>Rabbit Hole</span>
            </span>
          )}

          {node.pathwayRole === "dead_end" && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border">
              <span>Dead End</span>
            </span>
          )}
        </div>

        {/* Confidence Progress Meter */}
        <div className="pt-1.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-muted-foreground">Confidence Metric</span>
            <span
              className={cn(
                "font-semibold",
                isHighConfidence ? "text-entity-technology" : "text-entity-decision",
              )}
            >
              {node.confidence}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isHighConfidence ? "bg-entity-technology" : "bg-entity-decision",
              )}
              style={{ width: `${Math.max(5, Math.min(100, node.confidence))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export const NodeInspectorHeader = memo(NodeInspectorHeaderComponent);

