"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

type Props = {
  warning?: string;
};

/**
 * Policy restriction warning banner when harmful content is detected.
 * Satisfies AC-5.
 */
export function IntakePolicyWarning({ warning }: Props) {
  return (
    <div className="mt-3 p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs space-y-1 animate-in fade-in duration-300">
      <div className="flex items-center gap-1.5 font-semibold">
        <AlertTriangle className="h-4 w-4" />
        <span>Research Policy Restriction</span>
      </div>
      <p>{warning || "This inquiry touches prohibited topics and cannot be investigated."}</p>
    </div>
  );
}
