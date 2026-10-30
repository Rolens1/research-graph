"use client";

// 1. External imports
import React from "react";
import { Clock, ChevronUp } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { MockTimelineEvent, EntityType } from "@/lib/mock-investigation";
import { ENTITY_CONFIG } from "./TimelineEventCard";

// 3. Type definitions
export type CollapsedTimelineRibbonProps = {
  events: MockTimelineEvent[];
  nodeTypeMap?: Map<string, EntityType>;
  selectedEventId?: string | null;
  selectedNodeId?: string | null;
  onToggle: () => void;
  className?: string;
};

// 4. Component
export function CollapsedTimelineRibbon({
  events,
  nodeTypeMap,
  selectedEventId,
  selectedNodeId,
  onToggle,
  className,
}: CollapsedTimelineRibbonProps) {
  return (
    <section
      aria-label="Collapsed Chrono Timeline Ribbon"
      className={cn(
        "h-9 px-4 border-t border-border/80 bg-card/75 backdrop-blur-md flex items-center justify-between text-xs font-mono text-muted-foreground select-none shrink-0 transition-all duration-200",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          title="Expand Chrono Timeline"
        >
          <Clock className="h-3.5 w-3.5 text-entity-event" />
          <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
            Chrono Timeline
          </span>
          <span className="text-[10px] text-muted-foreground">
            ({events.length} milestones)
          </span>
        </button>

        {/* Micro dots preview with authentic entity colors */}
        <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-border/60">
          {events.slice(0, 12).map((evt) => {
            const entityType =
              evt.nodeId && nodeTypeMap?.has(evt.nodeId)
                ? (nodeTypeMap.get(evt.nodeId) as EntityType)
                : "event";
            const dotClass = ENTITY_CONFIG[entityType]?.dotClass || "bg-entity-event";
            const isDotActive =
              evt.id === selectedEventId ||
              Boolean(selectedNodeId && evt.nodeId === selectedNodeId);

            return (
              <span
                key={evt.id}
                title={`${evt.eventDate}: ${evt.title} (${entityType})`}
                className={cn(
                  "rounded-full transition-all",
                  isDotActive
                    ? "h-2.5 w-2.5 ring-2 ring-primary ring-offset-1 ring-offset-background scale-125 opacity-100"
                    : "h-2 w-2 opacity-80 hover:opacity-100 hover:scale-125",
                  dotClass,
                )}
              />
            );
          })}
          {events.length > 12 && (
            <span className="text-[9px] text-muted-foreground">
              +{events.length - 12}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
        title="Expand Timeline"
      >
        <span>Expand</span>
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}
