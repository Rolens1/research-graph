"use client";

// 1. External imports
import React, { useRef, useMemo, useEffect } from "react";
import {
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { MockTimelineEvent, MockGraphNode } from "@/lib/mock-investigation";
import { TimelineEventCard } from "./TimelineEventCard";
import { CollapsedTimelineRibbon } from "./CollapsedTimelineRibbon";

// 3. Type definitions
export type ChronoTimelineProps = {
  events: MockTimelineEvent[];
  nodes?: MockGraphNode[];
  isOpen: boolean;
  onToggle: () => void;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
  isLoading?: boolean;
  className?: string;
};

// 4. Component
export function ChronoTimeline({
  events,
  nodes = [],
  isOpen,
  onToggle,
  selectedEventId,
  onSelectEvent,
  isLoading = false,
  className,
}: ChronoTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Chronological sort: past to present (AC-2)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = new Date(a.parsedTimestamp || a.eventDate).getTime() || 0;
      const timeB = new Date(b.parsedTimestamp || b.eventDate).getTime() || 0;
      return timeA - timeB;
    });
  }, [events]);

  // Map nodeId to entityType for quick badge lookup
  const nodeTypeMap = useMemo(() => {
    const map = new Map<string, MockGraphNode["entityType"]>();
    for (const node of nodes) {
      map.set(node.id, node.entityType);
    }
    return map;
  }, [nodes]);

  // Multi modal wheel scroll navigation (AC-4)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollBy({ left: e.deltaY * 1.5, behavior: "auto" });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Collapsed Ribbon View (AC-1, AC-7)
  if (!isOpen) {
    return (
      <CollapsedTimelineRibbon
        events={sortedEvents}
        nodeTypeMap={nodeTypeMap}
        onToggle={onToggle}
        className={className}
      />
    );
  }

  // Expanded Timeline View (AC-1)
  return (
    <section
      aria-label="Chrono Timeline Strip"
      className={cn(
        "h-28 border-t border-border/80 bg-card/85 backdrop-blur-md flex flex-col justify-between shrink-0 select-none shadow-xs transition-all duration-200 overflow-hidden",
        className,
      )}
    >
      {/* Top timeline sub bar */}
      <div className="h-7 px-4 border-b border-border/60 bg-muted/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-entity-event" />
          <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
            Zone 3: Chrono Timeline
          </span>
          <span className="text-border">|</span>
          <span>Temporal Axis ({sortedEvents.length} events)</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <div className="h-3 w-px bg-border/80 mx-1" />

          <button
            type="button"
            onClick={onToggle}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Collapse Timeline"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex-1 overflow-x-auto px-4 py-2 flex items-center gap-3.5 scrollbar-none cursor-grab active:cursor-grabbing"
      >
        {/* Streaming Skeleton Placeholders (AC-6) */}
        {isLoading && sortedEvents.length === 0 && (
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0">
              <Compass className="h-3.5 w-3.5 animate-spin text-entity-event" />
              <span>Sounding temporal milestones...</span>
            </div>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="min-w-[220px] h-16 rounded-xl border border-border/40 bg-muted/20 animate-pulse shrink-0"
              />
            ))}
          </div>
        )}

        {/* Empty State (AC-6) */}
        {!isLoading && sortedEvents.length === 0 && (
          <div className="flex items-center justify-center w-full text-xs font-mono text-muted-foreground py-2">
            No chronological milestones recorded for this investigation yet.
          </div>
        )}

        {/* Chronological Milestone Cards (AC-2, AC-3, AC-5) */}
        {sortedEvents.map((event, idx) => (
          <TimelineEventCard
            key={event.id}
            event={event}
            index={idx}
            isSelected={selectedEventId === event.id}
            onSelect={onSelectEvent}
            linkedEntityType={event.nodeId ? nodeTypeMap.get(event.nodeId) : "event"}
          />
        ))}
      </div>
    </section>
  );
}
