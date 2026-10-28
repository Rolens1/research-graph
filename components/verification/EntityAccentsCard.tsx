// 1. External imports
import {
  Compass,
  Anchor,
  Calendar,
  AlertTriangle,
  Scroll,
  type LucideIcon,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type EntityType = {
  type: string;
  label: string;
  icon: LucideIcon;
  colorClass: string;
};

type Props = {
  className?: string;
};

const ENTITY_TYPES: readonly EntityType[] = [
  { type: "actor", label: "Fleet / Officer", icon: Anchor, colorClass: "bg-entity-actor-bg text-entity-actor-foreground border-entity-actor" },
  { type: "event", label: "Landfall Event", icon: Calendar, colorClass: "bg-entity-event-bg text-entity-event-foreground border-entity-event" },
  { type: "technology", label: "Compass / Gear", icon: Compass, colorClass: "bg-entity-technology-bg text-entity-technology-foreground border-entity-technology" },
  { type: "decision", label: "Charter / Pivot", icon: Scroll, colorClass: "bg-entity-decision-bg text-entity-decision-foreground border-entity-decision" },
  { type: "dispute", label: "Reef Hazard", icon: AlertTriangle, colorClass: "bg-entity-dispute-bg text-entity-dispute-foreground border-entity-dispute" },
];

// 4. Component
export function EntityAccentsCard({ className }: Props) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-6 shadow-xs space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          03. Cartographic Entity Accents
        </h2>
        <Compass className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-card-foreground">
        Distinct typed accents assigned to graph entities on the causal navigation chart:
      </p>
      <div className="flex flex-wrap gap-2">
        {ENTITY_TYPES.map((item) => {
          const Icon = item.icon;
          return (
            <span
              key={item.type}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border",
                item.colorClass
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}
