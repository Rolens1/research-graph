"use client";

// 1. External imports
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { Compass, Layers, Sparkles } from "lucide-react";

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
import { NodeContextMenu } from "./NodeContextMenu";
import { AddHypothesisModal } from "./AddHypothesisModal";
import type { MockGraphNode, MockGraphEdge } from "@/lib/mock-investigation";
import type { GraphNodeData } from "@/types/graph";
import type { AddNodePayload } from "@/types/mutation";

// Defined outside render cycle to avoid canvas re-mounting
const nodeTypes: NodeTypes = {
  entityNode: CustomEntityNode,
  constellationStarNode: ConstellationStarNode,
};

const edgeTypes: EdgeTypes = {
  causalEdge: CustomCausalEdge,
  constellationEdge: ConstellationEdge,
};

const STORAGE_KEY = "causality-search:canvas-view-mode";

// 3. Type definitions
type Props = {
  nodes: MockGraphNode[];
  edges: MockGraphEdge[];
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
  focusNodeTarget?: { nodeId: string; timestamp: number } | null;
  onSelectNode?: (nodeId: string | null) => void;
  onOpenDrawer?: () => void;
  viewMode?: CanvasViewMode;
  onViewModeChange?: (mode: CanvasViewMode) => void;
  isStreamCompleted?: boolean;
  onExcludeNode?: (nodeId: string) => void;
  onRestoreNode?: (nodeId: string) => void;
  onAddHypothesis?: (payload: AddNodePayload) => Promise<void>;
  onExploreRabbitHole?: (node: GraphNodeData) => void;
  className?: string;
};

// 4. Inner Canvas Component
function KnowledgeCanvasContent({
  nodes,
  edges,
  selectedNodeId,
  hoveredNodeId,
  focusNodeTarget,
  onSelectNode,
  onOpenDrawer,
  viewMode: propViewMode,
  onViewModeChange,
  isStreamCompleted,
  onExcludeNode,
  onRestoreNode,
  onAddHypothesis,
  onExploreRabbitHole,
  className,
}: Props) {
  const { fitView, setCenter } = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);
  const [isRealigning, setIsRealigning] = useState(false);

  // Context Menu & Add Hypothesis Modal States (Feature 29)
  const [contextMenu, setContextMenu] = useState<{
    node: GraphNodeData;
    position: { x: number; y: number };
  } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingHypothesis, setIsAddingHypothesis] = useState(false);

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

  // Keep node selection & timeline hover state updated with reference preservation for 60fps (AC-2)
  useEffect(() => {
    setFlowNodes((prev) =>
      prev.map((node) => {
        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;
        if (node.selected === isSelected && node.data?.isHovered === isHovered) {
          return node;
        }
        return {
          ...node,
          selected: isSelected,
          data: {
            ...node.data,
            isHovered,
          },
        };
      }),
    );
  }, [selectedNodeId, hoveredNodeId, setFlowNodes]);

  // Smooth camera centering upon fresh focusNodeTarget update from timeline milestone click (AC-1)
  const lastHandledFocusTimestampRef = useRef<number | null>(null);
  useEffect(() => {
    if (!focusNodeTarget?.nodeId || focusNodeTarget.timestamp === lastHandledFocusTimestampRef.current) return;
    lastHandledFocusTimestampRef.current = focusNodeTarget.timestamp;

    const targetNode = flowNodes.find((n) => n.id === focusNodeTarget.nodeId);
    if (!targetNode) return;

    const width = targetNode.measured?.width ?? (viewMode === "constellation" ? 72 : 250);
    const height = targetNode.measured?.height ?? (viewMode === "constellation" ? 72 : 96);
    const x = targetNode.position.x + width / 2;
    const y = targetNode.position.y + height / 2;

    setCenter(x, y, { duration: 600, zoom: 1.1 });
  }, [focusNodeTarget, flowNodes, viewMode, setCenter]);

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

  // Dismiss node selection from the inspector close button or canvas background click
  const handleCloseInspector = useCallback(() => {
    onSelectNode?.(null);
  }, [onSelectNode]);

  // Handle right-clicking a node opens custom context menu (AC-2)
  const handleNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      const targetNode = nodes.find((n) => n.id === node.id);
      if (targetNode) {
        setContextMenu({
          node: targetNode,
          position: { x: event.clientX, y: event.clientY },
        });
      }
    },
    [nodes],
  );

  const handleSubmitHypothesis = useCallback(
    async (payload: AddNodePayload) => {
      if (!onAddHypothesis) return;
      setIsAddingHypothesis(true);
      try {
        await onAddHypothesis(payload);
      } finally {
        setIsAddingHypothesis(false);
      }
    },
    [onAddHypothesis],
  );

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
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handleCloseInspector}
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
            onOpenContext={onOpenDrawer}
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
      {/* Top Right Floating Action: Add Hypothesis Button (AC-1) */}
      {!activePresentationNodeId && onAddHypothesis && (
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border/80 hover:border-accent text-xs font-mono font-semibold text-foreground hover:text-accent shadow-glass transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>+ Add Hypothesis</span>
          </button>
        </div>
      )}

      {/* Context Menu on Node Right Click (AC-2) */}
      <NodeContextMenu
        node={contextMenu?.node || null}
        position={contextMenu?.position || null}
        onClose={() => setContextMenu(null)}
        onExcludeNode={(n) => onExcludeNode?.(n.id)}
        onRestoreNode={(n) => onRestoreNode?.(n.id)}
        onExploreRabbitHole={(n) => {
          onSelectNode?.(n.id);
          onExploreRabbitHole?.(n);
        }}
        onInspectNode={(n) => {
          onSelectNode?.(n.id);
          onOpenDrawer?.();
        }}
      />

      {/* Add Hypothesis Modal (AC-1) */}
      <AddHypothesisModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSubmitHypothesis}
        existingNodes={nodes}
        isSubmitting={isAddingHypothesis}
      />
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
