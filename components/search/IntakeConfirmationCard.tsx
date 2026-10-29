"use client";

import React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

type Props = {
  refinedQuery: string;
  validationReason?: string;
  onConfirm: () => void;
};

/**
 * Validation and explicit confirmation card for crystallized research inquiries.
 * Satisfies AC-6.
 */
export function IntakeConfirmationCard({
  refinedQuery,
  validationReason,
  onConfirm,
}: Props) {
  return (
    <div className="mt-3 p-3.5 rounded-xl border border-accent/30 bg-accent/5 backdrop-blur-xs space-y-2 animate-in fade-in duration-300">
      <div className="flex items-center gap-1.5 text-accent text-xs font-semibold">
        <CheckCircle2 className="h-4 w-4" />
        <span>Crystallized Research Question</span>
      </div>

      <p className="text-xs md:text-sm font-medium text-foreground italic pl-2 border-l-2 border-accent">
        &ldquo;{refinedQuery}&rdquo;
      </p>

      {validationReason && (
        <p className="text-[11px] text-muted-foreground">{validationReason}</p>
      )}

      <div className="pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="h-8 px-4 rounded-lg bg-accent text-accent-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          <span>Launch Investigation</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
