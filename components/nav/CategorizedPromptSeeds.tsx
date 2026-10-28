"use client";

// 1. External imports
import React, { useState } from "react";
import { Globe, Cpu, Anchor, Landmark, Sparkles } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
export type DomainCategory = "geopolitics" | "technology" | "trade" | "history";

type DomainSeedGroup = {
  id: DomainCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  seeds: string[];
};

type Props = {
  onSelectSeed: (seed: string) => void;
  activeSeed?: string;
  disabled?: boolean;
  className?: string;
};

export const DOMAIN_SEED_GROUPS: DomainSeedGroup[] = [
  {
    id: "geopolitics",
    label: "Geopolitics",
    icon: Globe,
    seeds: [
      "Red Sea Maritime Chokepoints & Bab el-Mandeb Interdiction",
      "Lithium Triangle Nationalization in South America",
      "Arctic Maritime Passage Sovereign Claims",
    ],
  },
  {
    id: "technology",
    label: "Frontier Tech",
    icon: Cpu,
    seeds: [
      "Chinese EV Tariffs & Sodium Batteries in 2024",
      "RISC-V vs ARM Architecture Rivalry",
      "Advanced Packaging Bottlenecks in TSMC CoWoS",
    ],
  },
  {
    id: "trade",
    label: "Global Trade",
    icon: Anchor,
    seeds: [
      "Panama Canal Drought Restrictions & Transit Surcharges",
      "Semiconductor Supply Chain Nearshoring in North America",
      "Rare Earth Minerals Export Controls & Magnet Production",
    ],
  },
  {
    id: "history",
    label: "Historic Pivots",
    icon: Landmark,
    seeds: [
      "Fall of Napoleon: Causes & Turning Points in 1812",
      "Origins of the Silk Road Maritime Routes",
      "The 1973 Oil Embargo & Dollar Recycling Mechanics",
    ],
  },
];

// 4. Component
export function CategorizedPromptSeeds({
  onSelectSeed,
  activeSeed,
  disabled = false,
  className,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<DomainCategory>("geopolitics");

  const currentGroup = DOMAIN_SEED_GROUPS.find((g) => g.id === activeCategory) || DOMAIN_SEED_GROUPS[0];

  return (
    <div className={cn("space-y-3 select-none", className)}>
      {/* Category Tabs Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Sparkles className="h-3 w-3 text-entity-decision" />
          <span>Curated Expedition Seeds:</span>
        </div>

        {/* Domain Tab Buttons */}
        <div
          role="tablist"
          aria-label="Domain seed categories"
          className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/60 text-[10px] font-mono"
        >
          {DOMAIN_SEED_GROUPS.map((group) => {
            const Icon = group.icon;
            const isTabActive = activeCategory === group.id;

            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={isTabActive}
                onClick={() => setActiveCategory(group.id)}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer disabled:opacity-50",
                  isTabActive
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{group.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seed Chips */}
      <div className="flex flex-wrap gap-1.5">
        {currentGroup.seeds.map((seed) => {
          const isSelected = activeSeed === seed;

          return (
            <button
              key={seed}
              type="button"
              onClick={() => onSelectSeed(seed)}
              disabled={disabled}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer text-left disabled:opacity-50",
                isSelected
                  ? "bg-accent/15 text-accent border-accent/40 font-semibold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70",
              )}
            >
              {seed}
            </button>
          );
        })}
      </div>
    </div>
  );
}
