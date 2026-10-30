"use client";

// 1. External imports
import React from "react";
import { Calendar, ExternalLink } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { MockTimelineEvent, EntityType } from "@/lib/mock-investigation";

// 3. Type definitions
export type TimelineEventCardProps = {
  event: MockTimelineEvent;
  index: number;
  isSelected: boolean;
  isLinkedToSelectedNode?: boolean;
  onSelect?: (id: string) => void;
  onHover?: (nodeId: string | null) => void;
  linkedEntityType?: EntityType;
  className?: string;
};

export const ENTITY_CONFIG: Record<
  EntityType,
  { label: string; dotClass: string; textClass: string; bgClass: string; borderClass: string }
> = {
  actor: {
    label: "Actor",
    dotClass: "bg-entity-actor",
    textClass: "text-entity-actor",
    bgClass: "bg-entity-actor-bg",
    borderClass: "border-entity-actor/30",
  },
  event: {
    label: "Milestone",
    dotClass: "bg-entity-event",
    textClass: "text-entity-event",
    bgClass: "bg-entity-event-bg",
    borderClass: "border-entity-event/30",
  },
  technology: {
    label: "Tech",
    dotClass: "bg-entity-technology",
    textClass: "text-entity-technology",
    bgClass: "bg-entity-technology-bg",
    borderClass: "border-entity-technology/30",
  },
  decision: {
    label: "Decision",
    dotClass: "bg-entity-decision",
    textClass: "text-entity-decision",
    bgClass: "bg-entity-decision-bg",
    borderClass: "border-entity-decision/30",
  },
  dispute: {
    label: "Dispute",
    dotClass: "bg-entity-dispute",
    textClass: "text-entity-dispute",
    bgClass: "bg-entity-dispute-bg",
    borderClass: "border-entity-dispute/30",
  },
  enigma: {
    label: "Enigma",
    dotClass: "bg-entity-enigma",
    textClass: "text-entity-enigma",
    bgClass: "bg-entity-enigma-bg",
    borderClass: "border-entity-enigma/30",
  },
};

// 4. Component
export function TimelineEventCard({
  event,
  index,
  isSelected,
  isLinkedToSelectedNode,
  onSelect,
  onHover,
  linkedEntityType = "event",
  className,
}: TimelineEventCardProps) {
  const config = ENTITY_CONFIG[linkedEntityType] || ENTITY_CONFIG.event;
  const isActive = isSelected || Boolean(isLinkedToSelectedNode);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(event.id);
    }
  };

  return (
    <div
      id={`timeline-card-${event.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(event.id)}
      onMouseEnter={() => onHover?.(event.nodeId ?? null)}
      onMouseLeave={() => onHover?.(null)}
      onKeyDown={handleKeyDown}
      aria-label={`Milestone: ${event.title}, date ${event.eventDate}`}
      className={cn(
        "min-w-[230px] max-w-[250px] h-full p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shrink-0 shadow-2xs group outline-none select-none focus-visible:ring-2 focus-visible:ring-primary",
        isActive
          ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background bg-card shadow-xs"
          : "border-border/70 hover:border-accent/40 bg-card/90 hover:bg-card",
        className,
      )}
    >
      {/* Top Header: Date pill and entity badge */}
      <div className="flex items-center justify-between text-[10px] font-mono gap-1.5">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 text-foreground font-semibold shrink-0">
          <Calendar className="h-2.5 w-2.5 text-entity-event" />
          <span>{event.eventDate}</span>
        </span>

        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[9px] uppercase tracking-wider font-semibold shrink-0",
              config.bgClass,
              config.textClass,
              config.borderClass,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotClass)} />
            <span className="truncate max-w-[50px]">{config.label}</span>
          </span>

          <span className="text-muted-foreground/60 text-[9px]">#{index + 1}</span>
        </div>
      </div>

      {/* Middle: Title and description snippet */}
      <div className="space-y-0.5 my-1">
        <h5 className="text-[11px] font-semibold text-foreground font-sans line-clamp-1 group-hover:text-primary transition-colors">
          {event.title}
        </h5>
        <p className="text-[10px] text-muted-foreground line-clamp-1 leading-relaxed">
          {event.description}
        </p>
      </div>

      {/* Bottom Footer: Source citation link if present */}
      <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/80 pt-1 border-t border-border/40">
        {event.sourceUrl ? (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary hover:underline"
            title="View external source verification"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            <span>Citation</span>
          </a>
        ) : (
          <span className="text-muted-foreground/50">Causal record</span>
        )}

        {event.nodeId && (
          <span className="text-muted-foreground/60 truncate max-w-[100px]" title={event.nodeId}>
            {event.nodeId}
          </span>
        )}
      </div>
    </div>
  );
}
