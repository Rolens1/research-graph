"use client";

import React from "react";
import { Send } from "lucide-react";
import type { IntakeStatus } from "@/types/intake";

type Props = {
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  status: IntakeStatus;
};

export function IntakeInputBar({
  inputText,
  onInputChange,
  onSubmit,
  isLoading,
  status,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="p-3 border-t border-border/60 bg-card flex items-center gap-2">
      <input
        type="text"
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={
          status === "harmful_blocked"
            ? "Please enter a permissible research inquiry..."
            : "Reply to clarify or refine your question..."
        }
        className="flex-1 bg-transparent px-3 py-2 text-xs md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!inputText.trim() || isLoading}
        className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
