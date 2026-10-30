"use client";

// 1. External imports
import React, { memo, useEffect } from "react";
import {
  X,
  Compass,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import { NodeInspectorHeader } from "./NodeInspectorHeader";
import { NodeCausalConnections } from "./NodeCausalConnections";

// 3. Type definitions
type Props = {
  node: GraphNodeData | null;
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onExploreRabbitHole?: (node: GraphNodeData) => void;
  className?: string;
};

// 4. Component
function NodeInspectorDrawerComponent({
  node,
  nodes,
  edges,
  isOpen,
  onClose,
  onSelectNode,
  onExploreRabbitHole,
  className,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!node && !isOpen) return null;

  const isDisputed = Boolean(node?.isDisputed || node?.entityType === "dispute");
  const sourceCount = node?.sources?.length ?? 0;

  return (
    <aside
      className={cn(
        "absolute top-0 right-0 bottom-0 z-30 w-full max-w-md bg-card/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out font-sans select-none overflow-hidden",
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
        className,
      )}
      aria-label={node ? `Inspector for ${node.label}` : "Node Inspector Drawer"}
      aria-hidden={!isOpen}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-card/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            NODE INSPECTOR {node?.timestamp ? `/ ${node.timestamp}` : ""}
          </span>
          {isDisputed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-warning/15 text-warning border border-warning/30">
              <AlertTriangle className="h-2.5 w-2.5" />
              <span>Contested</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
          title="Close drawer (Esc)"
          aria-label="Close drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      {node && (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Header & Badges & Confidence Meter */}
          <NodeInspectorHeader node={node} />

          {/* Executive Causal Summary */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">
              Executive Summary
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed font-sans bg-muted/30 p-3 rounded-xl border border-border/60">
              {node.summary}
            </p>
          </div>

          {/* Unresolved Question Callout */}
          {node.unresolvedQuestion && (
            <div className="rounded-xl border border-entity-enigma/50 bg-entity-enigma-bg/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-entity-enigma-foreground">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Unresolved Causal Gap</span>
              </div>
              <p className="text-xs text-foreground font-semibold leading-relaxed">
                {node.unresolvedQuestion}
              </p>
            </div>
          )}

          {/* Granular Field Ambiguities */}
          {node.ambiguities && node.ambiguities.length > 0 && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-warning">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Conflicting Evidence ({node.ambiguities.length})</span>
              </div>
              <div className="space-y-1.5">
                {node.ambiguities.map((amb, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-mono text-muted-foreground border-l-2 border-warning/40 pl-2"
                  >
                    <span className="font-semibold text-foreground uppercase text-[9px]">
                      {amb.field}:{" "}
                    </span>
                    <span className="text-foreground/90">
                      {amb.candidates.map((c) => `"${c.value}" (${c.source})`).join(" vs ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Causal Connections */}
          <NodeCausalConnections
            nodeId={node.id}
            nodes={nodes}
            edges={edges}
            onSelectNode={onSelectNode}
          />

          {/* Primary Action Button: Explore Rabbit Hole */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onExploreRabbitHole?.(node)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <Compass className="h-4 w-4" />
              <span>Explore Rabbit Hole Drill-Down</span>
            </button>
            <p className="text-[10px] font-mono text-center text-muted-foreground mt-1.5">
              Launch recursive inquiry to investigate child causal mechanisms
            </p>
          </div>

          {/* Source Citations Teaser (Feature 26 integration anchor) */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                <span>Verified Citations</span>
              </span>
              <span>
                {sourceCount} {sourceCount === 1 ? "source" : "sources"}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export const NodeInspectorDrawer = memo(NodeInspectorDrawerComponent);
