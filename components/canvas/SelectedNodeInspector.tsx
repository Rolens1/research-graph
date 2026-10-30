"use client";

// 1. External imports
import React, { memo } from "react";
import Image from "next/image";
import {
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Users,
  Calendar,
  Cpu,
  Scale,
  Flame,
  Radio,
  Sparkles,
  HelpCircle,
  GitBranch,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData, EntityType, ImpactLevel } from "@/types/graph";

// 3. Type definitions
type Props = {
  node: GraphNodeData | null;
  onClose: () => void;
  onOpenContext?: (node: GraphNodeData) => void;
  onDeepDive?: (node: GraphNodeData) => void;
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

type ImpactBadgeConfig = {
  label: string;
  pillClass: string;
  dotClass: string;
  icon: React.ElementType;
};

const impactBadgeConfig: Record<ImpactLevel, ImpactBadgeConfig> = {
  critical: {
    label: "Critical Inflection",
    pillClass: "bg-danger/10 text-danger border-danger/30",
    dotClass: "bg-danger animate-pulse",
    icon: Flame,
  },
  high: {
    label: "Major Event",
    pillClass: "bg-warning/15 text-warning border-warning/30",
    dotClass: "bg-warning",
    icon: Radio,
  },
  medium: {
    label: "Verified Signal",
    pillClass: "bg-accent/10 text-accent border-accent/30",
    dotClass: "bg-accent",
    icon: Radio,
  },
  low: {
    label: "Context Signal",
    pillClass: "bg-secondary text-secondary-foreground border-border",
    dotClass: "bg-muted-foreground",
    icon: Radio,
  },
};

// 4. Component
function SelectedNodeInspectorComponent({
  node,
  onClose,
  onOpenContext,
  onDeepDive,
  className,
}: Props) {
  if (!node) return null;

  const impact = node.impactLevel ?? "medium";
  const isDisputed = Boolean(node.isDisputed || node.entityType === "dispute");
  const isHighConfidence = node.confidence >= 85;
  const sourceCount = node.sources?.length ?? 0;
  const timestamp = node.timestamp || "00:00";

  const EntityIcon = entityIcons[node.entityType] || Users;
  const categoryBadgeClass = entityBadgeStyles[node.entityType] || entityBadgeStyles.actor;
  const impactConfig = impactBadgeConfig[impact];
  const ImpactIcon = impactConfig.icon;

  const handleOpenContext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenContext) {
      onOpenContext(node);
    }
  };

  const handleDeepDive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeepDive) {
      onDeepDive(node);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm sm:max-w-md rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-4 shadow-glass select-none transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      role="region"
      aria-label={`Selected node details: ${node.label}`}
    >
      {/* Top Header Tag Row with Timestamp and Close Action */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            SELECTED NODE / {timestamp}
          </span>
          {isDisputed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-warning/15 text-warning border border-warning/30">
              <AlertTriangle className="h-2.5 w-2.5" />
              <span>Contested</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
          title="Deselect star"
          aria-label="Close inspector"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Thematic Backdrop Imagery Preview */}
      {node.backdropUrl && (
        <div
          className="relative w-full h-24 my-2.5 rounded-xl overflow-hidden border border-border/70 cursor-pointer group shadow-xs"
          onClick={handleDeepDive}
          title="Click to launch cinematic presentation theater"
        >
          <Image
            src={node.backdropUrl}
            alt={node.label}
            fill
            sizes="380px"
            className="object-cover object-center filter brightness-[0.75] contrast-[1.05] group-hover:scale-105 group-hover:brightness-[0.85] transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-background/85 backdrop-blur-md text-foreground border border-border/80 shadow-xs">
            <Sparkles className="h-3 w-3 text-accent" />
            <span>Launch Theater ↗</span>
          </div>
        </div>
      )}

      {/* Main Node Heading and Badges */}
      <div className="pt-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground leading-snug">
            {node.label}
          </h3>

          {/* Impact Pill */}
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border",
              impactConfig.pillClass,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", impactConfig.dotClass)} />
            <ImpactIcon className="h-2.5 w-2.5" />
            <span>{impactConfig.label}</span>
          </span>
        </div>

        {/* Category Pill and Metrics Row */}
        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold border",
              categoryBadgeClass,
            )}
          >
            <EntityIcon className="h-2.5 w-2.5" />
            <span>{node.entityType}</span>
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-mono",
              isHighConfidence ? "text-entity-technology font-medium" : "text-entity-decision font-medium",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isHighConfidence ? "bg-entity-technology" : "bg-entity-decision",
              )}
            />
            <span>{node.confidence}% confidence</span>
          </span>

          {node.pathwayRole === "divergent_branch" && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-accent/15 text-accent border border-accent/30"
              title="Rabbit hole divergent exploration branch"
            >
              <GitBranch className="h-2.5 w-2.5" />
              <span>Rabbit Hole Branch</span>
            </span>
          )}

          {node.pathwayRole === "dead_end" && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border"
              title="Explored lead that reached an investigative dead end"
            >
              <span>Dead End</span>
            </span>
          )}

          {sourceCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-muted-foreground/80" />
              <span>{sourceCount} {sourceCount === 1 ? "source" : "sources"}</span>
            </span>
          )}
        </div>

        {/* Executive Summary Clamped to Two Lines */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pt-1 font-sans">
          {node.summary}
        </p>

        {/* Unresolved Mystery Question Card Section */}
        {node.unresolvedQuestion && (
          <div className="rounded-xl border border-entity-enigma/50 bg-entity-enigma-bg/40 p-3 space-y-1 my-2 shadow-xs">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-entity-enigma-foreground">
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Unresolved Investigation Question</span>
            </div>
            <p className="text-xs text-foreground font-semibold leading-relaxed font-sans">
              {node.unresolvedQuestion}
            </p>
          </div>
        )}

        {/* Granular Field-Level Ambiguities Callout */}
        {node.ambiguities && node.ambiguities.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-2.5 space-y-1.5 my-2">
            <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-warning">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Granular Ambiguities ({node.ambiguities.length})</span>
            </div>
            <div className="space-y-1">
              {node.ambiguities.map((amb, i) => (
                <div key={i} className="text-[10px] font-mono text-muted-foreground border-l-2 border-warning/40 pl-2">
                  <span className="font-semibold text-foreground uppercase text-[9px]">{amb.field}: </span>
                  <span className="text-foreground/90">
                    {amb.candidates.map((c) => `"${c.value}" (${c.source})`).join(" vs ")}
                  </span>
                  {amb.reason && (
                    <p className="text-[9px] text-muted-foreground/80 italic font-sans pt-0.5">
                      {amb.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground/80">
          ID: {node.id}
        </span>

        <div className="flex items-center gap-2">
          {onDeepDive && (
            <button
              type="button"
              onClick={handleDeepDive}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3 w-3" />
              <span>Deep Dive</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenContext}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span>Details</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export const SelectedNodeInspector = memo(SelectedNodeInspectorComponent);
