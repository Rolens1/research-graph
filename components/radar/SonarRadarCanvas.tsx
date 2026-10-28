"use client";

// 1. External imports
import React, { useEffect, useRef } from "react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Blip = {
  id: string;
  distFraction: number; // 0.1 to 0.85 of radius
  angle: number; // 0 to 2*PI
  intensity: number; // 0 to 1
  label?: string;
};

type Props = {
  isLocked?: boolean;
  className?: string;
};

const SEEDED_BLIPS: Blip[] = [
  { id: "b1", distFraction: 0.35, angle: 0.8, intensity: 0, label: "Anchor Landmark" },
  { id: "b2", distFraction: 0.62, angle: 2.1, intensity: 0, label: "Disputed Claim" },
  { id: "b3", distFraction: 0.48, angle: 3.7, intensity: 0, label: "Primary Source" },
  { id: "b4", distFraction: 0.75, angle: 4.9, intensity: 0, label: "Causal Precedent" },
  { id: "b5", distFraction: 0.28, angle: 5.6, intensity: 0, label: "Milestone Node" },
];

// 4. Component
export function SonarRadarCanvas({ isLocked = false, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const sweepAngleRef = useRef<number>(0);
  const blipsRef = useRef<Blip[]>(SEEDED_BLIPS.map((b) => ({ ...b })));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.88;

      if (maxRadius <= 10) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // 1. Draw Concentric Depth Sounding Range Circles
      const rings = [0.25, 0.5, 0.75, 1.0];
      const ringLabels = ["1,000m", "2,000m", "3,000m", "4,000m"];

      ctx.save();
      rings.forEach((fraction, index) => {
        const r = maxRadius * fraction;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.35)"; // neutral slate ring border
        ctx.lineWidth = 1;
        ctx.stroke();

        // Distance label on vertical axis
        ctx.font = "9px monospace";
        ctx.fillStyle = "rgba(100, 116, 139, 0.75)"; // slate label
        ctx.textAlign = "center";
        ctx.fillText(ringLabels[index], centerX, centerY - r + 12);
      });

      // 2. Cardinal Graticule Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cardinal Labels
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(59, 130, 246, 0.85)"; // Astra intelligence blue
      ctx.textAlign = "center";
      ctx.fillText("N (000°)", centerX, centerY - maxRadius - 8);
      ctx.fillText("S (180°)", centerX, centerY + maxRadius + 16);
      ctx.textAlign = "left";
      ctx.fillText("E (090°)", centerX + maxRadius + 8, centerY + 3);
      ctx.textAlign = "right";
      ctx.fillText("W (270°)", centerX - maxRadius - 8, centerY + 3);

      // 3. Sweeping Beam & Conic Phosphor Trail
      const sweepAngle = sweepAngleRef.current;
      const trailAngle = 0.6; // trailing arc length in radians
      const trailSegments = 24;

      for (let i = 0; i < trailSegments; i++) {
        const segAngleStart = sweepAngle - (trailAngle * (i + 1)) / trailSegments;
        const segAngleEnd = sweepAngle - (trailAngle * i) / trailSegments;
        const alpha = (1 - i / trailSegments) * 0.18;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, segAngleStart, segAngleEnd);
        ctx.closePath();
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`; // sounding cyan glow
        ctx.fill();
      }

      // Main Leading Beam Line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxRadius,
        centerY + Math.sin(sweepAngle) * maxRadius
      );
      ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Center Hub Beacon
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.9)";
      ctx.fill();

      // 4. Update & Draw Landmark Node Blips
      const blips = blipsRef.current;
      blips.forEach((blip, index) => {
        // Detect if sweep beam just crossed this blip
        let diff = sweepAngle - blip.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        if (diff >= 0 && diff < 0.1) {
          blip.intensity = 1.0;
        } else {
          blip.intensity *= 0.975; // phosphor decay
        }

        if (blip.intensity > 0.05) {
          const bx = centerX + Math.cos(blip.angle) * (maxRadius * blip.distFraction);
          const by = centerY + Math.sin(blip.angle) * (maxRadius * blip.distFraction);

          // Glowing point
          ctx.beginPath();
          ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${blip.intensity})`;
          ctx.fill();

          // Outer ping ring
          ctx.beginPath();
          ctx.arc(bx, by, 7 + (1 - blip.intensity) * 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${blip.intensity * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Primary Target Lock-on Reticle (on blip 0)
          if (isLocked && index === 0) {
            const reticleSize = 14;
            ctx.strokeStyle = "rgba(37, 99, 235, 0.95)"; // Astra blue lock
            ctx.lineWidth = 1.5;

            // Reticle corner brackets
            ctx.beginPath();
            // Top Left
            ctx.moveTo(bx - reticleSize, by - reticleSize + 5);
            ctx.lineTo(bx - reticleSize, by - reticleSize);
            ctx.lineTo(bx - reticleSize + 5, by - reticleSize);
            // Top Right
            ctx.moveTo(bx + reticleSize - 5, by - reticleSize);
            ctx.lineTo(bx + reticleSize, by - reticleSize);
            ctx.lineTo(bx + reticleSize, by - reticleSize + 5);
            // Bottom Left
            ctx.moveTo(bx - reticleSize, by + reticleSize - 5);
            ctx.lineTo(bx - reticleSize, by + reticleSize);
            ctx.lineTo(bx - reticleSize + 5, by + reticleSize);
            // Bottom Right
            ctx.moveTo(bx + reticleSize - 5, by + reticleSize);
            ctx.lineTo(bx + reticleSize, by + reticleSize);
            ctx.lineTo(bx + reticleSize, by + reticleSize - 5);
            ctx.stroke();

            // Lock on label
            ctx.font = "9px monospace";
            ctx.fillStyle = "rgba(37, 99, 235, 0.95)";
            ctx.textAlign = "center";
            ctx.fillText("LOCK: ANCHOR CAUSALITY", bx, by + reticleSize + 14);
          }
        }
      });

      ctx.restore();

      // Advance sweep angle (approx 1 full rotation every 3.2 seconds at 60fps)
      sweepAngleRef.current = (sweepAngle + 0.032) % (Math.PI * 2);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isLocked]);

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center overflow-hidden", className)}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
