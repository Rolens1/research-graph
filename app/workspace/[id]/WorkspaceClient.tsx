"use client";

// 1. External imports
import React, { useState, useEffect, useSyncExternalStore } from "react";

// 2. Internal imports
import { VoyageTransitionScreen } from "@/components/radar/VoyageTransitionScreen";
import { InvestigationShell } from "@/components/workspace/investigation/InvestigationShell";

// 3. Type definitions
type Props = {
  sessionId: string;
  initialQuery?: string;
  initialDepth?: "recon" | "expedition";
};

type PendingData = {
  query: string;
  depth: "recon" | "expedition";
};

const EMPTY_PENDING: PendingData = {
  query: "",
  depth: "recon",
};

let cachedPendingSnapshot: PendingData = EMPTY_PENDING;
let lastRawPending: string | null = null;

const emptySubscribe = () => () => {};

function getPendingSnapshot(): PendingData {
  if (typeof window === "undefined") return EMPTY_PENDING;
  try {
    const raw = sessionStorage.getItem("pending_investigation");
    if (raw === lastRawPending) {
      return cachedPendingSnapshot;
    }
    lastRawPending = raw;
    if (raw) {
      const parsed = JSON.parse(raw) as { query?: string; depth?: "recon" | "expedition" };
      cachedPendingSnapshot = {
        query: parsed.query || "",
        depth: parsed.depth === "expedition" ? "expedition" : "recon",
      };
      return cachedPendingSnapshot;
    }
  } catch {
    // Ignore storage parse error
  }
  cachedPendingSnapshot = EMPTY_PENDING;
  return EMPTY_PENDING;
}

function getServerPendingSnapshot(): PendingData {
  return EMPTY_PENDING;
}

// 4. Component
export function WorkspaceClient({
  sessionId,
  initialQuery = "",
  initialDepth = "recon",
}: Props) {
  // Sync client storage without setState cascading renders or hydration mismatch
  const pendingData = useSyncExternalStore(
    emptySubscribe,
    getPendingSnapshot,
    getServerPendingSnapshot
  );

  const query = initialQuery || pendingData.query || "";
  const depth = initialDepth || pendingData.depth || "recon";
  const [showTransition, setShowTransition] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const raw = sessionStorage.getItem("pending_investigation");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !parsed.sessionId || parsed.sessionId === sessionId;
    } catch {
      return false;
    }
  });

  // Retain pending investigation query in storage so reloads or stream reconnects preserve the query
  useEffect(() => {
    // Keep pending session available during active exploration
  }, []);

  return (
    <div className="h-full flex flex-col relative selection:bg-accent/20 selection:text-accent overflow-hidden">
      {/* 360-degree Sonar Radar Transition Screen Overlay */}
      {showTransition && (
        <VoyageTransitionScreen
          query={query}
          depth={depth}
          onComplete={() => setShowTransition(false)}
        />
      )}

      {/* 3-Zone Investigation Screen Shell */}
      <InvestigationShell
        sessionId={sessionId}
        query={query}
        depth={depth}
      />
    </div>
  );
}
