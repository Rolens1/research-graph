"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createResearchSessionAction } from "@/actions/research";
import { generateDefaultSubQueries } from "./SubQueryDecompositionPreview";
import { NewInvestigationForm } from "./NewInvestigationForm";
import { IntakeMessenger } from "@/components/search/IntakeMessenger";
import type { IntakeMessage } from "@/types/intake";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
};

export function NewInvestigationModal({ isOpen, onClose, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [depth, setDepth] = useState<"recon" | "expedition">("recon");
  const [subQueries, setSubQueries] = useState<string[]>(() =>
    initialQuery.length >= 5 ? generateDefaultSubQueries(initialQuery) : [],
  );
  const [isIntakeActive, setIsIntakeActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setQuery(initialQuery);
    setSubQueries(initialQuery.length >= 5 ? generateDefaultSubQueries(initialQuery) : []);
  }

  const handleClose = useCallback(() => {
    setQuery("");
    setSubQueries([]);
    setErrorMessage(null);
    setIsSubmitting(false);
    setIsIntakeActive(false);
    onClose();
  }, [onClose]);

  const handleSelectSeed = (seed: string) => {
    setQuery(seed);
    setErrorMessage(null);
    setSubQueries(generateDefaultSubQueries(seed));
  };

  const handleOpenIntake = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setErrorMessage("Please enter an investigation question with at least 3 characters.");
      return;
    }
    setErrorMessage(null);
    setIsIntakeActive(true);
  }, [query]);

  const handleConfirmLaunch = useCallback(
    async (refinedQuery: string, intakeHistory: IntakeMessage[]) => {
      setIsSubmitting(true);
      setErrorMessage(null);

      const finalQuery = refinedQuery.trim() || query.trim();

      try {
        const activeAngles =
          subQueries.length > 0 ? subQueries : generateDefaultSubQueries(finalQuery);
        const result = await createResearchSessionAction({
          query: finalQuery,
          depth,
          subQueries: activeAngles,
        });

        if (!result.success || !result.researchId) {
          setErrorMessage(result.error || "Failed to start investigation.");
          setIsSubmitting(false);
          setIsIntakeActive(false);
          return;
        }

        try {
          sessionStorage.setItem(
            "pending_investigation",
            JSON.stringify({
              query: finalQuery,
              originalQuery: query.trim(),
              depth,
              subQueries: activeAngles,
              intakeHistory,
              sessionId: result.researchId,
            }),
          );
        } catch {
          // Ignore storage errors
        }

        handleClose();
        router.push(
          `/workspace/${result.researchId}?q=${encodeURIComponent(finalQuery)}&depth=${depth}`,
        );
      } catch (err) {
        console.error("Launch error:", err);
        setErrorMessage("An unexpected error occurred while launching.");
        setIsSubmitting(false);
        setIsIntakeActive(false);
      }
    },
    [query, depth, subQueries, handleClose, router],
  );

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !isIntakeActive) {
        e.preventDefault();
        if (query.trim().length >= 3 && !isSubmitting) {
          handleOpenIntake();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, query, isSubmitting, isIntakeActive, handleClose, handleOpenIntake]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) handleClose();
      }}
    >
      {isIntakeActive ? (
        <IntakeMessenger
          initialQuery={query}
          depth={depth}
          onConfirmLaunch={handleConfirmLaunch}
          onCancel={() => setIsIntakeActive(false)}
        />
      ) : (
        <NewInvestigationForm
          query={query}
          onQueryChange={(val) => {
            setQuery(val);
            if (errorMessage) setErrorMessage(null);
          }}
          depth={depth}
          onDepthChange={setDepth}
          subQueries={subQueries}
          onSubQueriesChange={setSubQueries}
          errorMessage={errorMessage}
          isSubmitting={isSubmitting}
          onSubmit={handleOpenIntake}
          onClose={handleClose}
          onSelectSeed={handleSelectSeed}
        />
      )}
    </div>
  );
}
