"use client";

// 1. External imports
import React, { memo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData, GraphEdgeData, RelationType } from "@/types/graph";

// 3. Type definitions
type Props = {
  nodeId: string;
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  onSelectNode: (nodeId: string) => void;
  className?: string;
};

const relationBadgeStyles: Record<RelationType, string> = {
  causes: "bg-accent/15 text-accent border-accent/30",
  blocks: "bg-danger/15 text-danger border-danger/30",
  finances: "bg-success/15 text-success border-success/30",
  contradicts: "bg-warning/15 text-warning border-warning/30",
  leads_to: "bg-secondary text-secondary-foreground border-border",
};

// 4. Component
function NodeCausalConnectionsComponent({
  nodeId,
  nodes,
  edges,
  onSelectNode,
  className,
}: Props) {
  const nodeMap = React.useMemo(() => {
    const map = new Map<string, GraphNodeData>();
    for (const n of nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [nodes]);

  const inboundEdges = React.useMemo(
    () => edges.filter((e) => e.target === nodeId),
    [edges, nodeId],
  );

  const outboundEdges = React.useMemo(
    () => edges.filter((e) => e.source === nodeId),
    [edges, nodeId],
  );

  return (
    <div className={cn("space-y-4 font-sans select-none", className)}>
      {/* Inbound Causes Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">
            <ArrowDownRight className="h-3.5 w-3.5 text-accent" />
            <span>Inbound Causes ({inboundEdges.length})</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/70">
            Influenced by
          </span>
        </div>

        {inboundEdges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-2.5 text-center">
            <p className="text-[11px] font-mono text-muted-foreground">
              Root Genesis Node • No inbound causes
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {inboundEdges.map((edge) => {
              const sourceNode = nodeMap.get(edge.source);
              const badgeStyle =
                relationBadgeStyles[edge.relationType] ||
                relationBadgeStyles.leads_to;

              return (
                <button
                  key={edge.id}
                  type="button"
                  onClick={() => onSelectNode(edge.source)}
                  className="w-full text-left rounded-xl border border-border/70 bg-card hover:bg-muted/50 p-2.5 transition-all duration-200 group flex items-start justify-between gap-2 shadow-xs cursor-pointer"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider border",
                          badgeStyle,
                        )}
                      >
                        {edge.relationType.replace("_", " ")}
                      </span>
                      {edge.isDisputed && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono bg-warning/15 text-warning border border-warning/30">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          <span>Disputed</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {sourceNode?.label || edge.source}
                    </p>

                    <p className="text-[11px] text-muted-foreground line-clamp-1 italic font-sans">
                      &quot;{edge.label}&quot;
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-muted-foreground group-hover:text-foreground pt-0.5">
                    <span>Jump</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Outbound Effects Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">
            <ArrowUpRight className="h-3.5 w-3.5 text-entity-technology" />
            <span>Outbound Effects ({outboundEdges.length})</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/70">
            Leads to
          </span>
        </div>

        {outboundEdges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-2.5 text-center">
            <p className="text-[11px] font-mono text-muted-foreground">
              Terminal Outcome Node • No outbound effects
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {outboundEdges.map((edge) => {
              const targetNode = nodeMap.get(edge.target);
              const badgeStyle =
                relationBadgeStyles[edge.relationType] ||
                relationBadgeStyles.leads_to;

              return (
                <button
                  key={edge.id}
                  type="button"
                  onClick={() => onSelectNode(edge.target)}
                  className="w-full text-left rounded-xl border border-border/70 bg-card hover:bg-muted/50 p-2.5 transition-all duration-200 group flex items-start justify-between gap-2 shadow-xs cursor-pointer"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider border",
                          badgeStyle,
                        )}
                      >
                        {edge.relationType.replace("_", " ")}
                      </span>
                      {edge.isDisputed && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono bg-warning/15 text-warning border border-warning/30">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          <span>Disputed</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {targetNode?.label || edge.target}
                    </p>

                    <p className="text-[11px] text-muted-foreground line-clamp-1 italic font-sans">
                      &quot;{edge.label}&quot;
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-muted-foreground group-hover:text-foreground pt-0.5">
                    <span>Jump</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const NodeCausalConnections = memo(NodeCausalConnectionsComponent);

