"use client";

import React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntakeMessage } from "@/types/intake";

type Props = {
  message: IntakeMessage;
};

/**
 * Meta Messenger styled chat bubble component.
 * Satisfies AC-2.
 */
export function MessengerBubble({ message }: Props) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex items-end gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {isAssistant && (
        <div className="h-7 w-7 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0 mb-0.5">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] md:max-w-[75%] px-4 py-2.5 text-xs md:text-sm leading-relaxed",
          isAssistant
            ? "bg-card text-card-foreground border border-border/80 rounded-2xl rounded-bl-xs shadow-xs"
            : "bg-accent text-accent-foreground rounded-2xl rounded-br-xs shadow-xs ml-auto",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span
          className={cn(
            "text-[10px] block mt-1 select-none",
            isAssistant ? "text-muted-foreground" : "text-accent-foreground/70 text-right",
          )}
        >
          {message.timestamp}
        </span>
      </div>

      {!isAssistant && (
        <div className="h-7 w-7 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center shrink-0 mb-0.5">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

/**
 * Three-dot bouncing typing indicator bubble.
 */
export function TypingIndicatorBubble() {
  return (
    <div className="flex items-end gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="h-7 w-7 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0 mb-0.5">
        <Bot className="h-4 w-4" />
      </div>

      <div className="bg-card text-muted-foreground border border-border/80 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
