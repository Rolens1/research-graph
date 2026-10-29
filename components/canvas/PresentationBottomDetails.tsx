"use client";

// 1. External imports
import React, { memo } from "react";
import { ExternalLink, AlertTriangle, Quote, ArrowRight, Layers } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData } from "@/types/graph";

// 3. Type definitions
type Props = {
  node: GraphNodeData;
  connectedEdgesCount?: number;
  className?: string;
};

// 4. Component
function PresentationBottomDetailsComponent({
  node,
  connectedEdgesCount = 0,
  className,
}: Props) {
  const isDisputed = Boolean(node.isDisputed || node.entityType === "dispute");
  const sources = node.sources || [];

  return (
    <div className={cn("space-y-5 select-text pt-2", className)}>
      {/* Contradiction / Dispute Alert Callout (If active) */}
      {isDisputed && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-warning/40 bg-warning/10 text-warning">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold">
              Contested Finding & Divergent Intelligence
            </h4>
            <p className="text-xs text-warning/90 leading-relaxed font-sans">
              Multiple intelligence feeds present competing assessments regarding this node. 
              Review the primary citations below to examine the conflicting data points.
            </p>
          </div>
        </div>
      )}

      {/* Primary Source Citations Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-accent" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Primary Source Citations & Verbatim Evidence ({sources.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground/80">
            Ground-Truth Verified
          </span>
        </div>

        {/* Source Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sources.map((source, idx) => (
            <div
              key={source.id || idx}
              className="p-3.5 rounded-xl border border-border/80 bg-card/80 backdrop-blur-sm space-y-2 hover:border-accent/50 transition-colors shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-foreground line-clamp-1">
                  {source.title}
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-accent transition-colors"
                  title="Open source URL"
                  aria-label={`Open source: ${source.title}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Verbatim Excerpt */}
              <blockquote className="text-xs text-muted-foreground italic pl-2.5 border-l-2 border-border font-sans leading-relaxed line-clamp-3">
                &ldquo;{source.verbatimSnippet}&rdquo;
              </blockquote>

              <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/80 pt-1">
                <span>{source.publishedDate || "Date: N/A"}</span>
                <span className="text-accent font-medium">
                  {source.credibilityScore}% Credibility
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Causal Impact & Topological Significance */}
      <div className="pt-2 flex items-center justify-between text-xs font-mono text-muted-foreground border-t border-border/60">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-accent" />
          <span>Graph Depth Level: {node.depthLevel}</span>
        </div>

        <div className="flex items-center gap-1.5 text-foreground">
          <span>Active Causal Links:</span>
          <span className="font-semibold text-accent">{connectedEdgesCount}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export const PresentationBottomDetails = memo(PresentationBottomDetailsComponent);
