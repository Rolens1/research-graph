// 1. External imports
import { Terminal } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  className?: string;
};

// 4. Component
export function TypographyShowcaseCard({ className }: Props) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-6 shadow-xs space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          02. Navigational Typography
        </h2>
        <Terminal className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        <div>
          <span className="text-xs font-mono text-muted-foreground">Sans Primary (Inter):</span>
          <p className="text-base font-semibold leading-tight text-foreground">
            Expedition Log &amp; Autonomous Multi Agent Causal Charting
          </p>
        </div>
        <div>
          <span className="text-xs font-mono text-muted-foreground">Vellum Body Copy:</span>
          <p className="text-sm text-foreground">
            Synthesizing primary ship logs, disputed claims, and charted landmarks across deep web ocean trenches.
          </p>
        </div>
        <div>
          <span className="text-xs font-mono text-muted-foreground">Coordinate &amp; Telemetry Mono (Geist Mono):</span>
          <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded-md border border-border">
            [BEARING 314° NW] depth=4200m waypoints=18 currents=24 confidence=96.4%
          </p>
        </div>
      </div>
    </section>
  );
}
