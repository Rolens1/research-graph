// 1. External imports
import React from "react";

// 2. Internal imports
import { WorkspaceHeader } from "@/components/nav/WorkspaceHeader";

// 3. Type definitions
type Props = {
  children: React.ReactNode;
  params?: Promise<Record<string, string | string[]>>;
};

// 4. Component (Next.js 16 App Router Server Component Layout)
export default function WorkspaceLayout({ children }: Props) {
  return (
    <div className="h-screen flex flex-col bg-neutral-canvas text-foreground overflow-hidden">
      <WorkspaceHeader />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
