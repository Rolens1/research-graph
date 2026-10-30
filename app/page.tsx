"use client";

// 1. External imports
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch } from "lucide-react";

// 2. Internal imports
import { LandingHeader } from "@/components/search/LandingHeader";
import { SearchHelm, type SearchDepth } from "@/components/search/SearchHelm";
import { IntakeMessenger } from "@/components/search/IntakeMessenger";
import { PromptSeeds } from "@/components/search/PromptSeeds";
import { LandingFooter } from "@/components/search/LandingFooter";
import { createResearchSessionAction } from "@/actions/research";
import type { IntakeMessage } from "@/types/intake";

// 3. Type definitions (none required beyond SearchDepth)

// 4. Component (Clean Google/Yahoo/Astra style neutral search landing page)
export function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState<SearchDepth>("recon");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIntakeActive, setIsIntakeActive] = useState(false);

  const handleSelectSeed = (seedPrompt: string) => {
    setQuery(seedPrompt);
  };

  const handleOpenIntake = () => {
    const trimmed = query.trim();
    if (!trimmed || isSubmitting) return;
    setIsIntakeActive(true);
  };

  const handleConfirmLaunch = async (refinedQuery: string, intakeHistory: IntakeMessage[]) => {
    setIsSubmitting(true);
    const finalQuery = refinedQuery.trim() || query.trim();

    try {
      const result = await createResearchSessionAction({
        query: finalQuery,
        depth,
      });

      if (!result.success || !result.researchId) {
        console.error("Failed to start research:", result.error);
        setIsSubmitting(false);
        return;
      }

      const sessionId = result.researchId;
      const targetUrl = `/workspace/${sessionId}?q=${encodeURIComponent(finalQuery)}&depth=${depth}`;

      try {
        sessionStorage.setItem(
          "pending_investigation",
          JSON.stringify({
            query: finalQuery,
            originalQuery: query.trim(),
            depth,
            sessionId,
            intakeHistory,
          }),
        );
      } catch (err) {
        console.error("Failed to store pending investigation:", err);
      }

      router.push(targetUrl);
    } catch (err) {
      console.error("Error creating investigation session:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-canvas text-foreground flex flex-col justify-between selection:bg-accent/20 selection:text-accent transition-colors duration-200">
      <LandingHeader />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full space-y-6 my-auto">
        {/* Brand Emblem & Headline (Clean institutional aesthetic) */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
            <GitBranch className="h-6 w-6 text-accent" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Causality-Search
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              Autonomous causal event intelligence and verified knowledge graphs.
            </p>
          </div>
        </div>

        {/* Center Card: Morphing between SearchHelm and IntakeMessenger */}
        {isIntakeActive ? (
          <IntakeMessenger
            initialQuery={query}
            depth={depth}
            onConfirmLaunch={handleConfirmLaunch}
            onCancel={() => setIsIntakeActive(false)}
          />
        ) : (
          <>
            <SearchHelm
              query={query}
              onQueryChange={setQuery}
              depth={depth}
              onDepthChange={setDepth}
              onSubmit={handleOpenIntake}
              isSubmitting={isSubmitting}
            />

            <PromptSeeds onSelectSeed={handleSelectSeed} />
          </>
        )}
      </div>

      <LandingFooter />
    </main>
  );
}

export default HomePage;
