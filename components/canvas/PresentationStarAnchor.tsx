"use client";

// 1. External imports
import React, { memo, useId } from "react";
import Image from "next/image";
import { Sparkles, Radio, Flame, AlertTriangle } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData, EntityType, ImpactLevel } from "@/types/graph";

// 3. Type definitions
type Props = {
  node: GraphNodeData;
  className?: string;
};

type StarTheme = {
  starColor: string;
  glowColor: string;
  coronaColor: string;
  ringColor: string;
  badgeLabel: string;
};

function resolveStarTheme(
  entityType: EntityType,
  impactLevel: ImpactLevel,
  isDisputed: boolean,
): StarTheme {
  if (impactLevel === "critical") {
    return {
      starColor: "var(--color-danger)",
      glowColor: "rgba(239, 68, 68, 0.9)",
      coronaColor: "rgba(239, 68, 68, 0.4)",
      ringColor: "rgba(239, 68, 68, 0.2)",
      badgeLabel: "Critical Inflection",
    };
  }

  if (isDisputed || entityType === "dispute") {
    return {
      starColor: "var(--color-warning)",
      glowColor: "rgba(245, 158, 11, 0.9)",
      coronaColor: "rgba(245, 158, 11, 0.4)",
      ringColor: "rgba(245, 158, 11, 0.2)",
      badgeLabel: "Contested Finding",
    };
  }

  switch (entityType) {
    case "event":
      return {
        starColor: "var(--color-entity-event)",
        glowColor: "rgba(234, 88, 12, 0.85)",
        coronaColor: "rgba(234, 88, 12, 0.35)",
        ringColor: "rgba(234, 88, 12, 0.18)",
        badgeLabel: "Milestone Event",
      };
    case "decision":
      return {
        starColor: "var(--color-entity-decision)",
        glowColor: "rgba(217, 119, 6, 0.85)",
        coronaColor: "rgba(217, 119, 6, 0.35)",
        ringColor: "rgba(217, 119, 6, 0.18)",
        badgeLabel: "Strategic Policy",
      };
    case "technology":
      return {
        starColor: "var(--color-entity-technology)",
        glowColor: "rgba(5, 150, 105, 0.85)",
        coronaColor: "rgba(5, 150, 105, 0.35)",
        ringColor: "rgba(5, 150, 105, 0.18)",
        badgeLabel: "Technology Signal",
      };
    case "actor":
    default:
      return {
        starColor: "var(--color-entity-actor)",
        glowColor: "rgba(2, 132, 199, 0.85)",
        coronaColor: "rgba(2, 132, 199, 0.35)",
        ringColor: "rgba(2, 132, 199, 0.18)",
        badgeLabel: "Key Entity",
      };
  }
}

// 4. Component
function PresentationStarAnchorComponent({ node, className }: Props) {
  const glowFilterId = useId();
  const impact = node.impactLevel ?? "medium";
  const isDisputed = Boolean(node.isDisputed || node.entityType === "dispute");
  const theme = resolveStarTheme(node.entityType, impact, isDisputed);
  const timestamp = node.timestamp || "00:00";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 select-none",
        className,
      )}
    >
      {/* Radiant Star Graphic Container */}
      <div className="relative flex items-center justify-center w-48 h-48">
        {/* Outer Pulsing Corona Waves */}
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-25"
          style={{ backgroundColor: theme.ringColor }}
        />
        <div
          className="absolute inset-4 rounded-full animate-pulse opacity-40 blur-xl"
          style={{ backgroundColor: theme.coronaColor }}
        />
        <div
          className="absolute inset-10 rounded-full opacity-60 blur-md"
          style={{ backgroundColor: theme.glowColor }}
        />

        {/* Concentric Celestial Orbit Ring */}
        <div
          className="absolute inset-2 rounded-full border border-dashed opacity-30 animate-[spin_60s_linear_infinite]"
          style={{ borderColor: theme.starColor }}
        />

        {/* Hero 4-Pointed SVG Star */}
        <svg
          viewBox="0 0 100 100"
          className="w-32 h-32 relative z-10 filter drop-shadow-[0_0_24px_rgba(255,255,255,0.4)]"
          aria-hidden="true"
        >
          <defs>
            <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 4-Pointed Celestial Star Polygon */}
          <path
            d="M 50 8 Q 50 50 92 50 Q 50 50 50 92 Q 50 50 8 50 Q 50 50 50 8 Z"
            fill={theme.starColor}
            filter={`url(#${glowFilterId})`}
          />

          {/* Concentrated Brilliant Core Jewel */}
          <circle cx="50" cy="50" r="8" fill="#ffffff" className="opacity-95" />
          <circle cx="50" cy="50" r="14" fill={theme.starColor} className="opacity-40 animate-pulse" />
        </svg>
      </div>

      {/* Monospace Timestamp & Impact Badge */}
      <div className="flex flex-col items-center gap-2 mt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-background/80 backdrop-blur-md border border-border shadow-xs text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>CHRONO {timestamp}</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-medium text-muted-foreground bg-muted/60 border border-border/80">
          {impact === "critical" ? (
            <Flame className="h-3 w-3 text-danger animate-pulse" />
          ) : isDisputed ? (
            <AlertTriangle className="h-3 w-3 text-warning" />
          ) : (
            <Radio className="h-3 w-3 text-accent" />
          )}
          <span>{theme.badgeLabel}</span>
        </div>

        <span className="text-[10px] font-mono text-muted-foreground/70 mt-1">
          {node.id}
        </span>

        {/* Visual Intelligence Evidence Frame Card */}
        {node.backdropUrl && (
          <div className="relative mt-3 w-48 h-28 rounded-2xl overflow-hidden border border-border/80 shadow-glass group">
            <Image
              src={node.backdropUrl}
              alt={node.label}
              fill
              sizes="192px"
              className="object-cover object-center filter brightness-[0.95] contrast-[1.05] group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-2.5 right-2.5 flex items-center justify-between text-[9px] font-mono font-medium">
              <span className="uppercase tracking-wider text-accent flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Evidence Frame</span>
              </span>
              <span className="text-muted-foreground">HD</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const PresentationStarAnchor = memo(PresentationStarAnchorComponent);
