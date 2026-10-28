"use client";

// 1. External imports
import React from "react";
import { Activity } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  isConnected?: boolean;
  label?: string;
  className?: string;
};

// 4. Component
export function EngineStatusPill({
  isConnected = true,
  label,
  className,
}: Props) {
  const statusLabel = label || (isConnected ? "ENGINE ONLINE" : "STANDBY");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-mono font-medium border transition-colors select-none",
        isConnected
          ? "bg-secondary text-secondary-foreground border-border"
          : "bg-muted text-muted-foreground border-border/60",
        className
      )}
      title={isConnected ? "Research Engine stream active and ready" : "Engine standing by"}
    >
      <span className="relative flex h-2 w-2">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isConnected ? "bg-accent" : "bg-muted-foreground"
          )}
        />
      </span>
      <span className="hidden sm:inline font-mono">{statusLabel}</span>
      <Activity className="h-3 w-3 sm:hidden text-accent" />
    </div>
  );
}
