"use client";

// 1. External imports
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, Terminal, Clock, Network, ArrowLeft } from "lucide-react";

// 2. Internal imports
import { VoyageTransitionScreen } from "@/components/radar/VoyageTransitionScreen";

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
    <div className="min-h-screen bg-neutral-canvas text-foreground flex flex-col relative selection:bg-accent/20 selection:text-accent">
      {/* 360-degree Sonar Radar Transition Screen Overlay */}
      {showTransition && (
        <VoyageTransitionScreen
          query={query}
          depth={depth}
          onComplete={() => setShowTransition(false)}
        />
      )}

      {/* Workspace Top Navigation Bar */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors cursor-pointer"
            title="Return to Search"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground">
                <span className="truncate max-w-xs md:max-w-md">{query || "Untitled Investigation"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                  {depth.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="hidden sm:inline">SESSION:</span>
          <span className="font-semibold text-primary">{sessionId.slice(0, 8)}</span>
        </div>
      </header>

      {/* 3-Zone Investigation Screen Shell Scaffold (Ready for Phase 2) */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Zone 1: Interactive Causal Canvas (8 cols on large screens) */}
        <div className="lg:col-span-8 rounded-2xl border border-border bg-card/50 backdrop-blur-xs p-6 flex flex-col justify-between shadow-xs relative overflow-hidden min-h-[400px]">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">ZONE 1: CAUSAL KNOWLEDGE GRAPH</span>
            </div>
            <span>ELK.JS DETERMINISTIC TOPOLOGY</span>
          </div>

          <div className="my-auto text-center space-y-3 py-16">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border mx-auto flex items-center justify-center text-muted-foreground">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Investigation Canvas Initialized
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Radar scan successfully locked on causality landmarks. Full 3-zone layout unfolding in Phase 2.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-3 border-t border-border/60">
            <span>COORDINATES: DETERMINISTIC</span>
            <span>NODES: 0 &bull; EDGES: 0</span>
          </div>
        </div>

        {/* Right Stack: Zone 2 Terminal & Zone 3 Timeline (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Zone 2: Live Agent Terminal */}
          <div className="flex-1 rounded-2xl border border-border bg-card/50 backdrop-blur-xs p-4 flex flex-col justify-between shadow-xs min-h-[220px]">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-accent" />
                <span className="font-medium text-foreground">ZONE 2: LIVE TELEMETRY</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            </div>

            <div className="font-mono text-[11px] text-muted-foreground p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <div>[SYSTEM] Handshake verified with InsForge</div>
              <div>[RADAR] Sonar lock completed on landmark</div>
              <div>[STREAM] Awaiting agent telemetry feed...</div>
            </div>

            <div className="text-[10px] font-mono text-muted-foreground pt-2 border-t border-border/60">
              SSE EVENT STREAM READY
            </div>
          </div>

          {/* Zone 3: Investigation Timeline */}
          <div className="flex-1 rounded-2xl border border-border bg-card/50 backdrop-blur-xs p-4 flex flex-col justify-between shadow-xs min-h-[220px]">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-b border-border/60 pb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-entity-event" />
                <span className="font-medium text-foreground">ZONE 3: TIMELINE</span>
              </div>
              <span>CHRONOLOGY</span>
            </div>

            <div className="my-auto text-center py-6 text-xs text-muted-foreground font-mono">
              Milestone events will populate chronologically as research streams.
            </div>

            <div className="text-[10px] font-mono text-muted-foreground pt-2 border-t border-border/60">
              CHRONOCAUSE SUITE v0.1
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
