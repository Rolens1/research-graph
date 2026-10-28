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
  Compass,
  ArrowUpRight,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { InvestigationItem } from "./InvestigationCard";

// 3. Type definitions
type Props = {
  items: InvestigationItem[];
  onDelete: (id: string, query: string) => void;
  className?: string;
};

// 4. Component
export function InvestigationTable({ items, onDelete, className }: Props) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setActiveMenuId(null);
      }
    }
    if (activeMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenuId]);

  return (
    <div
      ref={menuContainerRef}
      className={cn(
        "rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs overflow-hidden shadow-xs",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
              <th scope="col" className="py-3 px-4 font-medium">Investigation Inquiry</th>
              <th scope="col" className="py-3 px-3 font-medium">Status</th>
              <th scope="col" className="py-3 px-3 font-medium text-center">Confidence</th>
              <th scope="col" className="py-3 px-3 font-medium text-center">Nodes</th>
              <th scope="col" className="py-3 px-3 font-medium text-center">Sources</th>
              <th scope="col" className="py-3 px-3 font-medium">Date</th>
              <th scope="col" className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((item) => {
              const nodesCount = item.nodes_count ?? 0;
              const sourcesCount = item.sources_count ?? 0;
              const isRunning = item.status === "running";
              const isCompleted = item.status === "completed";
              const isFailed = item.status === "failed";
              const isMenuOpen = activeMenuId === item.id;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  {/* Topic Query */}
                  <td className="py-3.5 px-4 font-medium text-foreground max-w-xs md:max-w-md">
                    <Link
                      href={`/workspace/${item.id}?q=${encodeURIComponent(item.query)}`}
                      className="hover:text-primary transition-colors flex items-center gap-1.5 line-clamp-1"
                    >
                      <span className="truncate">{item.query}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground" />
                    </Link>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
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
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap font-mono text-[11px]">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold",
                        item.confidence_score >= 85
                          ? "bg-entity-technology-bg text-entity-technology-foreground"
                          : "bg-entity-decision-bg text-entity-decision-foreground",
                      )}
                    >
                      {item.confidence_score}%
                    </span>
                  </td>

                  {/* Nodes Count */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Network className="h-3 w-3 text-accent" />
                      <span>{nodesCount}</span>
                    </span>
                  </td>

                  {/* Sources Count */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-entity-technology" />
                      <span>{sourcesCount}</span>
                    </span>
                  </td>

                  {/* Creation Date */}
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap relative">
                    <div className="inline-block text-left">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : item.id);
                        }}
                        className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors cursor-pointer"
                        title="Options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-4 top-10 w-44 rounded-xl border border-border bg-popover text-popover-foreground shadow-glass p-1.5 z-40 animate-in fade-in-0 zoom-in-95 space-y-1 text-left">
                          <Link
                            href={`/workspace/${item.id}?q=${encodeURIComponent(item.query)}`}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors cursor-pointer"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <Compass className="h-3.5 w-3.5 text-accent" />
                            <span>Open Canvas</span>
                          </Link>

                          <a
                            href={`/api/export/${item.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors cursor-pointer"
                            onClick={() => setActiveMenuId(null)}
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
                              setActiveMenuId(null);
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
