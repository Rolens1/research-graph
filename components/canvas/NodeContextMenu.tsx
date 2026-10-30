"use client";

import React, { useEffect, useRef, useCallback } from "react";
import {
  EyeOff,
  RotateCcw,
  Compass,
  Info,
} from "lucide-react";
import type { GraphNodeData } from "@/types/graph";

type Props = {
  node: GraphNodeData | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onExcludeNode: (node: GraphNodeData) => void;
  onRestoreNode?: (node: GraphNodeData) => void;
  onExploreRabbitHole?: (node: GraphNodeData) => void;
  onInspectNode?: (node: GraphNodeData) => void;
};

export function NodeContextMenu({
  node,
  position,
  onClose,
  onExcludeNode,
  onRestoreNode,
  onExploreRabbitHole,
  onInspectNode,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!position || !node) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [position, node, onClose]);

  const handleExclude = useCallback(() => {
    if (node) {
      onExcludeNode(node);
      onClose();
    }
  }, [node, onExcludeNode, onClose]);

  const handleRestore = useCallback(() => {
    if (node && onRestoreNode) {
      onRestoreNode(node);
      onClose();
    }
  }, [node, onRestoreNode, onClose]);

  const handleRabbitHole = useCallback(() => {
    if (node && onExploreRabbitHole) {
      onExploreRabbitHole(node);
      onClose();
    }
  }, [node, onExploreRabbitHole, onClose]);

  const handleInspect = useCallback(() => {
    if (node && onInspectNode) {
      onInspectNode(node);
      onClose();
    }
  }, [node, onInspectNode, onClose]);

  if (!position || !node) return null;

  // Viewport clamping
  const menuWidth = 220;
  const menuHeight = 160;
  const clampedX = Math.min(position.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - menuWidth - 10);
  const clampedY = Math.min(position.y, (typeof window !== "undefined" ? window.innerHeight : 800) - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
      className="fixed z-50 w-56 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md text-foreground font-mono text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Node Mini Header */}
      <div className="px-2.5 py-1.5 border-b border-border/50 mb-1">
        <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider truncate">
          {node.entityType}
        </p>
        <p className="text-xs font-semibold text-foreground truncate">
          {node.label}
        </p>
      </div>

      {/* Menu Actions */}
      <div className="space-y-0.5">
        {/* Inspect Details */}
        <button
          type="button"
          onClick={handleInspect}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-muted text-foreground transition-colors cursor-pointer"
        >
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Inspect Node Details</span>
        </button>

        {/* Explore Rabbit Hole (only if active) */}
        {!node.isExcluded && onExploreRabbitHole && (
          <button
            type="button"
            onClick={handleRabbitHole}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            <Compass className="h-3.5 w-3.5 text-accent" />
            <span>Explore Rabbit Hole</span>
          </button>
        )}

        {/* Exclude or Restore Node */}
        {node.isExcluded ? (
          <button
            type="button"
            onClick={handleRestore}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-success/15 text-success transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restore to Causal Chain</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleExclude}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Exclude from Chain</span>
          </button>
        )}
      </div>
    </div>
  );
}
