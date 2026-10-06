"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `callback` on an interval, and once immediately (deferred to a
 * microtask so the effect body never triggers a synchronous setState).
 * The latest callback is always used, so callers can pass closures without
 * re-creating the interval. Returns nothing; cleanup clears the interval.
 */
export function usePolling(callback: () => void, intervalMs: number) {
  const saved = useRef(callback);

  // Keep the latest callback in a ref, updated in an effect (not during
  // render) so the interval below never needs to be re-created.
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(() => saved.current(), intervalMs);
    queueMicrotask(() => {
      if (!cancelled) saved.current();
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [intervalMs]);
}
