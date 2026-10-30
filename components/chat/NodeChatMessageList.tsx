"use client";

// 1. External imports
import React, { memo } from "react";
import { Bot, User } from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

// 3. Type definitions
type Props = {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
};

// 4. Component
function NodeChatMessageListComponent({
  messages,
  isLoading,
  messagesEndRef,
  className,
}: Props) {
  if (messages.length === 0) return null;

  return (
    <div
      className={cn(
        "max-h-56 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin font-sans select-none",
        className,
      )}
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex gap-2 text-xs leading-relaxed",
            msg.role === "user" ? "justify-end" : "justify-start",
          )}
        >
          {msg.role === "assistant" && (
            <div className="h-5 w-5 rounded-md bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-3 w-3" />
            </div>
          )}

          <div
            className={cn(
              "rounded-xl px-3 py-2 max-w-[85%] font-sans text-xs",
              msg.role === "user"
                ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                : "bg-card border border-border/80 text-foreground/90 rounded-tl-xs shadow-2xs",
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
            {msg.role === "assistant" && !msg.content && isLoading && (
              <span className="inline-block h-3 w-1.5 bg-accent animate-pulse" />
            )}
          </div>

          {msg.role === "user" && (
            <div className="h-5 w-5 rounded-md bg-primary/20 text-foreground flex items-center justify-center shrink-0 mt-0.5">
              <User className="h-3 w-3" />
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export const NodeChatMessageList = memo(NodeChatMessageListComponent);

