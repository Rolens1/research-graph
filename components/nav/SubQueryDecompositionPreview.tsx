"use client";

// 1. External imports
import React, { useState } from "react";
import { Plus, X, RotateCcw, Compass, Check } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  query: string;
  subQueries: string[];
  onChangeSubQueries: (queries: string[]) => void;
  disabled?: boolean;
  className?: string;
};

export function generateDefaultSubQueries(topic: string): string[] {
  const lower = topic.toLowerCase();

  if (lower.includes("tariff") || lower.includes("battery") || lower.includes("ev")) {
    return [
      "Domestic state subsidy architectures and cost parity thresholds",
      "International trade tariff frameworks and retaliatory barriers",
      "Export detour logistics and alternative transit corridors",
      "Patents, intellectual property, and supply chain bottlenecks",
    ];
  }

  if (lower.includes("napoleon") || lower.includes("war") || lower.includes("historic")) {
    return [
      "Strategic military logistics, supply lines, and terrain attrition",
      "Coalition alliances, treaties, and diplomatic realignment",
      "Domestic political fallout, economic sanctions, and trade embargoes",
      "Long term geopolitical balance of power and legacy milestones",
    ];
  }

  if (lower.includes("red sea") || lower.includes("chokepoint") || lower.includes("shipping")) {
    return [
      "Coastal missile interdiction and maritime security threats",
      "Cape route diversion timelines, fuel costs, and container imbalances",
      "Hull war risk insurance rate spikes and charterer disputes",
      "Multinational naval task force escorts and electronic countermeasures",
    ];
  }

  return [
    `Root causal drivers and historical preconditions of ${topic.slice(0, 30)}`,
    "Strategic decisions, major institutional actors, and policy interventions",
    "Cascading downstream repercussions, market bottlenecks, and second order effects",
    "Conflicting evidence, disputed data claims, and alternative hypotheses",
  ];
}

// 4. Component
export function SubQueryDecompositionPreview({
  query,
  subQueries,
  onChangeSubQueries,
  disabled = false,
  className,
}: Props) {
  const [newQuestionText, setNewQuestionText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleRemove = (index: number) => {
    const updated = subQueries.filter((_, idx) => idx !== index);
    onChangeSubQueries(updated);
  };

  const handleEdit = (index: number, text: string) => {
    const updated = [...subQueries];
    updated[index] = text;
    onChangeSubQueries(updated);
  };

  const handleAdd = () => {
    const trimmed = newQuestionText.trim();
    if (trimmed && subQueries.length < 6) {
      onChangeSubQueries([...subQueries, trimmed]);
      setNewQuestionText("");
      setIsAdding(false);
    }
  };

  const handleReset = () => {
    const fresh = generateDefaultSubQueries(query);
    onChangeSubQueries(fresh);
  };

  return (
    <div className={cn("space-y-2.5 rounded-xl border border-border/80 bg-muted/20 p-3.5 select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-foreground font-semibold">
          <Compass className="h-3.5 w-3.5 text-accent" />
          <span>The Architect: Decomposed Angles Preview</span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          title="Regenerate default angles"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
        Autonomous agents will explore these sub questions in parallel. Click any angle to customize.
      </p>

      {/* Sub questions list */}
      <div className="space-y-1.5">
        {subQueries.map((subQ, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-card/80 text-xs font-mono group hover:border-accent/40 transition-colors"
          >
            <span className="text-[10px] text-accent font-bold shrink-0">
              0{idx + 1}.
            </span>
            <input
              type="text"
              value={subQ}
              onChange={(e) => handleEdit(idx, e.target.value)}
              disabled={disabled}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-hidden text-xs truncate"
            />
            {subQueries.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                title="Remove angle"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Sub Question Input */}
      {isAdding ? (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              } else if (e.key === "Escape") {
                setIsAdding(false);
              }
            }}
            placeholder="Add custom investigative angle..."
            className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-accent"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAdd}
            className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 cursor-pointer"
          >
            <Check className="h-3 w-3" />
            <span>Add</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="h-8 px-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        subQueries.length < 6 && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-accent transition-colors pt-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
            <span>Add custom investigative angle</span>
          </button>
        )
      )}
    </div>
  );
}
