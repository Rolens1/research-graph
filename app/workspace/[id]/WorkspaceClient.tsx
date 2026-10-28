"use client";

// 1. External imports
import React, { useState, useEffect } from "react";

// 2. Internal imports
import { VoyageTransitionScreen } from "@/components/radar/VoyageTransitionScreen";
import { InvestigationShell } from "@/components/workspace/investigation/InvestigationShell";

// 3. Type definitions
type Props = {
  sessionId: string;
  initialQuery?: string;
  initialDepth?: "recon" | "expedition";
};

// 4. Component
export function WorkspaceClient({
  sessionId,
  initialQuery = "",
  initialDepth = "recon",
}: Props) {
  const [query] = useState<string>(() => {
    if (initialQuery) return initialQuery;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("pending_investigation");
        if (stored) {
          const parsed = JSON.parse(stored) as { query?: string; depth?: "recon" | "expedition" };
          return parsed.query || "";
        }
      } catch {
        // Ignore JSON or storage errors
      }
    }
    return "";
  });

  const [depth] = useState<"recon" | "expedition">(() => {
    if (initialDepth) return initialDepth;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("pending_investigation");
        if (stored) {
          const parsed = JSON.parse(stored) as { query?: string; depth?: "recon" | "expedition" };
          if (parsed.depth) return parsed.depth;
        }
      } catch {
        // Ignore JSON or storage errors
      }
    }
    return "recon";
  });

  const [showTransition, setShowTransition] = useState(true);

  // Clean up pending investigation storage once mounted
  useEffect(() => {
    try {
      sessionStorage.removeItem("pending_investigation");
    } catch {
      // Ignore storage removal errors
    }
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
