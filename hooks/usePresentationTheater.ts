"use client";

import { useState, useMemo, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { GraphNodeData } from "@/types/graph";
import type { CanvasViewMode } from "@/lib/graph-adapter";

type UsePresentationTheaterOptions = {
  flowNodes: Node<GraphNodeData>[];
  flowEdges: Edge[];
  viewMode: CanvasViewMode;
  setCenter: (x: number, y: number, options?: { zoom?: number; duration?: number }) => void;
  fitView: (options?: { duration?: number; padding?: number }) => void;
  onSelectNode?: (nodeId: string) => void;
};

export function usePresentationTheater({
  flowNodes,
  flowEdges,
  viewMode,
  setCenter,
  fitView,
  onSelectNode,
}: UsePresentationTheaterOptions) {
  const [activePresentationNodeId, setActivePresentationNodeId] = useState<string | null>(null);

  // List of all nodes in topological sequence for presentation slide navigation
  const presentationNodes = useMemo(() => {
    return flowNodes.map((n) => n.data as GraphNodeData);
  }, [flowNodes]);

  const currentSlideIndex = useMemo(() => {
    if (!activePresentationNodeId) return -1;
    return presentationNodes.findIndex((n) => n.id === activePresentationNodeId);
  }, [activePresentationNodeId, presentationNodes]);

  const activePresentationNode = useMemo(() => {
    if (currentSlideIndex === -1) return null;
    return presentationNodes[currentSlideIndex] ?? null;
  }, [currentSlideIndex, presentationNodes]);

  const connectedEdgesCount = useMemo(() => {
    if (!activePresentationNodeId) return 0;
    return flowEdges.filter(
      (e) => e.source === activePresentationNodeId || e.target === activePresentationNodeId,
    ).length;
  }, [activePresentationNodeId, flowEdges]);

  // Center camera and fly to active node
  const flyToNode = useCallback(
    (nodeId: string) => {
      const targetNode = flowNodes.find((n) => n.id === nodeId);
      if (targetNode) {
        const width = targetNode.measured?.width ?? (viewMode === "constellation" ? 140 : 240);
        const height = targetNode.measured?.height ?? (viewMode === "constellation" ? 90 : 96);
        setCenter(targetNode.position.x + width / 2, targetNode.position.y + height / 2, {
          zoom: 2.0,
          duration: 600,
        });
      }
    },
    [flowNodes, viewMode, setCenter],
  );

  // Open presentation slide mode with camera zoom
  const handleOpenPresentation = useCallback(
    (nodeId: string) => {
      setActivePresentationNodeId(nodeId);
      onSelectNode?.(nodeId);
      flyToNode(nodeId);
    },
    [onSelectNode, flyToNode],
  );

  // Close presentation and restore overview
  const handleClosePresentation = useCallback(() => {
    setActivePresentationNodeId(null);
    fitView({ duration: 600, padding: 0.2 });
  }, [fitView]);

  // Step to previous slide
  const handlePrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      const prevNode = presentationNodes[currentSlideIndex - 1];
      if (prevNode) {
        setActivePresentationNodeId(prevNode.id);
        onSelectNode?.(prevNode.id);
        flyToNode(prevNode.id);
      }
    }
  }, [currentSlideIndex, presentationNodes, onSelectNode, flyToNode]);

  // Step to next slide
  const handleNextSlide = useCallback(() => {
    if (currentSlideIndex < presentationNodes.length - 1) {
      const nextNode = presentationNodes[currentSlideIndex + 1];
      if (nextNode) {
        setActivePresentationNodeId(nextNode.id);
        onSelectNode?.(nextNode.id);
        flyToNode(nextNode.id);
      }
    }
  }, [currentSlideIndex, presentationNodes, onSelectNode, flyToNode]);

  return {
    activePresentationNodeId,
    activePresentationNode,
    presentationNodes,
    currentSlideIndex,
    connectedEdgesCount,
    handleOpenPresentation,
    handleClosePresentation,
    handlePrevSlide,
    handleNextSlide,
  };
}
