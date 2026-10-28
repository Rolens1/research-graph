"use client";

// 1. External imports
import React from "react";
import { Search, X } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
export type StatusFilter = "all" | "running" | "completed" | "failed";

type Props = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  counts: {
    all: number;
    running: number;
    completed: number;
    failed: number;
  };
  onClearFilters: () => void;
  className?: string;
};

const filterTabs: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All Sessions" },
  { id: "running", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
];

// 4. Component
export function WorkspaceFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  counts,
  onClearFilters,
  className,
}: Props) {
  const isFiltered = searchQuery.trim().length > 0 || statusFilter !== "all";

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs",
        className,
      )}
    >
      {/* Search Input Box */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter past investigations by topic..."
          className="w-full h-9 pl-9 pr-8 rounded-xl bg-muted/40 hover:bg-muted/60 focus:bg-card border border-border/60 focus:border-accent text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {filterTabs.map((tab) => {
          const count = counts[tab.id];
          const isActive = statusFilter === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer select-none",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-mono leading-tight",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground border border-border/60",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Clear Filters Reset */}
        {isFiltered && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Reset filters"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
