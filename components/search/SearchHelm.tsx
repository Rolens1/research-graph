"use client";

// 1. External imports
import React, { useRef, useEffect } from "react";
import { Search, ArrowRight, X, Loader2 } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
export type SearchDepth = "recon" | "expedition";

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  depth: SearchDepth;
  onDepthChange: (depth: SearchDepth) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  className?: string;
};

// 4. Component (Clean neutral search bar inspired by Google and landing reference)
export function SearchHelm({
  query,
  onQueryChange,
  depth,
  onDepthChange,
  onSubmit,
  isSubmitting = false,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input on Cmd+/ or Ctrl+/ shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !isSubmitting) {
        onSubmit();
      }
    }
  };

  const handleClear = () => {
    onQueryChange("");
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "w-full max-w-2xl rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-2 shadow-glass transition-all focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/10",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="pl-3 text-muted-foreground shrink-0">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What would you like to investigate today?"
          className="w-full bg-transparent px-2 py-2 text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-hidden"
          disabled={isSubmitting}
        />

        {query.length > 0 && !isSubmitting && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Keyboard shortcut hint badge (matching reference design) */}
        <div className="hidden md:flex items-center px-2 py-1 rounded-md bg-muted/80 text-[11px] font-mono text-muted-foreground border border-border/60 shrink-0">
          <span>⌘ /</span>
        </div>

        {/* Depth Mode Segmented Switch */}
        <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-muted/70 border border-border/80 shrink-0">
          <button
            type="button"
            onClick={() => onDepthChange("recon")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              depth === "recon"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Quick single iteration overview"
          >
            Recon
          </button>
          <button
            type="button"
            onClick={() => onDepthChange("expedition")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
              depth === "expedition"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Deep multi iteration recursive research"
          >
            Deep
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!query.trim() || isSubmitting}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
          ) : (
            <>
              <span className="hidden sm:inline">Investigate</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Mobile Depth Mode Selector Bar */}
      <div className="flex sm:hidden items-center justify-between pt-2 mt-2 border-t border-border/60 px-2 text-xs text-muted-foreground">
        <span>Depth:</span>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted border border-border">
          <button
            type="button"
            onClick={() => onDepthChange("recon")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px]",
              depth === "recon" ? "bg-card text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            Recon
          </button>
          <button
            type="button"
            onClick={() => onDepthChange("expedition")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px]",
              depth === "expedition" ? "bg-card text-foreground font-semibold" : "text-muted-foreground"
            )}
          >
            Deep
          </button>
        </div>
      </div>
    </div>
  );
}
