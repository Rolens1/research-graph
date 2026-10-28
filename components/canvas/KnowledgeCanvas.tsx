"use client";

// 1. External imports
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  type NodeMouseHandler,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Compass, Layers } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import { adaptMockToReactFlow } from "@/lib/graph-adapter";
import { calculateElkLayout } from "@/lib/elk-layout";
import { CanvasControls } from "./CanvasControls";
import { CustomEntityNode } from "./CustomEntityNode";
import { CustomCausalEdge } from "./CustomCausalEdge";
import type { MockGraphNode, MockGraphEdge } from "@/lib/mock-investigation";

// Defined outside render cycle to avoid canvas re-mounting
const nodeTypes: NodeTypes = {
  entityNode: CustomEntityNode,
};

const edgeTypes: EdgeTypes = {
  causalEdge: CustomCausalEdge,
};

// 3. Type definitions
type Props = {
  nodes: MockGraphNode[];
  edges: MockGraphEdge[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  className?: string;
};

// 4. Inner Canvas Component
function KnowledgeCanvasContent({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  className,
}: Props) {
  const { fitView } = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);
  const [isRealigning, setIsRealigning] = useState(false);

  // Compute initial node and edge collections
  const { initialNodes, initialEdges } = useMemo(
    () => adaptMockToReactFlow(nodes, edges),
    [nodes, edges],
  );

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Execute ELK auto layout on initial mount or when graph data changes
  useEffect(() => {
    let isCancelled = false;

    async function applyInitialLayout() {
      setIsRealigning(true);
      try {
        const layoutedNodes = await calculateElkLayout(initialNodes, initialEdges);
        if (!isCancelled) {
          setFlowNodes(layoutedNodes);
          setFlowEdges(initialEdges);
          setTimeout(() => {
            if (!isCancelled) {
              fitView({ duration: 400, padding: 0.2 });
            }
          }, 50);
        }
      } catch (err) {
        console.error("Failed to calculate initial ELK layout:", err);
        if (!isCancelled) {
          setFlowNodes(initialNodes);
          setFlowEdges(initialEdges);
        }
      } finally {
        if (!isCancelled) {
          setIsRealigning(false);
        }
      }
    }

    applyInitialLayout();

    return () => {
      isCancelled = true;
    };
  }, [initialNodes, initialEdges, fitView, setFlowNodes, setFlowEdges]);

  // Keep node selection updated without resetting manual node positions
  useEffect(() => {
    setFlowNodes((prev) =>
      prev.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    );
  }, [selectedNodeId, setFlowNodes]);

  // Re-align layout on demand via toolbar button
  const handleRealignLayout = useCallback(async () => {
    if (isRealigning) return;
    setIsRealigning(true);
    try {
      const layoutedNodes = await calculateElkLayout(flowNodes, flowEdges);
      setFlowNodes(layoutedNodes);
      setTimeout(() => {
        fitView({ duration: 400, padding: 0.2 });
      }, 50);
    } catch (err) {
      console.error("Failed to re-align layout:", err);
    } finally {
      setIsRealigning(false);
    }
  }, [flowNodes, flowEdges, isRealigning, setFlowNodes, fitView]);

  // Handle node selection
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onSelectNode?.(node.id);
    },
    [onSelectNode],
  );

  // Recenter viewport on double click
  const handleDoubleClick = useCallback(() => {
    if (!isLocked) {
      fitView({ duration: 400, padding: 0.2 });
    }
  }, [fitView, isLocked]);

  return (
    <div
      className={cn(
        "relative flex-1 h-full w-full bg-background overflow-hidden select-none",
        className,
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Background Watermark Astrolabe Motif */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Compass className="h-[480px] w-[480px] text-foreground" />
      </div>

      {/* Top Topology Status Pill */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-card/85 backdrop-blur-md border border-border/80 text-[11px] font-mono text-muted-foreground shadow-xs pointer-events-auto">
          <Layers className="h-3.5 w-3.5 text-accent" />
          <span>Topology: Left to Right Layered Flow</span>
          <span className="text-border">|</span>
          <span>{flowNodes.length} nodes</span>
          <span className="text-border">|</span>
          <span>{flowEdges.length} causal edges</span>
        </div>
      </div>

      {/* Global SVG Marker Definitions for Directed Causal Arrows */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <marker
            id="causal-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-border-strong)" />
          </marker>
          <marker
            id="causal-arrow-active"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-accent)" />
          </marker>
          <marker
            id="causal-arrow-disputed"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-warning)" />
          </marker>
        </defs>
      </svg>

      {/* React Flow Hardware-Accelerated Viewport */}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        panOnDrag={!isLocked}
        zoomOnScroll={!isLocked}
        zoomOnPinch={!isLocked}
        nodesDraggable={!isLocked}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="h-full w-full bg-transparent"
      >
        {/* Background Dot Matrix Pattern */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="var(--color-border-strong)"
          className="opacity-70"
        />

        {/* Orienting Minimap */}
        <MiniMap
          position="bottom-right"
          className="!bg-card/90 !backdrop-blur-md !border-border/80 !shadow-glass !rounded-xl !overflow-hidden !m-4 !border"
          maskColor="rgba(11, 15, 23, 0.7)"
          nodeColor="var(--color-primary)"
          nodeStrokeColor="var(--color-border)"
          nodeStrokeWidth={1}
          nodeBorderRadius={4}
        />
      </ReactFlow>

      {/* Floating Canvas Controls (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <CanvasControls
          isLocked={isLocked}
          onToggleLock={() => setIsLocked((prev) => !prev)}
          isRealigning={isRealigning}
          onRealignLayout={handleRealignLayout}
        />
      </div>
    </div>
  );
}

// 5. Root Component wrapped in ReactFlowProvider
export function KnowledgeCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <KnowledgeCanvasContent {...props} />
    </ReactFlowProvider>
  );
}
