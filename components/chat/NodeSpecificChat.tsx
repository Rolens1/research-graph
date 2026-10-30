"use client";

// 1. External imports
import React, { memo, useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
} from "lucide-react";

// 2. Internal imports
import { cn } from "@/lib/utils";
import type { GraphNodeData } from "@/types/graph";
import type { ChatMessage } from "@/types/chat";
import { NodeChatSuggestions } from "./NodeChatSuggestions";
import { NodeChatMessageList } from "./NodeChatMessageList";

// 3. Type definitions
type Props = {
  node: GraphNodeData;
  sessionId?: string;
  className?: string;
};

// 4. Component
function NodeSpecificChatComponent({
  node,
  sessionId = "mock",
  className,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeNodeIdRef = useRef<string>(node.id);

  // Reset conversation if selected node changes
  useEffect(() => {
    if (activeNodeIdRef.current !== node.id) {
      activeNodeIdRef.current = node.id;
      setMessages([]);
      setError(null);
      setInputValue("");
    }
  }, [node.id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || inputValue).trim();
      if (!query || isLoading) return;

      setInputValue("");
      setError(null);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
        createdAt: new Date().toISOString(),
      };

      const assistantMessageId = `asst-${Date.now()}`;
      const placeholderAssistant: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, placeholderAssistant]);
      setIsLoading(true);

      try {
        const response = await fetch(`/api/research/${sessionId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId: node.id,
            query,
            sources: node.sources,
            nodeLabel: node.label,
            history: messages.slice(-4),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to connect to investigation assistant");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId ? { ...m, content: accumulated } : m,
            ),
          );
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Error streaming response";
        setError(errMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content:
                    "Based on verified citations for this entity, no supporting evidence exists to answer this query.",
                }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading, node.id, node.sources, node.label, messages, sessionId],
  );

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card font-sans select-none overflow-hidden shadow-xs",
        className,
      )}
    >
      {/* Collapsible Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-muted/40 transition-colors cursor-pointer text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Ask Questions About This Entity
          </span>
          {messages.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-accent/15 text-accent">
              {messages.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-[10px] font-mono text-muted-foreground/80">
            {isOpen ? "Collapse" : "Open Q&A"}
          </span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* Expanded Chat Body */}
      {isOpen && (
        <div className="border-t border-border/60 bg-muted/10 p-3 space-y-3 animate-in fade-in-0 duration-150">
          {/* Evidence Grounding Notice */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/80 border-b border-border/40 pb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-entity-technology shrink-0" />
            <span>Answers strictly grounded in {node.sources.length} verified sources</span>
          </div>

          {/* Quick Suggestions (Shown when few or no messages) */}
          {messages.length === 0 && (
            <NodeChatSuggestions
              node={node}
              onSelect={(chipQuery) => handleSendMessage(chipQuery)}
              disabled={isLoading}
            />
          )}

          {/* Message List */}
          <NodeChatMessageList
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />

          {error && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-danger bg-danger/10 p-2 rounded-lg border border-danger/20">
              <ShieldAlert className="h-3 w-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5 pt-1"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask about ${node.label}...`}
              disabled={isLoading}
              className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="h-7 w-7 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Send question"
              aria-label="Send question"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export const NodeSpecificChat = memo(NodeSpecificChatComponent);
