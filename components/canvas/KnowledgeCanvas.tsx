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
import { adaptMockToReactFlow, type CanvasViewMode } from "@/lib/graph-adapter";
import { calculateElkLayout } from "@/lib/elk-layout";
import { usePresentationTheater } from "@/hooks/usePresentationTheater";
import { CanvasControls } from "./CanvasControls";
import { CustomEntityNode } from "./CustomEntityNode";
import { ConstellationStarNode } from "./ConstellationStarNode";
import { SelectedNodeInspector } from "./SelectedNodeInspector";
import { StarPresentationSlide } from "./StarPresentationSlide";
import { CustomCausalEdge } from "./CustomCausalEdge";
import { ConstellationEdge } from "./ConstellationEdge";
import { CanvasSvgMarkers } from "./CanvasSvgMarkers";
import type { MockGraphNode, MockGraphEdge } from "@/lib/mock-investigation";
import type { GraphNodeData } from "@/types/graph";

// Defined outside render cycle to avoid canvas re-mounting
const nodeTypes: NodeTypes = {
  entityNode: CustomEntityNode,
  constellationStarNode: ConstellationStarNode,
};

const edgeTypes: EdgeTypes = {
  causalEdge: CustomCausalEdge,
  constellationEdge: ConstellationEdge,
};

const STORAGE_KEY = "chronocause:canvas-view-mode";

// 3. Type definitions
type Props = {
  nodes: MockGraphNode[];
  edges: MockGraphEdge[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  viewMode?: CanvasViewMode;
  onViewModeChange?: (mode: CanvasViewMode) => void;
  isStreamCompleted?: boolean;
  className?: string;
};

// 4. Inner Canvas Component
function KnowledgeCanvasContent({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  viewMode: propViewMode,
  onViewModeChange,
  isStreamCompleted,
  className,
}: Props) {
  const { fitView, setCenter } = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);
  const [isRealigning, setIsRealigning] = useState(false);

  // Trigger smooth cinematic fitView animation upon stream completion (AC-5)
  useEffect(() => {
    if (isStreamCompleted) {
      fitView({ duration: 800, padding: 0.2 });
    }
  }, [isStreamCompleted, fitView]);

  // Manage view mode with localStorage persistence, defaulting to constellation
  const [internalViewMode, setInternalViewMode] = useState<CanvasViewMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "cards" || stored === "constellation") {
          return stored;
        }
      } catch {
        // Ignore storage access errors
      }
    }
    return "constellation";
  });

  const viewMode = propViewMode ?? internalViewMode;

  // Handle view mode toggle and persist to localStorage
  const handleViewModeChange = useCallback(
    (mode: CanvasViewMode) => {
      setInternalViewMode(mode);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, mode);
        } catch {
          // Ignore storage access errors
        }
      }
      onViewModeChange?.(mode);
    },
    [onViewModeChange],
  );

  // Compute initial node and edge collections (independent of viewMode so toggling viewMode doesn't re-run layout)
  const { initialNodes, initialEdges } = useMemo(
    () => adaptMockToReactFlow(nodes, edges, null, "constellation"),
    [nodes, edges],
  );

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Execute ELK auto layout on initial mount or when graph topology changes
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

  // Dynamically update node and edge types when view mode changes while preserving coordinates
  useEffect(() => {
    setFlowNodes((prev) =>
      prev.map((node) => ({
        ...node,
        type: viewMode === "constellation" ? "constellationStarNode" : "entityNode",
      })),
    );
    setFlowEdges((prev) =>
      prev.map((edge) => ({
        ...edge,
        type: viewMode === "constellation" ? "constellationEdge" : "causalEdge",
      })),
    );
  }, [viewMode, setFlowNodes, setFlowEdges]);

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

  // Presentation Theater custom hook handling slide navigation and camera fly-to
  const {
    activePresentationNodeId,
    activePresentationNode,
    presentationNodes,
    currentSlideIndex,
    connectedEdgesCount,
    handleOpenPresentation,
    handleClosePresentation,
    handlePrevSlide,
    handleNextSlide,
  } = usePresentationTheater({
    flowNodes,
    flowEdges,
    viewMode,
    setCenter,
    fitView,
    onSelectNode,
  });

  // Handle single node click (selects node and surfaces the bottom-left HUD dock)
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      onSelectNode?.(node.id);
    },
    [onSelectNode],
  );

  // Handle double-clicking a node directly enters the presentation theater
  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (_, node) => {
      handleOpenPresentation(node.id);
    },
    [handleOpenPresentation],
  );

  // Recenter viewport on background double click when presentation is closed
  const handleDoubleClick = useCallback(() => {
    if (!isLocked && !activePresentationNodeId) {
      fitView({ duration: 400, padding: 0.2 });
    }
  }, [fitView, isLocked, activePresentationNodeId]);

  // Resolve active selected node data for the bottom-left HUD inspector dock
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = flowNodes.find((n) => n.id === selectedNodeId);
    return (node?.data as GraphNodeData) ?? null;
  }, [selectedNodeId, flowNodes]);

  // Dismiss node selection from the inspector close button
  const handleCloseInspector = useCallback(() => {
    onSelectNode?.("");
  }, [onSelectNode]);

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

      {/* Sounding / Empty State during Initial Investigation */}
      {flowNodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 space-y-3">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-accent/10 border border-accent/30 animate-pulse">
            <Compass className="h-8 w-8 text-accent animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs font-mono font-semibold text-foreground tracking-wider uppercase">
              Sounding Causal Waters
            </p>
            <p className="text-[11px] font-mono text-muted-foreground max-w-xs">
              Autonomous agents are extracting entities, verifying evidence, and plotting topology...
            </p>
          </div>
        </div>
      )}

      {/* Global SVG Marker Definitions for Directed Causal Arrows */}
      <CanvasSvgMarkers />

      {/* React Flow Hardware-Accelerated Viewport */}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        panOnDrag={!isLocked && !activePresentationNodeId}
        zoomOnScroll={!isLocked && !activePresentationNodeId}
        zoomOnPinch={!isLocked && !activePresentationNodeId}
        nodesDraggable={!isLocked && !activePresentationNodeId}
        elementsSelectable={!activePresentationNodeId}
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

      {/* Floating Canvas Controls & Selected Node Inspector HUD Dock (Bottom Left) */}
      {!activePresentationNodeId && (
        <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-full">
          <CanvasControls
            isLocked={isLocked}
            onToggleLock={() => setIsLocked((prev) => !prev)}
            isRealigning={isRealigning}
            onRealignLayout={handleRealignLayout}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          <SelectedNodeInspector
            node={selectedNodeData}
            onClose={handleCloseInspector}
            onDeepDive={(node) => handleOpenPresentation(node.id)}
          />
        </div>
      )}

      {/* Full-Viewport Cinematic Theater Presentation Overlay */}
      {activePresentationNode && (
        <StarPresentationSlide
          node={activePresentationNode}
          connectedEdgesCount={connectedEdgesCount}
          currentIndex={currentSlideIndex}
          totalSlides={presentationNodes.length}
          onPrev={handlePrevSlide}
          onNext={handleNextSlide}
          onClose={handleClosePresentation}
          hasPrev={currentSlideIndex > 0}
          hasNext={currentSlideIndex < presentationNodes.length - 1}
        />
      )}
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
