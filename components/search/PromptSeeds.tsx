"use client";

// 1. External imports
import { ArrowUpRight, MoreHorizontal, Sparkles } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type PromptSeed = {
  id: string;
  domain: string;
  title: string;
};

type Props = {
  onSelectSeed: (prompt: string) => void;
  className?: string;
};

const PROMPT_SEEDS: readonly PromptSeed[] = [
  {
    id: "semiconductors",
    domain: "Frontier Compute",
    title: "The geopolitical race for 2nm EUV semiconductor lithography",
  },
  {
    id: "biotech",
    domain: "Biotechnology",
    title: "CRISPR off-target editing disputes in clinical gene therapies",
  },
  {
    id: "fusion",
    domain: "Energy Physics",
    title: "Commercial magnetic confinement nuclear fusion net energy milestones",
  },
  {
    id: "macro",
    domain: "Global Macro",
    title: "The 1971 Bretton Woods collapse and dollar reserve hegemony",
  },
];

// 4. Component (Clean suggestions card matching landing-idea.png reference)
export function PromptSeeds({ onSelectSeed, className }: Props) {
  return (
    <div
      className={cn(
        "w-full max-w-2xl rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-2 shadow-glass space-y-1",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-b border-border/40">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Suggested Inquiries</span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">Trending</span>
      </div>

      <div className="space-y-0.5">
        {PROMPT_SEEDS.map((seed) => (
          <button
            key={seed.id}
            type="button"
            onClick={() => onSelectSeed(seed.title)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors truncate">
                {seed.title}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0 border border-border/50">
                {seed.domain}
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
              <span
                className="p-1 rounded-md hover:bg-muted/90 text-muted-foreground hover:text-foreground transition-colors"
                title="Details"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSeed(seed.title);
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </span>
              <span
                className="p-1 rounded-md hover:bg-muted/90 text-muted-foreground hover:text-foreground transition-colors"
                title="Explore inquiry"
              >
                <ArrowUpRight className="h-3.5 w-3.5 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
