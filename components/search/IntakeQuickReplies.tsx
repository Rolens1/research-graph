"use client";

import React from "react";

type Props = {
  quickReplies: string[];
  isLoading: boolean;
  onSelect: (reply: string) => void;
};

/**
 * One tap suggestion chips for quick responses in the intake counselor.
 * Satisfies AC 4.
 */
export function IntakeQuickReplies({ quickReplies, isLoading, onSelect }: Props) {
  if (quickReplies.length === 0 || isLoading) return null;

  return (
    <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-border/40 bg-muted/20">
      {quickReplies.map((reply) => (
        <button
          key={reply}
          type="button"
          onClick={() => onSelect(reply)}
          className="px-2.5 py-1 rounded-full text-[11px] bg-muted/80 hover:bg-muted text-foreground border border-border/80 transition-colors cursor-pointer hover:border-accent/40"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
