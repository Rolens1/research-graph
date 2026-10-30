import { Compass, Lock, ShieldCheck } from "lucide-react";
import { OAuthButtons } from "./OAuthButtons";

type Props = {
  redirectTo?: string;
  className?: string;
};

export function LoginCard({ redirectTo, className = "" }: Props) {
  return (
    <div
      className={`w-full max-w-md rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs flex flex-col justify-between space-y-6 ${className}`}
    >
      <div className="space-y-6">
        {/* Brand Icon and Header */}
        <div className="space-y-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
              Sign in to Causality-Search
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select your identity provider to access your research sessions and causal knowledge graphs.
            </p>
          </div>
        </div>

        {/* Auth Method Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute bg-card px-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Identity Provider
          </span>
        </div>

        {/* OAuth Action Buttons */}
        <OAuthButtons redirectTo={redirectTo} />

        {/* Security Assurance Notice */}
        <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-2">
          <div className="flex items-center gap-2 text-foreground font-mono text-xs">
            <ShieldCheck className="h-4 w-4 text-entity-decision shrink-0" />
            <span className="font-medium">Admiralty Log Confidentiality</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All investigations, charted waypoints, and primary citations are bound strictly to your investigator
            identifier via database Row Level Security.
          </p>
        </div>
      </div>

      {/* Card Terms & Protocol Footer */}
      <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-muted-foreground" />
          <span>Encrypted Session</span>
        </div>
        <span>Next.js 16 App Router</span>
      </div>
    </div>
  );
}
