"use client";

// 1. External imports
import React, { useRef } from "react";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { MockTimelineEvent } from "@/lib/mock-investigation";

// 3. Type definitions
type Props = {
  events: MockTimelineEvent[];
  isOpen: boolean;
  onToggle: () => void;
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
  className?: string;
};

// 4. Component
export function ChronoTimelinePlaceholder({
  events,
  isOpen,
  onToggle,
  selectedEventId,
  onSelectEvent,
  className,
}: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!isOpen) {
    return (
      <section
        aria-label="Collapsed Timeline Ribbon"
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

          {/* Micro dots representation */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border/60">
            {events.map((evt) => (
              <span
                key={evt.id}
                title={`${evt.eventDate}: ${evt.title}`}
                className="h-2 w-2 rounded-full bg-entity-event/70 hover:scale-125 transition-transform"
              />
            ))}
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

  return (
    <section
      aria-label="Chrono Timeline Strip"
      className={cn(
        "h-28 border-t border-border/80 bg-card/80 backdrop-blur-md flex flex-col justify-between shrink-0 select-none shadow-xs transition-all duration-200 overflow-hidden",
        className,
      )}
    >
      {/* Top timeline sub-bar */}
      <div className="h-7 px-4 border-b border-border/60 bg-muted/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-entity-event" />
          <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
            Zone 3: Chrono Timeline
          </span>
          <span className="text-border">|</span>
          <span>Temporal Axis</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Scroll chevrons */}
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

          {/* Collapse button */}
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
        className="flex-1 overflow-x-auto px-4 py-2 flex items-center gap-4 scrollbar-none"
      >
        {events.map((event, idx) => {
          const isSelected = selectedEventId === event.id;

          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent?.(event.id)}
              className={cn(
                "min-w-[220px] max-w-[240px] h-full p-2.5 rounded-xl border bg-card/90 hover:bg-card transition-all cursor-pointer flex flex-col justify-between shrink-0 shadow-2xs group",
                isSelected
                  ? "border-primary ring-1 ring-primary/40 shadow-xs"
                  : "border-border/70 hover:border-accent/40",
              )}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-muted/80 text-foreground font-semibold">
                  <Calendar className="h-2.5 w-2.5 text-entity-event" />
                  <span>{event.eventDate}</span>
                </span>
                <span className="text-muted-foreground/60">#{idx + 1}</span>
              </div>

              <div className="space-y-0.5">
                <h5 className="text-[11px] font-semibold text-foreground font-sans line-clamp-1 group-hover:text-primary transition-colors">
                  {event.title}
                </h5>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
