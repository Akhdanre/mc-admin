import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Surface container. Maps the legacy `bg-slate-900/60 border-slate-800/80` card.
 *
 *   tone="panel"  standard card (surface/60, border/80)
 *   tone="muted"  recessed empty-state panel (surface/40, dashed border)
 *   tone="solid"  opaque surface
 */
export type CardTone = "panel" | "muted" | "solid";

const tones: Record<CardTone, string> = {
  panel: "bg-surface/60 border-border/80",
  muted: "bg-surface/40 border-dashed border-border",
  solid: "bg-surface border-border",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: "sm" | "md" | "lg" | "none";
  children: ReactNode;
}

const paddings = { sm: "p-4", md: "p-5", lg: "p-6", none: "" } as const;

export function Card({
  tone = "panel",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn("border rounded-2xl", tones[tone], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardLabelProps extends HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children: ReactNode;
}

/** Small uppercase stat label used across dashboards. */
export function CardLabel({ className, children, ...props }: CardLabelProps) {
  return (
    <p
      className={cn("text-xs font-semibold uppercase tracking-wider text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}


