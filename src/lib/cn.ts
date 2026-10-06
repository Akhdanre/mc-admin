/**
 * Tiny className combiner (clsx-lite). No external deps.
 * Filters falsy values and joins with a space.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
