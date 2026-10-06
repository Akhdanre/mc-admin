import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Form controls sharing the legacy field style:
 * `bg-slate-950 border-slate-800 rounded-xl focus:border-indigo-500`.
 */
const fieldBase =
  "w-full bg-overlay border border-border rounded-xl px-3 py-2 text-xs text-slate-200 " +
  "placeholder:text-faint-foreground focus:outline-none focus:border-ring transition";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { mono, className, ...props },
  ref
) {
  return (
    <input ref={ref} className={cn(fieldBase, mono && "font-mono", className)} {...props} />
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(fieldBase, "font-medium cursor-pointer", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { mono = true, className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldBase, mono && "font-mono", "resize-none", className)}
      {...props}
    />
  );
});
