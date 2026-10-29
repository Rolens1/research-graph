"use client";

// 1. External imports
import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, ChevronRight } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  investigationTitle?: string;
  className?: string;
};

const emptySubscribe = () => () => {};

function getClientTitle(): string {
  if (typeof window === "undefined") return "Investigation Canvas";
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    if (q) return q;
    const stored = sessionStorage.getItem("pending_investigation");
    if (stored) {
      const parsed = JSON.parse(stored) as { query?: string };
      if (parsed.query) return parsed.query;
    }
  } catch {
    // Ignore storage or parsing errors
  }
  return "Investigation Canvas";
}

function getServerTitle(): string {
  return "Investigation Canvas";
}

// 4. Component
export function Breadcrumbs({ investigationTitle, className }: Props) {
  const pathname = usePathname();
  const isWorkspaceHome = pathname === "/workspace";
  const isInvestigationPage = pathname.startsWith("/workspace/") && !isWorkspaceHome;

  // useSyncExternalStore guarantees zero hydration mismatch while synchronizing client storage safely
  const clientTitle = useSyncExternalStore(
    emptySubscribe,
    getClientTitle,
    getServerTitle
  );

  const displayTitle = investigationTitle || clientTitle;

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn("flex items-center gap-2 text-xs font-mono select-none", className)}
    >
      {/* Brand logo & home link */}
      <Link
        href="/"
        className="flex items-center gap-2 group transition-opacity hover:opacity-90"
        title="Chronocause Helm"
      >
        <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs transition-transform group-hover:scale-105">
          <Compass className="h-4 w-4" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-foreground font-sans hidden sm:inline">
          Chronocause
        </span>
      </Link>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />

      {/* Workspace Link */}
      <Link
        href="/workspace"
        className={cn(
          "transition-colors hover:text-foreground",
          isWorkspaceHome
            ? "text-foreground font-semibold"
            : "text-muted-foreground hover:underline"
        )}
      >
        Workspace
      </Link>

      {/* Investigation Title (if active) */}
      {isInvestigationPage && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span
            className="text-foreground font-medium truncate max-w-[140px] sm:max-w-[220px] md:max-w-[340px]"
            title={displayTitle}
            suppressHydrationWarning
          >
            {displayTitle}
          </span>
        </>
      )}
    </nav>
  );
}
