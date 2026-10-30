"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Compass, Sparkles, Loader2, X, AlertTriangle, CornerDownRight } from "lucide-react";
import type { GraphNodeData } from "@/types/graph";

type Props = {
  node: GraphNodeData;
  isOpen: boolean;
  onClose: () => void;
  onExpand: (node: GraphNodeData, customFocusAngle?: string) => Promise<void>;
  isExpanding?: boolean;
};

export function RabbitHolePopover({
  node,
  isOpen,
  onClose,
  onExpand,
  isExpanding = false,
}: Props) {
  const [focusAngle, setFocusAngle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const currentDepth = node.depthLevel ?? 0;
  const isMaxDepth = currentDepth >= 3;
  const targetDepth = currentDepth + 1;

  // Derive dynamic contextual suggestion chips from node intelligence
  const suggestionChips = useMemo(() => {
    const chips: string[] = [];
    if (node.unresolvedQuestion) {
      chips.push(`Resolve: ${node.unresolvedQuestion.slice(0, 36)}...`);
    }
    if (node.ambiguities && node.ambiguities.length > 0) {
      chips.push(`Clarify ${node.ambiguities[0].field} conflicts`);
    }
    chips.push("Underlying policy decisions");
    chips.push("Secondary operational impacts");
    return chips.slice(0, 3);
  }, [node]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isExpanding) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExpanding, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isMaxDepth || isExpanding) return;
      setError(null);
      try {
        await onExpand(node, focusAngle.trim() || undefined);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to expand rabbit hole inquiry";
        setError(msg);
      }
    },
    [node, focusAngle, isMaxDepth, isExpanding, onExpand, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rabbit hole drill down popover"
      className="rounded-2xl border border-accent/40 bg-card/95 p-4 shadow-xl backdrop-blur-md text-foreground text-xs font-sans space-y-3.5 animate-in fade-in-0 zoom-in-95 duration-150 relative"
    >
      {/* Header with Depth Progression */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="font-mono font-semibold text-foreground text-xs tracking-tight">
              Rabbit Hole Drill Down
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
              <span>Depth {currentDepth}</span>
              <CornerDownRight className="h-3 w-3 text-accent" />
              <span className="font-semibold text-accent">Depth {targetDepth}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isExpanding}
          className="h-6 w-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close rabbit hole popover"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Max Depth Warning or Prompt Form */}
      {isMaxDepth ? (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 space-y-1">
          <div className="flex items-center gap-1.5 font-mono font-bold text-[10px] text-warning uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Recursion Boundary Reached</span>
          </div>
          <p className="text-[11px] text-foreground/90 leading-relaxed font-sans">
            This lead has reached the maximum permitted depth of 3 levels. To explore further causal pathways, return to root entities or formulate a new inquiry.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Quick Focus Suggestion Chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-accent" />
              <span>Suggested Inquiry Angles</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFocusAngle(chip)}
                  disabled={isExpanding}
                  className="px-2 py-1 rounded-lg text-[10px] font-mono border border-border/80 bg-muted/40 hover:bg-accent/15 hover:border-accent hover:text-accent transition-all text-left cursor-pointer truncate max-w-full"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Focus Angle Input */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>Custom Focus Angle (Optional)</span>
              <span>{focusAngle.length}/150</span>
            </div>
            <input
              type="text"
              maxLength={150}
              value={focusAngle}
              onChange={(e) => setFocusAngle(e.target.value)}
              placeholder="e.g. Secret pricing agreements or carrier reallocations"
              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-muted/30 border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground font-sans"
              disabled={isExpanding}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-[11px] font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isExpanding}
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExpanding}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isExpanding ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Expanding Leads...</span>
                </>
              ) : (
                <>
                  <Compass className="h-3 w-3" />
                  <span>Launch Drill Down</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
