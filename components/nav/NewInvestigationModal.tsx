"use client";

// 1. External imports
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Compass, X, ArrowRight, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

// 2. Internal imports
import { createResearchSessionAction } from "@/actions/research";
import { cn } from "@/lib/utils";
import { CategorizedPromptSeeds } from "./CategorizedPromptSeeds";
import {
  SubQueryDecompositionPreview,
  generateDefaultSubQueries,
} from "./SubQueryDecompositionPreview";

// 3. Type definitions
type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
};

// 4. Component
export function NewInvestigationModal({ isOpen, onClose, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [depth, setDepth] = useState<"recon" | "expedition">("recon");
  const [subQueries, setSubQueries] = useState<string[]>(() =>
    initialQuery.length >= 5 ? generateDefaultSubQueries(initialQuery) : [],
  );
  const [showAnglesPreview, setShowAnglesPreview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
    setSubQueries(initialQuery.length >= 5 ? generateDefaultSubQueries(initialQuery) : []);
  }

  const handleClose = useCallback(() => {
    setQuery("");
    setSubQueries([]);
    setErrorMessage(null);
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const handleSelectSeed = (seed: string) => {
    setQuery(seed);
    setErrorMessage(null);
    setSubQueries(generateDefaultSubQueries(seed));
  };

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (trimmed.length < 5) {
      setErrorMessage("Please enter an investigation question with at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const activeAngles = subQueries.length > 0 ? subQueries : generateDefaultSubQueries(trimmed);
      const result = await createResearchSessionAction({
        query: trimmed,
        depth,
        subQueries: activeAngles,
      });

      if (!result.success || !result.researchId) {
        setErrorMessage(result.error || "Failed to start investigation.");
        setIsSubmitting(false);
        return;
      }

      try {
        sessionStorage.setItem(
          "pending_investigation",
          JSON.stringify({ query: trimmed, depth, subQueries: activeAngles }),
        );
      } catch {
        // Ignore storage errors
      }

      handleClose();
      router.push(`/workspace/${result.researchId}?q=${encodeURIComponent(trimmed)}&depth=${depth}`);
    } catch (err) {
      console.error("Launch error:", err);
      setErrorMessage("An unexpected error occurred while launching.");
      setIsSubmitting(false);
    }
  }, [query, depth, subQueries, handleClose, router]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (query.trim().length >= 5 && !isSubmitting) {
          void handleSubmit();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, query, isSubmitting, handleClose, handleSubmit]);

  if (!isOpen) return null;

  const isValid = query.trim().length >= 5;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 md:p-7 shadow-glass space-y-5 animate-in fade-in-0 zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base font-semibold text-foreground font-sans">
                Launch New Investigation
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                Steerable multi agent causality extraction
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            title="Close dialog (Escape)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input box */}
        <div className="space-y-2">
          <div className="relative rounded-xl border border-border bg-muted/30 focus-within:border-accent/80 focus-within:ring-2 focus-within:ring-accent/10 transition-all p-3">
            <textarea
              ref={inputRef}
              rows={2}
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (errorMessage) setErrorMessage(null);
                if (val.trim().length >= 5 && subQueries.length === 0) {
                  setSubQueries(generateDefaultSubQueries(val));
                }
              }}
              placeholder="What complex historical, corporate, or geopolitical puzzle do you want to chart?"
              disabled={isSubmitting}
              className="w-full bg-transparent text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:outline-hidden resize-none font-sans"
            />
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
              <span>{query.length} chars (min 5)</span>
              <span className="hidden sm:inline">Press ⌘+Enter to launch</span>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-mono">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Prompt Decomposition Preview (Rendered when valid query) */}
        {isValid && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAnglesPreview(!showAnglesPreview)}
              className="w-full flex items-center justify-between text-xs font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
            >
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Investigative Focus Angles ({subQueries.length})
              </span>
              {showAnglesPreview ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showAnglesPreview && (
              <SubQueryDecompositionPreview
                query={query}
                subQueries={subQueries}
                onChangeSubQueries={setSubQueries}
                disabled={isSubmitting}
              />
            )}
          </div>
        )}

        {/* Depth Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
            Investigation Depth
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDepth("recon")}
              disabled={isSubmitting}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-colors cursor-pointer",
                depth === "recon"
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-card/60 hover:bg-muted text-muted-foreground",
              )}
            >
              <div className="font-semibold text-xs font-sans text-foreground">Reconnaissance</div>
              <div className="text-[11px] font-mono text-muted-foreground">Fast causal survey (~1 min)</div>
            </button>

            <button
              type="button"
              onClick={() => setDepth("expedition")}
              disabled={isSubmitting}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-colors cursor-pointer",
                depth === "expedition"
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-card/60 hover:bg-muted text-muted-foreground",
              )}
            >
              <div className="font-semibold text-xs font-sans text-foreground">Deep Expedition</div>
              <div className="text-[11px] font-mono text-muted-foreground">Full multi agent verification (~3 min)</div>
            </button>
          </div>
        </div>

        {/* Categorized Seeds Drawer */}
        <CategorizedPromptSeeds
          onSelectSeed={handleSelectSeed}
          activeSeed={query}
          disabled={isSubmitting}
        />

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                <span>Charting Course...</span>
              </>
            ) : (
              <>
                <span>Launch Expedition</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
