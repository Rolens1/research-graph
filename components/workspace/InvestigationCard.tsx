"use client";

// 1. External imports
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  ShieldCheck,
  MoreVertical,
  FileDown,
  Trash2,
  ExternalLink,
  Compass,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
export type InvestigationItem = {
  id: string;
  query: string;
  status: string;
  confidence_score: number;
  created_at: string;
  nodes_count?: number;
  sources_count?: number;
};

type Props = {
  item: InvestigationItem;
  onDelete: (id: string, query: string) => void;
  className?: string;
};

// 4. Component
export function InvestigationCard({ item, onDelete, className }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const nodesCount = item.nodes_count ?? 0;
  const sourcesCount = item.sources_count ?? 0;

  // Format status badge
  const isRunning = item.status === "running";
  const isCompleted = item.status === "completed";
  const isFailed = item.status === "failed";

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/80 bg-card/60 hover:bg-card/90 p-5 shadow-xs transition-all hover:border-accent/40 hover:shadow-glass flex flex-col justify-between space-y-4 group",
        className,
      )}
    >
      <div className="space-y-2.5">
        {/* Top Header: Status Pill, Date, and Menu Action */}
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "uppercase px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium",
                isRunning && "bg-accent/15 text-accent border-accent/40 animate-pulse",
                isCompleted && "bg-entity-technology-bg text-entity-technology-foreground border-entity-technology",
                isFailed && "bg-destructive/15 text-destructive border-destructive/40",
                !isRunning && !isCompleted && !isFailed && "bg-secondary text-secondary-foreground border-border",
              )}
            >
              {item.status}
            </span>
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
          </div>

          {/* Action Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="h-7 w-7 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Session options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 w-44 rounded-xl border border-border bg-popover text-popover-foreground shadow-glass p-1.5 z-30 animate-in fade-in-0 zoom-in-95 space-y-1">
                <Link
                  href={`/workspace/${item.id}?q=${encodeURIComponent(item.query)}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  <Compass className="h-3.5 w-3.5 text-accent" />
                  <span>Open Canvas</span>
                </Link>

                <a
                  href={`/api/export/${item.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Export PDF</span>
                </a>

                <div className="border-t border-border/60 my-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(item.id, item.query);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Session</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title link */}
        <Link
          href={`/workspace/${item.id}?q=${encodeURIComponent(item.query)}`}
          className="block"
        >
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {item.query}
          </h3>
        </Link>
      </div>

      {/* Metrics Row: Confidence, Nodes, Sources */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-3">
          {/* Confidence Meter */}
          <div className="flex items-center gap-1.5" title={`Confidence score: ${item.confidence_score}%`}>
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                item.confidence_score >= 85 ? "bg-entity-technology" : "bg-entity-decision",
              )}
            />
            <span className="text-[11px] font-semibold text-foreground">
              {item.confidence_score}%
            </span>
          </div>

          {/* Nodes count */}
          <div className="flex items-center gap-1" title={`${nodesCount} verified nodes charted`}>
            <Network className="h-3 w-3 text-accent" />
            <span className="text-[11px]">{nodesCount}</span>
          </div>

          {/* Sources count */}
          <div className="flex items-center gap-1" title={`${sourcesCount} primary citations verified`}>
            <ShieldCheck className="h-3 w-3 text-entity-technology" />
            <span className="text-[11px]">{sourcesCount}</span>
          </div>
        </div>

        <Link
          href={`/workspace/${item.id}?q=${encodeURIComponent(item.query)}`}
          className="text-xs font-mono font-medium text-primary hover:text-accent flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
        >
          <span>Canvas</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
