// 1. External imports
import { Sparkles } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  className?: string;
};

// 4. Component
export function TokenShowcaseCard({ className }: Props) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-6 shadow-xs space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          01. Abyssal &amp; Admiralty Surfaces
        </h2>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm text-card-foreground">
        Nautical cartography palette in Tailwind v4 tokens. Oceanic abyss default and aged parchment light mode with zero raw hex codes.
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-3 rounded-lg bg-muted border border-border">
          <span className="block font-semibold">bg-muted</span>
          <span className="text-muted-foreground text-[11px]">Sounding deck panels</span>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border">
          <span className="block font-semibold">bg-card</span>
          <span className="text-muted-foreground text-[11px]">Abyssal slate chart table</span>
        </div>
        <div className="p-3 rounded-lg bg-primary text-primary-foreground shadow-xs">
          <span className="block font-semibold">bg-primary</span>
          <span className="opacity-90 text-[11px]">Primary action</span>
        </div>
        <div className="p-3 rounded-lg bg-secondary text-secondary-foreground border border-border">
          <span className="block font-semibold">bg-secondary</span>
          <span className="text-muted-foreground text-[11px]">Night tide slate pills</span>
        </div>
      </div>
    </section>
  );
}
