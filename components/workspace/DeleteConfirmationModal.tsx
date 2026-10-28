"use client";

// 1. External imports
import React, { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

// 2. Internal imports
// No internal utils needed

// 3. Type definitions
type Props = {
  isOpen: boolean;
  sessionTitle?: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

// 4. Component
export function DeleteConfirmationModal({
  isOpen,
  sessionTitle,
  isDeleting,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-glass space-y-5 animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h2
              id="delete-dialog-title"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Delete Investigation Session?
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This action is permanent and cannot be undone. All charted entity nodes, causal edges, verified citations, and telemetry logs will be removed.
            </p>
          </div>
        </div>

        {/* Highlighted Session Title */}
        {sessionTitle && (
          <div className="p-3 rounded-xl border border-border bg-muted/40 text-xs font-mono text-foreground line-clamp-2">
            &ldquo;{sessionTitle}&rdquo;
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="h-9 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-9 px-4 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold flex items-center gap-2 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Session</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
