import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Typography scale mapping the legacy text classes.
 *
 *   <PageTitle>   text-xl (22/30) font-semibold text-heading
 *   <SectionTitle> text-lg (18/26) font-semibold text-heading
 *   <Body>        text-sm (14/20) text-foreground
 *   <Muted>       text-xs (12/16) text-muted-foreground
 *   <Caption>     text-xs (12/16) text-subtle-foreground
 *
 * Sizes come from the Penpot `typography.*` tokens (see globals.css).
 */
export function PageTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-xl font-semibold text-heading", className)} {...props}>
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
    <span className={cn("font-mono text-foreground", className)} {...props}>
      {children}
    </span>
  );
}
