"use client";

// 1. External imports
import React, { memo, useId } from "react";
import {
  Handle,
  Position,
  type NodeProps,
  type Node,
} from "@xyflow/react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData, EntityType, ImpactLevel } from "@/types/graph";

// 3. Type definitions
type Props = NodeProps<Node<GraphNodeData>>;

type StarTheme = {
  starColor: string;
  glowColor: string;
  coronaColor: string;
  badgeLabel: string;
};

// Size mapping according to impact level (radius in SVG units, diameter = 2 * radius)
const IMPACT_RADIUS_MAP: Record<ImpactLevel, number> = {
  critical: 16, // 32px diameter
  high: 12,     // 24px diameter
  medium: 9,    // 18px diameter
  low: 7,       // 14px diameter
};

function resolveStarTheme(
  entityType: EntityType,
  impactLevel: ImpactLevel,
  isDisputed: boolean,
): StarTheme {
  // Critical impact nodes always take precedence with luminous scarlet / crimson
  if (impactLevel === "critical") {
    return {
      starColor: "var(--color-danger)",
      glowColor: "rgba(239, 68, 68, 0.8)",
      coronaColor: "rgba(239, 68, 68, 0.35)",
      badgeLabel: "Critical Event",
    };
  }

  // Disputed entities shine with amber warning beacons
  if (isDisputed || entityType === "dispute") {
    return {
      starColor: "var(--color-warning)",
      glowColor: "rgba(245, 158, 11, 0.8)",
      coronaColor: "rgba(245, 158, 11, 0.35)",
      badgeLabel: "Disputed Signal",
    };
  }

  switch (entityType) {
    case "event":
      return {
        starColor: "var(--color-entity-event)",
        glowColor: "rgba(234, 88, 12, 0.75)",
        coronaColor: "rgba(234, 88, 12, 0.3)",
        badgeLabel: "Event",
      };
    case "decision":
      return {
        starColor: "var(--color-entity-decision)",
        glowColor: "rgba(217, 119, 6, 0.75)",
        coronaColor: "rgba(217, 119, 6, 0.3)",
        badgeLabel: "Strategic Decision",
      };
    case "technology":
      return {
        starColor: "var(--color-entity-technology)",
        glowColor: "rgba(5, 150, 105, 0.75)",
        coronaColor: "rgba(5, 150, 105, 0.3)",
        badgeLabel: "Technology",
      };
    case "enigma":
      return {
        starColor: "var(--color-entity-enigma)",
        glowColor: "rgba(168, 85, 247, 0.85)",
        coronaColor: "rgba(168, 85, 247, 0.4)",
        badgeLabel: "Unresolved Enigma",
      };
    case "actor":
    default:
      return {
        starColor: "var(--color-entity-actor)",
        glowColor: "rgba(2, 132, 199, 0.75)",
        coronaColor: "rgba(2, 132, 199, 0.3)",
        badgeLabel: "Actor",
      };
  }
}

