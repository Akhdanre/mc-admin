"use client";

import { useCallback, useState } from "react";

export interface Feedback {
  message: string;
  isError?: boolean;
}

/**
 * Toast-style transient feedback message that auto-dismisses after 5s.
 * A newer message replaces the current one; the dismiss timer only clears
 * the message it was scheduled for (stale timers don't wipe newer messages).
 */
export function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const showFeedback = useCallback((message: string, isError = false) => {
    setFeedback({ message, isError });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 5000);
  }, []);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  return { feedback, showFeedback, clearFeedback };
}
