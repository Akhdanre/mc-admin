"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Wraps the app with next-themes. `attribute="class"` toggles the `.dark`
 * class on <html> (driving the CSS vars in globals.css); system preference is
 * the default and the choice persists to localStorage.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
