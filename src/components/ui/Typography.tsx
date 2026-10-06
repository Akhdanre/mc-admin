import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Typography scale mapping the legacy text classes.
 *
 *   <PageTitle>   text-xl font-bold text-white tracking-tight
 *   <SectionTitle> text-lg font-semibold text-white
 *   <Body>        text-sm text-slate-300
 *   <Muted>       text-xs text-slate-400
 *   <Caption>     text-xs text-slate-500
 */
export function PageTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-xl font-bold text-heading tracking-tight", className)} {...props}>
      {children}
    </h2>
  );
}

export function SectionTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-heading", className)} {...props}>
      {children}
    </h3>
  );
}

export function Body({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function Muted({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function Caption({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-subtle-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function Mono({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("font-mono text-slate-200", className)} {...props}>
      {children}
    </span>
  );
}
