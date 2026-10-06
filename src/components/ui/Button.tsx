import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Global button. Variants map 1:1 to the legacy hardcoded styles.
 *
 *   variant="primary"   solid indigo action
 *   variant="secondary" neutral slate action
 *   variant="success"   emerald tint action
 *   variant="danger"    rose tint action
 *   variant="ghost"     text-only, hover to surface
 *   variant="tab"       inactive tab (pair with `active` for the on-state)
 *   variant="tab-active" active tab (solid primary)
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "ghost"
  | "tab"
  | "tab-active";

export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition cursor-pointer " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
  secondary:
    "bg-surface-raised text-slate-200 border border-border-strong hover:bg-slate-700",
  success:
    "bg-emerald-600/20 text-success-foreground border border-emerald-500/30 hover:bg-emerald-600/30",
  danger:
    "bg-rose-600/20 text-danger-foreground border border-rose-500/30 hover:bg-rose-600/30",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-surface-raised",
  tab: "text-muted-foreground hover:text-foreground",
  "tab-active": "bg-primary text-primary-foreground shadow-sm",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean; // convenience for tab buttons
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "sm",
  active,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const resolved: ButtonVariant =
    variant === "tab" && active ? "tab-active" : variant;
  return (
    <button
      type={type}
      className={cn(base, sizes[size], variants[resolved], className)}
      {...props}
    >
      {children}
    </button>
  );
}
