"use client";

// 1. External imports
import React from "react";
import { Plus, LayoutGrid, Table } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  userEmail?: string;
  totalCount: number;
  activeCount: number;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  onOpenNewInquiry: () => void;
  className?: string;
};

// 4. Component
export function WorkspaceStatsHeader({
  userEmail,
  totalCount,
  activeCount,
  viewMode,
  onViewModeChange,
  onOpenNewInquiry,
  className,
}: Props) {
  const greeting = userEmail
    ? `Welcome back, ${userEmail.split("@")[0]}`
    : "Investigation Workspace";

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/80",
        className,
      )}
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            {greeting}
          </h1>

          {/* Active status pill */}
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-accent/15 text-accent border border-accent/40 shadow-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
              <span>
                {activeCount} active {activeCount === 1 ? "voyage" : "voyages"}
              </span>
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          {totalCount} charted {totalCount === 1 ? "investigation" : "investigations"} with recursive causality and verified evidence
        </p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto">
        {/* View Mode Switcher */}
        <div
          role="group"
          aria-label="View mode layout"
          className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border shadow-xs"
        >
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            title="Card Grid View"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer",
              viewMode === "grid"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            aria-pressed={viewMode === "table"}
            title="Dense Table View"
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer",
              viewMode === "table"
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Table className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>

        {/* Primary New Investigation Trigger */}
        <button
          type="button"
          onClick={onOpenNewInquiry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Inquiry Helm</span>
        </button>
      </div>
    </div>
  );
}
