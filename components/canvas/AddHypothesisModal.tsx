"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Loader2, Link2 } from "lucide-react";
import type { EntityType, GraphNodeData } from "@/types/graph";
import type { AddNodePayload } from "@/types/mutation";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AddNodePayload) => Promise<void>;
  existingNodes: GraphNodeData[];
  isSubmitting?: boolean;
};

const ENTITY_TYPES: { type: EntityType; label: string }[] = [
  { type: "decision", label: "Strategic Decision" },
  { type: "event", label: "Event / Milestone" },
  { type: "technology", label: "Technology" },
  { type: "actor", label: "Key Actor" },
  { type: "dispute", label: "Contested Dispute" },
  { type: "enigma", label: "Unknown Enigma" },
];

function AddHypothesisForm({
  onClose,
  onSubmit,
  existingNodes,
  isSubmitting = false,
}: Omit<Props, "isOpen">) {
  const [label, setLabel] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("decision");
  const [summary, setSummary] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<string>(
    existingNodes[0]?.id || "",
  );
  const [error, setError] = useState<string | null>(null);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedLabel = label.trim();
      const trimmedSummary = summary.trim();

      if (!trimmedLabel) {
        setError("Please provide a name or label for the hypothesis.");
        return;
      }
      if (trimmedSummary.length < 10) {
        setError("Summary must be at least 10 characters long.");
        return;
      }

      try {
        await onSubmit({
          label: trimmedLabel,
          entityType,
          summary: trimmedSummary,
          proposedConnections: selectedConnection ? [selectedConnection] : [],
        });
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to add hypothesis";
        setError(msg);
      }
    },
    [label, entityType, summary, selectedConnection, onSubmit, onClose],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-card border border-border/80 rounded-2xl shadow-2xl max-w-md w-full p-6 text-foreground relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold font-mono tracking-tight text-foreground">
                Add Hypothesis Node
              </h2>
              <p className="text-xs text-muted-foreground">
                Introduce a new factor to test counterfactual outcomes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Label Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-foreground flex justify-between">
              <span>Hypothesis Label</span>
              <span className="text-[10px] text-muted-foreground">{label.length}/60</span>
            </label>
            <input
              type="text"
              maxLength={60}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Covert Port Bunker Fuel Subsidies"
              className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground"
              disabled={isSubmitting}
            />
          </div>

          {/* Entity Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-foreground">
              Entity Classification
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ENTITY_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setEntityType(t.type)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left border transition-all cursor-pointer ${
                    entityType === t.type
                      ? "bg-accent/15 border-accent text-accent font-semibold"
                      : "bg-muted/20 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                  disabled={isSubmitting}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary / Proposed Mechanism */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-foreground flex justify-between">
              <span>Hypothesis Summary & Mechanism</span>
              <span className="text-[10px] text-muted-foreground">{summary.length}/300</span>
            </label>
            <textarea
              rows={3}
              maxLength={300}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe the proposed action, mechanism, or hidden agreement..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Connect to Existing Node */}
          {existingNodes.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-medium text-foreground flex items-center gap-1.5">
                <Link2 className="h-3 w-3 text-muted-foreground" />
                <span>Proposed Anchor Connection</span>
              </label>
              <select
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent text-foreground"
                disabled={isSubmitting}
              >
                <option value="">None (Floating Node)</option>
                {existingNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.label} ({n.entityType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-xs font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying Evidence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Anchor Hypothesis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddHypothesisModal({ isOpen, ...props }: Props) {
  if (!isOpen) return null;
  return <AddHypothesisForm {...props} />;
}
