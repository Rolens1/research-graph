import { Network, GitBranch, ShieldCheck, Activity } from "lucide-react";

type Props = {
  className?: string;
};

export function LoginHero({ className = "" }: Props) {
  return (
    <div className={`flex flex-col justify-between space-y-8 ${className}`}>
      <div className="space-y-6">
        {/* Status indicator pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-secondary text-secondary-foreground border border-border">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span>EVENT INTELLIGENCE PORTAL &bull; SECURE GATEWAY</span>
        </div>

        {/* Hero headline */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Autonomous causal investigation &amp; recursive event intelligence
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Investigate multi-layered inflection points, cross-examine primary sources, resolve contradictory
            claims, and explore deterministic causal knowledge graphs in real time.
          </p>
        </div>

        {/* Architectural feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs space-y-2">
            <div className="flex items-center gap-2 text-foreground font-medium text-xs font-mono">
              <Network className="h-4 w-4 text-accent" />
              <span>RECURSIVE MULTI-AGENT CREW</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Four specialized agent loops conduct web reconnaissance, verify facts, and challenge hypotheses under strict confidence gates.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs space-y-2">
            <div className="flex items-center gap-2 text-foreground font-medium text-xs font-mono">
              <GitBranch className="h-4 w-4 text-emerald-500" />
              <span>DETERMINISTIC TOPOLOGY</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Layered cause-and-effect graphs computed deterministically with ELK layout engine without spatial hallucinations.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs space-y-2">
            <div className="flex items-center gap-2 text-foreground font-medium text-xs font-mono">
              <ShieldCheck className="h-4 w-4 text-entity-decision" />
              <span>ENTERPRISE DATA ISOLATION</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Row Level Security policies enforce strict investigator privacy and isolation directly on PostgreSQL relational tables.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-xs space-y-2">
            <div className="flex items-center gap-2 text-foreground font-medium text-xs font-mono">
              <Activity className="h-4 w-4 text-accent" />
              <span>LIVE TELEMETRY STREAM</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Server-Sent Events transmit agent reasoning, tool invocations, and live source citations directly into your terminal.
            </p>
          </div>
        </div>
      </div>

      {/* Micro system status footer */}
      <div className="pt-6 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>CHRONOCAUSE SUITE v0.1.0</span>
        </div>
        <span>INSFORGE SECURED</span>
      </div>
    </div>
  );
}
