"use client";

// 1. External imports
import React from "react";
import { Compass, SearchX, Plus, RotateCcw, Sparkles } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  type: "no_investigations" | "no_filter_matches";
  onNewInquiry?: (initialQuery?: string) => void;
  onResetFilters?: () => void;
  className?: string;
};

const QUICK_DOMAIN_SEEDS = [
  { title: "Red Sea Chokepoints", query: "Red Sea Maritime Chokepoints & Bab el-Mandeb Interdiction" },
  { title: "Sodium Batteries", query: "Chinese EV Tariffs & Sodium Batteries in 2024" },
  { title: "Panama Drought", query: "Panama Canal Drought Restrictions & Transit Surcharges" },
  { title: "1812 Russia Campaign", query: "Fall of Napoleon: Causes & Turning Points in 1812" },
];

// 4. Component
export function WorkspaceEmptyState({
  type,
  onNewInquiry,
  onResetFilters,
  className,
}: Props) {
  if (type === "no_filter_matches") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-card/40 p-10 text-center max-w-md mx-auto space-y-4 shadow-xs",
          className,
        )}
      >
        <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border mx-auto flex items-center justify-center text-muted-foreground">
          <SearchX className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            No Matching Investigations
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No research sessions match your active search keyword or status filter.
          </p>
        </div>

        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Search & Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/40 p-10 md:p-12 text-center max-w-lg mx-auto space-y-6 shadow-xs",
        className,
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary shadow-xs">
        <Compass className="h-7 w-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">
          No Investigations Charted Yet
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Deploy our recursive multi agent research team to investigate open-ended questions, verify sources, and chart interactive causal maps.
        </p>
      </div>

      {onNewInquiry && (
        <button
          type="button"
          onClick={() => onNewInquiry()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Launch First Inquiry</span>
        </button>
      )}

      {/* Quick Domain Seeds */}
      <div className="pt-3 border-t border-border/40 w-full max-w-sm mx-auto space-y-2.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3 text-entity-decision" />
          <span>Or explore a curated domain seed</span>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {QUICK_DOMAIN_SEEDS.map((seed) => (
            <button
              key={seed.title}
              type="button"
              onClick={() => onNewInquiry?.(seed.query)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/70 transition-colors cursor-pointer"
            >
              <span>{seed.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