// 4. Component
function ConstellationStarNodeComponent({ data, selected }: Props) {
  const gradientId = useId();
  const impact = data.impactLevel ?? "medium";
  const isDisputed = Boolean(data.isDisputed || data.entityType === "dispute");
  const isCritical = impact === "critical";
  const starRadius = IMPACT_RADIUS_MAP[impact];
  const theme = resolveStarTheme(data.entityType, impact, isDisputed);

  const cx = 36;
  const cy = 36;
  const R = starRadius;

  // Geometric 4-pointed pinched star path
  const starPath = `M ${cx} ${cy - R} Q ${cx} ${cy} ${cx + R} ${cy} Q ${cx} ${cy} ${cx} ${cy + R} Q ${cx} ${cy} ${cx - R} ${cy} Q ${cx} ${cy} ${cx} ${cy - R} Z`;

  // Secondary soft diagonal flare cross
  const crossRadius = Math.max(3, R * 0.45);
  const crossPath = `M ${cx - crossRadius} ${cy - crossRadius} L ${cx + crossRadius} ${cy + crossRadius} M ${cx - crossRadius} ${cy + crossRadius} L ${cx + crossRadius} ${cy - crossRadius}`;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center min-w-[120px] max-w-[160px] p-1 select-none group cursor-pointer transition-transform duration-200",
        data.isExcluded && "opacity-45 grayscale-[50%]",
        selected && "scale-105",
      )}
      role="button"
      tabIndex={0}
      title={`${data.label} (Double click or tap Deep Dive to enter Theater)`}
      aria-label={`${data.label} (${theme.badgeLabel})`}
    >
      {/* Top Monospace Timestamp Tag */}
      {data.timestamp && (
        <div
          className={cn(
            "text-[10px] font-mono tracking-wider mb-0.5 px-1.5 py-0.5 rounded-sm transition-all",
            isCritical
              ? "text-danger font-semibold bg-danger/10 border border-danger/20"
              : selected
                ? "text-foreground font-medium bg-card/80 border border-border"
                : "text-muted-foreground/80 group-hover:text-foreground",
          )}
        >
          {data.timestamp}
        </div>
      )}

      {/* Radiant Star Centerpiece */}
      <div className="relative flex items-center justify-center w-[72px] h-[72px]">
        {/* React Flow Left/Right/Top/Bottom Handles */}
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!absolute !left-3 !top-1/2 -translate-y-1/2 !w-1.5 !h-1.5 !bg-transparent !border-0 pointer-events-none"
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!absolute !right-3 !top-1/2 -translate-y-1/2 !w-1.5 !h-1.5 !bg-transparent !border-0 pointer-events-none"
        />
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!absolute !top-3 !left-1/2 -translate-x-1/2 !w-1.5 !h-1.5 !bg-transparent !border-0 pointer-events-none"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className="!absolute !bottom-3 !left-1/2 -translate-x-1/2 !w-1.5 !h-1.5 !bg-transparent !border-0 pointer-events-none"
        />

        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          className="overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Radiant Starlight Corona Gradient */}
            <radialGradient
              id={`halo-${gradientId}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={theme.glowColor} stopOpacity="0.8" />
              <stop offset="60%" stopColor={theme.coronaColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={theme.coronaColor} stopOpacity="0" />
            </radialGradient>

            {/* Core Gradient */}
            <linearGradient
              id={`star-${gradientId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor={theme.starColor} />
              <stop offset="100%" stopColor={theme.starColor} />
            </linearGradient>
          </defs>

          {/* Pulsing Beacon for Critical and Disputed Nodes */}
          {(isCritical || isDisputed) && (
            <circle
              cx={cx}
              cy={cy}
              r={R * 1.5}
              stroke={theme.starColor}
              strokeWidth="1.5"
              fill="none"
              opacity="0.4"
              className="animate-ping"
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animationDuration: isCritical ? "2s" : "3s",
              }}
            />
          )}

          {/* Outer Starlight Corona Aura */}
          <circle
            cx={cx}
            cy={cy}
            r={R * 1.6}
            fill={`url(#halo-${gradientId})`}
            className={cn(
              "transition-transform duration-300 group-hover:scale-125",
              data.isHovered && "scale-140 opacity-100",
            )}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />

          {/* Timeline Card Hover Glow Beacon (AC-2) */}
          {data.isHovered && !selected && (
            <circle
              cx={cx}
              cy={cy}
              r={R + 7}
              stroke={theme.starColor}
              strokeWidth="1.5"
              fill="none"
              opacity="0.85"
              className="animate-pulse"
              style={{
                transformOrigin: `${cx}px ${cy}px`,
              }}
            />
          )}

          {/* Celestial Selection Orbit Ring */}
          {selected && (
            <circle
              cx={cx}
              cy={cy}
              r={R + 8}
              stroke="var(--color-primary)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              fill="none"
              opacity="0.75"
              className="animate-spin"
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                animationDuration: "16s",
              }}
            />
          )}

          {/* 4-Pointed Pinched Star Flare */}
          <path
            d={starPath}
            fill={`url(#star-${gradientId})`}
            stroke={theme.starColor}
            strokeWidth="0.8"
            className="transition-transform duration-200 group-hover:scale-110"
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              filter: `drop-shadow(0 0 ${R * 0.4}px ${theme.glowColor})`,
            }}
          />

          {/* Radiant Diagonal Micro Rays */}
          <path
            d={crossPath}
            stroke="#ffffff"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.8"
            className="pointer-events-none"
          />

          {/* Intense Pure White Central Stellar Kernel */}
          <circle
            cx={cx}
            cy={cy}
            r={Math.max(2, R * 0.28)}
            fill="#ffffff"
            className="pointer-events-none"
          />
        </svg>
      </div>

      {/* Bottom Entity Label */}
      <div className="flex flex-col items-center mt-1 space-y-0.5 text-center">
        <span
          className={cn(
            "text-[11px] font-sans font-medium line-clamp-2 leading-tight transition-colors px-1 max-w-[140px]",
            isCritical
              ? "text-foreground font-semibold"
              : selected
                ? "text-foreground font-semibold"
                : "text-foreground/85 group-hover:text-foreground",
          )}
        >
          {data.label}
        </span>

        {/* Subtle category dot indicator */}
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: theme.starColor }}
          />
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
            {theme.badgeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

export const ConstellationStarNode = memo(ConstellationStarNodeComponent);
