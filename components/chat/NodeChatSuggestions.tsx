"use client";

// 1. External imports
import React, { memo, useMemo } from "react";
import { Sparkles, HelpCircle, AlertTriangle, ArrowRight } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData } from "@/types/graph";

// 3. Type definitions
type Props = {
  node: GraphNodeData;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
};

type SuggestionItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

// 4. Component
function NodeChatSuggestionsComponent({
  node,
  onSelect,
  disabled = false,
  className,
}: Props) {
  const suggestions: SuggestionItem[] = useMemo(() => {
    const list: SuggestionItem[] = [];

    if (node.isDisputed || node.entityType === "dispute") {
      list.push({
        id: "dispute",
        label: "Why is this claim contested by sources?",
        icon: AlertTriangle,
      });
    }

    if (node.unresolvedQuestion) {
      list.push({
        id: "enigma",
        label: "What is the unresolved causal question?",
        icon: HelpCircle,
      });
    }

    if (node.entityType === "actor") {
      list.push({
        id: "actor_actions",
        label: "What strategic decisions were made here?",
        icon: Sparkles,
      });
    } else if (node.entityType === "technology") {
      list.push({
        id: "tech_application",
        label: "How was this technology deployed?",
        icon: Sparkles,
      });
    } else {
      list.push({
        id: "causal_triggers",
        label: "What primary causes triggered this?",
        icon: Sparkles,
      });
    }

    list.push({
      id: "evidence_summary",
      label: "Summarize the strongest verified evidence",
      icon: Sparkles,
    });

    return list.slice(0, 3);
  }, [node]);

  return (
    <div className={cn("space-y-1.5 font-sans select-none", className)}>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 font-semibold block">
        Suggested Inquiries
      </span>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item.label)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono text-left border transition-all duration-150 cursor-pointer shadow-2xs group",
                "bg-muted/40 hover:bg-muted border-border/80 text-foreground/90 hover:text-foreground",
                disabled && "opacity-50 pointer-events-none",
              )}
            >
              <Icon className="h-3 w-3 text-accent shrink-0" />
              <span className="truncate max-w-[240px]">{item.label}</span>
              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const NodeChatSuggestions = memo(NodeChatSuggestionsComponent);

