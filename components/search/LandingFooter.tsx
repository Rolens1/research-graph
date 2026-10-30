// 1. External imports
import { GitBranch, ShieldCheck } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  className?: string;
};

// 4. Component (Clean minimal footer)
export function LandingFooter({ className }: Props) {
  return (
    <footer
      className={cn(
        "w-full py-4 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2 border-t border-border/40",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">Causality-Search</span>
        <span>&bull;</span>
        <span>Autonomous Causal Event Intelligence</span>
      </div>

      <div className="flex items-center gap-4 text-[11px] font-mono">
        <span className="flex items-center gap-1.5">
          <GitBranch className="h-3 w-3 text-accent" />
          <span>Deterministic Graph Topology</span>
        </span>
        <span>&bull;</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-success" />
          <span>InsForge RLS</span>
        </span>
      </div>
    </footer>
  );
}
