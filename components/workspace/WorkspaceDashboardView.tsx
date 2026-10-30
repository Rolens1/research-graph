"use client";

// 1. External imports
import React, { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import { deleteResearchSessionAction } from "@/actions/research";
import { NewInvestigationModal } from "@/components/nav/NewInvestigationModal";
import { WorkspaceStatsHeader } from "./WorkspaceStatsHeader";
import { WorkspaceFilterBar, type StatusFilter } from "./WorkspaceFilterBar";
import { InvestigationCard, type InvestigationItem } from "./InvestigationCard";
import { InvestigationTable } from "./InvestigationTable";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";

// 3. Type definitions
type Props = {
  initialResearches: InvestigationItem[];
  userEmail?: string;
  className?: string;
};

const VIEW_STORAGE_KEY = "causality_search_workspace_view";

// 4. Component
export function WorkspaceDashboardView({
  initialResearches,
  userEmail,
  className,
}: Props) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(VIEW_STORAGE_KEY);
        if (cached === "grid" || cached === "table") {
          return cached;
        }
      } catch {
        // Local storage disabled or unavailable in private browsing
      }
    }
    return "grid";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deletingSession, setDeletingSession] = useState<{
    id: string;
    query: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [modalInitialQuery, setModalInitialQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derived visible items with optimistic deletion applied
  const items = useMemo(() => {
    return initialResearches.filter((item) => !deletedIds.has(item.id));
  }, [initialResearches, deletedIds]);

  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      // Ignore storage write errors
    }
  };

  // Compute status counts across all active items
  const counts = useMemo(() => {
    let running = 0;
    let completed = 0;
    let failed = 0;

    for (const item of items) {
      if (item.status === "running") running++;
      else if (item.status === "completed") completed++;
      else if (item.status === "failed") failed++;
    }

    return {
      all: items.length,
      running,
      completed,
      failed,
    };
  }, [items]);

  // In-memory filtered list
  const filteredItems = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Title search filter
      if (trimmed && !item.query.toLowerCase().includes(trimmed)) {
        return false;
      }

      return true;
    });
  }, [items, statusFilter, searchQuery]);

  // Execute deletion
  const handleConfirmDelete = async () => {
    if (!deletingSession) return;

    setIsDeleting(true);
    setErrorMessage(null);

    const sessionId = deletingSession.id;

    // Optimistically mark as deleted
    setDeletedIds((prev) => new Set(prev).add(sessionId));

    try {
      const result = await deleteResearchSessionAction({ researchId: sessionId });

      if (!result.success) {
        // Rollback optimistic state
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(sessionId);
          return next;
        });
        setErrorMessage(result.error || "Failed to delete investigation session.");
      } else {
        setDeletingSession(null);
      }
    } catch (err) {
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred during deletion.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cn("space-y-6 max-w-6xl mx-auto w-full", className)}>
      {/* Error Callout Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-mono animate-in fade-in-0 duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="hover:underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats and Greeting Header */}
      <WorkspaceStatsHeader
        userEmail={userEmail}
        totalCount={items.length}
        activeCount={counts.running}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onOpenNewInquiry={() => setNewModalOpen(true)}
      />

      {/* Filter and Search Bar (only show if user has at least 1 investigation) */}
      {items.length > 0 && (
        <WorkspaceFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          counts={counts}
          onClearFilters={() => {
            setSearchQuery("");
            setStatusFilter("all");
          }}
        />
      )}

      {/* Main Content Area */}
      {items.length === 0 ? (
        <WorkspaceEmptyState
          type="no_investigations"
          onNewInquiry={(seedQuery) => {
            setModalInitialQuery(seedQuery || "");
            setNewModalOpen(true);
          }}
        />
      ) : filteredItems.length === 0 ? (
        <WorkspaceEmptyState
          type="no_filter_matches"
          onResetFilters={() => {
            setSearchQuery("");
            setStatusFilter("all");
          }}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <InvestigationCard
              key={item.id}
              item={item}
              onDelete={(id, query) => setDeletingSession({ id, query })}
            />
          ))}
        </div>
      ) : (
        <InvestigationTable
          items={filteredItems}
          onDelete={(id, query) => setDeletingSession({ id, query })}
        />
      )}

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={!!deletingSession}
        sessionTitle={deletingSession?.query}
        isDeleting={isDeleting}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
      />

      <NewInvestigationModal
        isOpen={newModalOpen}
        initialQuery={modalInitialQuery}
        onClose={() => {
          setNewModalOpen(false);
          setModalInitialQuery("");
        }}
      />
    </div>
  );
}
