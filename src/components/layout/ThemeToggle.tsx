"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

// Hydration-safe "mounted" flag without setState-in-effect: false on the
// server/first client render, true after subscribing on the client.
const subscribe = () => () => {};

/**
 * Light/dark toggle. Renders a neutral placeholder until mounted to avoid
 * hydration mismatch (the active theme is only known on the client).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const isDark = resolvedTheme === "dark";
  const base =
    "p-2 rounded-lg border border-border bg-overlay/80 text-muted-foreground " +
    "hover:text-foreground hover:border-border-strong transition cursor-pointer";

  if (!mounted) {
    return (
      <button type="button" aria-label="Toggle theme" className={base} suppressHydrationWarning>
        <span className="block w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={base}
    >
      {isDark ? (
        // Sun
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36l-1.41 1.41M7.05 16.95l-1.41 1.41m12.72 0l-1.41-1.41M7.05 7.05L5.64 5.64M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.354 15.354A9 9 0 018.646 3.646a9.003 9.003 0 00-.597 13.442 9.003 9.003 0 0012.305-1.734z"
          />
        </svg>
      )}
    </button>
  );
}
