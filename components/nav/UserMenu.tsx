"use client";

// 1. External imports
import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, LogOut, LogIn, ShieldCheck } from "lucide-react";

// 2. Internal imports
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  className?: string;
};

// 4. Component
export function UserMenu({ className }: Props) {
  // 1. State & hooks
  const { user, isLoading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  // Derived user initials
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "A";
  const userDisplayName = user?.email || "Guest Investigator";

  // 2. Handlers
  const handleSignOutClick = async () => {
    closeMenu();
    await signOut();
  };

  // 3. JSX return
  return (
    <div ref={menuRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="h-8 w-8 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent/20"
        title={user?.email ? `Signed in as ${user.email}` : "Account profile"}
      >
        {isLoading ? (
          <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : user ? (
          userInitial
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-popover text-popover-foreground shadow-glass p-2 z-50 animate-in fade-in-0 zoom-in-95 space-y-2">
          {/* User details header */}
          <div className="px-3 py-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                {user ? userInitial : "G"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate font-sans">
                  {userDisplayName}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mt-0.5">
                  <ShieldCheck className="h-3 w-3 text-accent" />
                  <span>{user ? "Authenticated Analyst" : "Guest Mode"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation / Actions */}
          <div className="space-y-1">
            <Link
              href="/workspace"
              onClick={closeMenu}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-muted text-foreground transition-colors font-medium cursor-pointer"
            >
              <span>Workspace Investigations</span>
            </Link>

            {user ? (
              <button
                type="button"
                onClick={handleSignOutClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors font-medium cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors font-medium cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In with OAuth</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
