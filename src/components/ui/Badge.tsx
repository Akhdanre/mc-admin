import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Pill / badge. Tints map the legacy `*-500/10 bg, *-500/20 border, *-400 text`.
 *
 *   tone="primary" | "success" | "danger" | "warning" | "info" | "neutral"
 */
export type BadgeTone =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral";

const tones: Record<BadgeTone, string> = {
  primary: "bg-indigo-500/10 text-primary-muted border-indigo-500/20",
  success: "bg-emerald-500/10 text-success-muted border-emerald-500/20",
  danger: "bg-rose-500/10 text-danger-muted border-rose-500/20",
  warning: "bg-amber-500/10 text-warning-muted border-amber-500/20",
  info: "bg-sky-500/10 text-info-muted border-sky-500/20",
  neutral: "bg-surface-raised text-muted-foreground border-border-strong",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
