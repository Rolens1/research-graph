"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchDepth } from "./SearchHelm";
import type { IntakeMessage, IntakeStatus, IntakeApiResponse } from "@/types/intake";
import { MessengerBubble, TypingIndicatorBubble } from "./MessengerBubble";
import { IntakeConfirmationCard } from "./IntakeConfirmationCard";
import { IntakePolicyWarning } from "./IntakePolicyWarning";
import { IntakeQuickReplies } from "./IntakeQuickReplies";
import { IntakeInputBar } from "./IntakeInputBar";

type Props = {
  initialQuery: string;
  depth: SearchDepth;
  onConfirmLaunch: (refinedQuery: string, intakeHistory: IntakeMessage[]) => void;
  onCancel: () => void;
  className?: string;
};

export function IntakeMessenger({
  initialQuery,
  depth,
  onConfirmLaunch,
  onCancel,
  className,
}: Props) {
  const [messages, setMessages] = useState<IntakeMessage[]>(() => [
    {
      id: "msg_init_user",
      role: "user",
      content: initialQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<IntakeStatus>("clarifying");
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [refinedQuery, setRefinedQuery] = useState(initialQuery);
  const [validationReason, setValidationReason] = useState("");
  const [policyWarning, setPolicyWarning] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, status]);

  // Initial turn: assess the initial query on mount asynchronously
  useEffect(() => {
    let ignore = false;

    async function initialAssessment() {
      try {
        const res = await fetch("/api/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: initialQuery }],
            currentQuery: initialQuery,
            depth,
          }),
        });

        if (!res.ok) throw new Error("Intake API failure");
        const data: IntakeApiResponse = await res.json();

        if (!ignore) {
          const assistantMsg: IntakeMessage = {
            id: `msg_asst_${Date.now()}`,
            role: "assistant",
            content: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setStatus(data.status);
          setQuickReplies(data.quickReplies || []);
          if (data.refinedQuery) setRefinedQuery(data.refinedQuery);
          if (data.validationReason) setValidationReason(data.validationReason);
          if (data.policyWarning) setPolicyWarning(data.policyWarning);
        }
      } catch (err) {
        console.warn("[IntakeMessenger] Initial assessment failed:", err);
        if (!ignore) {
          const fallbackMsg: IntakeMessage = {
            id: `msg_asst_fb_${Date.now()}`,
            role: "assistant",
            content: `I will investigate "${initialQuery}". Are you ready to launch the autonomous agents?`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, fallbackMsg]);
          setStatus("ready_for_confirmation");
          setQuickReplies(["Launch investigation", "Focus on timeline", "Focus on economic causes"]);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void initialAssessment();
    return () => {
      ignore = true;
    };
  }, [initialQuery, depth]);

  const handleSendMessage = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText || isLoading) return;

    const userMsg: IntakeMessage = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText("");
    setIsLoading(true);
    setQuickReplies([]);

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          currentQuery: cleanText,
          depth,
        }),
      });

      if (!res.ok) throw new Error("Intake API failure");
      const data: IntakeApiResponse = await res.json();

      const assistantMsg: IntakeMessage = {
        id: `msg_asst_${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStatus(data.status);
      setQuickReplies(data.quickReplies || []);
      if (data.refinedQuery) setRefinedQuery(data.refinedQuery);
      if (data.validationReason) setValidationReason(data.validationReason);
      if (data.policyWarning) setPolicyWarning(data.policyWarning);
    } catch (err) {
      console.warn("[IntakeMessenger] Turn failed:", err);
      const fallbackMsg: IntakeMessage = {
        id: `msg_asst_err_${Date.now()}`,
        role: "assistant",
        content: `I will investigate "${cleanText}". Are you ready to launch the autonomous agents?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setStatus("ready_for_confirmation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div
      className={cn(
        "w-full max-w-2xl rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md shadow-glass flex flex-col h-[520px] transition-all animate-in fade-in zoom-in-95 duration-200 overflow-hidden",
        className,
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-semibold text-foreground tracking-tight flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Investigation Intake Counselor
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
            {depth}
          </span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Return to clean search"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Message scroll thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <MessengerBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicatorBubble />}

        {/* Confirmation banner card */}
        {status === "ready_for_confirmation" && !isLoading && (
          <IntakeConfirmationCard
            refinedQuery={refinedQuery}
            validationReason={validationReason}
            onConfirm={() => onConfirmLaunch(refinedQuery, messages)}
          />
        )}

        {/* Policy restriction warning card */}
        {status === "harmful_blocked" && !isLoading && (
          <IntakePolicyWarning warning={policyWarning} />
        )}
      </div>

      {/* Quick reply suggestion chips */}
      <IntakeQuickReplies
        quickReplies={quickReplies}
        isLoading={isLoading}
        onSelect={handleSendMessage}
      />

      {/* Bottom input bar */}
      <IntakeInputBar
        inputText={inputText}
        onInputChange={setInputText}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
        status={status}
      />
    </div>
  );
}
