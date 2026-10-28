"use client";

// 1. External imports
import Link from "next/link";
import { LogIn, LogOut, LayoutGrid, User, Sparkles } from "lucide-react";

// 2. Internal imports
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  className?: string;
};

// 4. Component (Clean Google/Yahoo style top navigation bar)
export function LandingHeader({ className }: Props) {
  const { user, isLoading, signOut } = useAuth();

  return (
    <header className={cn("w-full flex items-center justify-between py-4 px-6 md:px-12", className)}>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-foreground">Chronocause</span>
          <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border/60">
            Event Intelligence
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="h-8 w-24 rounded-lg bg-muted/50 animate-pulse border border-border" />
        ) : user ? (
          <div className="flex items-center gap-2">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card hover:bg-muted text-foreground border border-border transition-colors shadow-xs"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-accent" />
              <span>Workspace</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono text-muted-foreground bg-muted/50 border border-border">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="max-w-[120px] truncate">{user.email}</span>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
