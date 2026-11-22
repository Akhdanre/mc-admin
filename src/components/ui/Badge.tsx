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
  success: "bg-success-surface text-success-muted border-success-border",
  danger: "bg-danger-surface text-danger-muted border-danger-border",
  warning: "bg-warning-surface text-warning-muted border-warning-border",
  info: "bg-info-surface text-info-muted border-info-border",
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
