"use client";

// 1. External imports
import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  FileDown,
  Clock,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  sessionId: string;
  query: string;
  depth?: "recon" | "expedition";
  confidenceScore: number;
  status: "running" | "completed" | "failed";
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  isTimelineOpen: boolean;
  onToggleTimeline: () => void;
  onExportPdf?: () => void;
  className?: string;
};

// 4. Component
export function InvestigationHeader({
  sessionId,
  query,
  depth = "recon",
  confidenceScore,
  status,
  isTerminalOpen,
  onToggleTerminal,
  isTimelineOpen,
  onToggleTimeline,
  onExportPdf,
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  const handleCopyLink = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <header
      className={cn(
        "h-14 px-4 md:px-6 border-b border-border/80 bg-card/70 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-20 select-none",
        className,
      )}
    >
      {/* Left: Back Link and Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/workspace"
          className="h-8 w-8 rounded-lg border border-border/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-xs"
          title="Return to Workspace Index"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-muted-foreground shrink-0">
            <span>Chart</span>
            <span className="text-border">/</span>
          </div>

          <h1
            className="text-xs md:text-sm font-semibold text-foreground truncate font-sans max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg"
            title={query || "Uncharted Investigation"}
          >
            {query || "Uncharted Investigation"}
          </h1>

          {/* Depth pill */}
          <span
            className={cn(
              "hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider border shrink-0",
              depth === "expedition"
                ? "bg-entity-decision-bg text-entity-decision-foreground border-entity-decision"
                : "bg-muted text-muted-foreground border-border",
            )}
          >
            {depth}
          </span>
        </div>
      </div>

      {/* Right: Metrics, Panel Toggles, Actions */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Confidence Meter */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/50 border border-border/60 shadow-xs"
          title={`Epistemic Confidence: ${confidenceScore}%`}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              confidenceScore >= 85
                ? "bg-entity-technology animate-pulse"
                : "bg-entity-decision",
            )}
          />
          <span className="text-[11px] font-mono text-muted-foreground">Confidence:</span>
          <span className="text-xs font-mono font-bold text-foreground">
            {confidenceScore}%
          </span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center">
          {isRunning && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium bg-accent/15 text-accent border border-accent/40 shadow-xs">
              <Compass className="h-3 w-3 animate-spin shrink-0" />
              <span className="hidden md:inline">Sounding</span>
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium bg-entity-technology-bg text-entity-technology-foreground border border-entity-technology shadow-xs">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span className="hidden md:inline">Verified</span>
            </span>
          )}
          {isFailed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium bg-destructive/15 text-destructive border border-destructive/40 shadow-xs">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span className="hidden md:inline">Halted</span>
            </span>
          )}
        </div>

        {/* Panel View Toggles Group */}
        <div
          role="group"
          aria-label="Panel Visibility Controls"
          className="flex items-center p-0.5 rounded-xl bg-muted/60 border border-border/80 shadow-xs"
        >
          {/* Timeline toggle */}
          <button
            type="button"
            onClick={onToggleTimeline}
            aria-pressed={isTimelineOpen}
            title={isTimelineOpen ? "Hide Chrono Timeline (Zone 3)" : "Show Chrono Timeline (Zone 3)"}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer",
              isTimelineOpen
                ? "bg-card text-foreground shadow-xs border border-border/60 font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden lg:inline text-[11px]">Timeline</span>
          </button>

          {/* Terminal toggle */}
          <button
            type="button"
            onClick={onToggleTerminal}
            aria-pressed={isTerminalOpen}
            title={isTerminalOpen ? "Hide Live Terminal (Zone 2)" : "Show Live Terminal (Zone 2)"}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer",
              isTerminalOpen
                ? "bg-card text-foreground shadow-xs border border-border/60 font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span className="hidden lg:inline text-[11px]">Terminal</span>
          </button>
        </div>

        {/* Copy Link button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs"
          title="Copy investigation URL to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-entity-technology" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Export PDF Button */}
        {onExportPdf ? (
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        ) : (
          <a
            href={`/api/export/${sessionId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </a>
        )}
      </div>
    </header>
  );
}
