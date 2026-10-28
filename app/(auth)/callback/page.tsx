"use client";

// 1. External imports
import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";

// 2. Internal imports
import { exchangeOAuthCodeAction } from "@/actions/auth";
import { insforge } from "@/lib/insforge-client";

// 3. Type definitions
type ExchangeStatus = "processing" | "success" | "error";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ExchangeStatus>("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function handleExchange() {
      const errorParam = searchParams.get("error");
      const errorDesc = searchParams.get("error_description");
      if (errorParam) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(errorDesc || errorParam || "OAuth provider rejected authentication.");
        }
        return;
      }

      const code = searchParams.get("insforge_code") || searchParams.get("code");
      const redirectTo = searchParams.get("redirectTo") || "/workspace";

      if (!code) {
        // Check if browser client already exchanged or has active session
        try {
          const { data, error } = await insforge.auth.getCurrentUser();
          if (!error && data?.user) {
            if (isMounted) {
              setStatus("success");
              startTransition(() => {
                router.replace(redirectTo);
              });
            }
            return;
          }
        } catch {
          // Continue to error if no code and no active user
        }

        if (isMounted) {
          setStatus("error");
          setErrorMessage("Authorization code missing in callback parameters.");
        }
        return;
      }

      try {
        const result = await exchangeOAuthCodeAction(code);

        if (!result.success) {
          // If server action reported error, check whether client SDK already handled the session
          const { data } = await insforge.auth.getCurrentUser();
          if (data?.user) {
            if (isMounted) {
              setStatus("success");
              startTransition(() => {
                router.replace(redirectTo);
              });
            }
            return;
          }

          if (isMounted) {
            setStatus("error");
            setErrorMessage(result.error || "Failed to exchange authorization code.");
          }
          return;
        }

        if (isMounted) {
          setStatus("success");
          startTransition(() => {
            router.replace(redirectTo);
          });
        }
      } catch (err) {
        console.error("Callback exchange error:", err);
        if (isMounted) {
          setStatus("error");
          setErrorMessage("An unexpected network error occurred while establishing session.");
        }
      }
    }

    void handleExchange();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xs space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
          <Compass className="h-6 w-6" />
        </div>
      </div>

      {status === "processing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm font-mono text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>EXCHANGING SECURITY TOKENS</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Verifying cryptographic proof with InsForge and binding session cookies...
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm font-mono text-entity-decision font-medium">
            <CheckCircle2 className="h-4 w-4" />
            <span>SESSION VERIFIED</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Handshake complete. Redirecting to investigation workspace...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-2 text-sm font-mono text-destructive font-medium">
            <ShieldAlert className="h-4 w-4" />
            <span>AUTHENTICATION FAILED</span>
          </div>
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-mono text-left">
            {errorMessage || "Unable to complete authentication."}
          </div>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="w-full h-10 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Return to Login
          </button>
        </div>
      )}
    </div>
  );
}

export default function CallbackPage() {
  return (
    <main className="min-h-screen bg-neutral-canvas text-foreground flex items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xs text-center space-y-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            <p className="text-xs font-mono text-muted-foreground">INITIALIZING SESSION HANDSHAKE...</p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </main>
  );
}
