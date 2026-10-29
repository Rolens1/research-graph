"use client";

// 1. External imports
import React, { memo } from "react";
import Image from "next/image";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types/graph";

// 3. Type definitions
type Props = {
  backdropUrl?: string;
  entityType?: EntityType;
  className?: string;
};

// Atmospheric procedural gradients tailored to entity categories for zero-cost fallback
const proceduralBackdropGradients: Record<EntityType, string> = {
  event:
    "radial-gradient(ellipse at 40% 40%, rgba(217, 70, 239, 0.15) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(3, 7, 18, 0.98) 100%)",
  decision:
    "radial-gradient(ellipse at 40% 40%, rgba(245, 158, 11, 0.14) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(3, 7, 18, 0.98) 100%)",
  actor:
    "radial-gradient(ellipse at 40% 40%, rgba(6, 182, 212, 0.14) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(3, 7, 18, 0.98) 100%)",
  technology:
    "radial-gradient(ellipse at 40% 40%, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(3, 7, 18, 0.98) 100%)",
  dispute:
    "radial-gradient(ellipse at 40% 40%, rgba(244, 63, 94, 0.16) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(3, 7, 18, 0.98) 100%)",
  enigma:
    "radial-gradient(ellipse at 40% 40%, rgba(168, 85, 247, 0.22) 0%, rgba(245, 158, 11, 0.08) 35%, rgba(15, 23, 42, 0.92) 65%, rgba(3, 7, 18, 0.98) 100%)",
};

// 4. Component
function CinematicBackdropComponent({
  backdropUrl,
  entityType = "event",
  className,
}: Props) {
  const fallbackGradient = proceduralBackdropGradients[entityType];

  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none select-none overflow-hidden z-0",
        className,
      )}
      aria-hidden="true"
    >
      {/* Background Graphic: Curated Asset or Procedural Gradient */}
      {backdropUrl ? (
        <div className="absolute inset-0 w-full h-full transform-gpu transition-transform duration-1000 ease-out">
          <Image
            src={backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter brightness-[0.9] contrast-[1.05] saturate-[1.1]"
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 w-full h-full"
          style={{ background: fallbackGradient }}
        />
      )}

      {/* Gentle directional scrim: crystal clear on the left so image is vivid, darker on the right for text */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/25 via-background/50 to-background/80" />

      {/* Subtle edge shading for cinematic framing */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(3,7,18,0.5)_90%,rgba(3,7,18,0.85)_100%)]" />

      {/* Top and Bottom gradient headers */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/70 to-transparent" />
    </div>
  );
}

export const CinematicBackdrop = memo(CinematicBackdropComponent);
