// 1. External imports
import { Compass } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type AgentChannel = {
  name: string;
  nauticalRole: string;
  colorClass: string;
};

type Props = {
  className?: string;
};

const AGENT_CHANNELS: readonly AgentChannel[] = [
  {
    name: "The Cartographer",
    nauticalRole: "Decomposes inquiries and maps uncharted causality",
    colorClass: "text-agent-architect border-agent-architect",
  },
  {
    name: "The Scout",
    nauticalRole: "Deep web sounding and evidence extraction",
    colorClass: "text-agent-reader border-agent-reader",
  },
  {
    name: "The Chronicler",
    nauticalRole: "Cross validates log entries and flags disputes",
    colorClass: "text-agent-checker border-agent-checker",
  },
  {
    name: "The Navigator",
    nauticalRole: "Deterministic ELK coordinate charting",
    colorClass: "text-agent-visualizer border-agent-visualizer",
  },
];

// 4. Component
export function AgentChannelsCard({ className }: Props) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-6 shadow-xs space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          04. Expedition Agent Crew
        </h2>
        <Compass className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm text-card-foreground">
        Streamed telemetry roles for the maritime investigation crew:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
        {AGENT_CHANNELS.map((agent) => (
          <div key={agent.name} className="p-3 rounded-lg border border-border bg-muted/40 space-y-1">
            <div className={cn("font-semibold flex items-center gap-1.5", agent.colorClass)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {agent.name}
            </div>
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              {agent.nauticalRole}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
