// 1. External imports
import { Compass, ArrowRight } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  completedLabel?: string;
  nextStepLabel?: string;
  activeFile?: string;
  className?: string;
};

// 4. Component
export function VerificationFooter({
  completedLabel = "Feature 04.1 Nautical Cartography Design Tokens Verified",
  nextStepLabel = "Next: 04.2 Google Style Nautical Search Landing Page",
  activeFile = "app/globals.css",
  className,
}: Props) {
  return (
    <footer
      className={cn(
        "rounded-xl border border-border bg-muted/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Compass className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">{completedLabel}</p>
          <p className="text-xs text-muted-foreground">{nextStepLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <span>{activeFile}</span>
        <ArrowRight className="h-3.5 w-3.5 text-primary" />
      </div>
    </footer>
  );
}
