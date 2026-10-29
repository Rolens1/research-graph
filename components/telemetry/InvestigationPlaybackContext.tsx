"use client";

// 1. External imports
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";

// 2. Type definitions
export type PlaybackSpeedMode = "turbo" | "step";

export interface PlaybackContextValue<T = unknown> {
  mode: PlaybackSpeedMode;
  setMode: (mode: PlaybackSpeedMode) => void;
  pendingCount: number;
  hasNextStep: boolean;
  stepForward: () => void;
  flushQueue: () => void;
  enqueueEvent: (event: T) => void;
  enqueueBatch: (events: T[]) => void;
  clearQueue: () => void;
}

export interface PlaybackProviderProps<T = unknown> {
  children: React.ReactNode;
  initialMode?: PlaybackSpeedMode;
  onEventDispatched?: (event: T) => void;
}

// 3. Create context
const InvestigationPlaybackContext = createContext<PlaybackContextValue<unknown> | null>(
  null,
);

// 4. Provider component
export function InvestigationPlaybackProvider<T = unknown>({
  children,
  initialMode = "turbo",
  onEventDispatched,
}: PlaybackProviderProps<T>) {
  const [mode, setModeState] = useState<PlaybackSpeedMode>(initialMode);
  const [pendingQueue, setPendingQueue] = useState<T[]>([]);

  // Keep ref to latest dispatch callback to avoid stale closures
  const onDispatchRef = useRef(onEventDispatched);
  useEffect(() => {
    onDispatchRef.current = onEventDispatched;
  }, [onEventDispatched]);

  const queueRef = useRef<T[]>(pendingQueue);

  // Step forward: shift the earliest event (FIFO) and dispatch it
  const stepForward = useCallback(() => {
    let nextEvent: T | undefined;
    setPendingQueue((prev) => {
      if (prev.length === 0) return prev;
      const [first, ...remaining] = prev;
      nextEvent = first;
      queueRef.current = remaining;
      return remaining;
    });

    if (nextEvent !== undefined && onDispatchRef.current) {
      onDispatchRef.current(nextEvent);
    }
  }, []);

  // Flush all queued items sequentially (e.g. returning to Turbo)
  const flushQueue = useCallback(() => {
    let itemsToFlush: T[] = [];
    setPendingQueue((prev) => {
      itemsToFlush = prev;
      queueRef.current = [];
      return [];
    });

    if (onDispatchRef.current) {
      for (const item of itemsToFlush) {
        onDispatchRef.current(item);
      }
    }
  }, []);

  // Set mode: if switching from step to turbo, automatically flush queue
  const setMode = useCallback(
    (newMode: PlaybackSpeedMode) => {
      setModeState(newMode);
      if (newMode === "turbo") {
        flushQueue();
      }
    },
    [flushQueue],
  );

  // Enqueue a single incoming event
  const enqueueEvent = useCallback(
    (event: T) => {
      if (mode === "turbo") {
        if (onDispatchRef.current) {
          onDispatchRef.current(event);
        }
      } else {
        setPendingQueue((prev) => {
          const next = [...prev, event];
          queueRef.current = next;
          return next;
        });
      }
    },
    [mode],
  );

  // Enqueue multiple incoming events
  const enqueueBatch = useCallback(
    (events: T[]) => {
      if (events.length === 0) return;
      if (mode === "turbo") {
        if (onDispatchRef.current) {
          for (const ev of events) {
            onDispatchRef.current(ev);
          }
        }
      } else {
        setPendingQueue((prev) => {
          const next = [...prev, ...events];
          queueRef.current = next;
          return next;
        });
      }
    },
    [mode],
  );

  const clearQueue = useCallback(() => {
    queueRef.current = [];
    setPendingQueue([]);
  }, []);

  // Global keyboard listener for Spacebar in step mode
  useEffect(() => {
    if (mode !== "step") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;

      // Ignore when focused in text inputs, textareas, contenteditable or select
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      e.preventDefault();
      stepForward();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode, stepForward]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      pendingCount: pendingQueue.length,
      hasNextStep: pendingQueue.length > 0,
      stepForward,
      flushQueue,
      enqueueEvent,
      enqueueBatch,
      clearQueue,
    }),
    [
      mode,
      setMode,
      pendingQueue.length,
      stepForward,
      flushQueue,
      enqueueEvent,
      enqueueBatch,
      clearQueue,
    ],
  );

  return (
    <InvestigationPlaybackContext.Provider
      value={value as unknown as PlaybackContextValue<unknown>}
    >
      {children}
    </InvestigationPlaybackContext.Provider>
  );
}

// 5. Custom hook to consume playback state
export function useInvestigationPlayback<T = unknown>(): PlaybackContextValue<T> {
  const context = useContext(InvestigationPlaybackContext);
  if (!context) {
    throw new Error(
      "useInvestigationPlayback must be used within an InvestigationPlaybackProvider",
    );
  }
  return context as unknown as PlaybackContextValue<T>;
}

// 6. Optional hook for components that can operate both inside and outside provider
export function useOptionalInvestigationPlayback<T = unknown>(): PlaybackContextValue<T> | null {
  const context = useContext(InvestigationPlaybackContext);
  return (context as unknown as PlaybackContextValue<T>) || null;
}
