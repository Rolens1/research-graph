"use client";

// 1. External imports
import React, { useState, useEffect, useCallback } from "react";

// 2. Internal imports
import { SonarRadarCanvas } from "./SonarRadarCanvas";
import { RadarTelemetryHUD, type RadarStage } from "./RadarTelemetryHUD";
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  query?: string;
  depth?: "recon" | "expedition";
  onComplete: () => void;
  className?: string;
};

// 4. Component
export function VoyageTransitionScreen({
  query = "Autonomous investigation initialization",
  depth = "recon",
  onComplete,
  className,
}: Props) {
  const [stage, setStage] = useState<RadarStage>("sounding");
  const [depthMeters, setDepthMeters] = useState(1000);
  const [activeAgent, setActiveAgent] = useState("The Scout: Sounding web ocean trenches...");

  const handleSkip = useCallback(() => {
    setStage("transitioning");
    setTimeout(() => {
      onComplete();
    }, 250);
  }, [onComplete]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStage("detecting");
      setDepthMeters(2800);
      setActiveAgent("The Cartographer: Plotting causal coordinate nodes...");
    }, 1200);

    const t2 = setTimeout(() => {
      setStage("locked");
      setDepthMeters(4200);
      setActiveAgent("The Navigator: Locking primary causal landmark...");
    }, 2500);

    const t3 = setTimeout(() => {
      setStage("transitioning");
    }, 3600);

    const t4 = setTimeout(() => {
      onComplete();
    }, 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-neutral-canvas flex items-center justify-center transition-all duration-700 ease-in-out",
        stage === "transitioning" ? "scale-125 opacity-0 pointer-events-none" : "scale-100 opacity-100",
        className
      )}
    >
      {/* 360-degree Sonar Canvas */}
      <div className="w-full max-w-3xl h-[65vh] max-h-[600px] flex items-center justify-center relative">
        <SonarRadarCanvas isLocked={stage === "locked" || stage === "transitioning"} />
      </div>

      {/* Telemetry HUD Overlay */}
      <RadarTelemetryHUD
        query={query}
        depth={depth}
        stage={stage}
        activeAgent={activeAgent}
        depthMeters={depthMeters}
        onSkip={handleSkip}
      />
    </div>
  );
}
