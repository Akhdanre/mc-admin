import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names and resolves Tailwind conflicts: when two classes set
 * the same utility (e.g. a base `justify-center` and an override
 * `justify-between`), the LAST one wins. This lets component base styles be
 * safely overridden via the `className` prop.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };
