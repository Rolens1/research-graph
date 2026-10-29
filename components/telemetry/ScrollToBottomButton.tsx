"use client";

// 1. External imports
import React from "react";
import { ArrowDown } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  unreadCount: number;
  onClick: () => void;
  className?: string;
};

// 4. Component
export function ScrollToBottomButton({ unreadCount, onClick, className }: Props) {
  return (
    <div
      className={cn(
        "absolute bottom-3 left-1/2 -translate-x-1/2 z-10 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-[11px] font-mono font-medium shadow-md hover:bg-accent/90 transition-all cursor-pointer border border-accent-foreground/20 active:scale-95"
      >
        <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
        <span>Resume Auto Scroll</span>
        {unreadCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-accent-foreground/25 text-[10px] font-bold">
            +{unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
