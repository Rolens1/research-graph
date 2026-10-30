"use client";

// 1. External imports
import React from "react";
import { Sun, Moon } from "lucide-react";

// 2. Internal imports
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  className?: string;
};

// 4. Component
export function ThemeToggle({ className }: Props) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to neutral light mode" : "Switch to obsidian dark mode"}
      title={isDark ? "Switch to neutral light mode" : "Switch to obsidian dark mode"}
      className={cn(
        "h-8 w-8 rounded-lg border border-border bg-card/70 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs",
        className
      )}
    >
      {!mounted ? (
        <span className="h-4 w-4" aria-hidden="true" />
      ) : isDark ? (
        <Sun className="h-4 w-4 transition-transform hover:rotate-45 text-entity-decision" />
      ) : (
        <Moon className="h-4 w-4 transition-transform hover:-rotate-12 text-foreground" />
      )}
    </button>
  );
}
