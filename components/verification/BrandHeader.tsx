// 1. External imports
import { Compass } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  title?: string;
  subtitle?: string;
  phaseLabel?: string;
  className?: string;
};

// 4. Component
export function BrandHeader({
  title = "Chronocause Expedition",
  subtitle = "Age of Exploration & Nautical Causal Graph Engine",
  phaseLabel = "Nautical Cartography Engine Active",
  className,
}: Props) {
  return (
    <header className={cn("border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
      <div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground font-mono">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-secondary text-secondary-foreground border border-border">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          {phaseLabel}
        </span>
      </div>
    </header>
  );
}
