"use client";

// 1. External imports
import React, { memo } from "react";
import {
  Globe,
  ExternalLink,
  Calendar,
  ChevronDown,
  ChevronRight,
  Quote,
  ShieldCheck,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { SourceCitation } from "@/types/graph";

// 3. Type definitions
type Props = {
  source: SourceCitation;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
};

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getCredibilityStyle(score: number): {
  badgeClass: string;
  label: string;
} {
  if (score >= 80) {
    return {
      badgeClass:
        "bg-entity-technology-bg text-entity-technology-foreground border-entity-technology",
      label: `${score}% Verified`,
    };
  }
  if (score >= 60) {
    return {
      badgeClass:
        "bg-entity-decision-bg text-entity-decision-foreground border-entity-decision",
      label: `${score}% Plausible`,
    };
  }
  return {
    badgeClass: "bg-danger/10 text-danger border-danger/30",
    label: `${score}% Low`,
  };
}

// 4. Component
function SourceCitationCardComponent({
  source,
  isExpanded,
  onToggle,
  className,
}: Props) {
  const domain = extractDomain(source.url);
  const credibility = getCredibilityStyle(source.credibilityScore);

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card hover:border-border transition-all duration-200 shadow-xs overflow-hidden font-sans select-none",
        isExpanded && "ring-1 ring-border/80 bg-card",
        className,
      )}
    >
      {/* Clickable Header Strip */}
      <div
        onClick={onToggle}
        className="p-3 cursor-pointer flex items-start justify-between gap-2.5 transition-colors hover:bg-muted/30"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`Source citation: ${source.title}`}
      >
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Metadata Badges Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Publisher Domain Badge */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border/80">
              <Globe className="h-2.5 w-2.5 text-accent" />
              <span className="truncate max-w-[130px]">{domain}</span>
            </span>

            {/* Credibility Score Pill */}
            <span
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border",
                credibility.badgeClass,
              )}
            >
              <ShieldCheck className="h-2.5 w-2.5" />
              <span>{credibility.label}</span>
            </span>

            {/* Publication Date Tag */}
            {source.publishedDate && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/80">
                <Calendar className="h-2.5 w-2.5" />
                <span>{source.publishedDate}</span>
              </span>
            )}
          </div>

          {/* Headline Title */}
          <h4 className="text-xs font-semibold text-foreground tracking-tight leading-snug line-clamp-2">
            {source.title}
          </h4>
        </div>

        {/* Actions Cluster: External Link & Accordion Chevron */}
        <div className="shrink-0 flex items-center gap-1 pt-0.5">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleExternalClick}
            className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            title="Open original article in new tab"
            aria-label={`Open source: ${source.title}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div
            className="h-6 w-6 rounded-md text-muted-foreground flex items-center justify-center"
            aria-hidden="true"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Verbatim Quoted Body */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50 bg-muted/20 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="rounded-lg bg-card/80 p-2.5 border-l-2 border-accent space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] font-mono text-accent font-semibold uppercase tracking-wider">
              <Quote className="h-3 w-3" />
              <span>Verbatim Excerpt</span>
            </div>
            <p className="text-xs text-foreground/90 italic font-sans leading-relaxed">
              &quot;{source.verbatimSnippet}&quot;
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-muted-foreground/80 border-t border-border/40">
              <span>Source URL: {domain}</span>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleExternalClick}
                className="text-accent hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <span>Read Full Article</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const SourceCitationCard = memo(SourceCitationCardComponent);

