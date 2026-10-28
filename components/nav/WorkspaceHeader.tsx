"use client";

// 1. External imports
import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";

// 2. Internal imports
import { Breadcrumbs } from "./Breadcrumbs";
import { EngineStatusPill } from "./EngineStatusPill";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { NewInvestigationModal } from "./NewInvestigationModal";
import { cn } from "@/lib/utils";

// 3. Type definitions
type Props = {
  investigationTitle?: string;
  className?: string;
};

// 4. Component
export function WorkspaceHeader({ investigationTitle, className }: Props) {
  // 1. State & hooks
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut to open new investigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsModalOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Handlers
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // 3. JSX return
  return (
    <>
      <header
        role="banner"
        className={cn(
          "h-14 border-b border-border bg-card/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 select-none transition-colors",
          className
        )}
      >
        {/* Left: Brand logo & dynamic breadcrumbs */}
        <div className="flex items-center min-w-0 mr-4">
          <Breadcrumbs investigationTitle={investigationTitle} />
        </div>

        {/* Right: Telemetry status, new inquiry button, theme switch & user profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Live Engine Connectivity Indicator */}
          <EngineStatusPill isConnected={true} />

          {/* Quick Launch Investigation Button */}
          <button
            type="button"
            onClick={handleOpenModal}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            title="Launch new inquiry (⌘K)"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Investigation</span>
            <kbd className="hidden lg:inline-flex items-center ml-1 px-1.5 py-0.5 rounded bg-primary-foreground/20 text-[10px] font-mono leading-none">
              ⌘K
            </kbd>
          </button>

          {/* Theme Switcher (Neutral Light <-> Obsidian Dark) */}
          <ThemeToggle />

          {/* User Account & Sign Out Dropdown */}
          <UserMenu />
        </div>
      </header>

      {/* Floating Frosted Launch Dialog */}
      <NewInvestigationModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
}
