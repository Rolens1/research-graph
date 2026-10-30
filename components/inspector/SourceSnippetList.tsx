"use client";

// 1. External imports
import React, { memo, useState, useCallback } from "react";
import { ShieldCheck, BookOpen } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { SourceCitation } from "@/types/graph";
import { SourceCitationCard } from "./SourceCitationCard";

// 3. Type definitions
type Props = {
  sources: SourceCitation[];
  className?: string;
};

// 4. Component
function SourceSnippetListComponent({ sources, className }: Props) {
  // Collapsed by default (Set of expanded source URLs/keys)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const handleToggleCard = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const totalSources = sources?.length ?? 0;

  return (
    <div className={cn("space-y-3 font-sans select-none", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span>Verified Citations ({totalSources})</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/70">
          Click to expand
        </span>
      </div>

      {/* Empty State */}
      {totalSources === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 text-center space-y-1">
          <div className="flex justify-center">
            <BookOpen className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="text-xs font-mono text-muted-foreground">
            No source citations attached to this entity
          </p>
        </div>
      ) : (
        /* Source Cards List */
        <div className="space-y-2">
          {sources.map((src, index) => {
            const cardKey = src.id || `${src.url}-${index}`;
            const isExpanded = expandedKeys.has(cardKey);

            return (
              <SourceCitationCard
                key={cardKey}
                source={src}
                isExpanded={isExpanded}
                onToggle={() => handleToggleCard(cardKey)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export const SourceSnippetList = memo(SourceSnippetListComponent);

