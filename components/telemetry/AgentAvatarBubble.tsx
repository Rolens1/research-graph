"use client";

// 1. External imports
import React, { useState } from "react";
import {
  Compass,
  Search,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { TelemetryLog, AgentName, TelemetryActionType } from "@/types/telemetry";

// 3. Type definitions
type Props = {
  log: TelemetryLog;
  isLatest?: boolean;
  className?: string;
};

interface AgentPersonaConfig {
  icon: React.ComponentType<{ className?: string }>;
  textColor: string;
  bgColor: string;
  borderColor: string;
  badgeLabel: string;
}

const personaConfigs: Record<AgentName, AgentPersonaConfig> = {
  "The Architect": {
    icon: Compass,
    textColor: "text-entity-enigma",
    bgColor: "bg-entity-enigma-bg",
    borderColor: "border-entity-enigma/40",
    badgeLabel: "Architect",
  },
  "The Reader": {
    icon: Search,
    textColor: "text-entity-actor",
    bgColor: "bg-entity-actor-bg",
    borderColor: "border-entity-actor/40",
    badgeLabel: "Reader",
  },
  "The Fact Checker": {
    icon: ShieldCheck,
    textColor: "text-entity-event",
    bgColor: "bg-entity-event-bg",
    borderColor: "border-entity-event/40",
    badgeLabel: "Fact Checker",
  },
  "The Visualizer": {
    icon: Sparkles,
    textColor: "text-entity-technology",
    bgColor: "bg-entity-technology-bg",
    borderColor: "border-entity-technology/40",
    badgeLabel: "Visualizer",
  },
};

const actionBadgeStyles: Record<TelemetryActionType, { text: string; bg: string; border: string; label: string }> = {
  conflict_raised: {
    text: "text-entity-dispute",
    bg: "bg-entity-dispute-bg",
    border: "border-entity-dispute/40",
    label: "Conflict Raised",
  },
  search_dispatched: {
    text: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/40",
    label: "Search Dispatched",
  },
  source_scraped: {
    text: "text-entity-actor",
    bg: "bg-entity-actor-bg",
    border: "border-entity-actor/40",
    label: "Source Scraped",
  },
  node_spawned: {
    text: "text-entity-technology",
    bg: "bg-entity-technology-bg",
    border: "border-entity-technology/40",
    label: "Node Spawned",
  },
  confidence_update: {
    text: "text-entity-decision",
    bg: "bg-entity-decision-bg",
    border: "border-entity-decision/40",
    label: "Confidence Update",
  },
  goal_reached: {
    text: "text-foreground",
    bg: "bg-muted",
    border: "border-foreground/30",
    label: "Goal Reached",
  },
  fact_extracted: {
    text: "text-muted-foreground",
    bg: "bg-muted/60",
    border: "border-border",
    label: "Fact Extracted",
  },
};

// 4. Component
export function AgentAvatarBubble({ log, isLatest = false, className }: Props) {
  const [showPayload, setShowPayload] = useState(false);
  const persona = personaConfigs[log.agentName] || personaConfigs["The Architect"];
  const actionStyle = actionBadgeStyles[log.actionType] || actionBadgeStyles.fact_extracted;
  const IconComponent = persona.icon;

  const formattedTime = new Date(log.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <article
      className={cn(
        "p-3 rounded-xl border bg-card/70 transition-all duration-200 space-y-2.5 shadow-xs",
        isLatest
          ? "border-accent/60 ring-1 ring-accent/30 shadow-glass"
          : "border-border/70 hover:border-border-strong",
        className,
      )}
    >
      {/* Top Meta Row */}
      <div className="flex items-center justify-between text-[11px] gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={cn(
              "h-5 w-5 shrink-0 rounded-md flex items-center justify-center border",
              persona.bgColor,
              persona.borderColor,
              persona.textColor,
            )}
          >
            <IconComponent className="h-3 w-3" />
          </div>

          <span className={cn("font-semibold text-xs truncate", persona.textColor)}>
            {log.agentName}
          </span>
        </div>

        <time
          dateTime={log.timestamp}
          className="text-[10px] font-mono text-muted-foreground shrink-0"
        >
          {formattedTime}
        </time>
      </div>

      {/* Message Body */}
      <p className="text-foreground text-xs leading-relaxed break-words font-sans selection:bg-accent/20">
        {log.message}
      </p>

      {/* Action Tag & Payload Trigger */}
      <div className="flex items-center justify-between pt-1 gap-2">
        <span
          className={cn(
            "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium",
            actionStyle.text,
            actionStyle.bg,
            actionStyle.border,
          )}
        >
          {actionStyle.label}
        </span>

        {log.payload && Object.keys(log.payload).length > 0 && (
          <button
            type="button"
            onClick={() => setShowPayload(!showPayload)}
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span>{showPayload ? "Hide Data" : "Inspect Data"}</span>
            {showPayload ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {/* Expandable JSON Payload */}
      {showPayload && log.payload && (
        <pre className="mt-2 p-2 rounded-lg bg-muted/60 border border-border text-[10px] font-mono text-foreground/80 overflow-x-auto max-h-40 selection:bg-accent/30">
          {JSON.stringify(log.payload, null, 2)}
        </pre>
      )}
    </article>
  );
}
