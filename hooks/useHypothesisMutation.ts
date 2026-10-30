"use client";

import { useState, useMemo, useCallback } from "react";
import type { GraphNodeData, GraphEdgeData } from "@/types/graph";
import type { AddNodePayload, MutationResponse } from "@/types/mutation";

interface UseHypothesisMutationOptions {
  sessionId: string;
  baseNodes: GraphNodeData[];
  baseEdges: GraphEdgeData[];
}

export function useHypothesisMutation({
  sessionId,
  baseNodes,
  baseEdges,
}: UseHypothesisMutationOptions) {
  const [userAddedNodes, setUserAddedNodes] = useState<GraphNodeData[]>([]);
  const [userAddedEdges, setUserAddedEdges] = useState<GraphEdgeData[]>([]);
  const [excludedNodeIds, setExcludedNodeIds] = useState<Set<string>>(new Set());
  const [severedEdgeIds, setSeveredEdgeIds] = useState<Set<string>>(new Set());

  // Combined reactive node collection with exclusion flag applied
  const displayNodes = useMemo(() => {
    const combined = [...baseNodes, ...userAddedNodes];
    // Deduplicate in case a node already exists in baseNodes
    const seen = new Set<string>();
    const unique: GraphNodeData[] = [];
    combined.forEach((n) => {
      if (!seen.has(n.id)) {
        seen.add(n.id);
        unique.push({
          ...n,
          isExcluded: excludedNodeIds.has(n.id) || Boolean(n.isExcluded),
        });
      }
    });
    return unique;
  }, [baseNodes, userAddedNodes, excludedNodeIds]);

  // Combined reactive edge collection with severed status applied
  const displayEdges = useMemo(() => {
    const combined = [...baseEdges, ...userAddedEdges];
    const seen = new Set<string>();
    const unique: GraphEdgeData[] = [];
    combined.forEach((e) => {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        const isSevered =
          severedEdgeIds.has(e.id) ||
          excludedNodeIds.has(e.source) ||
          excludedNodeIds.has(e.target) ||
          Boolean(e.isSevered);
        unique.push({
          ...e,
          isSevered,
        });
      }
    });
    return unique;
  }, [baseEdges, userAddedEdges, severedEdgeIds, excludedNodeIds]);

  // Exclude node handler (AC-4)
  const handleExcludeNode = useCallback(
    async (nodeId: string) => {
      try {
        const res = await fetch(`/api/research/${sessionId}/mutate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "exclude_node",
            payload: { nodeId },
            existingNodes: displayNodes,
            existingEdges: displayEdges,
          }),
        });
        if (res.ok) {
          const data: MutationResponse = await res.json();
          setExcludedNodeIds((prev) => new Set(prev).add(nodeId));
          setSeveredEdgeIds((prev) => {
            const next = new Set(prev);
            data.severedEdgeIds.forEach((id) => next.add(id));
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to exclude node:", err);
      }
    },
    [sessionId, displayNodes, displayEdges],
  );

  // Restore node handler (AC-6)
  const handleRestoreNode = useCallback(
    async (nodeId: string) => {
      try {
        const res = await fetch(`/api/research/${sessionId}/mutate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "restore_node",
            payload: { nodeId },
            existingNodes: displayNodes,
            existingEdges: displayEdges,
          }),
        });
        if (res.ok) {
          setExcludedNodeIds((prev) => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
          setSeveredEdgeIds((prev) => {
            const next = new Set(prev);
            displayEdges.forEach((e) => {
              if (e.source === nodeId || e.target === nodeId) {
                next.delete(e.id);
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to restore node:", err);
      }
    },
    [sessionId, displayNodes, displayEdges],
  );

  // Add hypothesis handler (AC-1, AC-5)
  const handleAddHypothesis = useCallback(
    async (payload: AddNodePayload) => {
      const res = await fetch(`/api/research/${sessionId}/mutate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_node",
          payload,
          existingNodes: displayNodes,
          existingEdges: displayEdges,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add hypothesis");
      }
      const data: MutationResponse = await res.json();
      if (data.affectedNode) {
        setUserAddedNodes((prev) => [...prev, data.affectedNode!]);
      }
      if (data.addedEdges && data.addedEdges.length > 0) {
        setUserAddedEdges((prev) => [...prev, ...data.addedEdges!]);
      }
    },
    [sessionId, displayNodes, displayEdges],
  );

  return {
    displayNodes,
    displayEdges,
    handleExcludeNode,
    handleRestoreNode,
    handleAddHypothesis,
  };
}
